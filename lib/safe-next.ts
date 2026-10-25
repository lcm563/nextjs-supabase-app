// 로그인·이메일 확인 후 이동할 `next` 경로 검증 (오픈 리다이렉트 방지)
// 내부 경로(/로 시작)만 허용하고, 외부로 해석될 수 있는 값은 fallback으로 대체한다.
// Task 006에서 proxy, 로그인·가입 폼도 이 함수를 사용한다.

export const DEFAULT_NEXT_PATH = "/events";

export function sanitizeNext(
  raw: string | null | undefined,
  fallback: string = DEFAULT_NEXT_PATH
): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  // "//evil.com"(프로토콜 상대 URL), "/\evil.com"(브라우저가 //로 해석) 차단
  if (raw.startsWith("//") || raw.includes("\\")) return fallback;
  // 제어 문자(탭·개행 등)는 브라우저가 제거하며 우회에 쓰일 수 있음
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;
  return raw;
}

// 인증 화면 사이 이동 링크에 next를 이어 붙인다 (기본 경로면 생략해 URL을 짧게 유지)
export function withNext(path: string, next: string): string {
  return next === DEFAULT_NEXT_PATH
    ? path
    : `${path}?next=${encodeURIComponent(next)}`;
}

// 인증 메일(가입 확인·비밀번호 재설정)의 돌아올 주소.
// 항상 ?next=를 포함한다. token_hash 템플릿으로 전환하면(Task 010) {{ .RedirectTo }} 뒤에 &token_hash=...를 붙이기 때문이다.
export function emailConfirmUrl(origin: string, next: string): string {
  return `${origin}/auth/confirm?next=${encodeURIComponent(next)}`;
}
