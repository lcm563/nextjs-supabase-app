"use server";

// 관리자 Server Action. 권한은 DB가 판정한다: RPC는 함수 안의 is_admin(), 강제 삭제는 events DELETE 정책 (DB_SCHEMA.md 9장)
import { failWith, ok, toActionErrorCode } from "@/lib/action-result";
import { removeCoverObject } from "@/lib/storage/event-covers";
import { createClient } from "@/lib/supabase/server";
import {
  eventHiddenInputSchema,
  userRoleInputSchema,
} from "@/lib/validations/admin";
import type { ActionResult } from "@/types/action";
import type { UserRole } from "@/types/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const idSchema = z.uuid();

// 관리자 화면 전체와 해당 이벤트 화면을 갱신한다
function revalidateAdmin(eventId?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath("/events");
  if (eventId) revalidatePath(`/events/${eventId}`);
}

// 이벤트 숨김·복구. 숨기면 그 이벤트의 처리 대기 신고가 resolved로, 복구하면 resolved 신고가 dismissed로 바뀐다
export async function setEventHidden(
  input: unknown
): Promise<ActionResult<null>> {
  const parsed = eventHiddenInputSchema.safeParse(input);
  if (!parsed.success) {
    return failWith("VALIDATION", z.flattenError(parsed.error).fieldErrors);
  }
  const { event_id, hidden } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_event_hidden", {
    p_event_id: event_id,
    p_hidden: hidden,
    p_reason: parsed.data.hidden ? parsed.data.reason : undefined,
  });
  if (error) return failWith(toActionErrorCode(error.message));

  revalidateAdmin(event_id);
  return ok(null);
}

// 이벤트 강제 삭제 후 커버 정리 (다른 사용자 폴더의 커버는 Storage 관리자 정책으로 지운다)
export async function deleteEventAsAdmin(
  eventId: string
): Promise<ActionResult<null>> {
  if (!idSchema.safeParse(eventId).success) return failWith("NOT_FOUND");

  const supabase = await createClient();
  const { data: event, error: readError } = await supabase
    .from("events")
    .select("cover_image_path")
    .eq("id", eventId)
    .maybeSingle();
  if (readError) return failWith("INTERNAL");
  if (!event) return failWith("NOT_FOUND");

  // RLS가 관리자가 아니면 0건으로 만들므로 삭제된 행으로 권한을 확인한다
  const { data: deleted, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .select("id");
  if (error) return failWith(toActionErrorCode(error.message));
  if (deleted.length === 0) return failWith("FORBIDDEN");

  if (event.cover_image_path) {
    await removeCoverObject(supabase, event.cover_image_path);
  }

  revalidateAdmin(eventId);
  return ok(null);
}

// 역할 변경. 마지막 관리자 해제는 DB가 LAST_ADMIN으로 거부한다
export async function setUserRole(
  input: unknown
): Promise<ActionResult<{ role: UserRole }>> {
  const parsed = userRoleInputSchema.safeParse(input);
  if (!parsed.success) return failWith("VALIDATION");
  const { user_id, role } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_role", {
    p_target: user_id,
    p_role: role,
  });
  if (error) return failWith(toActionErrorCode(error.message));

  revalidateAdmin();
  return ok({ role });
}

// 신고 기각 (처리 대기 신고만)
export async function dismissReport(
  reportId: string
): Promise<ActionResult<null>> {
  if (!idSchema.safeParse(reportId).success) return failWith("NOT_FOUND");

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_dismiss_report", {
    p_report_id: reportId,
  });
  if (error) return failWith(toActionErrorCode(error.message));

  revalidateAdmin();
  return ok(null);
}
