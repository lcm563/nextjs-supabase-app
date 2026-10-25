import { cn } from "@/lib/utils";
import Link from "next/link";

type AdminFilterTab = {
  href: string;
  label: string;
  count?: number;
  active: boolean;
};

// 관리자 목록 상태 필터 (Link 기반이라 필터가 URL에 남는다)
export function AdminFilterTabs({
  label,
  tabs,
}: {
  /** nav 접근성 이름 */
  label: string;
  tabs: AdminFilterTab[];
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            tab.active
              ? "border-primary bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="tabular-nums">{tab.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
