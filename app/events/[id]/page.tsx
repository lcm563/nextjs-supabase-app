import { AttendeeList } from "@/components/attendee-list";
import { CapacityBadge } from "@/components/capacity-badge";
import { RsvpButtons } from "@/components/rsvp-buttons";
import { ShareLinkButton } from "@/components/share-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventPhase, isEventEdited } from "@/lib/event-status";
import { formatDateTime, formatEventSchedule } from "@/lib/format";
import { MOCK_CURRENT_USER_ID, getMockEventDetail } from "@/lib/mock";
import { CalendarDays, Clock, Copy, MapPin, Pencil, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

// 이벤트 상세 (데이터는 Task 007에서 실제 쿼리로 교체)
// 공유 미리보기는 루트 기본 카드를 쓰므로 generateMetadata를 두지 않는다 (PRD 8장)

export const metadata: Metadata = { title: "이벤트 상세" };

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetailContent params={params} />
      </Suspense>
    </div>
  );
}

async function EventDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection();
  const now = new Date();
  const event = getMockEventDetail(id, now);
  if (!event) notFound();

  const phase = getEventPhase(event, now);
  const isHost = event.host.id === MOCK_CURRENT_USER_ID;
  const isFull =
    event.capacity !== null && event.rsvp_counts.going >= event.capacity;
  const edited = isEventEdited(event);

  return (
    <article className="space-y-6">
      <header className="space-y-4">
        <div className="space-y-2">
          <h1 className="break-words text-2xl font-bold">{event.title}</h1>
          {edited && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">수정됨</Badge>
              <span>{formatDateTime(event.updated_at)} 수정</span>
            </div>
          )}
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <dt className="sr-only">일시</dt>
            <CalendarDays
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <dd>{formatEventSchedule(event.starts_at, event.ends_at)}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="sr-only">장소</dt>
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <dd className="break-words">{event.location}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="sr-only">주최자</dt>
            <User
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <dd>주최 {event.host.display_name}</dd>
          </div>
          {event.rsvp_deadline && (
            <div className="flex items-start gap-2">
              <dt className="sr-only">응답 마감</dt>
              <Clock
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <dd>응답 마감 {formatDateTime(event.rsvp_deadline)}</dd>
            </div>
          )}
        </dl>

        <div className="flex flex-wrap gap-2">
          <ShareLinkButton eventId={event.id} />
          {isHost && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/events/${event.id}/edit`}>
                  <Pencil aria-hidden="true" />
                  수정
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/events/new?copy=${event.id}`}>
                  <Copy aria-hidden="true" />
                  복제
                </Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section aria-labelledby="rsvp-heading">
        <h2 id="rsvp-heading" className="sr-only">
          참석 응답
        </h2>
        <Card>
          {/* 마감·종료 안내는 RsvpButtons가 버튼 아래에 표시한다 */}
          <CardContent className="space-y-4 p-4">
            <CapacityBadge
              going={event.rsvp_counts.going}
              capacity={event.capacity}
              waitlist={event.rsvp_counts.waitlist}
            />
            <RsvpButtons
              eventId={event.id}
              initialStatus={event.my_status}
              phase={phase}
              isFull={isFull}
            />
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section aria-labelledby="notice-heading" className="space-y-2">
        <h2 id="notice-heading" className="text-lg font-semibold">
          공지 내용
        </h2>
        {event.description ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {event.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            등록된 공지 내용이 없습니다
          </p>
        )}
      </section>

      <Separator />

      <section aria-labelledby="attendees-heading" className="space-y-3">
        <h2 id="attendees-heading" className="text-lg font-semibold">
          참여자 현황
        </h2>
        <AttendeeList
          attendees={event.attendees}
          currentUserId={MOCK_CURRENT_USER_ID}
        />
      </section>
    </article>
  );
}

function EventDetailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-8 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-24" />
      <Skeleton className="h-40" />
    </div>
  );
}
