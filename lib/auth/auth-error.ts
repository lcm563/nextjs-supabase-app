// Supabase Auth 오류를 화면에 보일 한국어 안내로 바꾼다 (브라우저 인증 폼 공용)
// Supabase 원문 메시지는 영어라 그대로 보여주지 않는다. 모르는 오류는 폼별 기본 문구로 대신한다.
import { PASSWORD_MIN_LENGTH } from "@/lib/validations/password";
import { isAuthError } from "@supabase/supabase-js";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다",
  email_not_confirmed: "이메일 인증을 마친 뒤 로그인해주세요",
  weak_password: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다`,
  same_password: "현재 비밀번호와 다른 비밀번호를 입력해주세요",
  user_already_exists: "이미 가입된 이메일입니다",
  email_exists: "이미 가입된 이메일입니다",
  email_address_invalid: "이메일 주소를 확인해주세요",
  validation_failed: "입력값을 확인해주세요",
  signup_disabled: "현재 회원가입을 받지 않습니다",
  over_email_send_rate_limit:
    "메일 발송 한도를 넘었습니다. 잠시 후 다시 시도해주세요",
  over_request_rate_limit: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요",
  // 비밀번호 변경 화면을 세션 없이(만료된 재설정 링크 등) 연 경우
  session_not_found:
    "인증 세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요",
};

export function authErrorMessage(error: unknown, fallback: string): string {
  if (!isAuthError(error)) return fallback;
  if (error.name === "AuthSessionMissingError") {
    return AUTH_ERROR_MESSAGES.session_not_found;
  }
  return (error.code && AUTH_ERROR_MESSAGES[error.code]) || fallback;
}
