// Phase 2 UI 전용 더미 프로필. Task 007/008에서 실제 쿼리로 교체 후 삭제한다.

import type { Profile } from "@/types/event";

// 로그인한 사용자 역할을 하는 더미 사용자
export const MOCK_CURRENT_USER_ID = mockUserId(1);

const CREATED_AT = "2026-09-01T00:00:00.000Z";

const NAMES = [
  "김민준",
  "이서연",
  "박지훈",
  "최수아",
  "정도윤",
  "강하은",
  "조현우",
  "윤지아",
  "장서준",
  "임채원",
];

// id: 00000000-0000-4000-8000-0000000000NN (01 = 현재 사용자)
export const MOCK_PROFILES: Profile[] = NAMES.map((display_name, index) => ({
  id: mockUserId(index + 1),
  display_name,
  avatar_url: null,
  created_at: CREATED_AT,
}));

export function mockUserId(no: number): string {
  return `00000000-0000-4000-8000-${String(no).padStart(12, "0")}`;
}
