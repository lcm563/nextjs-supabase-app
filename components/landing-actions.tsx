import { Button } from "@/components/ui/button";
import { getEventPhase } from "@/lib/event-status";
import { formatDateTime } from "@/lib/format";
import { getCurrentUserId, getMyEvents } from "@/lib/queries/events";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

// 랜딩에서 로그인 여부에 따라 달라지는 부분 (요청 시점이라 각각 반드시 <Suspense> 안에서 렌더링)
// 로그인 사용자에게 가입 버튼을 보이면 이미 로그인했는데 가입 화면으로 가게 된다.
// 세션 확인(getClaims)이 현재 시각을 읽으므로 connection()을 먼저 부른다. getCurrentUserId는 요청 단위로 캐시된다.

async function getLandingUserId() {
  await connection();
  return getCurrentUserId();
}

// 히어로 버튼
export async function LandingActions() {
  const userId = await getLandingUserId();

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
      {userId ? (
        <>
          <Button asChild size="lg">
            <Link href="/events/new">
              <Plus aria-hidden="true" />
              이벤트 만들기
            </Link>
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

// 마지막 CTA 버튼 (어두운 띠 위: 배경색 버튼)
export async function LandingFinalAction() {
  const userId = await getLandingUserId();
  const [href, label] = userId
    ? ["/events/new", "이벤트 만들기"]
    : ["/auth/sign-up", "무료로 시작하기"];

  return (
    <Button
      asChild
      size="lg"
      className="bg-background text-foreground hover:bg-background/90"
    >
      <Link href={href}>{label}</Link>
    </Button>
  );
}

export function LandingFinalActionSkeleton() {
  return (
    <div className="h-10 w-40 rounded-md bg-background/20" aria-hidden="true" />
  );
}

// 로그인 사용자의 다가오는 이벤트 요약 띠. 비로그인이거나 다가오는 이벤트가 없으면 그리지 않는다
export async function UpcomingEventsStrip() {
  const userId = await getLandingUserId();
  if (!userId) return null;

  const now = new Date();
  const { hosting, attending } = await getMyEvents(userId);
  const upcoming = [...hosting, ...attending]
    .filter((event) => getEventPhase(event, now) !== "ended")
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  if (upcoming.length === 0) return null;

  const nearest = upcoming[0];
  return (
    <div className="border-b bg-accent text-accent-foreground">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <p>
          <span className="font-semibold">
            다가오는 내 이벤트 {upcoming.length}개
          </span>{" "}
          · 가장 가까운 일정: {formatDateTime(nearest.starts_at)}{" "}
          {nearest.title}
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-1 py-2 font-semibold underline-offset-4 hover:underline"
        >
          내 이벤트로 가기
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
