// 관리자 작업 입력 검증 스키마 (Server Action 재검증용, DB RPC 검증과 같은 규칙)
import { z } from "zod";

// DB_SCHEMA.md 9-3: hidden_reason 200자 제한
export const HIDDEN_REASON_MAX = 200;

export const eventHiddenInputSchema = z.discriminatedUnion("hidden", [
  z.object({
    event_id: z.uuid(),
    hidden: z.literal(true),
    reason: z
      .string()
      .trim()
      .min(1, { error: "숨김 사유를 입력해주세요" })
      .max(HIDDEN_REASON_MAX, {
        error: `숨김 사유는 ${HIDDEN_REASON_MAX}자 이하로 입력해주세요`,
      }),
  }),
  z.object({ event_id: z.uuid(), hidden: z.literal(false) }),
]);

export const userRoleInputSchema = z.object({
  user_id: z.uuid(),
  role: z.enum(["user", "admin"]),
});
