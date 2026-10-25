// 로그인 화면 상단 안내 (?notice=). 정해진 값만 문구로 바꾸고, 그 외 값은 무시한다.

export const LOGIN_NOTICE_EMAIL_CONFIRMED = "email-confirmed";

const LOGIN_NOTICES: Record<string, string> = {
  [LOGIN_NOTICE_EMAIL_CONFIRMED]:
    "이메일 인증이 완료되었습니다. 로그인해 주세요",
};

export function toLoginNotice(value: string | undefined): string | null {
  // hasOwn: "constructor" 같은 프로토타입 키가 매핑으로 잡히지 않도록
  return value && Object.hasOwn(LOGIN_NOTICES, value)
    ? LOGIN_NOTICES[value]
    : null;
}
