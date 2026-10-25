import { CapacityBadge } from "@/components/capacity-badge";
import { EventCover } from "@/components/event-cover";
import { Badge } from "@/components/ui/badge";
import { RSVP_STATUS_LABELS, isEventEdited } from "@/lib/event-status";
import { formatEventSchedule } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EventListItem } from "@/types/event";
import { CalendarDays, MapPin, UserRound } from "lucide-react";
import Link from "next/link";

type EventCardProps = {
  event: EventListItem;
  /** 종료 여부. 현재 시각 판단은 호출하는 서버 페이지에서 한다 */
  isPast: boolean;
};

// 이벤트 목록 카드. 카드 전체가 상세 페이지 링크
export function EventCard({ event, isPast }: EventCardProps) {
  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "block rounded-xl border bg-card text-card-foreground shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isPast && "opacity-70"
      )}
    >
      {/* 제목이 바로 아래 있으므로 썸네일은 장식용 */}
      <EventCover src={event.cover_image_url} alt="" variant="card" />
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {event.hidden_at && <Badge variant="destructive">숨김</Badge>}
          {isPast && <Badge variant="outline">종료</Badge>}
          {event.my_status && (
            <Badge variant="default">
              내 응답 · {RSVP_STATUS_LABELS[event.my_status]}
            </Badge>
          )}
          {isEventEdited(event) && <Badge variant="outline">수정됨</Badge>}
        </div>

        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug">
          {event.title}
        </h3>

        <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <dt className="sr-only">일시</dt>
            <CalendarDays
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <dd>{formatEventSchedule(event.starts_at, event.ends_at)}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="sr-only">장소</dt>
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <dd className="line-clamp-1">{event.location}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="sr-only">주최자</dt>
            <UserRound className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <dd>{event.host.display_name}</dd>
          </div>
        </dl>

        <CapacityBadge
          className="mt-3"
          going={event.rsvp_counts.going}
          capacity={event.capacity}
          waitlist={event.rsvp_counts.waitlist}
        />
      </div>
    </Link>
  );
}
