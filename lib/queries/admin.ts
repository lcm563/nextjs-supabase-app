// 관리자 조회 계층 (서버 전용: Server Components·Server Actions에서만 import)
// 관리자 RPC는 함수 안에서 is_admin()을 확인하고, events·event_reports는 RLS가 관리자에게 전체를 보여준다 (DB_SCHEMA.md 9장).

import {
  LIST_SELECT,
  toListItem,
  type EventRow,
  type Supabase,
} from "@/lib/queries/events";
import { createClient } from "@/lib/supabase/server";
import {
  AUTH_PROVIDERS,
  isAuthProvider,
  isReportReason,
  isReportStatus,
  isUserRole,
  type AdminEventStatusFilter,
  type AdminStats,
  type AdminUserRow,
  type EventReport,
  type ReportStatus,
} from "@/types/admin";
import type { EventListItem } from "@/types/event";
import { z } from "zod";

// 관리자 RPC의 페이지 크기 상한 (admin_list_users·admin_list_events의 p_limit 검증과 같다)
const ADMIN_PAGE_LIMIT = 100;

// 현재 사용자가 관리자인지 (비로그인이면 false)
export async function getIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data;
}

const count = z.number().int().nonnegative();
const adminStatsSchema = z.object({
  users_total: count,
  users_new_this_week: count,
  events_upcoming: count,
  events_ended: count,
  events_hidden: count,
  rsvps_total: count,
  reports_open: count,
  // enum 키 record는 모든 provider 키가 있어야 통과한다
  users_by_provider: z.record(z.enum(AUTH_PROVIDERS), count),
}) satisfies z.ZodType<AdminStats>;

// 대시보드 통계
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_stats");
  if (error) throw error;
  return adminStatsSchema.parse(data);
}

type AdminUserList = { rows: AdminUserRow[]; total: number };

async function listUsers(
  supabase: Supabase,
  { q = "", limit = ADMIN_PAGE_LIMIT }: { q?: string; limit?: number }
): Promise<AdminUserList> {
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: q,
    p_limit: limit,
  });
  if (error) throw error;

  const rows = data.map((row) => ({
    id: row.id,
    display_name: row.display_name,
    email: row.email,
    // DB가 다른 provider를 돌려주면(앱에서 쓰지 않음) 이메일 가입으로 표시한다
    provider: isAuthProvider(row.provider) ? row.provider : "email",
    role: isUserRole(row.role) ? row.role : "user",
    created_at: row.created_at,
    last_sign_in_at: row.last_sign_in_at,
  }));
  return { rows, total: data[0]?.total_count ?? 0 };
}

// 사용자 목록 (가입 최신순, 최대 100명). q: 이름·이메일 부분 일치
// totalAdmins는 검색과 무관한 전체 관리자 수 (마지막 관리자 해제 버튼 비활성화용)
export async function getAdminUsers({ q = "" }: { q?: string } = {}): Promise<{
  rows: AdminUserRow[];
  total: number;
  totalAdmins: number;
}> {
  const supabase = await createClient();
  const [result, all] = await Promise.all([
    listUsers(supabase, { q }),
    q ? listUsers(supabase, {}) : null,
  ]);
  const totalAdmins = (all ?? result).rows.filter(
    (user) => user.role === "admin"
  ).length;
  return { ...result, totalAdmins };
}

// 최근 가입 사용자
export async function getRecentUsers(limit: number): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  return (await listUsers(supabase, { limit })).rows;
}

// 이벤트 관리 목록 (숨김 포함, 시작 최신순, 최대 100건). q: 제목·주최자 이름 부분 일치
// 검색·공개 상태 필터·정렬·개수 제한은 admin_list_events RPC가 하고(hidden_at은 직접 필터할 수 없음),
// 고른 id의 본문·응답 집계만 events에서 읽는다. 2000건 기준 전체 조회는 응답이 약 1MB라 제한한다 (Task 010-a)
export async function getAdminEvents({
  q = "",
  status = "all",
}: {
  q?: string;
  status?: AdminEventStatusFilter;
} = {}): Promise<{ rows: EventListItem[]; total: number }> {
  const supabase = await createClient();
  const { data: picked, error: pickError } = await supabase.rpc(
    "admin_list_events",
    { p_search: q, p_status: status, p_limit: ADMIN_PAGE_LIMIT }
  );
  if (pickError) throw pickError;
  if (picked.length === 0) return { rows: [], total: 0 };

  const { data, error } = await supabase
    .from("events")
    .select(LIST_SELECT)
    .in(
      "id",
      picked.map((row) => row.event_id)
    );
  if (error) throw error;

  // RPC가 정한 순서(시작 최신순)를 유지한다
  const byId = new Map<string, EventRow>(data.map((row) => [row.id, row]));
  const rows = picked.flatMap((pick) => {
    const row = byId.get(pick.event_id);
    return row
      ? [
          toListItem(supabase, row, null, {
            hidden_at: pick.hidden_at,
            hidden_reason: pick.hidden_reason,
          }),
        ]
      : [];
  });
  return { rows, total: picked[0].total_count };
}

// 신고 목록 (최신순)
export async function getReports(
  status: ReportStatus | "all" = "all"
): Promise<EventReport[]> {
  const supabase = await createClient();
  let query = supabase
    .from("event_reports")
    .select(
      "id, event_id, reason, detail, status, created_at, event:events(title), reporter:profiles!event_reports_reporter_id_fkey(id, display_name)"
    )
    .order("created_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;

  return data.flatMap((row) =>
    isReportReason(row.reason) && isReportStatus(row.status)
      ? [
          {
            id: row.id,
            event_id: row.event_id,
            event_title: row.event.title,
            reporter: row.reporter,
            reason: row.reason,
            detail: row.detail,
            status: row.status,
            created_at: row.created_at,
          },
        ]
      : []
  );
}
