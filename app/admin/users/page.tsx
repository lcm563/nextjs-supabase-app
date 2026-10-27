import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { AdminUserTable } from "@/components/admin/admin-user-table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { getAdminUsers } from "@/lib/queries/admin";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

// 사용자 관리 (admin_list_users RPC, 가입 최신순 최대 100명)

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

  const { rows: users, total, totalAdmins } = await getAdminUsers({ q });
  const rows = users.map(({ created_at, last_sign_in_at, ...user }) => ({
    ...user,
    created_at_label: formatDateTime(created_at),
    last_sign_in_label: last_sign_in_at
      ? formatDateTime(last_sign_in_at)
      : null,
  }));

  return (
    <div className="space-y-4">
      <AdminSearchForm
        action="/admin/users"
        defaultQuery={q}
        placeholder="이름 또는 이메일 검색"
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {q ? `‘${q}’ 검색 결과 ` : ""}
        {total}명{total > rows.length ? ` 중 최근 ${rows.length}명 표시` : ""}
      </p>
      <AdminUserTable key={q} rows={rows} totalAdmins={totalAdmins} />
    </div>
  );
}
