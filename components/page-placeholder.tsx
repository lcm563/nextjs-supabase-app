// 정식 화면 구현 전까지 사용하는 "준비 중" 안내
export function PagePlaceholder({
  title,
  description = "준비 중입니다.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
