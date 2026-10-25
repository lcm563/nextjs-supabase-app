import { authErrorRedirect } from "@/lib/auth/error-redirect";
import { sanitizeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

// 소셜 로그인(OAuth, PKCE) 콜백: provider가 돌려준 code를 세션으로 교환한다
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // 내부 경로만 허용 (오픈 리다이렉트 방지)
  const next = sanitizeNext(searchParams.get("next"));

  // 사용자가 동의를 거부했거나 provider 오류 (예: access_denied)
  const providerError = searchParams.get("error");
  if (providerError) {
    authErrorRedirect(providerError);
  }

  if (!code) {
    authErrorRedirect("인증 코드가 없습니다");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    authErrorRedirect(error.message);
  }

  redirect(next);
}
