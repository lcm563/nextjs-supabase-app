// RSVP 상태 도메인 타입 (PRD 7장 rsvps.status)
// 참고: Task 005에서 database.types.ts 생성 후 파생 타입으로 정리 예정

export const RSVP_STATUSES = [
  "going",
  "not_going",
  "maybe",
  "waitlist",
] as const;

export type RsvpStatus = (typeof RSVP_STATUSES)[number];

// 사용자가 직접 선택하는 응답. waitlist는 정원 초과 시 서버(DB)가 지정한다.
export type RsvpChoice = Exclude<RsvpStatus, "waitlist">;
