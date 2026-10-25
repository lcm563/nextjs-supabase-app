"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_TABS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/events", label: "이벤트" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/reports", label: "신고" },
];

// 관리자 영역 탭 내비게이션 (360px에서도 4칸 한 줄)
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="관리자 메뉴" className="grid grid-cols-4 border-b">
      {ADMIN_TABS.map(({ href, label }) => {
        // 대시보드는 정확히 일치할 때만, 나머지는 하위 경로 포함
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-2 py-2.5 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
