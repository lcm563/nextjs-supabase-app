"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { REPORT_REASON_LABELS } from "@/lib/validations/report";
import type { EventReport, ReportStatus } from "@/types/admin";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export type ReportListItem = Omit<EventReport, "created_at"> & {
  /** 서버에서 formatDateTime으로 만든 표시 문자열 */
  created_at_label: string;
};

// 모의 처리 지연 (Task 009-1에서 제거)
const MOCK_DELAY_MS = 300;

const STATUS_LABELS: Record<ReportStatus, string> = {
  open: "처리 대기",
  resolved: "숨김 처리됨",
  dismissed: "기각됨",
};

// 신고 카드 목록 (처리 대기면 숨김 처리·기각)
export function ReportList({
  items: initialItems,
}: {
  items: ReportListItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handle = async (
    report: ReportListItem,
    status: Exclude<ReportStatus, "open">
  ) => {
    setBusyId(report.id);
    // TODO(Task 009-1): resolved는 admin_set_event_hidden RPC(이벤트 숨김 + 신고 resolved),
    // dismissed는 event_reports update (status·resolved_at)
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    setItems((prev) =>
      prev.map((item) => (item.id === report.id ? { ...item, status } : item))
    );
    setBusyId(null);
    toast.success(
      status === "resolved"
        ? `‘${report.event_title}’을(를) 숨기고 신고를 처리했습니다`
        : "신고를 기각했습니다"
    );
  };

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        해당하는 신고가 없습니다
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((report) => {
        const busy = busyId === report.id;
        return (
          <li key={report.id}>
            <Card aria-busy={busy}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link
                    href={`/events/${report.event_id}`}
                    className="min-w-0 break-words font-semibold underline-offset-4 hover:underline"
                  >
                    {report.event_title}
                  </Link>
                  <Badge
                    variant={
                      report.status === "open" ? "destructive" : "secondary"
                    }
                    className="shrink-0"
                  >
                    {STATUS_LABELS[report.status]}
                  </Badge>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">사유</dt>
                  <dd>{REPORT_REASON_LABELS[report.reason]}</dd>
                  <dt className="text-muted-foreground">신고자</dt>
                  <dd>{report.reporter.display_name}</dd>
                  <dt className="text-muted-foreground">신고일</dt>
                  <dd>{report.created_at_label}</dd>
                </dl>
                {report.detail && (
                  <p className="whitespace-pre-line break-words rounded-lg bg-muted px-3 py-2 text-sm">
                    {report.detail}
                  </p>
                )}
                {report.status === "open" && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => handle(report, "resolved")}
                    >
                      이벤트 숨김 처리
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => handle(report, "dismissed")}
                    >
                      기각
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
