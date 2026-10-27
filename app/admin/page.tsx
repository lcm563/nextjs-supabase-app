import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AUTH_PROVIDER_LABELS } from "@/lib/auth/providers";
import { formatDateTime } from "@/lib/format";
import { getAdminStats, getRecentUsers, getReports } from "@/lib/queries/admin";
import { REPORT_REASON_LABELS } from "@/lib/validations/report";
import { AUTH_PROVIDERS } from "@/types/admin";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

// 관리자 대시보드

// layout의 title.template은 같은 세그먼트의 page에는 적용되지 않아 전체 제목을 직접 지정
export const metadata: Metadata = {
  title: { absolute: "대시보드 | 관리자 | 모임 이벤트" },
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  await connection();
  const [stats, openReports, recentUsers] = await Promise.all([
    getAdminStats(),
    getReports("open").then((reports) => reports.slice(0, 3)),
    getRecentUsers(3),
  ]);

  const metrics: {
    label: string;
    value: number;
    hint?: string;
    href?: string;
  }[] = [
    {
      label: "가입자",
      value: stats.users_total,
      hint: `이번 주 +${stats.users_new_this_week}`,
    },
    { label: "다가오는 이벤트", value: stats.events_upcoming },
    { label: "종료된 이벤트", value: stats.events_ended },
    { label: "숨긴 이벤트", value: stats.events_hidden },
    { label: "참석 응답", value: stats.rsvps_total },
    {
      label: "처리 대기 신고",
      value: stats.reports_open,
      href: "/admin/reports",
    },
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          주요 지표
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map((metric) => (
            <li key={metric.label}>
              <Card className="h-full">
                <CardContent className="space-y-1 p-4">
                  <p className="text-sm text-muted-foreground">
                    {metric.href ? (
                      <Link
                        href={metric.href}
                        className="underline-offset-4 hover:underline"
                      >
                        {metric.label}
                      </Link>
                    ) : (
                      metric.label
                    )}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {metric.value.toLocaleString("ko-KR")}
                  </p>
                  {metric.hint && (
                    <p className="text-xs text-muted-foreground">
                      {metric.hint}
                    </p>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">가입 방식</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {AUTH_PROVIDERS.map((provider) => {
              const count = stats.users_by_provider[provider];
              const percent =
                stats.users_total === 0
                  ? 0
                  : Math.round((count / stats.users_total) * 100);
              return (
                <li key={provider} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{AUTH_PROVIDER_LABELS[provider]}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {count}명 ({percent}%)
                    </span>
                  </div>
                  {/* 숫자를 위에 표시하므로 막대는 장식 */}
                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">최근 신고</CardTitle>
            <Link
              href="/admin/reports"
              className="py-0.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              전체 보기
            </Link>
          </CardHeader>
          <CardContent>
            {openReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                처리할 신고가 없습니다
              </p>
            ) : (
              <ul className="divide-y">
                {openReports.map((report) => (
                  <li key={report.id} className="space-y-1 py-3 first:pt-0">
                    <Link
                      href={`/events/${report.event_id}`}
                      className="line-clamp-1 font-medium underline-offset-4 hover:underline"
                    >
                      {report.event_title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">
                        {REPORT_REASON_LABELS[report.reason]}
                      </Badge>
                      <span>{formatDateTime(report.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">최근 가입</CardTitle>
            <Link
              href="/admin/users"
              className="py-0.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              전체 보기
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recentUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(user.created_at)} 가입
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {AUTH_PROVIDER_LABELS[user.provider]}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="불러오는 중">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
