import { AdminEventTable } from "@/components/admin/admin-event-table";
import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { getAdminEvents } from "@/lib/queries/admin";
import type { AdminEventStatusFilter } from "@/types/admin";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

// 전체 이벤트 관리 (숨김 이벤트 포함)

export const metadata: Metadata = { title: "이벤트 관리" };

type SearchParams = Promise<{ q?: string; status?: string }>;

const STATUS_TABS: { value: AdminEventStatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "visible", label: "공개" },
  { value: "hidden", label: "숨김" },
];

function toStatus(value: string | undefined): AdminEventStatusFilter {
  return value === "visible" || value === "hidden" ? value : "all";
}

function eventsHref(q: string, status: AdminEventStatusFilter): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status !== "all") params.set("status", status);
  const query = params.toString();
  return query ? `/admin/events?${query}` : "/admin/events";
}

export default function AdminEventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">이벤트 관리</h1>
      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
        <AdminEventsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminEventsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = toStatus(params.status);
  await connection();

  const rows = (await getAdminEvents({ q, status })).map((event) => ({
    id: event.id,
    title: event.title,
    host_name: event.host.display_name,
    starts_at_label: formatDateTime(event.starts_at),
    rsvp_total: Object.values(event.rsvp_counts).reduce((a, b) => a + b, 0),
    hidden: event.hidden_at !== null,
    hidden_reason: event.hidden_reason,
  }));

  return (
    <div className="space-y-4">
      <AdminSearchForm
        action="/admin/events"
        defaultQuery={q}
        placeholder="제목 또는 주최자 검색"
        hiddenParams={status === "all" ? {} : { status }}
      />
      <AdminFilterTabs
        label="공개 상태"
        tabs={STATUS_TABS.map(({ value, label }) => ({
          href: eventsHref(q, value),
          label,
          active: value === status,
        }))}
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {q ? `‘${q}’ 검색 결과 ` : ""}
        {rows.length}건
      </p>
      {/* 필터·검색이 바뀌면 로컬 처리 상태를 버리고 새 목록으로 */}
      <AdminEventTable key={`${q}|${status}`} rows={rows} />
    </div>
  );
}
