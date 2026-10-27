import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

type EventCoverProps = {
  /** 공개 URL 또는 미리보기 blob URL. null이면 기본 배경 */
  src: string | null;
  /** 장식용(카드 썸네일)이면 빈 문자열 */
  alt: string;
  variant: "card" | "hero";
  /**
   * 첫 화면 로딩 방식 (Next 16: priority 대신)
   * - "preload": LCP가 확실한 단일 이미지 (상세 상단). <head>에 preload 링크를 넣는다
   * - "eager": 첫 화면에 보일 수 있는 여러 이미지 (목록 앞쪽 카드). 지연 로딩만 끈다
   * - 생략: 지연 로딩
   */
  loadingMode?: "preload" | "eager";
  className?: string;
};

const SIZES: Record<EventCoverProps["variant"], string> = {
  card: "(min-width: 640px) 50vw, 100vw",
  hero: "(min-width: 672px) 672px, 100vw",
};

// 이벤트 커버 이미지 (16:9). 훅이 없어 서버·클라이언트 컴포넌트 모두에서 쓴다
export function EventCover({
  src,
  alt,
  variant,
  loadingMode,
  className,
}: EventCoverProps) {
  return (
    <div
      className={cn(
        "relative aspect-[16/9] overflow-hidden bg-muted",
        variant === "card" ? "rounded-t-xl" : "rounded-xl",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={SIZES[variant]}
          preload={loadingMode === "preload"}
          loading={loadingMode === "eager" ? "eager" : undefined}
          // blob: 미리보기는 최적화 서버가 읽을 수 없다 (.svg는 Next가 자동으로 건너뜀)
          unoptimized={src.startsWith("blob:")}
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageIcon className="size-8" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
