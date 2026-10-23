// ActionResult 생성 헬퍼: Server Action은 항상 ok/fail로 결과를 반환한다.
import type { ActionErrorCode, ActionResult } from "@/types/action";

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail(
  code: ActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return {
    success: false,
    error: fieldErrors ? { code, message, fieldErrors } : { code, message },
  };
}
