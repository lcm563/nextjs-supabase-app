import { authErrorRedirect } from "@/lib/auth/error-redirect";
import { LOGIN_NOTICE_EMAIL_CONFIRMED } from "@/lib/auth/login-notice";
import { sanitizeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";
import {
  isAuthPKCECodeVerifierMissingError,
  type EmailOtpType,
} from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

const UPDATE_PASSWORD_PATH = "/auth/update-password";

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return EMAIL_OTP_TYPES.includes(value as EmailOtpType);
}

// 이메일 링크(가입 확인·비밀번호 재설정) 처리. 두 형식을 모두 받는다.
// - 기본 템플릿({{ .ConfirmationURL }}, 현재 사용): Supabase가 인증한 뒤 ?code=로 돌려보낸다.
//   PKCE라 요청한 브라우저에서만 세션을 만들 수 있다.
// - token_hash 템플릿(커스텀 SMTP 설정 후 전환 예정): {{ .RedirectTo }}&token_hash=&type=으로 바로 온다.
//   어느 기기에서 열어도 동작한다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // 내부 경로만 허용 (오픈 리다이렉트 방지)
  const next = sanitizeNext(searchParams.get("next"));

  // Supabase가 링크 만료 등의 오류를 붙여 돌려보낸 경우
  if (searchParams.get("error_code") === "otp_expired") {
    authErrorRedirect("인증 링크가 만료되었거나 이미 사용되었습니다");
  }
  const linkError = searchParams.get("error_description");
  if (linkError) {
    authErrorRedirect(linkError);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (isAuthPKCECodeVerifierMissingError(error)) {
      // 다른 기기·브라우저에서 링크를 연 경우: 인증은 Supabase에서 이미 끝났고 세션만 만들 수 없다
      if (next === UPDATE_PASSWORD_PATH) {
        authErrorRedirect(
          "비밀번호 재설정 링크는 재설정을 요청한 브라우저에서 열어주세요"
        );
      }
      const login = new URLSearchParams({
        notice: LOGIN_NOTICE_EMAIL_CONFIRMED,
        next,
      });
      redirect(`/auth/login?${login}`);
    }
    if (error) {
      authErrorRedirect(error.message);
    }
    redirect(next);
  }

  if (!token_hash || !isEmailOtpType(type)) {
    authErrorRedirect("인증 링크가 올바르지 않습니다");
  }

  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    authErrorRedirect(error.message);
  }

  redirect(next);
}
