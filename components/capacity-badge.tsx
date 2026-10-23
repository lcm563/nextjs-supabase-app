import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

type CapacityBadgeProps = {
  going: number;
  /** null = 정원 무제한 */
  capacity: number | null;
  waitlist: number;
  className?: string;
};

// 정원 대비 참석 인원 배지
// "참석 3/10", "참석 10/10 · 정원 마감 · 대기 2", "참석 5명 · 정원 없음"
export function CapacityBadge({
  going,
  capacity,
  waitlist,
  className,
}: CapacityBadgeProps) {
  const isFull = capacity !== null && going >= capacity;

  const parts =
    capacity === null
      ? [`참석 ${going}명`, "정원 없음"]
      : [`참석 ${going}/${capacity}`];
  if (isFull) parts.push("정원 마감");
  if (waitlist > 0) parts.push(`대기 ${waitlist}`);

  return (
    <Badge
      variant={isFull ? "destructive" : "secondary"}
      className={cn("gap-1 font-medium", className)}
    >
      <Users className="size-3" aria-hidden="true" />
      {parts.join(" · ")}
    </Badge>
  );
}
