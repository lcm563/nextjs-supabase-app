"use client";

import {
  CoverImageField,
  type CoverImageState,
} from "@/components/cover-image-field";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EVENT_COVER_BUCKET,
  buildCoverPath,
  coverUploadErrorMessage,
} from "@/lib/storage/event-covers";
import { createClient } from "@/lib/supabase/client";
import { createEvent, updateEvent } from "@/app/events/actions";
import {
  EVENT_LIMITS,
  eventInputSchema,
  type EventFormValues,
} from "@/lib/validations/event";
import type { EventInput } from "@/types/event";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import { toast } from "sonner";

type EventFormProps = {
  mode: "create" | "edit";
  defaultValues: EventFormValues;
  /** mode가 edit일 때 필수 */
  eventId?: string;
  /** 수정 화면의 기존 커버 URL */
  defaultCoverUrl?: string | null;
};

// 브라우저에서 Storage로 직접 올린다 (Server Action 본문 1MB 제한 회피).
// 실패하면 원인별 안내 문구를 돌려주고, 진단용으로 Storage 오류 원문을 콘솔에 남긴다
async function uploadCover(
  file: File
): Promise<{ path: string; error: null } | { path: null; error: string }> {
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    console.error("커버 이미지 업로드 실패: 세션 없음");
    return { path: null, error: coverUploadErrorMessage(null) };
  }

  const path = buildCoverPath(userId, file);
  const { error } = await supabase.storage
    .from(EVENT_COVER_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (!error) return { path, error: null };

  console.error("커버 이미지 업로드 실패", {
    name: error.name,
    message: error.message,
    status: error.status,
    statusCode: error.statusCode,
    file: { type: file.type, size: file.size },
  });
  return { path: null, error: coverUploadErrorMessage(error) };
}

// 이벤트 저장이 실패하면 방금 올린 객체를 지운다. 이 정리마저 실패하면 고아 파일로 남는다
async function discardUploadedCover(path: string) {
  await createClient().storage.from(EVENT_COVER_BUCKET).remove([path]);
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

// 이벤트 생성/수정 공용 폼
export function EventForm({
  mode,
  defaultValues,
  eventId,
  defaultCoverUrl = null,
}: EventFormProps) {
  const router = useRouter();
  // 커버는 File이라 react-hook-form 값 대신 별도 상태로 둔다
  const [cover, setCover] = useState<CoverImageState>(
    defaultCoverUrl
      ? { kind: "existing", url: defaultCoverUrl }
      : { kind: "none" }
  );
  const form = useForm<EventFormValues, unknown, EventInput>({
    resolver: zodResolver(eventInputSchema),
    defaultValues,
    mode: "onTouched",
  });
  // shadcn FormField는 변환 출력 타입(TTransformedValues)을 받지 않으므로
  // 필드 렌더링용 control만 입력 타입으로 맞춘다. handleSubmit은 EventInput을 그대로 받는다.
  const control = form.control as unknown as Control<EventFormValues>;
  const description = useWatch({ control, name: "description" });
  const { isSubmitting } = form.formState;

  // 클라이언트 검증을 통과한 뒤, 서버가 다시 검증하도록 변환 전 폼 값을 보낸다
  const onSubmit = async () => {
    const values = form.getValues();

    // 커버: 새 파일이면 업로드한 경로, 기존 커버를 제거했으면 null, 그대로면 undefined(기존 유지)
    let coverPath: string | null | undefined;
    if (cover.kind === "new") {
      const uploaded = await uploadCover(cover.file);
      if (uploaded.error !== null) {
        toast.error(uploaded.error);
        return;
      }
      coverPath = uploaded.path;
    } else if (cover.kind === "none" && defaultCoverUrl) {
      coverPath = null;
    }

    const input = { ...values, cover_image_path: coverPath };
    const result =
      mode === "create"
        ? await createEvent(input)
        : await updateEvent(eventId ?? "", input);

    if (!result.success) {
      if (cover.kind === "new" && coverPath) {
        await discardUploadedCover(coverPath);
      }
      const { message, fieldErrors } = result.error;
      for (const [name, messages] of Object.entries(fieldErrors ?? {})) {
        if (name in values && messages[0]) {
          form.setError(
            name as keyof EventFormValues,
            { message: messages[0] },
            { shouldFocus: true }
          );
        }
      }
      toast.error(message);
      return;
    }

    toast.success(
      mode === "create" ? "이벤트를 만들었습니다" : "변경 사항을 저장했습니다"
    );
    router.push(`/events/${result.data.id}`);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-6"
      >
        <CoverImageField defaultUrl={defaultCoverUrl} onChange={setCover} />

        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                제목
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="예: 아침 한강 러닝 5km"
                  maxLength={EVENT_LIMITS.titleMax}
                  aria-required="true"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={control}
            name="starts_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  시작 일시
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    aria-required="true"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="ends_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>종료 일시</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                장소
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="예: 반포한강공원 달빛광장"
                  maxLength={EVENT_LIMITS.locationMax}
                  aria-required="true"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>정원</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={EVENT_LIMITS.capacityMax}
                    placeholder="예: 10"
                    {...field}
                  />
                </FormControl>
                <FormDescription>비우면 정원 없음</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="rsvp_deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>응답 마감 일시</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormDescription>비우면 시작 전까지 응답 가능</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="준비물, 모이는 위치, 진행 방식 등을 알려주세요"
                  className="min-h-32"
                  maxLength={EVENT_LIMITS.descriptionMax}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-right">
                {description.length}/{EVENT_LIMITS.descriptionMax}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting
            ? "저장 중…"
            : mode === "create"
              ? "이벤트 만들기"
              : "변경 사항 저장"}
        </Button>
      </form>
    </Form>
  );
}
