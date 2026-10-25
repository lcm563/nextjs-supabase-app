import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { AdminUserTable } from "@/components/admin/admin-user-table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { getMockAdminUsers } from "@/lib/mock";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

// 사용자 관리 (데이터는 Task 009-1에서 admin_list_users RPC로 교체)

export const metadata: Metadata = { title: "사용자 관리" };

type SearchParams = Promise<{ q?: string }>;

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">사용자 관리</h1>
      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
        <AdminUsersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminUsersContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  await connection();
  const now = new Date();

  const totalAdmins = getMockAdminUsers(now).filter(
    (user) => user.role === "admin"
  ).length;
  const rows = getMockAdminUsers(now, { q }).map(
    ({ created_at, last_sign_in_at, ...user }) => ({
      ...user,
      created_at_label: formatDateTime(created_at),
      last_sign_in_label: last_sign_in_at
        ? formatDateTime(last_sign_in_at)
        : null,
    })
  );

  return (
    <div className="space-y-4">
      <AdminSearchForm
        action="/admin/users"
        defaultQuery={q}
        placeholder="이름 또는 이메일 검색"
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {q ? `‘${q}’ 검색 결과 ` : ""}
        {rows.length}명
      </p>
      <AdminUserTable key={q} rows={rows} totalAdmins={totalAdmins} />
    </div>
  );
}
