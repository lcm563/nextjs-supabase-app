// 로그인 수단 상수 (소셜 로그인 버튼, 관리자 사용자 목록 표시용)
import type { AuthProvider } from "@/types/admin";

// 로그인 화면 버튼 표시 순서
export const SOCIAL_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "kakao", label: "카카오" },
  { id: "custom:naver", label: "네이버" },
] as const satisfies readonly { id: AuthProvider; label: string }[];

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number]["id"];

export const AUTH_PROVIDER_LABELS: Record<AuthProvider, string> = {
  email: "이메일",
  google: "Google",
  kakao: "카카오",
  "custom:naver": "네이버",
};
