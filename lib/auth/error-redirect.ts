// 인증 Route Handler 공통: 오류 메시지를 담아 /auth/error로 이동
import { redirect } from "next/navigation";

export function authErrorRedirect(message: string): never {
  redirect(`/auth/error?error=${encodeURIComponent(message)}`);
}
