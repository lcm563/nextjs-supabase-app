// 이벤트 진행 단계 판정과 RSVP 표시 상수
// 판정 순서는 DB 함수 respond_to_event와 같다 (DB_SCHEMA.md 7장 4~5단계: 종료 → 마감).
// now는 호출하는 쪽(서버 페이지)에서 넘긴다. Client Component에서 직접 계산하지 않는다.

import type { Event } from "@/types/event";
import type { RsvpStatus } from "@/types/rsvp";

export type EventPhase = "open" | "deadline_passed" | "ended";

export function getEventPhase(
  event: Pick<Event, "starts_at" | "ends_at" | "rsvp_deadline">,
  now: Date
): EventPhase {
  const nowMs = now.getTime();
  if (Date.parse(event.ends_at ?? event.starts_at) < nowMs) return "ended";
  if (event.rsvp_deadline && Date.parse(event.rsvp_deadline) < nowMs) {
    return "deadline_passed";
  }
  return "open";
}

// 생성 직후의 미세한 시각 차이는 수정으로 보지 않는다
const EDITED_THRESHOLD_MS = 60 * 1000;

export function isEventEdited(
  event: Pick<Event, "created_at" | "updated_at">
): boolean {
  return (
    Date.parse(event.updated_at) - Date.parse(event.created_at) >
    EDITED_THRESHOLD_MS
  );
}

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  going: "참석",
  waitlist: "대기",
  maybe: "미정",
  not_going: "불참",
};

// 참여자 현황 표시 순서
export const RSVP_STATUS_ORDER: RsvpStatus[] = [
  "going",
  "waitlist",
  "maybe",
  "not_going",
];
