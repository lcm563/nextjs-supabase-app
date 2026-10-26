"use server";

// 이벤트 생성·수정·삭제 Server Action
// 입력은 폼 원본 값(EventFormValues)을 받아 서버에서 다시 검증한다. host_id는 클라이언트 값을 쓰지 않고 세션에서 정한다.
// 커버 이미지는 브라우저가 Storage에 직접 올리고(본문 1MB 제한 회피) 경로만 cover_image_path로 넘긴다.
import {
  ACTION_ERROR_MESSAGES,
  failWith,
  ok,
  toActionErrorCode,
} from "@/lib/action-result";
import { EVENT_COVER_BUCKET, isOwnCoverPath } from "@/lib/storage/event-covers";
import { createClient } from "@/lib/supabase/server";
import { eventInputSchema } from "@/lib/validations/event";
import type { ActionResult } from "@/types/action";
import type { EventInput } from "@/types/event";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const eventIdSchema = z.uuid();

// 새 경로 / null = 제거 / 없음(undefined) = 기존 유지
const coverInputSchema = z.object({
  cover_image_path: z.string().nullable().optional(),
});

type ParsedInput = { event: EventInput; coverPath: string | null | undefined };

async function getUserId(supabase: Supabase): Promise<string | null> {
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

function parseInput(
  input: unknown
):
  | { data: ParsedInput; error: null }
  | { data: null; error: ActionResult<never> } {
  const parsed = eventInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: failWith("VALIDATION", z.flattenError(parsed.error).fieldErrors),
    };
  }
  const cover = coverInputSchema.safeParse(input);
  if (!cover.success) return { data: null, error: failWith("VALIDATION") };
  return {
    data: { event: parsed.data, coverPath: cover.data.cover_image_path },
    error: null,
  };
}

// 다른 사용자 폴더의 객체를 이벤트에 연결하지 못하도록 경로 소유자를 다시 확인한다
function isValidCoverPath(path: string | null | undefined, userId: string) {
  return typeof path !== "string" || isOwnCoverPath(path, userId);
}

// 이전 커버 객체 정리. 실패해도 이벤트 저장·삭제는 되돌리지 않는다 (고아 파일은 로그로 남김)
async function removeCover(supabase: Supabase, path: string) {
  const { error } = await supabase.storage
    .from(EVENT_COVER_BUCKET)
    .remove([path]);
  if (error) console.error("커버 이미지 삭제 실패", path, error.message);
}

// 주최자 확인. 통과하면 기존 커버 경로를 돌려준다
async function checkHost(
  supabase: Supabase,
  id: string,
  userId: string
): Promise<
  | { coverPath: string | null; error: null }
  | { coverPath: null; error: ActionResult<never> }
> {
  const deny = (error: ActionResult<never>) => ({ coverPath: null, error });
  if (!eventIdSchema.safeParse(id).success) return deny(failWith("NOT_FOUND"));
  const { data, error } = await supabase
    .from("events")
    .select("host_id, cover_image_path")
    .eq("id", id)
    .maybeSingle();
  if (error) return deny(failWith("INTERNAL"));
  if (!data) return deny(failWith("NOT_FOUND"));
  if (data.host_id !== userId) return deny(failWith("FORBIDDEN"));
  return { coverPath: data.cover_image_path, error: null };
}

export async function createEvent(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const { data, error: invalid } = parseInput(input);
  if (invalid) return invalid;

  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return failWith("UNAUTHENTICATED");
  if (!isValidCoverPath(data.coverPath, userId)) return failWith("FORBIDDEN");

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      ...data.event,
      cover_image_path: data.coverPath ?? null,
      host_id: userId,
    })
    .select("id")
    .single();
  if (error) return failWith(toActionErrorCode(error.message));

  revalidatePath("/events");
  return ok({ id: created.id });
}

export async function updateEvent(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const { data, error: invalid } = parseInput(input);
  if (invalid) return invalid;

  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return failWith("UNAUTHENTICATED");
  if (!isValidCoverPath(data.coverPath, userId)) return failWith("FORBIDDEN");
  const host = await checkHost(supabase, id, userId);
  if (host.error) return host.error;

  const { error } = await supabase
    .from("events")
    .update(
      data.coverPath === undefined
        ? data.event
        : { ...data.event, cover_image_path: data.coverPath }
    )
    .eq("id", id);
  if (error) {
    const code = toActionErrorCode(error.message);
    // 정원 축소 거부(events_capacity_guard 트리거)는 정원 필드 오류로 보여준다
    return code === "CAPACITY"
      ? failWith(code, { capacity: [ACTION_ERROR_MESSAGES.CAPACITY] })
      : failWith(code);
  }

  // 교체·제거된 이전 커버 정리
  if (
    data.coverPath !== undefined &&
    host.coverPath &&
    host.coverPath !== data.coverPath
  ) {
    await removeCover(supabase, host.coverPath);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  return ok({ id });
}

export async function deleteEvent(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return failWith("UNAUTHENTICATED");
  const host = await checkHost(supabase, id, userId);
  if (host.error) return host.error;

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return failWith(toActionErrorCode(error.message));

  if (host.coverPath) await removeCover(supabase, host.coverPath);

  revalidatePath("/events");
  return ok(null);
}
