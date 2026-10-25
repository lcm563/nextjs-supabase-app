import type { Metadata } from "next";

// 관리자 사용자 관리 (화면은 Task 004-2b에서 구현)

export const metadata: Metadata = { title: "사용자 관리" };

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">사용자 관리</h1>
      <p className="text-muted-foreground">준비 중입니다.</p>
    </div>
  );
}
