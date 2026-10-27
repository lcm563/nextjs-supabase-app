# 인증 메일 템플릿 (token_hash 방식)

> 작성: Task 010-c (2026-10-27) · 적용 위치: Supabase Dashboard → Authentication → Emails(Email Templates)
> 템플릿 수정은 **커스텀 SMTP를 설정한 뒤에만** 저장된다(기본 SMTP는 편집 불가·발송 한도 낮음).

## 왜 token_hash 방식인가

기본 템플릿의 `{{ .ConfirmationURL }}`은 PKCE `code`로 돌아와서 **메일을 요청한 브라우저에서만** 세션을 만든다. 휴대폰으로 가입하고 PC 메일에서 링크를 열면 로그인이 되지 않는다(지금은 "인증 완료, 다시 로그인" 안내로 처리).
token_hash 방식은 링크에 일회용 토큰을 담아 `/auth/confirm`이 `verifyOtp`로 바로 세션을 만들므로 **어느 기기에서 열어도** 로그인된다. `/auth/confirm`은 두 방식을 모두 처리하므로 템플릿만 바꾸면 된다.

## 링크 형식

```
{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=<email|recovery>
```

- `{{ .RedirectTo }}`는 앱이 보낸 `https://<도메인>/auth/confirm?next=...`이다. 앱의 `emailConfirmUrl()`이 **항상 `?next=`를 붙이므로** 뒤에 `&`로 이어 붙일 수 있다.
- 이 주소가 Supabase Redirect URLs 허용 목록(`https://<도메인>/auth/confirm**`)에 없으면 Supabase가 Site URL로 바꿔 링크가 깨진다. 로컬 개발용 `http://localhost:3000/auth/confirm**`도 함께 둔다.
- 토큰은 한 번만 쓸 수 있고 만료된다(Dashboard의 이메일 OTP 만료 시간). 만료·재사용 링크는 한국어 오류 화면으로 안내한다.
- 일부 회사 메일의 링크 검사기(미리 열어보기)가 토큰을 먼저 써 버릴 수 있다. 그 경우 사용자는 "만료" 안내를 보고 다시 요청하면 된다.

## 1. Confirm signup (가입 확인)

**Subject**

```
[모임 이벤트] 이메일 주소를 확인해주세요
```

**Body (HTML)**

```html
<div
  style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1E293B"
>
  <h2 style="margin: 0 0 16px; font-size: 20px">
    모임 이벤트 가입을 환영합니다
  </h2>
  <p style="margin: 0 0 24px; line-height: 1.6">
    아래 버튼을 누르면 이메일 확인이 끝나고 바로 로그인됩니다. 휴대폰·PC 어디서
    열어도 괜찮아요.
  </p>
  <p style="margin: 0 0 24px">
    <a
      href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email"
      style="display: inline-block; padding: 12px 24px; border-radius: 8px; background: #4F46E5; color: #FFFFFF; text-decoration: none; font-weight: 600"
      >이메일 확인하기</a
    >
  </p>
  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4B5563">
    직접 가입하지 않으셨다면 이 메일은 무시하셔도 됩니다. 링크는 한 번만 쓸 수
    있습니다.
  </p>
</div>
```

## 2. Reset password (비밀번호 재설정)

**Subject**

```
[모임 이벤트] 비밀번호 재설정 안내
```

**Body (HTML)**

```html
<div
  style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1E293B"
>
  <h2 style="margin: 0 0 16px; font-size: 20px">
    비밀번호를 다시 설정해주세요
  </h2>
  <p style="margin: 0 0 24px; line-height: 1.6">
    아래 버튼을 누르면 새 비밀번호를 정하는 화면으로 이동합니다.
  </p>
  <p style="margin: 0 0 24px">
    <a
      href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery"
      style="display: inline-block; padding: 12px 24px; border-radius: 8px; background: #4F46E5; color: #FFFFFF; text-decoration: none; font-weight: 600"
      >새 비밀번호 설정하기</a
    >
  </p>
  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4B5563">
    재설정을 요청하지 않으셨다면 이 메일은 무시하셔도 됩니다. 비밀번호는 바뀌지
    않습니다.
  </p>
</div>
```

- 버튼 색 `#4F46E5`(흰 글자 대비 6.3:1)는 메일 클라이언트에서 CSS 변수를 쓸 수 없어 앱 primary와 가까운 고정 색으로 둔다.
- 재설정 링크의 `next`는 앱이 `/auth/update-password`로 보내므로, 확인 후 바로 새 비밀번호 화면이 열린다.

## 확인 순서 (적용 후)

1. 두 번째 메일함으로 가입 → **다른 기기·브라우저**에서 확인 메일 링크 → 로그인된 상태로 이동
2. 같은 링크를 한 번 더 열기 → "인증 링크가 만료되었거나 이미 사용되었습니다"
3. 비밀번호 재설정 요청 → 다른 기기에서 링크 → 새 비밀번호 화면 → 저장 후 `/events`
