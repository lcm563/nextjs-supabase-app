# 모임 이벤트 관리 웹 MVP 개발 로드맵

링크 하나로 공지하고, 클릭 한 번으로 참석 현황이 정리되는 정기 모임 관리 웹 서비스

## 개요

모임 이벤트 관리 웹은 수영·헬스·러닝 등 **정기 운동 모임의 주최자(총무)와 참여자**를 위한 공지·참석 관리 서비스로 다음 기능을 제공합니다:

- **이벤트 생성·공지**: 일시·장소·설명·정원을 등록하고 공유 링크 한 번으로 카톡방에 공지
- **참석 응답 관리**: 참석/불참/미정 응답, 정원 초과 시 대기자 자동 전환·승격, 참여자 현황 집계
- **링크 → 로그인 → 원래 이벤트 복귀**: 공유 링크로 진입해도 끊김 없는 참여 흐름

> 기준 문서: [PRD.md](./PRD.md) · 기술 스택: Next.js 16 (App Router) + Supabase (Auth, Postgres, RLS) + shadcn/ui + Tailwind CSS v3
> 카풀(2차)·정산(3차)은 MVP 범위 밖이며 [MVP 이후 로드맵](#mvp-이후-로드맵)에 정리합니다.

**📅 최종 업데이트**: 2026-10-23
**📊 진행 상황**: Phase 1·2 추가 기능(소셜 로그인·커버 이미지·관리자) 골격·UI 진행 예정 (4/18 Tasks 완료, 22%)

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
- **API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함 (Playwright MCP 테스트 시나리오 작성)**
- 완료된 작업의 문서는 체크된 박스와 변경 사항 요약을 반영하고, 새 작업은 빈 박스로 시작

3. **작업 구현**

- 작업 파일의 명세서를 따름
- 기능과 기능성 구현
- **API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 테스트 수행 필수**
- 각 단계 후 작업 파일 내 단계 진행 상황 업데이트
- 구현 완료 후 Playwright MCP를 사용한 E2E 테스트 실행
- 테스트 통과 확인 후 다음 단계로 진행
- 각 단계 완료 후 `npm run check-all`, `npm run build` 통과 확인 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 로드맵에서 완료된 작업을 ✅로 표시

## 개발 단계

### Phase 1: 애플리케이션 골격 구축 (추가 기능 골격 진행 중)

- **Task 001: 스타터 정리 및 이벤트 라우트 골격 생성** ✅ - 완료
  - ✅ `/instruments` 등 스타터 잔재 공개 경로·예제 코드 제거 (`lib/supabase/proxy.ts`)
  - ✅ `app/events/page.tsx`, `app/events/new/page.tsx`, `app/events/[id]/page.tsx`, `app/events/[id]/edit/page.tsx` 빈 껍데기 생성
  - ✅ 로그인 영역 공통 레이아웃(헤더·네비게이션·사용자 메뉴)과 랜딩(`/`) 골격 구현
  - ✅ 로딩(`loading.tsx`)·에러(`error.tsx`)·404(`not-found.tsx`) 경계 골격 추가
  - ✅ 완료 기준: 모든 라우트가 접근 가능하고 `npm run check-all` 통과

- **Task 002: 타입 정의 및 DB 스키마 설계** ✅ - 완료
  - ✅ `profiles`, `events`, `rsvps` 스키마 확정 (PRD 7장, 구현 제외) → [DB_SCHEMA.md](./DB_SCHEMA.md)
  - ✅ RSVP 상태(`going | not_going | maybe | waitlist`) 및 이벤트 입력 타입 정의 (`types/`)
  - ✅ 폼 검증 스키마 정의 (react-hook-form + zod 도입 결정 및 설치) → `lib/validations/`
  - ✅ 서버 액션 입·출력 타입과 에러 응답 규약 정의 (`types/action.ts`, `lib/action-result.ts`)
  - ✅ 완료 기준: 타입 파일 컴파일 통과, 스키마 설계안 문서화

- **Task 002-1: 추가 기능 골격 구축 (소셜 로그인·커버 이미지·관리자)** - 우선순위
  - 타입: `Event`에 `cover_image_path`·`hidden_at`·`hidden_reason`, 목록·상세 뷰 모델에 `cover_image_url`, `Profile`에 `role`, 관리자용 `types/admin.ts` (사용자 행·통계·신고)
  - 상수·검증: `lib/auth/providers.ts`(소셜 provider `google`·`kakao`·`custom:naver`와 라벨), 커버 이미지 파일 검증(5MB, jpeg·png·webp), 신고 입력 검증
  - 라우트: `app/admin/` 골격(관리자 판정 게이트 + 탭 내비, 대시보드·이벤트·사용자·신고 페이지, loading·error 경계), `app/auth/callback/route.ts`(OAuth 코드 교환 → `sanitizeNext()`)
  - 개발 모드 전용 역할 전환 쿠키(`lib/mock/role.ts`) — 관리자·일반 사용자 화면 확인용, Task 009-1에서 삭제
  - [DB_SCHEMA.md](./DB_SCHEMA.md)에 추가 기능 설계안(커버 컬럼·버킷 정책, 역할·`is_admin()`·숨김·신고·관리자 RPC, 소셜 가입 프로필 fallback) 정리
  - 완료 기준: 새 라우트 접근 가능(관리자 아니면 404), `npm run check-all`·`npm run build` 통과

### Phase 2: UI/UX 완성 (더미 데이터 활용) (추가 기능 UI 진행 중)

- **Task 003: 공통 컴포넌트 라이브러리 구현** ✅ - 완료
  - ✅ shadcn/ui 컴포넌트 추가 (`textarea`, `alert-dialog`, `sonner`, `avatar`, `tabs`, `form`, `separator`, `skeleton` + 기존 `button`, `card`, `input`, `badge` 등)
  - ✅ 도메인 컴포넌트: `EventCard`, `RsvpButtons`, `AttendeeList`, `CapacityBadge`, `ShareLinkButton`, `DeleteEventDialog`
  - ✅ 더미 데이터 및 목업 유틸리티 작성 (`lib/mock/`, 현재 시각 기준 상대 일시)
  - ✅ 다크 모드·접근성(키보드·스크린리더) 기준 적용 — `destructive` 토큰을 WCAG AA 대비로 조정

- **Task 004: 모든 페이지 UI 완성** ✅ - 완료
  - ✅ 이벤트 목록 UI (`?tab=hosting|attending` 탭, 다가오는 순, 지난 이벤트 구분) — 더미 데이터
  - ✅ 이벤트 생성/수정 폼 UI (`EventForm`, 필드별 검증 오류 표시, `?copy=[id]` 복제 시 값 미리 채움)
  - ✅ 이벤트 상세 UI (정원 대비 참석 수, 응답 버튼, 상태별 참여자 목록, 마감·종료 안내)
  - ✅ 삭제 확인 대화상자, 링크 복사 토스트
  - ✅ 360px·데스크톱 × 라이트·다크 반응형·대비 검증 및 사용자 플로우·키보드 조작 확인 (Playwright MCP)

- **Task 004-1: 소셜 로그인·커버 이미지 UI** — 더미 데이터
  - 로그인·가입 화면에 Google·카카오·네이버 버튼(목업 동작: 준비 중 안내), 인증 화면 문구 한국어화, OAuth 오류(`access_denied` 등) 안내
  - 버튼 스타일: Google·카카오는 브랜드 규격 색, 네이버는 흰 배경 + 녹색 로고(대비 4.5:1 충족)
  - 종목별 더미 커버(`public/mock/covers/`), `EventCover`(카드 썸네일·상세 커버, 없으면 기본 배경)
  - `EventForm` 커버 이미지 필드(선택·미리보기·교체·제거, 형식·크기 오류 안내), 복제 시 이미지 미복사 안내

- **Task 004-2: 관리자 화면 UI** — 더미 데이터
  - `/admin` 통계 대시보드, `/admin/events` 전체 이벤트(검색·상태 필터·숨김/복구·강제 삭제), `/admin/users` 사용자(가입 방식·역할 변경, 마지막 관리자 보호), `/admin/reports` 신고 처리
  - 사용자 메뉴의 "관리자" 링크(관리자만)와 개발용 역할 전환 토글
  - 이벤트 상세 "신고" 대화상자, 숨김 이벤트 안내 배너(주최자·관리자) / 그 외 사용자 404, 카드 "숨김" 배지

- **Task 004-3: 추가 기능 반응형·접근성·플로우 검증**
  - 360px·데스크톱 × 라이트·다크에서 인증·이벤트(커버 유무)·관리자 화면 점검 (가로 스크롤·대비·터치 영역·콘솔 오류)
  - 키보드 흐름: 소셜 버튼, 커버 선택→미리보기→제거, 역할 전환 → 숨김·복구 → 역할 변경 → 신고 처리, 일반 사용자 `/admin`·숨김 이벤트 404

### Phase 3: 핵심 기능 구현

- **Task 005: 데이터베이스 구축 및 RLS 적용** - 우선순위
  - Supabase MCP `apply_migration`으로 `profiles`, `events`, `rsvps` 테이블·제약(`unique(event_id, user_id)`) 생성
  - `auth.users` 가입 트리거로 `profiles` 자동 생성
  - PRD 7장 RLS 정책 적용 (본인만 RSVP 쓰기, 주최자만 이벤트 수정/삭제)
  - `get_advisors`로 보안·성능 점검, 지적 사항 해소
  - `generate_typescript_types`로 `lib/supabase/database.types.ts` 생성
  - Playwright MCP·SQL로 RLS 동작 검증 (타인 데이터 쓰기 차단 확인)

- **Task 006: 인증 흐름 보강 및 링크 복귀 구현**
  - `lib/supabase/proxy.ts`: 미인증 리다이렉트 시 원래 경로를 `next` 파라미터로 보존 (`createServerClient`~`getClaims()` 사이에 코드 추가 금지, 새 Response 생성 시 쿠키 복사)
  - 로그인·가입·이메일 확인(`/auth/confirm`) 성공 후 `next` 경로로 이동, 내부 경로만 허용(오픈 리다이렉트 방지) — 검증은 `lib/safe-next.ts`의 `sanitizeNext()` 사용 (`/auth/confirm`은 적용 완료)
  - 미인증 리다이렉트 응답에 세션 쿠키 복사, 로그인 페이지는 서버에서 `searchParams.next`를 읽어 폼에 전달
  - 환경 변수 누락 시 프로덕션에서는 인증 검사를 건너뛰지 않도록 변경 (현재 `hasEnvVars` false면 fail-open)
  - 가입 시 표시 이름(`display_name`) 입력 및 프로필 연동
  - Playwright MCP로 인증 플로우 E2E 테스트 (비로그인 링크 접근 → 로그인 → 원래 이벤트 복귀)

- **Task 006-1: 소셜 로그인 (Google · Kakao · Naver)**
  - UI·목업은 Task 004-1, 콜백 라우트 골격은 Task 002-1에서 완료 — 이 Task는 실제 provider 연동
  - 사전 준비(사용자 작업): 각 개발자 콘솔에서 앱 생성, Redirect URI에 `https://<project-ref>.supabase.co/auth/v1/callback` 등록, Supabase Dashboard에 Client ID/Secret 입력, Auth URL Configuration의 Redirect URLs에 `http://localhost:3000/auth/callback`·배포 도메인 추가 (키·시크릿은 커밋 금지)
  - Google·Kakao: Supabase 기본 provider 활성화 (Kakao 이메일은 비즈 앱 심사 전에는 제공되지 않을 수 있으므로 `email`이 없는 계정을 전제)
  - Naver: 기본 provider가 아니므로 Custom OAuth2 provider `custom:naver`로 등록 (authorize `https://nid.naver.com/oauth2.0/authorize`, token `https://nid.naver.com/oauth2.0/token`, userinfo `https://openapi.naver.com/v1/nid/me`)
    - ⚠️ Naver userinfo는 `{ response: { id, email, ... } }` 중첩 구조라 클레임 매핑이 안 될 위험 → 첫 단계에서 실제 로그인으로 검증, 실패 시 Route Handler 기반 자체 OAuth 흐름 검토
  - `app/auth/callback/route.ts`(Task 002-1 골격)로 실제 로그인 흐름 검증
  - 소셜 버튼 목업 동작을 `signInWithOAuth({ provider, options: { redirectTo } })` 호출로 교체, Task 006의 `next` 보존과 연동
  - `handle_new_user` 트리거 보강: 표시 이름을 `display_name` → `full_name`/`name`/`nickname` → 이메일 앞부분 → 기본값 순으로 채우고, `avatar_url`도 메타데이터에서 채움 (이메일 없는 계정 대응)
  - 같은 이메일의 이메일/소셜 계정 연결 동작(Supabase 자동 identity linking) 확인 및 문서화
  - PRD·DB_SCHEMA.md 반영
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] provider별 로그인 → `profiles` 행 생성(표시 이름·아바타) 확인
    - [ ] 비로그인으로 공유 링크 진입 → 소셜 로그인 → 원래 이벤트로 복귀
    - [ ] 로그인 취소·동의 거부 시 `/auth/error` 안내
    - [ ] `next`에 외부 URL(`//evil.com` 등) 주입 시 기본 경로로 대체

- **Task 007: 이벤트 CRUD 구현**
  - Server Action으로 이벤트 생성·수정·삭제 (`lib/supabase/server.ts`의 `createClient()`를 함수 내에서 매번 생성)
  - 서버 측 주최자 권한 재검증 및 zod 입력 검증
  - 이벤트 상세·목록 페이지를 더미 데이터에서 실제 쿼리로 교체
  - 공유 링크(`/events/[id]`) 복사 및 존재하지 않는 ID 처리
  - Playwright MCP로 생성→조회→수정→삭제 E2E 테스트

- **Task 007-1: 이벤트 커버 이미지 (Supabase Storage)**
  - UI·목업은 Task 004-1에서 완료 — 이 Task는 Storage 연동과 더미 커버(`public/mock/covers/`) 삭제
  - 마이그레이션: `events.cover_image_path text` 컬럼, 공개 버킷 `event-covers` (파일 5MB 제한, `image/jpeg`·`image/png`·`image/webp`만 허용)
  - `storage.objects` 정책: 업로드·교체·삭제는 경로 첫 폴더가 `(select auth.uid())`일 때만 (`{user_id}/{uuid}.{ext}`), 조회는 공개 버킷 기본 동작 (경로를 추측할 수 없도록 UUID 파일명)
  - 업로드: 브라우저 클라이언트(`lib/supabase/client.ts`)로 Storage에 직접 업로드(Server Action 본문 1MB 제한 회피) → 경로만 이벤트 생성·수정 Server Action으로 전달, 서버에서 경로 소유자 재검증
  - 이미지 교체·제거·이벤트 삭제 시 이전 파일 정리, 복제(`?copy=`) 시 이미지는 복사하지 않음
  - 커버 이미지 필드의 목업 업로드를 실제 Storage 업로드로 교체, 조회 계층에서 `cover_image_path` → 공개 URL 변환
  - `next.config.ts`의 `images.remotePatterns`에 Supabase Storage 호스트 추가
  - `get_advisors`(security) 점검, `database.types.ts` 재생성, PRD·DB_SCHEMA.md 반영
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 업로드 → 목록 썸네일·상세 커버 표시
    - [ ] 5MB 초과·허용 외 형식 거부 안내
    - [ ] 타인 폴더 경로로 업로드·삭제 시도 차단 (RLS)
    - [ ] 이미지 교체·제거·이벤트 삭제 시 이전 파일 삭제 확인
    - [ ] 360px·다크 모드 레이아웃

- **Task 008: 참석 응답·정원·대기자 로직 구현**
  - 응답(참석/불참/미정) upsert Server Action, 사용자당 이벤트별 1건 보장
  - 정원 판정·대기자 전환·자동 승격을 DB 함수(RPC) 트랜잭션으로 구현 (동시성 대응)
  - 참여자 현황(상태별 목록, 이름 표시) 실제 데이터 연동
  - 응답 변경 후 화면 갱신 (`revalidatePath` 또는 캐시 태그 무효화)
  - Playwright MCP로 정원 초과 → 대기자 전환 → 취소 시 승격 시나리오 테스트

- **Task 008-1: 핵심 기능 통합 테스트**
  - Playwright MCP로 전체 사용자 플로우 테스트 (주최자 생성·공유 → 참여자 가입·응답 → 현황 확인)
  - 정원 동시 응답 경쟁 상태, 권한 없는 수정·삭제 시도 등 엣지 케이스 검증
  - 에러 핸들링(잘못된 입력, 만료 세션, 삭제된 이벤트) 검증
  - 360px 모바일 뷰포트 기준 P0 기능(F-01~F-09) 수용 기준 점검

### Phase 4: 고급 기능 및 최적화

- **Task 009: P1 기능 구현**
  - 이벤트 복제 (`/events/new?copy=[id]`, 일시만 새로 지정) — F-10
  - 내 이벤트 목록 (`내가 주최` / `내가 참여`) — F-11
  - 응답 마감 시각 이후 변경 차단 및 안내, 종료된 이벤트 응답 차단 — F-12, F-14
  - `수정됨` 배지와 수정 시각 표시 — F-13
  - Playwright MCP로 마감·종료 이벤트 응답 차단 테스트

- **Task 009-1: 관리자 화면 (Admin)**
  - UI·목업은 Task 004-2, 라우트 골격은 Task 002-1에서 완료 — 이 Task는 권한 모델·RPC 연동과 개발용 역할 전환 삭제
  - 권한 모델: `profiles.role text not null default 'user'` (`user | admin`), `public.is_admin()` 함수 (security definer, `set search_path = ''`, stable)
    - 본인 `role` 수정 금지(컬럼 권한 회수 또는 트리거), 역할 변경은 RPC `admin_set_user_role`로만 (마지막 관리자 해제 방지)
    - 권한 판단에 `user_metadata`(사용자 수정 가능) 사용 금지, `service_role` 키 미사용
  - 초기 관리자: `CLAUDE.md`의 관리자 테스트 계정을 데이터 마이그레이션으로 지정 (비밀번호는 문서에 기록하지 않음)
  - 숨김·신고
    - `events.hidden_at timestamptz`, `hidden_reason text` — 숨김 이벤트는 주최자·관리자만 조회(RLS), 일반 목록·상세에서 제외, 복구 가능
    - `event_reports` 테이블 (신고자, 사유, 상태 `open | resolved | dismissed`) — 로그인 사용자는 신고 생성만, 조회·처리는 관리자만
  - 관리자 RPC (모두 내부에서 `is_admin()` 확인)
    - `admin_list_users()`: 이메일·가입 방식(provider)·가입일·최근 로그인·역할 (`auth.users` 조인)
    - `admin_stats()`: 가입자·이벤트·응답 수, 응답률
    - `admin_set_event_hidden()`: 이벤트 숨김·복구
  - 이벤트 강제 삭제: events DELETE 정책에 `or (select public.is_admin())` 추가
  - 관리자 게이트(`app/admin/layout.tsx`)·사용자 메뉴의 판정을 개발용 역할 쿠키에서 `is_admin()`으로 교체
  - 관리자 화면 4종과 신고 대화상자의 목업 동작을 RPC·쿼리로 교체
  - `get_advisors` 점검, `database.types.ts` 재생성, PRD·DB_SCHEMA.md 반영
  - 테스트 체크리스트 (Playwright MCP, 일반 계정·관리자 계정)
    - [ ] 일반 계정으로 `/admin` 접근 시 404, 관리자 RPC 직접 호출 차단
    - [ ] 관리자가 이벤트 숨김 → 일반 사용자 목록·상세에서 사라짐 → 복구
    - [ ] 신고 생성 → 관리자 신고 목록 표시 → 처리(숨김/기각)
    - [ ] 역할 부여·해제, 마지막 관리자 해제 차단
    - [ ] 이벤트 강제 삭제 및 통계 수치 확인

- **Task 010: 성능 최적화 및 배포**
  - Server Component 중심 렌더링 점검, 필요한 곳에 Cache Components(`use cache`) 적용
  - 인덱스 추가(`rsvps(event_id)`, `events(host_id, starts_at)`) 및 `get_advisors` 재점검
  - `npm run check-all`, `npm run build` 통과 확인
  - Vercel 배포, 환경 변수·Supabase Auth 리다이렉트 URL 설정
  - 성공 지표(응답률, 링크→응답 전환율, 주최자 재사용) 측정 방안 정리

## MVP 이후 로드맵

| 단계 | 내용                                                          |
| ---- | ------------------------------------------------------------- |
| 2차  | **카풀 매칭** — 운전자 좌석 등록, 탑승 신청, 출발지·시간 조율 |
| 3차  | **정산** — 비용 입력, N분의 1 계산, 입금 확인 체크            |
| 4차  | 자동 반복 일정, 이메일/푸시 알림                              |
| 5차  | 모임(Group) 단위·멤버 관리, 출석 통계                         |

## PRD 요구사항 매핑

| PRD 기능                        | 담당 Task                |
| ------------------------------- | ------------------------ |
| F-01 회원가입/로그인            | Task 005, 006            |
| F-02, F-03, F-04, F-09 이벤트   | Task 004, 007            |
| F-05 로그인 후 원래 링크 복귀   | Task 006                 |
| F-06, F-07, F-08 응답·정원·현황 | Task 004, 008            |
| F-10~F-14 (P1)                  | Task 009                 |
| 보안(RLS)·성능·접근성           | Task 005, 010            |
| 추가: 소셜 로그인               | Task 002-1, 004-1, 006-1 |
| 추가: 이벤트 커버 이미지        | Task 002-1, 004-1, 007-1 |
| 추가: 관리자 화면               | Task 002-1, 004-2, 009-1 |
