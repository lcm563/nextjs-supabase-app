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

// 오류 코드별 사용자 안내 문구 (화면에 보일 한국어는 앱에서 정한다)
export const ACTION_ERROR_MESSAGES: Record<ActionErrorCode, string> = {
  UNAUTHENTICATED: "로그인이 필요합니다",
  FORBIDDEN: "권한이 없습니다",
  NOT_FOUND: "이벤트를 찾을 수 없습니다",
  VALIDATION: "입력값을 확인해주세요",
  CAPACITY: "현재 참석 인원보다 적게 정원을 줄일 수 없습니다",
  DEADLINE_PASSED: "응답이 마감되었습니다",
  EVENT_ENDED: "종료된 이벤트입니다",
  LAST_ADMIN: "마지막 관리자는 해제할 수 없습니다",
  ALREADY_REPORTED: "이미 신고한 이벤트입니다. 관리자가 검토 중입니다",
  INTERNAL: "잠시 후 다시 시도해주세요",
};

const ACTION_ERROR_CODES = Object.keys(
  ACTION_ERROR_MESSAGES
) as ActionErrorCode[];

// DB 함수·트리거의 raise exception message(= ActionErrorCode)를 코드로 바꾼다. 알 수 없으면 INTERNAL
export function toActionErrorCode(message?: string): ActionErrorCode {
  return ACTION_ERROR_CODES.find((code) => code === message) ?? "INTERNAL";
}

// 기본 안내 문구로 실패 결과를 만든다
export function failWith(
  code: ActionErrorCode,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return fail(code, ACTION_ERROR_MESSAGES[code], fieldErrors);
}
