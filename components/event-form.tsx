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

// 모의 저장 지연 (Task 007에서 제거)
const MOCK_DELAY_MS = 400;

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

  const onSubmit = async (values: EventInput) => {
    // TODO(Task 007): createEvent/updateEvent Server Action(ActionResult) 호출,
    // 실패 시 error.fieldErrors는 form.setError로 반영
    void values;
    // TODO(Task 007-1): 새 파일이면 브라우저 클라이언트로 event-covers/{uid}/{uuid}.{ext}에 업로드한 뒤
    // 경로를 Server Action에 전달 (제거면 null, 기존 유지면 전달하지 않음)
    const uploading = cover.kind === "new";
    await new Promise((resolve) =>
      setTimeout(resolve, MOCK_DELAY_MS + (uploading ? MOCK_DELAY_MS : 0))
    );

    if (mode === "create") {
      toast.success("이벤트를 만들었습니다");
      router.push("/events");
    } else {
      toast.success("변경 사항을 저장했습니다");
      router.push(`/events/${eventId}`);
    }
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
