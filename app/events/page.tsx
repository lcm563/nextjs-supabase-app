import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventPhase } from "@/lib/event-status";
import { getCurrentUserId, getMyEvents } from "@/lib/queries/events";
import { cn } from "@/lib/utils";
import type { EventListItem } from "@/types/event";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

// 내 이벤트 목록

export const metadata: Metadata = { title: "내 이벤트" };

type EventTab = "hosting" | "attending";

const TABS: { value: EventTab; label: string }[] = [
  { value: "hosting", label: "내가 주최" },
  { value: "attending", label: "내가 참여" },
];

const EMPTY_MESSAGES: Record<EventTab, string> = {
  hosting: "아직 만든 이벤트가 없습니다",
  attending: "참여 중인 이벤트가 없습니다. 공유받은 링크로 응답해보세요",
};

// 정적 쉘(제목·만들기 버튼)만 렌더링하고, 요청 시점 데이터는 Suspense 안에서 읽는다
export default function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">내 이벤트</h1>
        <Button asChild>
          <Link href="/events/new">
            <Plus aria-hidden="true" />
            이벤트 만들기
          </Link>
        </Button>
      </div>
      <Suspense fallback={<EventListSkeleton />}>
        <EventListContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EventListContent({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  // 알 수 없는 값은 주최 탭으로 처리
  const activeTab: EventTab = tab === "attending" ? "attending" : "hosting";
  await connection();
  const now = new Date();

  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login?next=/events");
  const events = await getMyEvents(userId);
  const { upcoming, past } = splitByPhase(events[activeTab], now);

  return (
    <div className="space-y-6">
      <nav aria-label="이벤트 구분" className="grid grid-cols-2 border-b">
        {TABS.map(({ value, label }) => {
          const active = value === activeTab;
          return (
            <Link
              key={value}
              href={`/events?tab=${value}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}{" "}
              <span className="text-muted-foreground">
                {events[value].length}
              </span>
            </Link>
          );
        })}
      </nav>

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <>
          <EventSection title="다가오는 이벤트" items={upcoming} />
          <EventSection title="지난 이벤트" items={past} isPast />
        </>
      )}
    </div>
  );
}

// 다가오는 이벤트: 시작 오름차순 / 지난 이벤트: 시작 내림차순
function splitByPhase(items: EventListItem[], now: Date) {
  const upcoming: EventListItem[] = [];
  const past: EventListItem[] = [];
  for (const item of items) {
    (getEventPhase(item, now) === "ended" ? past : upcoming).push(item);
  }
  const byStart = (a: EventListItem, b: EventListItem) =>
    Date.parse(a.starts_at) - Date.parse(b.starts_at);
  upcoming.sort(byStart);
  past.sort((a, b) => byStart(b, a));
  return { upcoming, past };
}

function EventSection({
  title,
  items,
  isPast = false,
}: {
  title: string;
  items: EventListItem[];
  isPast?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <EventCard event={item} isPast={isPast} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState({ tab }: { tab: EventTab }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-4 py-12 text-center">
      <p className="text-sm text-muted-foreground">{EMPTY_MESSAGES[tab]}</p>
      {tab === "hosting" && (
        <Button asChild variant="outline">
          <Link href="/events/new">
            <Plus aria-hidden="true" />
            이벤트 만들기
          </Link>
        </Button>
      )}
    </div>
  );
}

function EventListSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-6 w-32" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
