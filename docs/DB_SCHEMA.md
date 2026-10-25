# DB 스키마 설계안

> 기준: [PRD.md](./PRD.md) 7장 데이터 모델 · 작성: Task 002 (설계만, 구현 제외)
> 1~5장은 **Task 005에서 적용 완료**(2026-10-25, 마이그레이션 `create_core_tables`·`profiles_on_signup`·`core_rls`·`core_table_grants`). 7장 RPC는 Task 008, 9장은 각 Task에서 적용합니다.
> 적용 순서: Supabase MCP `apply_migration` → `get_advisors` → `generate_typescript_types`(`lib/supabase/database.types.ts`).

## 1. 결정 요약

| 항목        | 결정                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| 테이블      | `profiles`, `events`, `rsvps` 3개 (PRD 7장과 동일)                                        |
| 컬럼 이름   | snake_case. 앱 타입(`types/`)과 zod 스키마(`lib/validations/`)도 같은 이름을 쓴다         |
| 시간 저장   | 모든 일시는 `timestamptz`(UTC 저장). 입력은 한국 시간으로 해석 → [6장](#6-타임존-규약)    |
| 정원·대기자 | DB 함수 `respond_to_event`가 이벤트 행 잠금 안에서 처리 (앱 코드에서 읽고-쓰기 금지)      |
| 대기 순서   | 대기자 중 `rsvps.updated_at`이 가장 이른 사람부터 승격 (상태가 바뀔 때만 행이 갱신되므로) |
| 프로필 생성 | `auth.users` INSERT 트리거 `handle_new_user` (9-6 소셜 fallback 버전으로 적용)            |
| 보안        | 모든 테이블 RLS 활성화. RSVP 쓰기는 RPC로만 (RLS는 최후 방어선)                           |

## 2. 테이블

### profiles

```sql
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  avatar_url   text,
  created_at   timestamptz not null default now()
);
```

### events

```sql
create table public.events (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 100),
  description   text check (char_length(description) <= 2000),
  location      text not null check (char_length(location) between 1 and 200),
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  capacity      int check (capacity between 1 and 1000),   -- null = 무제한
  rsvp_deadline timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint events_ends_after_starts   check (ends_at is null or ends_at > starts_at),
  constraint events_deadline_before_start check (rsvp_deadline is null or rsvp_deadline <= starts_at)
);
```

### rsvps

```sql
create table public.rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  status     text not null check (status in ('going', 'not_going', 'maybe', 'waitlist')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);
```

### PRD 7장 대비 추가된 제약

PRD 초안을 그대로 따르되, 아래만 보강했습니다. 모두 앱 검증(`lib/validations/event.ts`)과 같은 규칙이라 DB와 폼의 판단이 어긋나지 않습니다.

- `created_at`, `updated_at`에 `not null` 추가 (앱 타입이 `string`으로 가정)
- 글자 수 제한(제목 100, 장소 200, 설명 2000, 표시 이름 50)과 정원 상한 1000
- `ends_at > starts_at`, `rsvp_deadline <= starts_at` 교차 제약

## 3. 인덱스와 공통 트리거

```sql
-- rsvps(event_id, user_id)는 unique 제약이 인덱스를 만든다. event_id 단독 조회용 인덱스는 별도로 둔다.
create index rsvps_event_id_idx on public.rsvps (event_id);
-- 대기자 승격: 이벤트별 waitlist를 오래된 순으로 찾는다
create index rsvps_waitlist_idx on public.rsvps (event_id, updated_at) where status = 'waitlist';
-- 내 이벤트 목록(주최): 주최자별 다가오는 순
create index events_host_starts_idx on public.events (host_id, starts_at);
-- 내 이벤트 목록(참여): 내 응답 조회
create index rsvps_user_id_idx on public.rsvps (user_id);

-- updated_at 자동 갱신 (events, rsvps에 각각 BEFORE UPDATE 트리거)
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

`rsvps`는 `status` 외에 바뀌는 컬럼이 없으므로 `updated_at` = 마지막 상태 변경 시각입니다. 대기 순서를 이 값으로 정합니다.

## 4. 가입 시 프로필 생성

```sql
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- 표시 이름은 가입 시 `options.data.display_name`으로 받는다(Task 006). 없으면 이메일 앞부분을 쓴다.
- **적용본은 위 SQL이 아니라 [9-6](#9-6-소셜-로그인-가입-시-프로필)의 fallback 버전**이다(소셜 provider를 추가할 때 다시 만들지 않도록). `handle_new_user`는 `anon`·`authenticated`의 실행 권한을 회수했다.
- 이미 가입한 사용자 1명은 `profiles_on_signup` 마이그레이션에서 같은 규칙으로 채웠다.

## 5. RLS 정책

모든 테이블에 `enable row level security`. `auth.uid()`는 행마다 다시 계산되지 않도록 `(select auth.uid())`로 쓴다(Supabase 성능 권장).

| 테이블   | SELECT               | INSERT                          | UPDATE                          | DELETE                          |
| -------- | -------------------- | ------------------------------- | ------------------------------- | ------------------------------- |
| profiles | `authenticated` 전체 | `id = (select auth.uid())`      | `id = (select auth.uid())`      | 없음                            |
| events   | `authenticated` 전체 | `host_id = (select auth.uid())` | 주최자 (`host_id = uid`)        | 주최자 (`host_id = uid`)        |
| rsvps    | `authenticated` 전체 | `user_id = (select auth.uid())` | `user_id = (select auth.uid())` | `user_id = (select auth.uid())` |

- `anon` 역할에는 어떤 정책도 주지 않는다. 비로그인 사용자는 proxy가 로그인으로 보낸다.
- events UPDATE 정책은 `using`과 `with check` 모두 `host_id = (select auth.uid())`로 두어 주최자 변경을 막는다.
- **rsvps는 SELECT 정책만 둔다(적용 결정).** 직접 쓰면 정원 판정을 건너뛸 수 있으므로 INSERT/UPDATE/DELETE 정책과 권한이 없고, 쓰기는 `respond_to_event`(security definer)로만 한다. 위 표의 rsvps 쓰기 칸은 적용하지 않았다.
- profiles INSERT 정책도 두지 않았다(생성은 `handle_new_user` 트리거만).

### 테이블 권한 (GRANT)

이 프로젝트는 `public` 스키마에 새로 만든 테이블에 API 역할(`anon`·`authenticated`)의 기본 권한이 **부여되지 않는다**. RLS 정책만으로는 접근할 수 없어서 `core_table_grants`에서 필요한 권한만 명시적으로 줬다. 새 테이블·컬럼을 추가할 때도 GRANT를 함께 적어야 한다.

| 테이블   | authenticated 권한                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| profiles | SELECT, UPDATE(`display_name`, `avatar_url`)                                                                                    |
| events   | SELECT, DELETE, INSERT(`host_id` + 입력 컬럼 7개), UPDATE(입력 컬럼 7개) — `id`·`host_id`·시각 컬럼은 클라이언트가 바꿀 수 없음 |
| rsvps    | SELECT                                                                                                                          |

- `anon`은 권한이 없다. `TRUNCATE`·`REFERENCES`·`TRIGGER`는 회수했다(TRUNCATE는 RLS를 우회한다).
- Task 007-1의 `cover_image_path`, Task 009-1의 컬럼도 필요하면 컬럼 단위로 GRANT한다. 9-2·9-3의 "컬럼 권한 제한"은 이 방식으로 이미 기본 적용된 상태다.

### 검증 (Task 005)

`execute_sql` 한 번의 DO 블록에서 임시 사용자 3명을 만들고 역할을 바꿔 확인한 뒤, 마지막에 예외를 일으켜 전부 롤백했다(데이터 흔적 없음).

- 트리거 fallback: `display_name`은 그대로, 메타데이터가 없으면 이메일 앞부분, 이메일이 없으면 `nickname`과 `picture`(아바타)
- 다른 사용자 이벤트 수정·삭제 0행. 다른 사람 명의 생성, `host_id` 변경, `id` 지정 생성, rsvps 직접 쓰기, TRUNCATE 거부
- 본인 이벤트 생성·수정·삭제와 본인 프로필 수정 허용, 다른 사람 프로필 수정 0행
- `anon`: events·profiles 조회 권한 없음

## 6. 타임존 규약

- **입력**: 폼의 `datetime-local` 값(예: `2026-10-25T07:00`)은 한국 시간(Asia/Seoul, UTC+9)으로 해석한다. 한국은 서머타임이 없어 `+09:00` 고정으로 변환해도 안전하다.
- **변환 위치**: `lib/validations/event.ts`의 `kstLocalToIso()`. 클라이언트·서버 어디서 실행해도 결과가 같다(브라우저 시간대에 의존하지 않음).
- **저장**: UTC ISO 문자열(`2026-10-24T22:00:00.000Z`) → `timestamptz`.
- **표시**: `Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul" })`로 포맷한다. 서버(UTC)와 브라우저가 같은 결과를 내도록 `timeZone`을 항상 명시한다.
- **수정 폼 채우기**: 저장된 UTC 값을 한국 시간 `YYYY-MM-DDTHH:mm`으로 되돌리는 함수가 필요하다(Task 004/007에서 `kstLocalToIso`와 같은 파일에 추가).

## 7. 참석 응답 RPC: `respond_to_event`

정원 판정·대기자 전환·승격을 한 트랜잭션에서 처리합니다. 같은 이벤트에 동시에 응답이 몰려도 이벤트 행을 잠그므로 정원을 넘지 않습니다.

```sql
create function public.respond_to_event(p_event_id uuid, p_status text)
returns public.rsvps
language plpgsql security definer set search_path = '' as $$ ... $$;

revoke execute on function public.respond_to_event(uuid, text) from public, anon;
grant execute on function public.respond_to_event(uuid, text) to authenticated;
```

`security definer`인 이유: 승격은 **다른 사용자의** rsvps 행을 바꾸므로 "본인만 쓰기" RLS로는 불가능합니다. 대신 함수 안에서 `auth.uid()`로 본인 확인을 직접 합니다.

### 처리 흐름

1. `v_user := auth.uid()` — null이면 `UNAUTHENTICATED`
2. `p_status`가 `going | not_going | maybe`가 아니면 `VALIDATION` (`waitlist`는 직접 선택 불가)
3. `select ... from events where id = p_event_id for update` — 이벤트 행 잠금. 없으면 `NOT_FOUND`
4. 종료 판정: `coalesce(ends_at, starts_at) < now()`이면 `EVENT_ENDED`
5. 마감 판정: `rsvp_deadline < now()`이면 `DEADLINE_PASSED`
6. 기존 응답 조회 → `v_prev` (없으면 null)
7. 새 상태 결정:
   - `p_status = 'going'`이고 이미 `going`이면 그대로
   - `p_status = 'going'`이고 `capacity`가 있고 현재 `going` 수 ≥ `capacity`이면 → `waitlist` (이미 `waitlist`면 순서 유지를 위해 갱신하지 않음)
   - 그 외에는 `p_status`
8. upsert: `insert ... on conflict (event_id, user_id) do update set status = excluded.status` (상태가 같으면 쓰지 않아 `updated_at` 유지)
9. 승격: `v_prev = 'going'`이었고 새 상태가 `going`이 아니면, 같은 이벤트의 `waitlist` 중 `updated_at`이 가장 이른 1명을 `going`으로 변경 (`for update skip locked` 불필요 — 3단계 잠금으로 이미 직렬화됨)
10. 본인의 최종 rsvps 행 반환

### 에러 전달 규약

함수는 `raise exception using errcode = 'P0001', message = '<ActionErrorCode>'` 형태로 실패합니다. Server Action은 `error.message`를 `ActionErrorCode`(`types/action.ts`)로 그대로 매핑하고, 사용자에게 보일 한국어 문구는 앱에서 정합니다.

| 상황           | message (ActionErrorCode) |
| -------------- | ------------------------- |
| 로그인 안 됨   | `UNAUTHENTICATED`         |
| 잘못된 상태 값 | `VALIDATION`              |
| 이벤트 없음    | `NOT_FOUND`               |
| 이벤트 종료    | `EVENT_ENDED`             |
| 응답 마감      | `DEADLINE_PASSED`         |

정원 초과는 에러가 아니라 `waitlist` 상태로 정상 반환됩니다(`CAPACITY` 코드는 이벤트 수정 시 정원 축소 검증 등에 예약).

### 정원 변경 시 (Task 007/008에서 확정)

- **정원 확대 / 무제한 전환**: 늘어난 자리만큼 대기자를 순서대로 승격하는 `promote_waitlist(p_event_id)`를 이벤트 수정 Server Action에서 호출한다.
- **정원 축소**: 이미 `going`인 사람을 대기로 내리지 않는다. 현재 참석 수보다 작게 줄이려 하면 `CAPACITY` 에러로 막는 방안을 권장한다.

## 8. 앱 코드와의 대응

| DB                      | 앱                                                                   |
| ----------------------- | -------------------------------------------------------------------- |
| `profiles` 행           | `Profile` (`types/event.ts`)                                         |
| `events` 행             | `Event` (`types/event.ts`)                                           |
| `events` 입력 컬럼 7개  | `EventInput`, 검증은 `eventInputSchema` (`lib/validations/event.ts`) |
| `rsvps.status`          | `RsvpStatus`, 사용자 선택은 `RsvpChoice` (`types/rsvp.ts`)           |
| `respond_to_event` 인자 | `rsvpInputSchema` (`lib/validations/rsvp.ts`)                        |
| 상태별 인원 집계        | `EventWithCounts.rsvp_counts` — Task 005에서 뷰/RPC 형태 확정        |

`database.types.ts`는 Task 005에서 생성했고, 세 Supabase 클라이언트(`server`·`client`·`proxy`)에 `Database` 제네릭을 적용했다. 다만 앱 타입(`types/event.ts`)에는 아직 DB에 없는 컬럼(`cover_image_path`, `hidden_*`, `role`)이 있어서 조회 계층(`lib/queries/`, Task 007)이 매핑한다. `Tables<"events">` 파생으로 바꾸는 것은 해당 컬럼이 모두 생기는 Task 009-1 이후로 미룬다.

## 9. 추가 기능 설계안

> 대상: 소셜 로그인 · 이벤트 커버 이미지 · 관리자 화면 (PRD 4장). 작성: Task 002-1b (설계만)
> 적용 시점: 커버 이미지는 Task 007-1, 소셜 로그인은 Task 006-1, 관리자는 Task 009-1. 적용 후 `get_advisors`로 확인한다.

### 9-1. 이벤트 커버 이미지

```sql
alter table public.events add column cover_image_path text;  -- null = 커버 없음

-- 공개 버킷: 이벤트 상세 URL을 아는 사람만 이미지를 보게 되므로 공개 읽기로 둔다
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-covers', 'event-covers', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp']);
```

- 객체 경로: `{uid}/{uuid}.{ext}` — 첫 폴더가 업로드한 사용자 id다. DB에는 경로만 저장하고, 조회 계층이 `getPublicUrl()`로 `EventListItem.cover_image_url`을 채운다.
- 이미지를 바꾸면 새 경로로 올리고 이전 객체를 지운다(같은 경로 덮어쓰기는 CDN 캐시 때문에 피한다).

| storage.objects 정책 | 조건 (`bucket_id = 'event-covers'` 공통)                                     |
| -------------------- | ---------------------------------------------------------------------------- |
| SELECT               | 공개 버킷이라 정책 불필요 (목록 조회 방지를 위해 SELECT 정책은 없음)         |
| INSERT               | `authenticated`, `(storage.foldername(name))[1] = (select auth.uid())::text` |
| UPDATE / DELETE      | INSERT와 같은 조건 (본인 폴더만)                                             |

### 9-2. 관리자 역할

```sql
alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin'));

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
```

- **role 컬럼 보호**: 본인 프로필 UPDATE 정책으로 `role`까지 바꿀 수 없도록 `authenticated`의 `profiles` UPDATE 권한을 컬럼 단위로 다시 준다 (`revoke update on profiles from authenticated; grant update (display_name, avatar_url) on profiles to authenticated;`).
- **역할 변경**: RPC `admin_set_user_role(target uuid, new_role text)`만 허용. `is_admin()`이 아니면 예외, 마지막 관리자를 `user`로 바꾸려 하면 예외.
- 권한 판단에 `auth.users.raw_user_meta_data`(사용자가 수정 가능)는 쓰지 않는다. 앱은 `service_role` 키를 쓰지 않는다.
- 첫 관리자는 마이그레이션에서 지정한다 (관리자 테스트 계정).

### 9-3. 이벤트 숨김

```sql
alter table public.events
  add column hidden_at     timestamptz,             -- null = 공개
  add column hidden_reason text check (char_length(hidden_reason) <= 200);
```

- events SELECT 정책: `hidden_at is null or host_id = (select auth.uid()) or (select public.is_admin())`. 주최자는 숨겨진 자기 이벤트를 볼 수 있다(숨김 안내 표시).
- 숨김·해제는 RPC `admin_set_event_hidden(event_id uuid, hidden boolean, reason text)`만 허용. 주최자의 events UPDATE 정책으로 `hidden_*`를 바꾸지 못하게 컬럼 권한을 제한한다(9-2와 같은 방식).
- 숨겨진 이벤트에는 새 응답을 받지 않는다 (`respond_to_event`에서 검사).

### 9-4. 이벤트 신고

```sql
create table public.event_reports (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null check (reason in ('spam', 'inappropriate', 'misleading', 'other')),
  detail      text check (char_length(detail) <= 500),
  status      text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  unique (event_id, reporter_id)   -- 같은 사람이 같은 이벤트를 중복 신고하지 않음
);
create index event_reports_open_idx on public.event_reports (created_at) where status = 'open';
```

| 정책   | 조건                                                                     |
| ------ | ------------------------------------------------------------------------ |
| SELECT | `(select public.is_admin())` (신고자 본인도 볼 필요가 없으므로 관리자만) |
| INSERT | `reporter_id = (select auth.uid())`, `status = 'open'`                   |
| UPDATE | `(select public.is_admin())` (상태 변경)                                 |
| DELETE | 없음                                                                     |

### 9-5. 관리자 RPC

모두 `security definer set search_path = ''`, 함수 첫 줄에서 `if not public.is_admin() then raise exception ... end if;`.

| 함수                                               | 반환                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| `admin_list_users(search text, page int)`          | `AdminUserRow` 목록. `auth.users`의 email·last_sign_in_at·provider를 조인 |
| `admin_stats()`                                    | `AdminStats` (json). 이번 주는 한국 시간 월요일 0시 기준                  |
| `admin_set_event_hidden(event_id, hidden, reason)` | 숨김 처리 + 해당 이벤트의 open 신고를 `resolved`로                        |
| `admin_set_user_role(target, new_role)`            | 9-2 참고                                                                  |

`auth.users`는 클라이언트에 노출되지 않으므로 관리자 사용자 목록은 반드시 이 RPC로 조회한다.

### 9-6. 소셜 로그인 가입 시 프로필

4장의 `handle_new_user`를 아래 순서의 fallback으로 바꾼다. provider마다 이름 키가 다르다(Google `full_name`·`name`, Kakao `nickname`·`name`, Naver 커스텀 OIDC `name`).

```sql
insert into public.profiles (id, display_name, avatar_url)
values (
  new.id,
  left(coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    '사용자'
  ), 50),
  coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
);
```

- 카카오는 이메일 동의가 선택이라 `email`이 없을 수 있다 → 마지막 fallback `'사용자'`.
- `left(..., 50)`으로 `display_name` 길이 제약(1~50자)을 지킨다.
- 대응 앱 코드: provider 상수 `lib/auth/providers.ts`, 콜백 `app/auth/callback/route.ts`.
