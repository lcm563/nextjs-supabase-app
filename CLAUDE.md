# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Next.js 16과 Supabase를 사용한 풀스택 웹 애플리케이션 스타터 킷입니다. App Router, Server Components, 그리고 Supabase Auth를 활용한 인증 시스템을 포함하고 있습니다.

## 주요 기술 스택

- **프레임워크**: Next.js 16 (App Router, `cacheComponents` 활성화)
- **인증/데이터베이스**: Supabase (@supabase/ssr, @supabase/supabase-js)
- **스타일링**: Tailwind CSS v3 (`tailwind.config.ts`, `tailwindcss-animate`)
- **UI 컴포넌트**: shadcn/ui (new-york 스타일, Radix UI 기반)
- **테마**: next-themes (다크 모드 지원)
- **아이콘**: Lucide React
- **폼/검증**: react-hook-form + zod v4 + @hookform/resolvers (v5)
- **토스트**: sonner (`components/ui/sonner.tsx`, `app/layout.tsx`에 `Toaster` 배치)
- **타입스크립트**: 엄격 모드 활성화
- **코드 품질**: ESLint (flat config), Prettier (+ `prettier-plugin-tailwindcss`), Husky, lint-staged

## 개발 명령어

```bash
# 개발 서버 실행 (Turbopack 사용)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 코드 검사 및 포맷팅
npm run lint           # ESLint 검사
npm run lint:fix       # ESLint 자동 수정
npm run format         # Prettier 포맷팅
npm run format:check   # Prettier 검사만
npm run typecheck      # TypeScript 타입 체크
npm run check-all      # 모든 검사 통합 실행 (권장)
```

## ⚡ 자주 사용하는 명령어

```bash
# 개발
npm run dev         # 개발 서버 실행 (Turbopack)
npm run build       # 프로덕션 빌드
npm run check-all   # 모든 검사 통합 실행 (권장)

# UI 컴포넌트
npx shadcn@latest add button    # 새 컴포넌트 추가
```

## ✅ 작업 완료 체크리스트

```bash
npm run check-all   # 모든 검사 통과 확인
npm run build       # 빌드 성공 확인
```

## 프로젝트 구조 및 아키텍처

### Supabase 클라이언트 패턴

이 프로젝트는 **세 가지 다른 Supabase 클라이언트**를 환경에 따라 사용합니다:

1. **Server Components**: `lib/supabase/server.ts`의 `createClient()`
   - Server Components와 Route Handlers에서 사용
   - 쿠키 기반 인증 처리
   - **중요**: Fluid compute 환경을 위해 함수 내에서 매번 새로 생성해야 함 (전역 변수 사용 금지)

2. **Client Components**: `lib/supabase/client.ts`의 `createClient()`
   - 브라우저 환경의 Client Components에서 사용
   - `createBrowserClient` 사용

3. **Proxy**: `lib/supabase/proxy.ts`의 `updateSession()`
   - 루트 `proxy.ts`의 `proxy()`에서 호출 (Next.js 16에서 `middleware.ts`는 `proxy.ts`로 대체됨)
   - 인증되지 않은 사용자를 `/auth/login`으로 리다이렉트
   - **중요**: `createServerClient`와 `supabase.auth.getClaims()` 사이에 코드를 추가하지 말 것

### 인증 흐름

- **Proxy 보호**: 루트 `proxy.ts`는 정적 파일·이미지를 제외한 모든 요청을 가로채서 인증 확인
- **보호된 라우트**: `/events/**` 등 공개 경로가 아닌 모든 경로는 인증된 사용자만 접근 가능
- **리다이렉트 경로 검증**: 로그인·이메일 확인 후 이동하는 `next` 값은 반드시 `lib/safe-next.ts`의 `sanitizeNext()`로 검증 (오픈 리다이렉트 방지)
- **원래 화면 복귀**: proxy가 비로그인 접근을 `/auth/login?next=<경로+쿼리>`로 보내고, 로그인·가입 페이지가 `next`를 서버에서 검증해 폼에 넘긴다. 인증 화면 사이 링크는 `withNext()`로 `next`를 유지
- **이메일 링크**(가입 확인·비밀번호 재설정): `emailRedirectTo`/`redirectTo`는 `/auth/confirm?next=...`. `/auth/confirm`이 기본 템플릿의 `code`(현재 사용, PKCE라 요청한 브라우저에서만 세션 생성)와 `token_hash`(커스텀 SMTP 설정 후 전환 예정, Task 010)를 모두 처리한다. 다른 기기에서 가입 확인 링크를 열면 인증은 끝난 상태이므로 `/auth/login?notice=email-confirmed&next=...`로 보낸다. 돌아올 주소는 `emailConfirmUrl()`로 만든다(항상 `?next=` 포함)
- **비밀번호 규칙**: 최소 8자(`lib/validations/password.ts`의 `PASSWORD_MIN_LENGTH`)는 Supabase Dashboard > Authentication > Email의 최소 길이와 **같아야 한다**(바꿀 때 둘 다). 유출 비밀번호 검사는 Pro 플랜 기능이라 Free 플랜에서는 쓰지 않는다. 인증 폼의 Supabase 오류는 원문(영어) 대신 `lib/auth/auth-error.ts`의 `authErrorMessage()`로 한국어 안내를 보여준다
- **공유 링크 미리보기**: `/events/[id]`는 로그인이 필요하므로 카카오톡 등 미리보기는 루트 기본 메타데이터 카드로 표시됨 (PRD 8장)

### 주요 디렉터리

- `types/`: 도메인 타입(`event.ts`, `rsvp.ts`, `admin.ts`)과 Server Action 결과 규약(`action.ts`)
- `lib/validations/`: zod 검증 스키마 (클라이언트 폼 + Server Action 공용), KST ↔ UTC 변환
- `lib/format.ts`(일시 표시, Asia/Seoul 고정), `lib/event-status.ts`(이벤트 단계 판정), `lib/action-result.ts`(`ok`/`fail`/`failWith`, 오류 코드별 한국어 안내 `ACTION_ERROR_MESSAGES`), `lib/safe-next.ts`
- `lib/queries/`: 서버 전용 조회 계층(`events.ts`: 내 이벤트 목록·상세, 응답 집계, 커버 공개 URL, 숨김 상태 / `admin.ts`: 관리자 판정·통계·사용자·이벤트·신고). 접근 범위는 RLS·RPC가 판정
- `lib/storage/event-covers.ts`: 커버 이미지 Storage 경로·소유자 검사·공개 URL 헬퍼 (버킷 `event-covers`, 경로 `{uid}/{uuid}.{ext}`)
- Server Action: `app/events/actions.ts`(이벤트 생성·수정·삭제, 커버 경로 저장·이전 파일 정리), `app/events/[id]/actions.ts`(참석 응답 → RPC `respond_to_event`, 신고 `reportEvent`), `app/admin/actions.ts`(숨김·복구, 강제 삭제, 역할 변경, 신고 기각 → 관리자 RPC)
- `app/admin/`: 관리자 화면 (대시보드·이벤트·사용자·신고). 레이아웃의 `AdminGate`가 DB의 `is_admin()`으로 판정해 관리자가 아니면 404
- `lib/auth/`: 소셜 provider 상수·활성화 판정·로그인 화면 노출 목록(`providers.ts`, 네이버는 MVP 이후 과제라 숨김), 인증 Route Handler 공통 오류 리다이렉트(`error-redirect.ts`)
- **공개 경로**: `/`, `/login*`, `/auth/*` (login, sign-up, forgot-password, 소셜 로그인 콜백 `/auth/callback` 등) (조건은 `lib/supabase/proxy.ts` 참고)
- **인증 확인 라우트**: `/auth/confirm/route.ts`에서 이메일 확인 처리

### 환경 변수

필수 환경 변수 (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=[Supabase 프로젝트 URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[Supabase Anon Key]
```

**참고**: 환경 변수가 설정되지 않은 경우 Proxy는 인증 확인을 자동으로 건너뜁니다 (`lib/utils.ts`의 `hasEnvVars`).

선택 환경 변수:

```
# Supabase Dashboard에서 활성화를 마친 소셜 provider만 쉼표로 (비우면 모든 소셜 버튼이 '준비 중' 안내)
NEXT_PUBLIC_ENABLED_SOCIAL_PROVIDERS=google,kakao,custom:naver
```

`NEXT_PUBLIC_*` 값은 빌드 시 고정되므로 바꾼 뒤 개발 서버를 다시 시작한다. 조회·판정은 `lib/auth/providers.ts`의 `isSocialProviderEnabled()`.

### 경로 별칭 설정

`tsconfig.json`에서 `@/*`를 프로젝트 루트로 매핑:

```typescript
// 사용 예시
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
```

### shadcn/ui 컴포넌트

- **스타일**: new-york
- **위치**: `components/ui/`
- **설정**: `components.json`에서 관리
- **추가 방법**: `npx shadcn@latest add [component-name]`

## 코드 작성 가이드라인

### Supabase 클라이언트 사용 시 주의사항

1. **Server Components/Route Handlers**:

   ```typescript
   import { createClient } from "@/lib/supabase/server";

   export default async function ServerComponent() {
     // 매번 새로 생성 (전역 변수 X)
     const supabase = await createClient();
     const { data } = await supabase.from("table").select();
   }
   ```

2. **Client Components**:

   ```typescript
   "use client";
   import { createClient } from "@/lib/supabase/client";

   export default function ClientComponent() {
     const supabase = createClient();
     // ...
   }
   ```

3. **Proxy(`lib/supabase/proxy.ts`) 수정 시**:
   - `createServerClient`와 `supabase.auth.getClaims()` 사이에 코드를 추가하지 말 것
   - 새로운 Response 객체를 만들 경우 반드시 쿠키를 복사할 것

### TypeScript 타입

- Supabase 데이터베이스 타입: `lib/supabase/database.types.ts` (생성 파일, 직접 수정 금지). 세 Supabase 클라이언트에 `Database` 제네릭 적용됨. RPC(`respond_to_event`, `is_admin`, `get_event_hidden_states`, `admin_*`) 타입 포함
- **`profiles.role`·`events.hidden_*`는 로그인 사용자에게 SELECT 권한이 없다.** `events`를 `select("*")`로 읽으면 권한 오류가 나므로 컬럼을 나열하고(`lib/queries/events.ts`의 `EVENT_COLUMNS`), 숨김 상태는 `getHiddenStates()`(주최자·관리자만 값 반환), 관리자 여부는 `getIsAdmin()`으로 읽는다
- 앱 뷰 모델(`types/event.ts`)의 `hidden_*`와 파생 값(`cover_image_url`)은 조회 계층이 매핑한다. `rsvps.status`·`event_reports.reason/status`·`role`처럼 생성 타입이 `string`인 값은 `isRsvpStatus()`(`types/rsvp.ts`), `isReportReason()`·`isReportStatus()`·`isUserRole()`(`types/admin.ts`)로 좁힌다
- 정원 판정·대기자 승격은 앱 코드가 아니라 DB(RPC·트리거)가 처리한다 (`docs/DB_SCHEMA.md` 7장)
- 스키마 변경 후 Supabase MCP의 `generate_typescript_types`로 다시 생성하여 위 경로에 저장
- **테이블 권한**: 이 프로젝트는 `public` 새 테이블에 `anon`·`authenticated` 기본 권한이 없다. 마이그레이션에서 RLS 정책과 함께 필요한 GRANT(가능하면 컬럼 단위)를 명시해야 한다 (`docs/DB_SCHEMA.md` 5장)

## MCP 서버 설정

프로젝트는 다음 MCP 서버를 사용합니다:

- **supabase**: Supabase 데이터베이스 연동
- **playwright**: 브라우저 자동화
- **context7**: 문서 검색
- **shadcn**: shadcn/ui 컴포넌트 관리
- **sequential-thinking**: 단계별 사고 지원
- **shrimp-task-manager**: 작업 관리

## Git Hooks

프로젝트는 Husky를 사용하여 커밋 전 자동 검증을 수행합니다:

- **pre-commit**: 스테이지된 파일에 대해 lint-staged로 ESLint(`--fix`) + Prettier 자동 실행 (`lint-staged.config.mjs`)
- **pre-push**: `npm run typecheck` 전체 타입 체크
- **Claude Code 훅**: `.claude/settings.json`의 PostToolUse 훅이 Edit/Write한 파일을 Prettier로 자동 포맷

## 추가 참고사항

- **Turbopack**: Next.js 16의 기본 번들러로, 개발 서버와 빌드에 사용됨
- **가이드 문서** (`docs/guides/`): `nextjs-16.md`, `project-structure.md`, `styling-guide.md`, `component-patterns.md`, `forms-react-hook-form.md` (react-hook-form, zod, @hookform/resolvers 설치 완료)
- **Slack 알림 훅**: `.claude/hooks/*.sh`는 `.env.local`의 `SLACK_WEBHOOK_URL`이 필요하며 현재 `settings.json`에 등록되어 있지 않음
- **폰트**: Geist Sans 폰트를 기본으로 사용
- **다크 모드**: next-themes를 통해 시스템 설정 기반 자동 전환 지원
- **테마**: tweakcn "Clean Slate"(slate + indigo). `app/globals.css`의 HSL 토큰(Tailwind v3 형식)이며, WCAG AA 4.5:1을 넘도록 밝기를 조정한 토큰은 주석으로 표시. 색은 토큰(`bg-primary`, `text-destructive` 등)으로만 쓰고 `text-red-500` 같은 팔레트 색을 직접 쓰지 않는다 (소셜 로그인 브랜드 색 제외)

💡 **상세 규칙은 위 개발 가이드 문서들을 참조하세요**

### 로그인이 필요한 브라우저 검증

- 연결된 Supabase 프로젝트의 계정은 사용자 본인 계정 두 개뿐이다: `lcm563@naver.com`(표시 이름 lcm563, **관리자**)과 `lcm563@kakao.com`(Bomdong, 일반 사용자). 별도 테스트 계정은 없으며, 비밀번호는 문서에 적지 않는다.
- 로그인이 필요하면 임의 계정으로 시도하거나 계정을 새로 만들지 말고, 사용자에게 Playwright 브라우저에서 직접 로그인해 달라고 요청한다.
- 관리자 화면 확인: 관리자 계정(`lcm563@naver.com`)으로 로그인해 확인한다. 일반 사용자 시점은 일반 계정으로 로그인하거나, SQL 한 번의 호출 안에서 `request.jwt.claims`·`role`을 바꿔 확인하고 롤백한다. 역할을 바꾸는 테스트 뒤에는 첫 관리자 역할이 유지되는지 확인한다.
- 접근성·반응형 점검 스크립트: `.playwright-mcp/audit-phase3.js`(git 제외). 상단의 이벤트 id를 SQL로 만든 테스트 이벤트로 바꾼 뒤 관리자 세션에서 `browser_run_code_unsafe`의 `filename`으로 실행한다.
