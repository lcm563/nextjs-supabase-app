import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RSVP_STATUS_LABELS, RSVP_STATUS_ORDER } from "@/lib/event-status";
import type { Attendee, RsvpStatus } from "@/types/rsvp";

type AttendeeListProps = {
  attendees: Attendee[];
  currentUserId?: string;
};

// 대기는 먼저 들어온 순(승격 순서), 나머지는 이름 가나다순
function sortAttendees(status: RsvpStatus, list: Attendee[]): Attendee[] {
  return [...list].sort((a, b) =>
    status === "waitlist"
      ? Date.parse(a.updated_at) - Date.parse(b.updated_at)
      : a.display_name.localeCompare(b.display_name, "ko")
  );
}

function getInitial(name: string): string {
  return Array.from(name.trim())[0] ?? "?";
}

// 응답 상태별 참여자 현황
export function AttendeeList({ attendees, currentUserId }: AttendeeListProps) {
  if (attendees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        아직 응답한 사람이 없습니다
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {RSVP_STATUS_ORDER.map((status) => {
        const list = sortAttendees(
          status,
          attendees.filter((attendee) => attendee.status === status)
        );
        const label = RSVP_STATUS_LABELS[status];

        return (
          <section key={status} aria-label={`${label} 참여자`}>
            <h3 className="text-sm font-semibold">
              {label}{" "}
              <span className="text-muted-foreground">{list.length}명</span>
            </h3>
            {list.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                아직 없습니다
              </p>
            ) : (
              <ul className="mt-2 divide-y rounded-lg border">
                {list.map((attendee, index) => (
                  <li
                    key={attendee.user_id}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <Avatar className="size-8">
                      {attendee.avatar_url && (
                        <AvatarImage src={attendee.avatar_url} alt="" />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitial(attendee.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {attendee.display_name}
                      {attendee.user_id === currentUserId && (
                        <span className="ml-1 text-muted-foreground">(나)</span>
                      )}
                    </span>
                    {status === "waitlist" && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        대기 {index + 1}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
