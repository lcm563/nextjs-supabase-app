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
import {
  PASSWORD_MIN_LENGTH,
  passwordSchema,
} from "@/lib/validations/password";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 숨겨진 화면(Activity)에 새 비밀번호가 남지 않도록 화면을 떠날 때 지운다
  useEffect(() => () => setPassword(""), []);

  const handleUpdatePassword = async (
    e: React.SubmitEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError(null);

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      router.push("/events");
    } catch (error: unknown) {
      setError(authErrorMessage(error, "비밀번호를 바꾸지 못했습니다"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">새 비밀번호 설정</CardTitle>
          <CardDescription>
            앞으로 로그인할 비밀번호를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="update-password">새 비밀번호</Label>
                <Input
                  id="update-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  aria-describedby="update-password-hint"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p
                  id="update-password-hint"
                  className="text-xs text-muted-foreground"
                >
                  {PASSWORD_MIN_LENGTH}자 이상
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "저장 중…" : "새 비밀번호 저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
