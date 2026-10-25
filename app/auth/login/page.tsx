import { AuthFormSkeleton } from "@/components/auth-form-skeleton";
import { LoginForm } from "@/components/login-form";
import { toLoginNotice } from "@/lib/auth/login-notice";
import { sanitizeNext } from "@/lib/safe-next";
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
  return <LoginForm next={sanitizeNext(next)} notice={toLoginNotice(notice)} />;
}
