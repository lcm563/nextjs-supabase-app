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
**📊 진행 상황**: Phase 1 완료, Phase 2 대기 중 (2/11 Tasks 완료, 18%)

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

### Phase 2: UI/UX 완성 (더미 데이터 활용)

- **Task 003: 공통 컴포넌트 라이브러리 구현**
  - shadcn/ui 컴포넌트 추가 (`button`, `card`, `input`, `textarea`, `badge`, `dialog`/`alert-dialog`, `sonner`, `avatar`, `tabs`, `form` 등)
  - 도메인 컴포넌트: `EventCard`, `RsvpButtons`, `AttendeeList`, `CapacityBadge`, `ShareLinkButton`
  - 더미 데이터 및 목업 유틸리티 작성 (`lib/mock/`)
  - 다크 모드·접근성(키보드·스크린리더) 기준 적용

- **Task 004: 모든 페이지 UI 완성**
  - 이벤트 목록 UI (주최/참여 탭, 다가오는 순, 지난 이벤트 구분) — 더미 데이터
  - 이벤트 생성/수정 폼 UI (필드별 검증 오류 표시, 복제 시 값 미리 채움)
  - 이벤트 상세 UI (정원 대비 참석 수, 응답 버튼, 상태별 참여자 목록, 마감·종료 안내)
  - 삭제 확인 대화상자, 링크 복사 토스트
  - 360px 모바일 우선 반응형 검증 및 사용자 플로우·네비게이션 완성

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
  - 로그인·가입·이메일 확인(`/auth/confirm`) 성공 후 `next` 경로로 이동, 내부 경로만 허용(오픈 리다이렉트 방지)
  - 가입 시 표시 이름(`display_name`) 입력 및 프로필 연동
  - Playwright MCP로 인증 플로우 E2E 테스트 (비로그인 링크 접근 → 로그인 → 원래 이벤트 복귀)

- **Task 007: 이벤트 CRUD 구현**
  - Server Action으로 이벤트 생성·수정·삭제 (`lib/supabase/server.ts`의 `createClient()`를 함수 내에서 매번 생성)
  - 서버 측 주최자 권한 재검증 및 zod 입력 검증
  - 이벤트 상세·목록 페이지를 더미 데이터에서 실제 쿼리로 교체
  - 공유 링크(`/events/[id]`) 복사 및 존재하지 않는 ID 처리
  - Playwright MCP로 생성→조회→수정→삭제 E2E 테스트

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
| 4차  | 자동 반복 일정, 이메일/푸시 알림, 소셜 로그인                 |
| 5차  | 모임(Group) 단위·멤버 관리, 출석 통계                         |

## PRD 요구사항 매핑

| PRD 기능                        | 담당 Task     |
| ------------------------------- | ------------- |
| F-01 회원가입/로그인            | Task 005, 006 |
| F-02, F-03, F-04, F-09 이벤트   | Task 004, 007 |
| F-05 로그인 후 원래 링크 복귀   | Task 006      |
| F-06, F-07, F-08 응답·정원·현황 | Task 004, 008 |
| F-10~F-14 (P1)                  | Task 009      |
| 보안(RLS)·성능·접근성           | Task 005, 010 |
