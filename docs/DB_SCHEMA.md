# DB 스키마 설계안

> 기준: [PRD.md](./PRD.md) 7장 데이터 모델 · 작성: Task 002 (설계만, 구현 제외)
> 이 문서의 SQL은 **설계안**입니다. 실제 적용은 Task 005에서 Supabase MCP `apply_migration`으로 하고, 적용 후 `get_advisors` → `generate_typescript_types`(`lib/supabase/database.types.ts`) 순서로 진행합니다.

## 1. 결정 요약

| 항목        | 결정                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| 테이블      | `profiles`, `events`, `rsvps` 3개 (PRD 7장과 동일)                                        |
| 컬럼 이름   | snake_case. 앱 타입(`types/`)과 zod 스키마(`lib/validations/`)도 같은 이름을 쓴다         |
| 시간 저장   | 모든 일시는 `timestamptz`(UTC 저장). 입력은 한국 시간으로 해석 → [6장](#6-타임존-규약)    |
| 정원·대기자 | DB 함수 `respond_to_event`가 이벤트 행 잠금 안에서 처리 (앱 코드에서 읽고-쓰기 금지)      |
| 대기 순서   | 대기자 중 `rsvps.updated_at`이 가장 이른 사람부터 승격 (상태가 바뀔 때만 행이 갱신되므로) |
| 프로필 생성 | `auth.users` INSERT 트리거 `handle_new_user`                                              |
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
- 이미 가입한 사용자(현재 1명)는 트리거 대상이 아니므로 Task 005 마이그레이션에서 `profiles`를 한 번 채워 넣는다.

## 5. RLS 정책

모든 테이블에 `enable row level security`. `auth.uid()`는 행마다 다시 계산되지 않도록 `(select auth.uid())`로 쓴다(Supabase 성능 권장).

| 테이블   | SELECT               | INSERT                          | UPDATE                          | DELETE                          |
| -------- | -------------------- | ------------------------------- | ------------------------------- | ------------------------------- |
| profiles | `authenticated` 전체 | `id = (select auth.uid())`      | `id = (select auth.uid())`      | 없음                            |
| events   | `authenticated` 전체 | `host_id = (select auth.uid())` | 주최자 (`host_id = uid`)        | 주최자 (`host_id = uid`)        |
| rsvps    | `authenticated` 전체 | `user_id = (select auth.uid())` | `user_id = (select auth.uid())` | `user_id = (select auth.uid())` |

- `anon` 역할에는 어떤 정책도 주지 않는다. 비로그인 사용자는 proxy가 로그인으로 보낸다.
- events UPDATE 정책은 `using`과 `with check` 모두 `host_id = (select auth.uid())`로 두어 주최자 변경을 막는다.
- rsvps의 INSERT/UPDATE 정책이 있어도 앱은 직접 쓰지 않고 `respond_to_event`만 호출한다. 직접 쓰면 정원 판정을 건너뛸 수 있으므로, Task 005에서 rsvps INSERT/UPDATE 정책을 아예 두지 않고 RPC만 열어 두는 방안도 함께 검토한다(권장).

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

Task 005에서 `database.types.ts`를 생성하면 `types/`의 행 타입은 생성된 `Tables<"events">` 등에서 파생하도록 바꿉니다.
