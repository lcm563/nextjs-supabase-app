# 모임 이벤트

링크 하나로 모임을 공지하고 참석 응답을 받는 웹 앱입니다. 주최자가 이벤트를 만들어 링크를 공유하면, 참여자는 로그인 후 참석·불참·미정으로 응답하고 정원이 차면 대기자로 등록됩니다.

- 요구사항: [docs/PRD.md](docs/PRD.md) · 진행 상황: [docs/ROADMAP.md](docs/ROADMAP.md) · DB 설계: [docs/DB_SCHEMA.md](docs/DB_SCHEMA.md)

## 기술 스택

- Next.js 16 (App Router, Cache Components / Partial Prerender, Turbopack)
- Supabase (Postgres + RLS + RPC, Auth: 이메일·Google·Kakao, Storage: 커버 이미지)
- Tailwind CSS v3 + shadcn/ui (테마: tweakcn Clean Slate), react-hook-form + zod
- 배포: Vercel (Hobby, 함수 리전 `sin1` — Supabase `ap-southeast-1`과 같은 싱가포르)

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 환경 변수 참고)
npm run dev                  # http://localhost:3000
```

검사: `npm run check-all` (타입·린트·포맷), `npm run build`

## 환경 변수

| 이름                                   | 필수 | 설명                                                                       |
| -------------------------------------- | ---- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | ✅   | Supabase 프로젝트 URL                                                      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅   | Supabase publishable(또는 anon) 키. 공개용 키이며 데이터 보호는 RLS가 한다 |
| `NEXT_PUBLIC_ENABLED_SOCIAL_PROVIDERS` |      | 켠 소셜 로그인 (`google,kakao`). 비우면 소셜 버튼은 '준비 중' 안내         |

- 모두 `NEXT_PUBLIC_*`라 **빌드할 때 코드에 고정**된다. 값을 바꾸면 개발 서버를 재시작하고, Vercel은 재배포한다. 커버 이미지 도메인 허용(`next.config.ts`)도 빌드 시 `NEXT_PUBLIC_SUPABASE_URL`로 정해진다.
- 프로덕션에서 Supabase 변수가 없으면 보호 경로는 503("서비스 설정이 완료되지 않았습니다")으로 막힌다 (fail-closed, `lib/supabase/proxy.ts`).
- `service_role` 키는 쓰지 않는다. 키·시크릿은 커밋하지 않는다 (`.env.local`은 git 제외).

## Vercel 배포

`main` 브랜치가 Production으로 배포된다. Preview 배포(PR·브랜치)는 같은 Supabase 프로젝트를 쓰므로 **화면 확인용으로만** 쓰고, 실제 데이터를 만드는 테스트는 하지 않는다.

1. **Vercel 프로젝트 만들기**: Vercel Dashboard → Add New → Project → GitHub 저장소 Import. Framework는 Next.js로 자동 인식된다 (빌드 명령·출력 폴더는 기본값).
2. **환경 변수**: Import 화면(또는 Settings → Environment Variables)에서 위 3개를 **Production·Preview** 모두에 등록한 뒤 Deploy. 첫 빌드 전에 넣어야 한다.
3. **함수 리전**: 저장소의 `vercel.json`이 `sin1`로 지정한다. Settings → Functions에서 Singapore로 표시되는지 확인한다.
4. **Supabase Auth URL** (Supabase Dashboard → Authentication → URL Configuration)
   - Site URL: `https://<배포 도메인>`
   - Redirect URLs에 추가 (기존 localhost 항목은 로컬 개발용으로 유지):
     - `https://<배포 도메인>/auth/callback**` (소셜 로그인 복귀, `?next=` 포함)
     - `https://<배포 도메인>/auth/confirm**` (가입 확인·비밀번호 재설정 메일)
5. **소셜 로그인 콘솔(Google·Kakao)**: 변경 불필요. 두 provider 모두 Supabase 콜백(`https://<project-ref>.supabase.co/auth/v1/callback`)으로 돌아오고, 앱 도메인으로의 이동은 4번의 Redirect URLs가 허용한다.
6. **보안 설정**: Supabase Dashboard → Authentication → 비밀번호 보안의 유출 비밀번호 보호(Leaked password protection)를 켠다.

배포 후 확인: 랜딩 → 로그인(이메일·Google·Kakao) → 비로그인으로 이벤트 링크 접속 시 로그인 후 원래 화면 복귀 → 이벤트 생성(커버)·응답·삭제 → 관리자 화면.

## 문서

- 개발 규칙: [CLAUDE.md](CLAUDE.md), [shrimp-rules.md](shrimp-rules.md)
- 가이드: [docs/guides/](docs/guides/)
