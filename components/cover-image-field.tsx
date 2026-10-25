"use client";

import { EventCover } from "@/components/event-cover";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  COVER_IMAGE_TYPES,
  validateCoverImage,
} from "@/lib/validations/cover-image";
import { useEffect, useId, useRef, useState } from "react";

export type CoverImageState =
  | { kind: "none" }
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; previewUrl: string };

type CoverImageFieldProps = {
  /** 수정 화면의 기존 커버 URL */
  defaultUrl: string | null;
  onChange?: (state: CoverImageState) => void;
};

// 이벤트 커버 이미지 선택·미리보기·제거
export function CoverImageField({
  defaultUrl,
  onChange,
}: CoverImageFieldProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const [state, setState] = useState<CoverImageState>(
    defaultUrl ? { kind: "existing", url: defaultUrl } : { kind: "none" }
  );
  const [error, setError] = useState<string | null>(null);
  // 현재 미리보기 blob URL (교체·제거·언마운트 시 해제)
  const previewRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  const update = (next: CoverImageState) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next.kind === "new" ? next.previewUrl : null;
    setState(next);
    onChange?.(next);
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 발생하도록 비운다
    event.target.value = "";
    if (!file) return;

    const message = validateCoverImage(file);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    update({ kind: "new", file, previewUrl: URL.createObjectURL(file) });
  };

  const src =
    state.kind === "existing"
      ? state.url
      : state.kind === "new"
        ? state.previewUrl
        : null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-none">커버 이미지</p>
      <EventCover src={src} alt="선택한 커버 이미지 미리보기" variant="hero" />
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={inputId}
          type="file"
          accept={COVER_IMAGE_TYPES.join(",")}
          onChange={handleFile}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
          )}
        >
          {src ? "이미지 변경" : "이미지 선택"}
        </label>
        {src && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(null);
              update({ kind: "none" });
            }}
          >
            제거
          </Button>
        )}
      </div>
      <p id={hintId} className="text-sm text-muted-foreground">
        JPG·PNG·WebP, 5MB 이하
      </p>
      <p
        id={errorId}
        aria-live="polite"
        // 라이브 영역은 숨기지 않아야 오류가 바로 읽힌다
        className="text-sm font-medium text-destructive"
      >
        {error}
      </p>
    </div>
  );
}
