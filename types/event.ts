// 이벤트 도메인 타입 (PRD 7장 데이터 모델, DB 컬럼명 snake_case 그대로 사용)
// 날짜/시간(timestamptz)은 ISO 8601 문자열로 다룬다.
// 참고: Task 005에서 database.types.ts 생성 후 Row 파생 타입으로 정리 예정

import type { UserRole } from "@/types/admin";
import type { Attendee, RsvpStatus } from "@/types/rsvp";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
};

export type Event = {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  location: string;
  starts_at: string;
  ends_at: string | null;
  /** null = 정원 무제한 */
  capacity: number | null;
  rsvp_deadline: string | null;
  /** Storage 객체 경로. null = 커버 이미지 없음 */
  cover_image_path: string | null;
  /** 관리자가 숨긴 시각. null = 공개 */
  hidden_at: string | null;
  hidden_reason: string | null;
  created_at: string;
  updated_at: string;
};

// 폼/Server Action에서 사용자가 입력하는 필드만 포함
export type EventInput = Pick<
  Event,
  | "title"
  | "description"
  | "location"
  | "starts_at"
  | "ends_at"
  | "capacity"
  | "rsvp_deadline"
>;

// 상태별 응답 인원수를 포함한 이벤트 (목록/상세 표시용)
export type EventWithCounts = Event & {
  rsvp_counts: Record<RsvpStatus, number>;
};

// 목록 카드용: 주최자 이름과 현재 사용자의 응답 상태 포함
export type EventListItem = EventWithCounts & {
  host: Pick<Profile, "id" | "display_name">;
  /** 현재 사용자의 응답. 응답하지 않았으면 null */
  my_status: RsvpStatus | null;
  /** 커버 이미지 공개 URL. 조회 계층이 cover_image_path를 변환해 채운다 */
  cover_image_url: string | null;
};

// 상세 화면용: 참여자 현황 포함
export type EventDetail = EventListItem & {
  attendees: Attendee[];
};
