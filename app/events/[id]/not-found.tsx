import { Button } from "@/components/ui/button";
import Link from "next/link";

// 존재하지 않는 이벤트 (Task 007에서 notFound() 호출)
export default function EventNotFound() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-bold">이벤트를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground">
        삭제되었거나 잘못된 링크일 수 있습니다.
      </p>
      <Button asChild>
        <Link href="/events">내 이벤트로 이동</Link>
      </Button>
    </div>
  );
}
