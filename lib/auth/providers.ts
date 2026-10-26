// 로그인 수단 상수 (소셜 로그인 버튼, 관리자 사용자 목록 표시용)
import type { AuthProvider } from "@/types/admin";

// 로그인 화면 버튼 표시 순서
export const SOCIAL_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "kakao", label: "카카오" },
  { id: "custom:naver", label: "네이버" },
] as const satisfies readonly { id: AuthProvider; label: string }[];

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number]["id"];

// 로그인·가입 화면에서 숨기는 provider. 네이버는 MVP 이후 과제다 (ROADMAP 'MVP 이후 로드맵')
const HIDDEN_SOCIAL_PROVIDERS: readonly SocialProvider[] = ["custom:naver"];

// 로그인·가입 화면에 보이는 소셜 버튼 (표시 순서는 SOCIAL_PROVIDERS와 같다)
export const LOGIN_SOCIAL_PROVIDERS = SOCIAL_PROVIDERS.filter(
  ({ id }) => !HIDDEN_SOCIAL_PROVIDERS.includes(id)
);

export const AUTH_PROVIDER_LABELS: Record<AuthProvider, string> = {
  email: "이메일",
  google: "Google",
  kakao: "카카오",
  "custom:naver": "네이버",
};

// 실제 로그인을 켠 provider 목록 (Supabase Dashboard에서 활성화를 마친 것만 적는다)
// 예: NEXT_PUBLIC_ENABLED_SOCIAL_PROVIDERS=google,kakao,custom:naver — 비어 있으면 모든 버튼이 '준비 중' 안내
const ENABLED_SOCIAL_PROVIDERS = new Set(
  (process.env.NEXT_PUBLIC_ENABLED_SOCIAL_PROVIDERS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
);

export function isSocialProviderEnabled(id: SocialProvider): boolean {
  return ENABLED_SOCIAL_PROVIDERS.has(id);
}
