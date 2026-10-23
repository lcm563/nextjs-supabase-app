import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { CalendarCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const NAV_LINKS = [
  { href: "/events", label: "내 이벤트" },
  { href: "/events/new", label: "이벤트 만들기" },
];

// 랜딩과 로그인 영역이 공유하는 공통 헤더
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <CalendarCheck className="size-5 text-primary" />
            <span>모임 이벤트</span>
          </Link>
          {/* 좁은 화면에서는 사용자 메뉴 안의 링크로 대체 */}
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense fallback={<div className="h-9 w-9" />}>
              <AuthButton />
            </Suspense>
          )}
        </div>
      </div>
    </header>
  );
}
