// 세그먼트 loading.tsx 공통 스켈레톤
export function PageLoading() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="불러오는 중">
      <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-full max-w-sm animate-pulse rounded-md bg-muted" />
    </div>
  );
}
