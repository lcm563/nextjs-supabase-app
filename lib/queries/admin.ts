// 관리자 조회 계층 (서버 전용: Server Components·Server Actions에서만 import)
// 관리자 RPC는 함수 안에서 is_admin()을 확인하고, events·event_reports는 RLS가 관리자에게 전체를 보여준다 (DB_SCHEMA.md 9장).

import {
  getHiddenStates,
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

// 관리자 RPC의 페이지 크기 상한 (admin_list_users의 p_limit 검증과 같다)
const ADMIN_PAGE_LIMIT = 100;

// ilike 패턴: 검색어의 %, _ 는 글자 그대로 찾는다
function toIlikePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

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

// 이벤트 관리 목록 (숨김 포함, 시작 최신순). q: 제목·주최자 이름 부분 일치
export async function getAdminEvents({
  q = "",
  status = "all",
}: {
  q?: string;
  status?: AdminEventStatusFilter;
} = {}): Promise<EventListItem[]> {
  const supabase = await createClient();

  let rows: EventRow[];
  if (q) {
    const pattern = toIlikePattern(q);
    const { data: hosts, error: hostError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("display_name", pattern);
    if (hostError) throw hostError;

    // 제목 일치와 주최자 이름 일치를 따로 조회해 합친다 (검색어를 or 필터 문자열에 넣지 않기 위해)
    const [byTitle, byHost] = await Promise.all([
      supabase.from("events").select(LIST_SELECT).ilike("title", pattern),
      hosts.length > 0
        ? supabase
            .from("events")
            .select(LIST_SELECT)
            .in(
              "host_id",
              hosts.map((host) => host.id)
            )
        : null,
    ]);
    if (byTitle.error) throw byTitle.error;
    if (byHost?.error) throw byHost.error;
    const merged = new Map(
      [...byTitle.data, ...(byHost?.data ?? [])].map((row) => [row.id, row])
    );
    rows = [...merged.values()];
  } else {
    const { data, error } = await supabase.from("events").select(LIST_SELECT);
    if (error) throw error;
    rows = data;
  }

  const hidden = await getHiddenStates(
    supabase,
    rows.map((row) => row.id)
  );
  return rows
    .map((row) => toListItem(supabase, row, null, hidden.get(row.id)))
    .filter((event) => {
      if (status === "visible") return event.hidden_at === null;
      if (status === "hidden") return event.hidden_at !== null;
      return true;
    })
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
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
