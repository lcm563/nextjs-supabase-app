// 비밀번호 입력 검증 (가입·비밀번호 변경 공용)
// 최소 길이는 Supabase Dashboard > Authentication > Email의 최소 비밀번호 길이와 같아야 한다.
// 다르면 앱은 통과시키고 Supabase가 거부해 안내가 어긋난다. 유출 비밀번호 검사는 Pro 플랜 기능이라 쓰지 않는다.
import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

export const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH, {
  error: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 입력해주세요`,
});
