"use client";

import { Button } from "@/components/ui/button";
import { RSVP_STATUS_LABELS, type EventPhase } from "@/lib/event-status";
import type { RsvpChoice, RsvpStatus } from "@/types/rsvp";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type RsvpButtonsProps = {
  eventId: string;
  initialStatus: RsvpStatus | null;
  /** 서버 페이지에서 현재 시각 기준으로 계산해 넘긴다 */
  phase: EventPhase;
  isFull: boolean;
};

const CHOICES: RsvpChoice[] = ["going", "not_going", "maybe"];

const PHASE_NOTICES: Record<Exclude<EventPhase, "open">, string> = {
  deadline_passed: "응답이 마감되었습니다",
  ended: "종료된 이벤트입니다",
};

// 모의 응답 지연 (Task 008에서 제거)
const MOCK_DELAY_MS = 300;

// 참석/불참/미정 응답 버튼
export function RsvpButtons({
  eventId,
  initialStatus,
  phase,
  isFull,
}: RsvpButtonsProps) {
  const [status, setStatus] = useState<RsvpStatus | null>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const disabled = phase !== "open" || isPending;

  // 대기 중이면 '참석'을 요청한 상태로 본다
  const isSelected = (choice: RsvpChoice) =>
    status === choice || (choice === "going" && status === "waitlist");

  const respond = (choice: RsvpChoice) => {
    if (disabled || isSelected(choice)) return;

    startTransition(async () => {
      // TODO(Task 008): respondToEvent Server Action 호출로 교체 (eventId, choice)
      void eventId;
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

      if (choice === "going" && isFull) {
        setStatus("waitlist");
        toast.info("정원이 가득 차 대기자로 등록되었습니다");
        return;
      }
      setStatus(choice);
      toast.success(`${RSVP_STATUS_LABELS[choice]}으로 응답했습니다`);
    });
  };

  const notice =
    phase !== "open"
      ? PHASE_NOTICES[phase]
      : status === "waitlist"
        ? "대기 중입니다. 자리가 나면 순서대로 참석으로 바뀝니다"
        : null;

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label="참석 응답"
        aria-busy={isPending}
        className="grid grid-cols-3 gap-2"
      >
        {CHOICES.map((choice) => {
          const selected = isSelected(choice);
          return (
            <Button
              key={choice}
              type="button"
              variant={selected ? "default" : "outline"}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => respond(choice)}
              className="h-10"
            >
              {RSVP_STATUS_LABELS[choice]}
            </Button>
          );
        })}
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {notice}
      </p>
    </div>
  );
}
