import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";

// 오류 코드 → 사용자 안내 문구. 매핑에 없는 값(Supabase 오류 메시지 등)은 원문을 보여준다.
const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "로그인이 취소되었습니다. 다시 시도해 주세요",
};

function toErrorMessage(error: string | undefined): string {
  if (!error) return "알 수 없는 오류가 발생했습니다";
  // hasOwn: "constructor" 같은 프로토타입 키가 매핑으로 잡히지 않도록
  return Object.hasOwn(ERROR_MESSAGES, error) ? ERROR_MESSAGES[error] : error;
}

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <p className="text-sm text-muted-foreground">
      {toErrorMessage(params?.error)}
    </p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                로그인 중 문제가 발생했습니다
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4">
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
              <Button asChild>
                <Link href="/auth/login">로그인 화면으로</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
