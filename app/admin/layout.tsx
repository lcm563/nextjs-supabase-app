import { PageLoading } from "@/components/page-loading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMockRole } from "@/lib/mock/role";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: { template: "%s | 관리자 | 모임 이벤트", default: "관리자" },
  robots: { index: false, follow: false },
};

// TODO(Task 004-2b): components/admin/admin-nav.tsx 탭 내비로 교체
const ADMIN_LINKS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/events", label: "이벤트 관리" },
  { href: "/admin/users", label: "사용자 관리" },
  { href: "/admin/reports", label: "신고 관리" },
];

// 관리자 영역 레이아웃: 정적 쉘 + 역할 판정은 Suspense 안에서 (쿠키 읽기)
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        <Suspense fallback={<PageLoading />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

// 관리자가 아니면 관리자 영역의 존재를 드러내지 않도록 404
// TODO(Task 009-1): getMockRole() → is_admin() RPC
async function AdminGate({ children }: { children: React.ReactNode }) {
  if ((await getMockRole()) !== "admin") notFound();

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="관리자 메뉴" className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">관리자</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {ADMIN_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
