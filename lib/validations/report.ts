// 이벤트 신고 입력 검증 스키마 (클라이언트 폼 + Server Action 공용)
import { z } from "zod";

import { REPORT_REASONS, type ReportReason } from "@/types/admin";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "스팸·광고",
  inappropriate: "부적절한 내용",
  misleading: "허위·오해 소지",
  other: "기타",
};

export const REPORT_DETAIL_MAX_LENGTH = 500;

export const reportInputSchema = z.object({
  reason: z.enum(REPORT_REASONS, { error: "신고 사유를 선택해주세요" }),
  // 비어 있으면 null로 저장
  detail: z
    .string()
    .trim()
    .max(REPORT_DETAIL_MAX_LENGTH, {
      error: `상세 내용은 ${REPORT_DETAIL_MAX_LENGTH}자 이하로 입력해주세요`,
    })
    .transform((value) => value || null),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
