// 프로필 입력 검증 스키마 (DB 제약 profiles.display_name 1~50자와 같은 규칙)
import { z } from "zod";

export const DISPLAY_NAME_MAX_LENGTH = 50;

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, { error: "표시 이름을 입력해주세요" })
  .max(DISPLAY_NAME_MAX_LENGTH, {
    error: `표시 이름은 ${DISPLAY_NAME_MAX_LENGTH}자 이하로 입력해주세요`,
  });
