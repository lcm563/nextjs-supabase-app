// 참석 응답 입력 검증 스키마 (Server Action 공용)
// waitlist는 사용자가 고를 수 없고, 정원 초과 시 DB 함수(respond_to_event)가 지정한다.
import { z } from "zod";

import { RSVP_STATUSES } from "@/types/rsvp";

export const rsvpChoiceSchema = z
  .enum(RSVP_STATUSES)
  .exclude(["waitlist"], { error: "참석, 불참, 미정 중 하나를 선택해주세요" });

export const rsvpInputSchema = z.object({
  event_id: z.uuid("올바르지 않은 이벤트입니다"),
  status: rsvpChoiceSchema,
});

export type RsvpInput = z.infer<typeof rsvpInputSchema>;
