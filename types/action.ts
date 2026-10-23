// Server Action 공통 결과 규약 (타입 전용, 런타임 헬퍼는 lib/action-result.ts)

export type ActionErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CAPACITY"
  | "DEADLINE_PASSED"
  | "EVENT_ENDED"
  | "INTERNAL";

export type ActionError = {
  code: ActionErrorCode;
  message: string;
  /** 필드별 검증 오류 메시지 (VALIDATION 코드에서 사용) */
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T> =
  { success: true; data: T } | { success: false; error: ActionError };
