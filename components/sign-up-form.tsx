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
import { authErrorMessage } from "@/lib/auth/auth-error";
import { emailConfirmUrl, withNext } from "@/lib/safe-next";
import {
  PASSWORD_MIN_LENGTH,
  passwordSchema,
} from "@/lib/validations/password";
import {
  DISPLAY_NAME_MAX_LENGTH,
  displayNameSchema,
} from "@/lib/validations/profile";
import { useEffect, useState } from "react";

export function SignUpForm({
  next,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  /** 가입 확인 후 이동할 경로. 페이지에서 sanitizeNext로 검증한 값 */
  next: string;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 숨겨진 화면(Activity)에 비밀번호가 남지 않도록 화면을 떠날 때 지운다
  useEffect(
    () => () => {
      setPassword("");
      setRepeatPassword("");
    },
    []
  );

  const handleSignUp = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    const parsedName = displayNameSchema.safeParse(displayName);
    if (!parsedName.success) {
      setError(parsedName.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) {
      setError(parsedPassword.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("비밀번호가 일치하지 않습니다");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // handle_new_user 트리거가 profiles.display_name으로 사용한다
          data: { display_name: parsedName.data },
          // 확인 링크는 /auth/confirm이 세션을 만든 뒤 next로 보낸다
          emailRedirectTo: emailConfirmUrl(window.location.origin, next),
        },
      });
      if (error) throw error;
      setDisplayName("");
      setEmail("");
      setPassword("");
      setRepeatPassword("");
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(authErrorMessage(error, "가입 중 오류가 발생했습니다"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>이메일로 새 계정을 만드세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="sign-up-display-name">표시 이름</Label>
                <Input
                  id="sign-up-display-name"
                  placeholder="참여자 목록에 보일 이름"
                  autoComplete="nickname"
                  required
                  maxLength={DISPLAY_NAME_MAX_LENGTH}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sign-up-email">이메일</Label>
                <Input
                  id="sign-up-email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="sign-up-password">비밀번호</Label>
                </div>
                <Input
                  id="sign-up-password"
                  type="password"
                  required
                  aria-describedby="sign-up-password-hint"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p
                  id="sign-up-password-hint"
                  className="text-xs text-muted-foreground"
                >
                  {PASSWORD_MIN_LENGTH}자 이상
                </p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="sign-up-repeat-password">비밀번호 확인</Label>
                </div>
                <Input
                  id="sign-up-repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "가입하는 중…" : "회원가입"}
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
            이미 계정이 있으신가요?{" "}
            <Link
              href={withNext("/auth/login", next)}
              className="underline underline-offset-4"
            >
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
