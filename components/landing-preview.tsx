import { CapacityBadge } from "@/components/capacity-badge";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, MapPin, Waves } from "lucide-react";

// 랜딩 히어로의 이벤트 상세 미리보기 (고정 예시 데이터, DB를 읽지 않는다)
// 실제 상세 화면과 같은 구성이지만 눌러지는 화면이 아니므로 응답 버튼은 버튼이 아닌 모양만 그린다
const SAMPLE = {
  title: "주말 아침 수영 정기모임",
  schedule: "11월 1일 (토) 오전 7:00 ~ 9:00",
  location: "잠실 실내수영장",
  deadline: "응답 마감 10월 31일 (금) 오후 10:00",
};

const CHOICES = [
  { label: "참석", selected: true },
  { label: "불참", selected: false },
  { label: "미정", selected: false },
];

export function LandingPreview() {
  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg">
        <div className="flex aspect-[16/6] items-center justify-center bg-accent text-primary">
          <Waves className="size-12" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <p className="text-lg font-bold">{SAMPLE.title}</p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <CalendarDays
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {SAMPLE.schedule}
              </li>
              <li className="flex items-center gap-2">
                <MapPin
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {SAMPLE.location}
              </li>
              <li className="flex items-center gap-2">
                <Clock
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {SAMPLE.deadline}
              </li>
            </ul>
          </div>
          <CapacityBadge going={10} capacity={10} waitlist={2} />
          <div className="grid grid-cols-3 gap-2" aria-label="참석 응답 예시">
            {CHOICES.map(({ label, selected }) => (
              <span
                key={label}
                className={cn(
                  "flex h-10 items-center justify-center rounded-md border text-sm font-medium",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background"
                )}
              >
                {label}
                {selected && <span className="sr-only"> (선택됨)</span>}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            대기 중입니다. 자리가 나면 순서대로 참석으로 바뀝니다
          </p>
        </div>
      </div>
      <figcaption className="mt-2 text-center text-sm text-muted-foreground">
        예시 화면 · 실제 이벤트 상세와 같은 구성
      </figcaption>
    </figure>
  );
}
