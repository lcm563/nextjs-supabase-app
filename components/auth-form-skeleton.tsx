import { Skeleton } from "@/components/ui/skeleton";

// 로그인·가입 카드 로딩 자리 (next 파라미터를 읽는 동안)
export function AuthFormSkeleton() {
  return (
    <div className="space-y-6 rounded-xl border p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9" />
        </div>
      ))}
      <Skeleton className="h-9" />
      <Skeleton className="h-28" />
    </div>
  );
}
