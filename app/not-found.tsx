import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// 전역 404
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start gap-3 px-4 py-8">
        <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <p className="text-muted-foreground">주소가 올바른지 확인해 주세요.</p>
        <Button asChild>
          <Link href="/">홈으로 이동</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
