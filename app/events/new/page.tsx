import { EventForm } from "@/components/event-form";
import { EventFormSkeleton } from "@/components/event-form-skeleton";
import { getMockEventDetail } from "@/lib/mock";
import {
  emptyEventFormValues,
  eventToFormValues,
  type EventFormValues,
} from "@/lib/validations/event";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

// 이벤트 만들기. ?copy=[id]면 기존 이벤트 내용으로 미리 채운다 (데이터는 Task 007에서 실제 쿼리로 교체)

export const metadata: Metadata = { title: "이벤트 만들기" };

export default function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ copy?: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">이벤트 만들기</h1>
        <p className="text-sm text-muted-foreground">
          만든 뒤 상세 페이지 링크를 공유하면 참석 응답을 받을 수 있습니다.
        </p>
      </div>
      <Suspense fallback={<EventFormSkeleton />}>
        <NewEventFormContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewEventFormContent({
  searchParams,
}: {
  searchParams: Promise<{ copy?: string }>;
}) {
  const { copy } = await searchParams;
  if (!copy) {
    return <EventForm mode="create" defaultValues={emptyEventFormValues} />;
  }

  await connection();
  const source = getMockEventDetail(copy, new Date());
  if (!source) {
    return <EventForm mode="create" defaultValues={emptyEventFormValues} />;
  }

  // 복제 시 일시는 새로 지정하도록 비운다
  const defaultValues: EventFormValues = {
    ...eventToFormValues(source),
    starts_at: "",
    ends_at: "",
    rsvp_deadline: "",
  };

  return (
    <div className="space-y-6">
      <p role="status" className="rounded-lg border bg-muted px-4 py-3 text-sm">
        ‘{source.title}’ 내용을 복사했습니다. 일시를 새로 지정해주세요
      </p>
      <EventForm mode="create" defaultValues={defaultValues} />
    </div>
  );
}
