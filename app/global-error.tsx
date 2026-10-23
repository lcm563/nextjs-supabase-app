"use client";

import "./globals.css";

// 루트 레이아웃 자체에서 발생한 오류 경계. 루트 레이아웃을 대체하므로 html/body를 직접 렌더링한다.
// ThemeProvider 밖이라 components/ui에 의존하지 않는 최소 마크업만 사용한다.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="bg-background text-foreground antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-start justify-center gap-3 px-4 py-8">
          <h1 className="text-2xl font-bold">문제가 발생했습니다</h1>
          <p className="text-muted-foreground">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 새로고침해 주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
