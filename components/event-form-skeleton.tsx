import { Skeleton } from "@/components/ui/skeleton";

// 이벤트 폼 로딩 자리 (생성·수정 페이지 공용)
export function EventFormSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9" />
        </div>
      ))}
      <Skeleton className="h-32" />
      <Skeleton className="h-9 w-full sm:w-32" />
    </div>
  );
}
