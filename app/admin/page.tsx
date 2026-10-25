import type { Metadata } from "next";

// 관리자 대시보드 (화면은 Task 004-2b에서 구현)

// layout의 title.template은 같은 세그먼트의 page에는 적용되지 않아 전체 제목을 직접 지정
export const metadata: Metadata = {
  title: { absolute: "대시보드 | 관리자 | 모임 이벤트" },
};

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="text-muted-foreground">준비 중입니다.</p>
    </div>
  );
}
