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
import { authErrorMessage } from "@/lib/auth/auth-error";
import { emailConfirmUrl } from "@/lib/safe-next";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (
    e: React.SubmitEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // 메일 링크는 /auth/confirm이 세션을 만든 뒤 비밀번호 변경 화면으로 보낸다
      // (Supabase Dashboard > Authentication > URL Configuration의 Redirect URLs에 허용돼 있어야 함)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: emailConfirmUrl(
          window.location.origin,
          "/auth/update-password"
        ),
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(
        authErrorMessage(error, "메일을 보내지 못했습니다. 다시 시도해주세요")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">메일을 확인해주세요</CardTitle>
            <CardDescription>비밀번호 재설정 안내를 보냈습니다</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              이메일과 비밀번호로 가입한 계정이면 재설정 메일이 도착합니다.
              메일의 링크는 요청한 이 브라우저에서 열어주세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">비밀번호 재설정</CardTitle>
            <CardDescription>
              가입한 이메일을 입력하면 비밀번호를 바꿀 수 있는 링크를
              보내드립니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="forgot-email">이메일</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "보내는 중…" : "재설정 메일 보내기"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                비밀번호가 기억나셨나요?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  로그인
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
