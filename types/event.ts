// 이벤트 도메인 타입 (PRD 7장 데이터 모델, DB 컬럼명 snake_case 그대로 사용)
// 날짜/시간(timestamptz)은 ISO 8601 문자열로 다룬다.
// 참고: Task 005에서 database.types.ts 생성 후 Row 파생 타입으로 정리 예정

import type { RsvpStatus } from "@/types/rsvp";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
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
