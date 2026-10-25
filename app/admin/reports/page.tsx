import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { ReportList } from "@/components/admin/report-list";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { getMockReports } from "@/lib/mock";
import type { ReportStatus } from "@/types/admin";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

// 신고 관리 (데이터는 Task 009-1에서 event_reports 조회로 교체)

export const metadata: Metadata = { title: "신고 관리" };

type SearchParams = Promise<{ status?: string }>;

const STATUS_TABS: { value: ReportStatus; label: string }[] = [
  { value: "open", label: "처리 대기" },
  { value: "resolved", label: "숨김 처리" },
  { value: "dismissed", label: "기각" },
];

function toStatus(value: string | undefined): ReportStatus {
  return value === "resolved" || value === "dismissed" ? value : "open";
}

export default function AdminReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">신고 관리</h1>
      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
        <AdminReportsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminReportsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status: rawStatus } = await searchParams;
  const status = toStatus(rawStatus);
  await connection();
  const now = new Date();

  const all = getMockReports(now);
  const items = all
    .filter((report) => report.status === status)
    .map(({ created_at, ...report }) => ({
      ...report,
      created_at_label: formatDateTime(created_at),
    }));

  return (
    <div className="space-y-4">
      <AdminFilterTabs
        label="신고 상태"
        tabs={STATUS_TABS.map(({ value, label }) => ({
          href:
            value === "open"
              ? "/admin/reports"
              : `/admin/reports?status=${value}`,
          label,
          count: all.filter((report) => report.status === value).length,
          active: value === status,
        }))}
      />
      <ReportList key={status} items={items} />
    </div>
  );
}
