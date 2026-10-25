"use server";

// 개발 모드 전용 역할 전환 Server Action
// TODO(Task 009-1): lib/mock/role.ts와 함께 삭제
import { MOCK_ROLE_COOKIE } from "@/lib/mock/role";
import type { UserRole } from "@/types/admin";
import { cookies } from "next/headers";

export async function setMockRole(role: UserRole): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;
  const cookieStore = await cookies();
  cookieStore.set(MOCK_ROLE_COOKIE, role === "admin" ? "admin" : "user", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}
