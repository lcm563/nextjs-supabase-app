"use client";

import { Button } from "@/components/ui/button";

// 라우트 세그먼트 error.tsx에서 공통으로 사용하는 에러 화면
export function RouteError({
  reset,
  title = "문제가 발생했습니다",
}: {
  reset: () => void;
  title?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 새로고침해 주세요.
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
