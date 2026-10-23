"use client";

import { RouteError } from "@/components/route-error";

// 루트 세그먼트 에러 경계 (루트 레이아웃 자체의 오류는 global-error.tsx가 처리)
export default function RootError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-8">
      <RouteError reset={reset} />
    </main>
  );
}
