"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withNext } from "@/lib/safe-next";
import { useEffect, useState } from "react";

export function LoginForm({
  next,
  notice = null,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  /** 로그인 후 이동할 경로. 페이지에서 sanitizeNext로 검증한 값 */
  next: string;
  /** 상단 안내 문구 (예: 다른 기기에서 이메일 인증을 마친 경우) */
  notice?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // cacheComponents는 떠난 화면을 숨긴 채 상태를 보존하므로(Activity),
  // 화면이 숨겨질 때 비밀번호를 지워 다음 방문(로그아웃 후 등)에 남지 않게 한다
  useEffect(() => () => setPassword(""), []);

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setEmail("");
      setPassword("");
      // 뒤로 가기로 로그인 화면에 돌아오지 않도록 replace
      router.replace(next);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>이메일과 비밀번호로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {notice && (
            <p
              role="status"
              className="mb-6 rounded-lg border bg-muted px-4 py-3 text-sm"
            >
              {notice}
            </p>
          )}
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="login-email">이메일</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="login-password">비밀번호</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block py-0.5 text-sm underline-offset-4 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "로그인 중…" : "로그인"}
              </Button>
            </div>
          </form>
          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">또는</span>
            <Separator className="flex-1" />
          </div>
          <SocialLoginButtons next={next} />
          <div className="mt-6 text-center text-sm">
            계정이 없으신가요?{" "}
            <Link
              href={withNext("/auth/sign-up", next)}
              className="underline underline-offset-4"
            >
              회원가입
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
