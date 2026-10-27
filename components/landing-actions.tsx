import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/queries/events";
import Link from "next/link";
import { connection } from "next/server";

// 랜딩 상단 버튼. 로그인 여부에 따라 다르게 보여준다 (요청 시점이라 반드시 <Suspense> 안에서 렌더링)
// 로그인 사용자에게 가입 버튼을 보이면 이미 로그인했는데 가입 화면으로 가게 된다
export async function LandingActions() {
  // 세션 확인(getClaims)이 현재 시각을 읽으므로 요청 시점 렌더링임을 먼저 알린다
  await connection();
  const userId = await getCurrentUserId();

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
      {userId ? (
        <>
          <Button asChild size="lg">
            <Link href="/events/new">이벤트 만들기</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/events">내 이벤트 보기</Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild size="lg">
            <Link href="/auth/sign-up">무료로 시작하기</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/login">로그인</Link>
          </Button>
        </>
      )}
    </div>
  );
}

// 버튼 자리를 같은 크기로 비워 둬 로그인 상태가 정해질 때 레이아웃이 흔들리지 않게 한다
export function LandingActionsSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
      aria-hidden="true"
    >
      <div className="h-10 rounded-md bg-muted sm:w-36" />
      <div className="h-10 rounded-md bg-muted sm:w-32" />
    </div>
  );
}
