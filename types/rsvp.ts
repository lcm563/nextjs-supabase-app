// RSVP 상태 도메인 타입 (PRD 7장 rsvps.status)
// 참고: Task 005에서 database.types.ts 생성 후 파생 타입으로 정리 예정

export const RSVP_STATUSES = [
  "going",
  "not_going",
  "maybe",
  "waitlist",
] as const;

export type RsvpStatus = (typeof RSVP_STATUSES)[number];

// DB 생성 타입의 rsvps.status(string)를 RsvpStatus로 좁힌다
export function isRsvpStatus(value: string): value is RsvpStatus {
  return (RSVP_STATUSES as readonly string[]).includes(value);
}

// 사용자가 직접 선택하는 응답. waitlist는 정원 초과 시 서버(DB)가 지정한다.
export type RsvpChoice = Exclude<RsvpStatus, "waitlist">;

// 참여자 현황 표시용 (rsvps + profiles 조인 결과)
export type Attendee = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  status: RsvpStatus;
  /** 마지막 상태 변경 시각. waitlist 순서 기준 */
  updated_at: string;
};
