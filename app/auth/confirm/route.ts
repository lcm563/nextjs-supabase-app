import { authErrorRedirect } from "@/lib/auth/error-redirect";
import { sanitizeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
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

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return EMAIL_OTP_TYPES.includes(value as EmailOtpType);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // 내부 경로만 허용 (오픈 리다이렉트 방지)
  const next = sanitizeNext(searchParams.get("next"));

  if (!token_hash || !isEmailOtpType(type)) {
    authErrorRedirect("인증 링크가 올바르지 않습니다");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    authErrorRedirect(error.message);
  }

  redirect(next);
}
