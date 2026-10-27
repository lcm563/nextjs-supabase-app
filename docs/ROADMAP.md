# 모임 이벤트 관리 웹 MVP 개발 로드맵

링크 하나로 공지하고, 클릭 한 번으로 참석 현황이 정리되는 정기 모임 관리 웹 서비스

## 개요

모임 이벤트 관리 웹은 수영·헬스·러닝 등 **정기 운동 모임의 주최자(총무)와 참여자**를 위한 공지·참석 관리 서비스로 다음 기능을 제공합니다:

- **이벤트 생성·공지**: 일시·장소·설명·정원을 등록하고 공유 링크 한 번으로 카톡방에 공지
- **참석 응답 관리**: 참석/불참/미정 응답, 정원 초과 시 대기자 자동 전환·승격, 참여자 현황 집계
- **링크 → 로그인 → 원래 이벤트 복귀**: 공유 링크로 진입해도 끊김 없는 참여 흐름

> 기준 문서: [PRD.md](./PRD.md) · 기술 스택: Next.js 16 (App Router) + Supabase (Auth, Postgres, RLS) + shadcn/ui + Tailwind CSS v3
> 카풀(2차)·정산(3차)·네이버 로그인(4차)은 MVP 범위 밖이며 [MVP 이후 로드맵](#mvp-이후-로드맵)에 정리합니다.

**📅 최종 업데이트**: 2026-10-26
**📊 진행 상황**: Phase 1·2·3 완료(소셜 로그인은 Google·Kakao), Phase 4 대기 중 (15/18 Tasks 완료, 83%)

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

### Phase 1: 애플리케이션 골격 구축 ✅

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

- **Task 002-1: 추가 기능 골격 구축 (소셜 로그인·커버 이미지·관리자)** ✅ - 완료
  - ✅ 타입: `Event`에 `cover_image_path`·`hidden_at`·`hidden_reason`, 목록·상세 뷰 모델에 `cover_image_url`, `Profile`에 `role`, 관리자용 `types/admin.ts` (사용자 행·통계·신고)
  - ✅ 상수·검증: `lib/auth/providers.ts`(소셜 provider `google`·`kakao`·`custom:naver`와 라벨), 커버 이미지 파일 검증(5MB, jpeg·png·webp), 신고 입력 검증
  - ✅ 라우트: `app/admin/` 골격(관리자 판정 게이트 + 탭 내비, 대시보드·이벤트·사용자·신고 페이지, loading·error 경계), `app/auth/callback/route.ts`(OAuth 코드 교환 → `sanitizeNext()`)
  - ✅ 개발 모드 전용 역할 전환 쿠키(`lib/mock/role.ts`) — 관리자·일반 사용자 화면 확인용, Task 009-1에서 삭제
  - ✅ [DB_SCHEMA.md](./DB_SCHEMA.md)에 추가 기능 설계안(커버 컬럼·버킷 정책, 역할·`is_admin()`·숨김·신고·관리자 RPC, 소셜 가입 프로필 fallback) 정리
  - ✅ 완료 기준: 새 라우트 접근 가능(관리자 아니면 404), `npm run check-all`·`npm run build` 통과

### Phase 2: UI/UX 완성 (더미 데이터 활용) ✅

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

- **Task 004-1: 소셜 로그인·커버 이미지 UI** ✅ - 완료 (더미 데이터)
  - ✅ 로그인·가입 화면에 Google·카카오·네이버 버튼(목업 동작: 준비 중 안내), 인증 화면 문구 한국어화, OAuth 오류(`access_denied` 등) 안내
  - ✅ 버튼 스타일: Google·카카오는 브랜드 규격 색, 네이버는 흰 배경 + 녹색 로고(대비 4.5:1 충족)
  - ✅ 종목별 더미 커버(`public/mock/covers/`), `EventCover`(카드 썸네일·상세 커버, 없으면 기본 배경)
  - ✅ `EventForm` 커버 이미지 필드(선택·미리보기·교체·제거, 형식·크기 오류 안내), 복제 시 이미지 미복사 안내

- **Task 004-2: 관리자 화면 UI** ✅ - 완료 (더미 데이터)
  - ✅ `/admin` 통계 대시보드, `/admin/events` 전체 이벤트(검색·상태 필터·숨김/복구·강제 삭제), `/admin/users` 사용자(가입 방식·역할 변경, 마지막 관리자 보호), `/admin/reports` 신고 처리
  - ✅ 사용자 메뉴의 "관리자" 링크(관리자만)와 개발용 역할 전환 토글
  - ✅ 이벤트 상세 "신고" 대화상자, 숨김 이벤트 안내 배너(주최자·관리자) / 그 외 사용자 404, 카드 "숨김" 배지

- **Task 004-3: 추가 기능 반응형·접근성·플로우 검증** ✅ - 완료
  - ✅ 360px·데스크톱 × 라이트·다크에서 인증·이벤트(커버 유무)·관리자 화면 점검 (가로 스크롤·대비·터치 영역·콘솔 오류)
  - ✅ 키보드 흐름: 소셜 버튼, 커버 선택→미리보기→제거, 역할 전환 → 숨김·복구 → 역할 변경 → 신고 처리, 일반 사용자 `/admin`·숨김 이벤트 404
  - ✅ 점검 중 수정: 지난 이벤트 카드는 커버만 흐리게(글자 대비 유지), 숨김 배너 글자색, 단독 텍스트 링크 높이 24px 이상(WCAG 2.5.8)

### Phase 3: 핵심 기능 구현 ✅

- **Task 005: 데이터베이스 구축 및 RLS 적용** ✅ - 완료
  - ✅ `apply_migration`으로 `profiles`·`events`·`rsvps` 테이블·제약(`unique(event_id, user_id)`)·인덱스 생성 (`create_core_tables`)
  - ✅ `auth.users` 가입 트리거 `handle_new_user`로 `profiles` 자동 생성 (소셜 fallback 버전)
  - ✅ RLS 정책과 컬럼 단위 GRANT (`core_rls`·`core_table_grants`) — rsvps 쓰기는 RPC로만
  - ✅ `get_advisors` 점검, `lib/supabase/database.types.ts` 생성 후 세 Supabase 클라이언트에 `Database` 제네릭 적용
  - ✅ SQL 롤백 시나리오로 RLS 검증 (타인 데이터 쓰기 차단)

- **Task 006: 인증 흐름 보강 및 링크 복귀 구현** ✅ - 완료
  - ✅ `lib/supabase/proxy.ts`: 미인증 리다이렉트 시 원래 경로를 `next`로 보존, 세션 쿠키 복사, 프로덕션 환경 변수 누락 시 fail-closed
  - ✅ 로그인·가입·이메일 확인(`/auth/confirm`) 후 `sanitizeNext()`로 검증한 `next`로 이동, 인증 화면 사이 링크는 `withNext()`로 유지
  - ✅ 가입 시 표시 이름(`display_name`) 입력 및 프로필 연동
  - ✅ 비로그인 링크 접근 → 로그인 → 원래 이벤트 복귀 E2E 확인

- **Task 006-1: 소셜 로그인 (Google · Kakao)** ✅ - 완료 (Naver는 [MVP 이후 로드맵](#mvp-이후-로드맵) 4차로 보류)
  - ✅ `SocialLoginButtons`: `NEXT_PUBLIC_ENABLED_SOCIAL_PROVIDERS`에 켜진 provider만 `signInWithOAuth({ provider, options: { redirectTo: /auth/callback?next=... } })`로 이동
  - ✅ Google·Kakao Supabase provider 활성화(사용자 작업). Kakao는 Supabase가 `account_email`을 항상 요청해 KOE205 → 동의항목 설정과 개인 개발자 비즈 앱 전환으로 해결
  - ✅ 같은 이메일의 기존 계정에 자동 identity linking 확인(새 사용자 없음, 기존 표시 이름 유지) — [DB_SCHEMA.md](./DB_SCHEMA.md) 9-6, PRD 가정에 기록
  - ✅ 네이버 버튼은 로그인·가입 화면에서 숨김 (`HIDDEN_SOCIAL_PROVIDERS`)
  - 테스트 체크리스트 (Playwright MCP)
    - [x] provider별 로그인 → `profiles` 행 확인 (연결 시 기존 프로필 유지, 신규 가입 매핑은 실제 메타데이터로 롤백 검증: Google 이름·아바타, Kakao 이름)
    - [x] 비로그인으로 공유 링크 진입 → 소셜 로그인 → 원래 이벤트로 복귀 (Google·Kakao 사용자 확인)
    - [x] 로그인 취소·동의 거부 시 `/auth/error` 안내
    - [x] `next`에 외부 URL(`//evil.com` 등) 주입 시 기본 경로로 대체

- **Task 007: 이벤트 CRUD 구현** ✅ - 완료
  - ✅ 조회 계층 `lib/queries/events.ts` (`getMyEvents`·`getEventDetail`, 상태별 응답 집계·내 응답·커버 공개 URL)
  - ✅ Server Action `app/events/actions.ts` (`createEvent`·`updateEvent`·`deleteEvent`): zod 서버 재검증, 세션 기준 `host_id`, 주최자 재검증(NOT_FOUND·FORBIDDEN), `revalidatePath`
  - ✅ 오류 코드 → 한국어 안내 공용화 (`ACTION_ERROR_MESSAGES`·`failWith`), 필드 오류는 폼 칸에 표시
  - ✅ 이벤트 목록·상세·수정·복제 페이지 실데이터 교체, 잘못된·없는 ID는 404
  - ✅ 생성→조회→수정→복제→삭제 E2E

- **Task 007-1: 이벤트 커버 이미지 (Supabase Storage)** ✅ - 완료
  - ✅ 마이그레이션: `events.cover_image_path`(컬럼 GRANT 포함), 공개 버킷 `event-covers`(5MB, jpeg·png·webp), 본인 폴더 INSERT·UPDATE·DELETE 정책
  - ✅ 본인 폴더 SELECT 정책 추가(설계 변경) — SELECT 정책이 없으면 Storage `remove()`가 0건 삭제됨을 SQL로 확인
  - ✅ 브라우저에서 `{uid}/{uuid}.{ext}`로 직접 업로드 → 경로만 Server Action에 전달, 서버에서 경로 소유자 재검증, 저장 실패 시 업로드 객체 삭제
  - ✅ 교체·제거·이벤트 삭제 시 이전 파일 정리, 복제 시 미복사, `next.config.ts` `remotePatterns`, 더미 커버 삭제
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 업로드 → 목록 썸네일·상세 커버 표시
    - [x] 5MB 초과·허용 외 형식 거부 안내
    - [x] 타인 폴더 경로로 업로드·삭제 시도 차단 (RLS SQL 검증 + 서버 경로 검증 FORBIDDEN)
    - [x] 이미지 교체·제거·이벤트 삭제 시 이전 파일 삭제 확인
    - [x] 360px·다크 모드 레이아웃

- **Task 008: 참석 응답·정원·대기자 로직 구현** ✅ - 완료
  - ✅ RPC `respond_to_event`(이벤트 행 잠금, 정원 판정·대기 전환·승격 한 트랜잭션), 내부용 `promote_waitlist`
  - ✅ 정원 트리거: 현재 참석 수보다 작게 축소 시 `CAPACITY` 거부(폼 정원 칸에 표시), 확대·무제한 전환 시 대기자 승격
  - ✅ `respondToEvent` Server Action과 `RsvpButtons` 연동(대기 여부는 서버 결과 사용), 참여자 현황·정원 배지 갱신
  - ✅ 정원 초과 → 대기 → 취소 시 승격을 SQL 롤백 시나리오와 실제 두 계정으로 확인

- **Task 008-1: 핵심 기능 통합 테스트** ✅ - 완료
  - ✅ 실사용자 플로우(360px): 커버 포함 생성 → 공유 링크 복사 → 참석(정원 마감) → 다른 사용자 대기 → 불참 시 자동 승격 → 정원 확대 → 축소 거부 → 복제 → 삭제 → 삭제된 링크 404
  - ✅ 점검 스크립트: 16개 화면 × 360·1280px × 라이트·다크(64조합) 가로 스크롤·대비·터치 영역·콘솔 오류 0건
  - ✅ 엣지 케이스: 만료 세션(쿠키 없는 페이지·Server Action 요청 → 로그인 리다이렉트), 잘못된 입력 서버 거부, 비주최자 수정·삭제 0건·`host_id` 변경 거부·rsvps 직접 쓰기 거부, 마지막 한 자리 경쟁 시 한 명만 참석(SQL 롤백)
  - ✅ 이벤트 화면에서 쓰지 않는 mock 제거 (`lib/mock`은 관리자 화면 전용으로 축소)
  - P0 수용 기준 점검 (PRD 5장)

    | 기능                          | 결과 | 확인 내용                                                                |
    | ----------------------------- | ---- | ------------------------------------------------------------------------ |
    | F-01 회원가입/로그인          | ✅   | 이메일 가입·로그인·로그아웃, 소셜(Google·Kakao), 가입 시 `profiles` 생성 |
    | F-02 이벤트 생성              | ✅   | 필수·선택 필드, 주최자 자동 지정, 클라이언트·서버 필드별 오류            |
    | F-03 이벤트 상세              | ✅   | 공지·일시·장소·주최자·정원 대비 참석 수                                  |
    | F-04 공유 링크                | ✅   | `/events/[id]` 클립보드 복사, "링크를 복사했습니다" 토스트               |
    | F-05 로그인 후 원래 링크 복귀 | ✅   | 이메일·소셜 로그인 모두 원래 이벤트로 복귀, 외부 `next` 차단             |
    | F-06 참석 응답                | ✅   | 참석·불참·미정 변경, 사용자당 1건(unique 제약 + RPC upsert)              |
    | F-07 정원·대기자              | ✅   | 정원 초과 시 대기, 불참 시 먼저 대기한 사람 자동 승격                    |
    | F-08 참여자 현황              | ✅   | 참석·대기·미정·불참 목록과 이름, 로그인 사용자 모두 열람                 |
    | F-09 이벤트 수정/삭제         | ✅   | 주최자만(UI·Server Action·RLS), 삭제 확인 대화상자                       |

### Phase 4: 고급 기능 및 최적화

- **Task 009: P1 기능 구현** ✅ - 완료 (Phase 2·3에서 구현, 실데이터로 수용 기준 재확인 — 코드 변경 없음)
  - ✅ 이벤트 복제 (`/events/new?copy=[id]`, 일시만 새로 지정) — F-10
  - ✅ 내 이벤트 목록 (`내가 주최` / `내가 참여`) — F-11
  - ✅ 응답 마감 시각 이후 변경 차단 및 안내, 종료된 이벤트 응답 차단 — F-12, F-14
  - ✅ `수정됨` 배지와 수정 시각 표시 — F-13
  - ✅ Playwright MCP로 마감·종료 이벤트 응답 차단 테스트
  - P1 수용 기준 점검 (PRD 5장, 테스트 이벤트 7개를 SQL로 만들어 확인 후 삭제)

    | 기능                  | 결과 | 확인 내용                                                                                     |
    | --------------------- | ---- | --------------------------------------------------------------------------------------------- |
    | F-10 이벤트 복제      | ✅   | 제목·장소·정원·공지 채움, 시작·종료·마감 일시는 비움, 커버 미복사 안내                        |
    | F-11 내 이벤트 목록   | ✅   | 주최·참여 탭과 개수, 다가오는 이벤트는 시작 오름차순                                          |
    | F-12 응답 마감        | ✅   | 버튼 3개 비활성 + "응답이 마감되었습니다", Server Action·RPC 직접 호출 시 `DEADLINE_PASSED`   |
    | F-13 공지 수정 표시   | ✅   | 생성 60초 뒤 수정 시 카드·상세에 `수정됨` 배지, 상세에 수정 시각                              |
    | F-14 지난 이벤트 구분 | ✅   | "지난 이벤트" 섹션(시작 내림차순)·`종료` 배지, 버튼 비활성 + 안내, 직접 호출 시 `EVENT_ENDED` |

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
  - 커스텀 SMTP 설정(기본 SMTP는 발송 한도가 낮고 메일 템플릿을 수정할 수 없음) → 가입 확인·비밀번호 재설정 템플릿을 `token_hash` 방식(`{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email|recovery`)과 한국어 문구로 변경. 다른 기기에서 링크를 열어도 바로 로그인되며, `/auth/confirm`은 이미 두 방식을 모두 처리한다 (Task 006 결정)
  - 성공 지표(응답률, 링크→응답 전환율, 주최자 재사용) 측정 방안 정리

## MVP 이후 로드맵

| 단계 | 내용                                                                                                                                                                                                |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2차  | **카풀 매칭** — 운전자 좌석 등록, 탑승 신청, 출발지·시간 조율                                                                                                                                       |
| 3차  | **정산** — 비용 입력, N분의 1 계산, 입금 확인 체크                                                                                                                                                  |
| 4차  | 자동 반복 일정, 이메일/푸시 알림, **네이버 소셜 로그인** — Naver 개발자 앱·Supabase Custom OAuth2(`custom:naver`) 등록, 중첩 userinfo 매핑 검증 후 로그인 화면 버튼 다시 표시 (Task 006-1에서 보류) |
| 5차  | 모임(Group) 단위·멤버 관리, 출석 통계                                                                                                                                                               |

## PRD 요구사항 매핑

| PRD 기능                        | 담당 Task                |
| ------------------------------- | ------------------------ |
| F-01 회원가입/로그인            | Task 005, 006            |
| F-02, F-03, F-04, F-09 이벤트   | Task 004, 007            |
| F-05 로그인 후 원래 링크 복귀   | Task 006                 |
| F-06, F-07, F-08 응답·정원·현황 | Task 004, 008            |
| F-10~F-14 (P1)                  | Task 009                 |
| 보안(RLS)·성능·접근성           | Task 005, 010            |
| 추가: 소셜 로그인 (Naver는 4차) | Task 002-1, 004-1, 006-1 |
| 추가: 이벤트 커버 이미지        | Task 002-1, 004-1, 007-1 |
| 추가: 관리자 화면               | Task 002-1, 004-2, 009-1 |
