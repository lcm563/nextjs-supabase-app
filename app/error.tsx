"use client";

import { RouteError } from "@/components/route-error";

// 전역 에러 경계 (루트 레이아웃 아래 세그먼트 대상)
export default function GlobalError({
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
