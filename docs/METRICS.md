# 성공 지표 측정

> 기준: [PRD.md](./PRD.md) 9장 성공 지표 · 작성: Task 010-c (2026-10-27)
> 쿼리는 Supabase SQL Editor(또는 MCP `execute_sql`)에서 postgres 권한으로 실행한다. 앱 화면에는 노출하지 않는다.

## 1. 지금 측정할 수 있는 지표

현재 DB(`events`, `rsvps`)만으로 계산한다. 아래 세 쿼리는 합성 데이터(롤백)로 값을 검증했다: 주최자 2명 중 1명이 2개 생성 → 50.0%, 이벤트 3개에 참여자 응답 1건 → 0.33, 생성 30분 뒤 첫 응답 → 30.0분.

| 지표                         | 정의                                                                        | PRD 목표 |
| ---------------------------- | --------------------------------------------------------------------------- | -------- |
| 주최자 재사용                | 이벤트를 2개 이상 만든 주최자 ÷ 이벤트를 1개 이상 만든 주최자               | 40% 이상 |
| 이벤트당 응답 수 (보조)      | 주최자 본인을 뺀 응답 수의 이벤트 평균. 응답률의 분자 쪽 추이를 본다        | —        |
| 첫 응답까지 걸린 시간 (보조) | 이벤트 생성 → 주최자 외 첫 응답까지의 중앙값(분). 공유가 빨리 퍼지는지 본다 | —        |

```sql
-- 주최자 재사용률
with hosts as (
  select host_id, count(*) as n from public.events group by host_id
)
select count(*) filter (where n >= 2) as reused_hosts,
       count(*) as hosts,
       round(100.0 * count(*) filter (where n >= 2) / nullif(count(*), 0), 1) as pct
from hosts;

-- 이벤트당 응답 수 (주최자 본인 제외)
select round(avg(c), 2) as responses_per_event
from (
  select e.id, count(r.id) filter (where r.user_id <> e.host_id) as c
  from public.events e
  left join public.rsvps r on r.event_id = e.id
  group by e.id
) t;

-- 첫 응답까지 걸린 시간 중앙값(분)
select round(percentile_cont(0.5) within group (order by m)::numeric, 1) as median_minutes
from (
  select extract(epoch from min(r.created_at) - e.created_at) / 60 as m
  from public.events e
  join public.rsvps r on r.event_id = e.id and r.user_id <> e.host_id
  group by e.id, e.created_at
) t;
```

- 기간을 나눠 보려면 `where e.created_at >= now() - interval '30 days'`처럼 이벤트 생성일로 자른다.
- `rsvps.created_at`은 첫 응답 시각이다(응답을 바꾸면 `updated_at`만 바뀐다).
- 테스트 이벤트·본인 계정 데이터가 섞이면 값이 왜곡되므로, 실사용자가 생긴 뒤에는 운영자 계정의 이벤트를 제외하고 본다.

## 2. 추가 기록이 있어야 측정할 수 있는 지표

현재는 "누가 링크를 열었는지"와 "링크 복사"를 저장하지 않으므로 아래 지표는 계산할 수 없다. 측정하려면 기록을 추가해야 하며, **구현은 별도 작업으로 결정한다**(MVP 범위 밖).

| 지표             | 정의                                                            | PRD 목표 | 필요한 기록                                                          |
| ---------------- | --------------------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| 응답률           | 이벤트 상세를 연 로그인 사용자 중 응답한 비율                   | 70% 이상 | 이벤트 상세 조회(사용자·이벤트별 첫 조회)                            |
| 링크→응답 전환율 | 비로그인 상태로 링크를 연 방문 중, 로그인 후 응답까지 끝낸 비율 | 50% 이상 | 비로그인 방문(proxy가 `/auth/login?next=/events/…`로 보낼 때) + 응답 |
| 공지 소요 시간   | 이벤트 생성 → 첫 링크 복사까지                                  | 1분 이내 | 공유 버튼 클릭 시각                                                  |

권장 방식(구현 시):

- **응답률**: `event_views(event_id, user_id, first_viewed_at, unique(event_id, user_id))` 테이블에 상세 페이지 첫 조회를 기록하고 `rsvps`와 조인한다. RLS는 본인 행 INSERT만, 조회는 관리자 RPC로.
- **링크→응답 전환율**: 비로그인 방문은 사용자 식별이 없으므로 서버 로그 대신 Vercel Web Analytics(Hobby 무료)의 `/events/[id]` → `/auth/login` 페이지 흐름으로 근사하거나, 로그인 후 `next`로 돌아온 첫 조회를 `event_views`에 `via_login = true`로 표시한다.
- **공지 소요 시간**: `events.first_shared_at`(공유 버튼 첫 클릭 시 한 번만 채움)을 두고 `first_shared_at - created_at`의 중앙값을 본다.
- 개인정보: 조회 기록은 사용자 id만 저장하고 IP·기기 정보는 저장하지 않는다.
