// 이벤트 조회 계층 (서버 전용: Server Components·Server Actions에서만 import)
// Supabase 클라이언트는 함수마다 새로 만든다. 접근 범위는 RLS가 판정한다 (DB_SCHEMA.md 5장).

import { getCoverPublicUrl } from "@/lib/storage/event-covers";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { EventDetail, EventListItem } from "@/types/event";
import { isRsvpStatus, type Attendee, type RsvpStatus } from "@/types/rsvp";
import { cache } from "react";
import { z } from "zod";

// hidden_*는 authenticated에 SELECT 권한이 없으므로 `*` 대신 컬럼을 나열하고,
// 숨김 상태는 get_event_hidden_states RPC(주최자·관리자만 값 반환)로 따로 읽는다 (DB_SCHEMA.md 9-5)
const EVENT_COLUMNS =
  "id, host_id, title, description, location, starts_at, ends_at, capacity, rsvp_deadline, cover_image_path, created_at, updated_at";
const HOST_SELECT = "host:profiles!events_host_id_fkey(id, display_name)";
export const LIST_SELECT =
  `${EVENT_COLUMNS}, ${HOST_SELECT}, rsvps(user_id, status)` as const;
const DETAIL_SELECT =
  `${EVENT_COLUMNS}, ${HOST_SELECT}, rsvps(user_id, status, updated_at, profile:profiles(display_name, avatar_url))` as const;

type RsvpRow = { user_id: string; status: string };

export type EventRow<R extends RsvpRow = RsvpRow> = Omit<
  Tables<"events">,
  "hidden_at" | "hidden_reason"
> & {
  host: { id: string; display_name: string };
  rsvps: R[];
};

type DetailRsvpRow = RsvpRow & {
  updated_at: string;
  profile: { display_name: string; avatar_url: string | null };
};

export type Supabase = Awaited<ReturnType<typeof createClient>>;

type HiddenState = Pick<EventListItem, "hidden_at" | "hidden_reason">;

const NOT_HIDDEN: HiddenState = { hidden_at: null, hidden_reason: null };

const uuidSchema = z.uuid();

// 숨긴 이벤트의 숨김 정보 (event_id → 상태). 주최자 본인·관리자가 아니면 비어 있다
export async function getHiddenStates(
  supabase: Supabase,
  eventIds: string[]
): Promise<Map<string, HiddenState>> {
  if (eventIds.length === 0) return new Map();
  const { data, error } = await supabase.rpc("get_event_hidden_states", {
    p_event_ids: eventIds,
  });
  if (error) throw error;
  return new Map(
    data.map((row) => [
      row.event_id,
      { hidden_at: row.hidden_at, hidden_reason: row.hidden_reason },
    ])
  );
}

export function toListItem(
  supabase: Supabase,
  { rsvps, ...event }: EventRow,
  userId: string | null,
  hidden: HiddenState = NOT_HIDDEN
): EventListItem {
  const counts: Record<RsvpStatus, number> = {
    going: 0,
    not_going: 0,
    maybe: 0,
    waitlist: 0,
  };
  let myStatus: RsvpStatus | null = null;
  for (const rsvp of rsvps) {
    if (!isRsvpStatus(rsvp.status)) continue;
    counts[rsvp.status] += 1;
    if (rsvp.user_id === userId) myStatus = rsvp.status;
  }

  return {
    ...event,
    ...hidden,
    rsvp_counts: counts,
    my_status: myStatus,
    cover_image_url: getCoverPublicUrl(supabase, event.cover_image_path),
  };
}

function toAttendees(rsvps: DetailRsvpRow[]): Attendee[] {
  return rsvps.flatMap((rsvp) =>
    isRsvpStatus(rsvp.status)
      ? [
          {
            user_id: rsvp.user_id,
            display_name: rsvp.profile.display_name,
            avatar_url: rsvp.profile.avatar_url,
            status: rsvp.status,
            updated_at: rsvp.updated_at,
          },
        ]
      : []
  );
}

// 로그인 사용자 id. 세션이 없으면 null
// 한 요청에서 여러 Suspense 경계(랜딩 등)가 불러도 세션 확인은 한 번만 하도록 요청 단위로 캐시한다
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
});

// 내 이벤트 목록 (정렬은 페이지에서 한다)
// hosting: 내가 주최 / attending: 타인 주최 중 내 응답이 불참이 아닌 이벤트
export async function getMyEvents(userId: string): Promise<{
  hosting: EventListItem[];
  attending: EventListItem[];
}> {
  const supabase = await createClient();

  const [hostingResult, myRsvpsResult] = await Promise.all([
    supabase.from("events").select(LIST_SELECT).eq("host_id", userId),
    supabase
      .from("rsvps")
      .select("event_id")
      .eq("user_id", userId)
      .neq("status", "not_going"),
  ]);
  if (hostingResult.error) throw hostingResult.error;
  if (myRsvpsResult.error) throw myRsvpsResult.error;

  const attendingIds = myRsvpsResult.data.map((rsvp) => rsvp.event_id);
  let attendingRows: EventRow[] = [];
  if (attendingIds.length > 0) {
    const { data, error } = await supabase
      .from("events")
      .select(LIST_SELECT)
      .in("id", attendingIds)
      .neq("host_id", userId);
    if (error) throw error;
    attendingRows = data;
  }

  const hidden = await getHiddenStates(
    supabase,
    [...hostingResult.data, ...attendingRows].map((row) => row.id)
  );
  const toItem = (row: EventRow) =>
    toListItem(supabase, row, userId, hidden.get(row.id));

  return {
    hosting: hostingResult.data.map(toItem),
    attending: attendingRows.map(toItem),
  };
}

// 이벤트 상세. 잘못된 id이거나 없으면 null (페이지에서 notFound() 처리)
export async function getEventDetail(
  id: string,
  userId: string
): Promise<EventDetail | null> {
  if (!uuidSchema.safeParse(id).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const hidden = await getHiddenStates(supabase, [id]);
  return {
    ...toListItem(supabase, data, userId, hidden.get(id)),
    attendees: toAttendees(data.rsvps),
  };
}
