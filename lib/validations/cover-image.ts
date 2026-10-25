// 이벤트 커버 이미지 파일 검증 (클라이언트 입력 + Server Action 공용)
import { z } from "zod";

export const COVER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const COVER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const coverImageFileSchema = z
  .file({ error: "이미지 파일을 선택해주세요" })
  .max(COVER_IMAGE_MAX_BYTES, { error: "이미지는 5MB 이하로 올려주세요" })
  .mime(COVER_IMAGE_TYPES, {
    error: "JPG, PNG, WEBP 형식의 이미지만 올릴 수 있어요",
  });

// 통과하면 null, 아니면 첫 번째 오류 메시지
export function validateCoverImage(file: File): string | null {
  const result = coverImageFileSchema.safeParse(file);
  return result.success ? null : (result.error.issues[0]?.message ?? null);
}
