import { AuthFormSkeleton } from "@/components/auth-form-skeleton";
import { LoginForm } from "@/components/login-form";
import { toLoginNotice } from "@/lib/auth/login-notice";
import { getCurrentUserId } from "@/lib/queries/events";
import { sanitizeNext } from "@/lib/safe-next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

// 로그인 후 돌아갈 경로(next)는 서버에서 검증해 폼에 넘긴다
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<AuthFormSkeleton />}>
          <LoginFormWithNext searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function LoginFormWithNext({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const { next, notice } = await searchParams;
  const safeNext = sanitizeNext(next);
  // 이미 로그인했으면 폼 대신 돌아갈 곳으로 보낸다 (세션 확인이 현재 시각을 읽으므로 connection 먼저)
  await connection();
  if (await getCurrentUserId()) redirect(safeNext);
  return <LoginForm next={safeNext} notice={toLoginNotice(notice)} />;
}
