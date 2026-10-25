// 개발 모드 전용 역할 전환 쿠키 (관리자·일반 사용자 화면 확인용)
// TODO(Task 009-1): profiles.role + is_admin() RPC로 교체 후 이 파일과 role-actions.ts 삭제
import type { UserRole } from "@/types/admin";
import { cookies } from "next/headers";

export const MOCK_ROLE_COOKIE = "mock-role";

// 프로덕션에서는 쿠키와 관계없이 항상 일반 사용자
export async function getMockRole(): Promise<UserRole> {
  if (process.env.NODE_ENV !== "development") return "user";
  const cookieStore = await cookies();
  return cookieStore.get(MOCK_ROLE_COOKIE)?.value === "admin"
    ? "admin"
    : "user";
}
