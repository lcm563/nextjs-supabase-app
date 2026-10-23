import { PagePlaceholder } from "@/components/page-placeholder";

// 이벤트 수정 (주최자 권한 검증은 Task 007)
export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PagePlaceholder
      title="이벤트 수정"
      description={`준비 중입니다. (이벤트 ID: ${id})`}
    />
  );
}
