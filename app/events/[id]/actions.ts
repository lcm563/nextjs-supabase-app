"use server";

// 이벤트 상세 Server Action
// 참석 응답: 정원 판정·대기 전환·승격은 DB 함수 respond_to_event가 한 트랜잭션에서 처리한다.
import { failWith, ok, toActionErrorCode } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { reportInputSchema } from "@/lib/validations/report";
import { rsvpInputSchema } from "@/lib/validations/rsvp";
import type { ActionResult } from "@/types/action";
import { isRsvpStatus, type RsvpStatus } from "@/types/rsvp";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function respondToEvent(
  input: unknown
): Promise<ActionResult<{ status: RsvpStatus }>> {
  const parsed = rsvpInputSchema.safeParse(input);
  if (!parsed.success) {
    return failWith("VALIDATION", z.flattenError(parsed.error).fieldErrors);
  }
  const { event_id, status } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_to_event", {
    p_event_id: event_id,
    p_status: status,
  });
  if (error) return failWith(toActionErrorCode(error.message));
  if (!isRsvpStatus(data.status)) return failWith("INTERNAL");

  revalidatePath(`/events/${event_id}`);
  revalidatePath("/events");
  return ok({ status: data.status });
}

const reportEventInputSchema = reportInputSchema.extend({ event_id: z.uuid() });

// 이벤트 신고. 신고자는 세션 사용자로 정한다. 처리 대기(open) 신고가 있으면 부분 unique 인덱스가 막고,
// 처리(숨김·기각)된 뒤에는 다시 신고할 수 있다 (DB_SCHEMA.md 9-4)
export async function reportEvent(input: unknown): Promise<ActionResult<null>> {
  const parsed = reportEventInputSchema.safeParse(input);
  if (!parsed.success) {
    return failWith("VALIDATION", z.flattenError(parsed.error).fieldErrors);
  }
  const { event_id, reason, detail } = parsed.data;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return failWith("UNAUTHENTICATED");

  const { error } = await supabase
    .from("event_reports")
    .insert({ event_id, reporter_id: userId, reason, detail });
  if (error) {
    if (error.code === "23505") return failWith("ALREADY_REPORTED");
    if (error.code === "23503") return failWith("NOT_FOUND");
    return failWith("INTERNAL");
  }

  revalidatePath("/admin", "layout");
  return ok(null);
}
