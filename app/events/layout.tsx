import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// 이벤트 영역 공통 레이아웃: 랜딩과 동일한 헤더/푸터 구조
export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
