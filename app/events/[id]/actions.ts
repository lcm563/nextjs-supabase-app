"use server";

// 참석 응답 Server Action. 정원 판정·대기 전환·승격은 DB 함수 respond_to_event가 한 트랜잭션에서 처리한다.
import { failWith, ok, toActionErrorCode } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
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
