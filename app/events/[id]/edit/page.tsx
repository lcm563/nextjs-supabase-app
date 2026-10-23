import { DeleteEventDialog } from "@/components/delete-event-dialog";
import { EventForm } from "@/components/event-form";
import { EventFormSkeleton } from "@/components/event-form-skeleton";
import { Separator } from "@/components/ui/separator";
import { MOCK_CURRENT_USER_ID, getMockEventDetail } from "@/lib/mock";
import { eventToFormValues } from "@/lib/validations/event";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

// 이벤트 수정·삭제 (데이터는 Task 007에서 실제 쿼리로 교체)
// 비주최자 리다이렉트는 UI 분기일 뿐이며, 권한은 Task 007 Server Action에서 다시 검증한다.

export const metadata: Metadata = { title: "이벤트 수정" };

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">이벤트 수정</h1>
      <Suspense fallback={<EventFormSkeleton />}>
        <EditEventContent params={params} />
      </Suspense>
    </div>
  );
}

async function EditEventContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection();
  const event = getMockEventDetail(id, new Date());
  if (!event) notFound();
  if (event.host.id !== MOCK_CURRENT_USER_ID) redirect(`/events/${id}`);

  return (
    <div className="space-y-8">
      <EventForm
        mode="edit"
        eventId={event.id}
        defaultValues={eventToFormValues(event)}
      />
      <Separator />
      <section
        aria-labelledby="danger-zone"
        className="space-y-3 rounded-xl border border-destructive/50 p-4"
      >
        <h2 id="danger-zone" className="text-lg font-semibold">
          위험 구역
        </h2>
        <p className="text-sm text-muted-foreground">
          이벤트를 삭제하면 참여자들이 더 이상 상세 페이지에 접근할 수 없고,
          모든 응답 내역이 함께 삭제됩니다.
        </p>
        <DeleteEventDialog eventId={event.id} eventTitle={event.title} />
      </section>
    </div>
  );
}
