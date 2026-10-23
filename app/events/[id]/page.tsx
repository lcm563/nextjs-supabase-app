import { PagePlaceholder } from "@/components/page-placeholder";

// 이벤트 상세 (데이터 조회·notFound 처리는 Task 007)
export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PagePlaceholder
      title="이벤트 상세"
      description={`준비 중입니다. (이벤트 ID: ${id})`}
    />
  );
}
