// Phase 2 UI 전용 더미 이벤트·응답. Task 007/008에서 실제 쿼리로 교체 후 삭제한다.
// 일시는 호출 시점(now) 기준 상대값으로 만든다. 모듈 최상위에서 현재 시각을 읽지 않는다.

import {
  MOCK_CURRENT_USER_ID,
  MOCK_PROFILES,
  mockUserId,
} from "@/lib/mock/profiles";
import type { Event, EventDetail, EventListItem } from "@/types/event";
import type { Attendee, RsvpStatus } from "@/types/rsvp";

type MockRsvp = { user_id: string; status: RsvpStatus; updated_at: string };
type MockEvent = Event & { rsvps: MockRsvp[] };

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const KST_OFFSET_MS = 9 * HOUR_MS;

function addHours(base: Date, hours: number): string {
  return new Date(base.getTime() + hours * HOUR_MS).toISOString();
}

function addDays(base: Date, days: number): string {
  return new Date(base.getTime() + days * DAY_MS).toISOString();
}

// 오늘(한국 날짜) 기준 dayOffset일 뒤 한국 시간 hour시 정각
function kstAt(now: Date, dayOffset: number, hour: number): string {
  const kstMidnight =
    Math.floor((now.getTime() + KST_OFFSET_MS) / DAY_MS) * DAY_MS -
    KST_OFFSET_MS;
  return new Date(
    kstMidnight + dayOffset * DAY_MS + hour * HOUR_MS
  ).toISOString();
}

// [사용자 번호, 상태] 순서대로 1시간 간격 응답 (배열 순서 = 응답 순서 = 대기 순서)
function buildRsvps(
  respondedFrom: string,
  entries: [userNo: number, status: RsvpStatus][]
): MockRsvp[] {
  const base = new Date(respondedFrom);
  return entries.map(([userNo, status], index) => ({
    user_id: mockUserId(userNo),
    status,
    updated_at: addHours(base, index + 1),
  }));
}

function mockEventId(no: number): string {
  return `10000000-0000-4000-8000-${String(no).padStart(12, "0")}`;
}

// 시나리오별 이벤트 id (페이지·테스트에서 참조)
export const MOCK_EVENT_IDS = {
  hostedUnlimited: mockEventId(1), // a. 내가 주최, 정원 무제한
  hostedFull: mockEventId(2), // b. 내가 주최, 정원 가득 + 대기 2명
  deadlineSoon: mockEventId(3), // c. 내가 참석, 응답 마감 임박
  deadlinePassed: mockEventId(4), // d. 응답 마감 지남, 내 상태 미정
  endedAttended: mockEventId(5), // e. 종료된 이벤트, 내가 참석
  hostedEnded: mockEventId(6), // f. 내가 주최, 종료
  edited: mockEventId(7), // g. 수정됨, 설명 없음, 내 응답 없음
} as const;

function buildMockEvents(now: Date): MockEvent[] {
  const createdAt = addDays(now, -3);
  const me = MOCK_CURRENT_USER_ID;

  return [
    {
      id: MOCK_EVENT_IDS.hostedUnlimited,
      host_id: me,
      title: "아침 한강 러닝 5km",
      description:
        "반포한강공원 달빛광장 앞에서 모여 가볍게 5km 뛰어요.\n페이스는 6분 30초 내외, 처음 오시는 분도 환영합니다.\n\n끝나고 근처에서 커피 한잔해요 ☕",
      location: "반포한강공원 달빛광장",
      starts_at: kstAt(now, 3, 6),
      ends_at: kstAt(now, 3, 8),
      capacity: null,
      rsvp_deadline: kstAt(now, 2, 22),
      created_at: createdAt,
      updated_at: createdAt,
      rsvps: buildRsvps(createdAt, [
        [1, "going"],
        [2, "going"],
        [3, "going"],
        [4, "going"],
        [5, "maybe"],
        [6, "maybe"],
        [7, "not_going"],
      ]),
    },
    {
      id: MOCK_EVENT_IDS.hostedFull,
      host_id: me,
      title: "저녁 수영 레인 모임",
      description:
        "레인 1개 대관이라 정원 6명입니다.\n자리가 차면 대기자로 등록되고, 취소자가 생기면 순서대로 참석으로 바뀝니다.",
      location: "올림픽수영장 3레인",
      starts_at: kstAt(now, 5, 20),
      ends_at: kstAt(now, 5, 22),
      capacity: 6,
      rsvp_deadline: null,
      created_at: createdAt,
      updated_at: createdAt,
      rsvps: buildRsvps(createdAt, [
        [1, "going"],
        [2, "going"],
        [3, "going"],
        [4, "going"],
        [5, "going"],
        [6, "going"],
        [7, "waitlist"],
        [8, "waitlist"],
        [9, "maybe"],
        [10, "not_going"],
      ]),
    },
    {
      id: MOCK_EVENT_IDS.deadlineSoon,
      host_id: mockUserId(2),
      title: "헬스 파트너 하체 루틴",
      description: "스쿼트 위주로 1시간 30분 진행합니다. 개인 수건 챙겨주세요.",
      location: "강남 휘트니스 2층",
      starts_at: kstAt(now, 1, 7),
      ends_at: kstAt(now, 1, 9),
      capacity: 10,
      // 최소 7시간 뒤에 시작하므로 마감(3시간 뒤)은 항상 시작 전이다
      rsvp_deadline: addHours(now, 3),
      created_at: createdAt,
      updated_at: createdAt,
      rsvps: buildRsvps(createdAt, [
        [2, "going"],
        [1, "going"],
        [3, "going"],
        [5, "going"],
        [8, "going"],
        [9, "maybe"],
      ]),
    },
    {
      id: MOCK_EVENT_IDS.deadlinePassed,
      host_id: mockUserId(4),
      title: "클라이밍 입문 원데이",
      description: "장비 대여 인원을 미리 파악해야 해서 응답 마감을 두었어요.",
      location: "더클라임 신림점",
      starts_at: kstAt(now, 2, 19),
      ends_at: kstAt(now, 2, 21),
      capacity: 10,
      rsvp_deadline: addHours(now, -2),
      created_at: createdAt,
      updated_at: createdAt,
      rsvps: buildRsvps(createdAt, [
        [4, "going"],
        [6, "going"],
        [7, "going"],
        [1, "maybe"],
        [10, "not_going"],
      ]),
    },
    {
      id: MOCK_EVENT_IDS.endedAttended,
      host_id: mockUserId(3),
      title: "새벽 수영 자유형 연습",
      description: "자유형 호흡 위주로 연습했습니다. 다들 수고하셨어요!",
      location: "잠실 실내수영장",
      starts_at: kstAt(now, -5, 6),
      ends_at: kstAt(now, -5, 8),
      capacity: 8,
      rsvp_deadline: null,
      created_at: addDays(now, -10),
      updated_at: addDays(now, -10),
      rsvps: buildRsvps(addDays(now, -10), [
        [3, "going"],
        [1, "going"],
        [2, "going"],
        [5, "going"],
        [6, "not_going"],
      ]),
    },
    {
      id: MOCK_EVENT_IDS.hostedEnded,
      host_id: me,
      title: "정기 러닝 10km",
      description:
        "올림픽공원 외곽 순환 코스. 완주 기록은 단톡방에 공유했어요.",
      location: "올림픽공원 평화의문",
      starts_at: kstAt(now, -12, 20),
      ends_at: kstAt(now, -12, 22),
      capacity: null,
      rsvp_deadline: null,
      created_at: addDays(now, -20),
      updated_at: addDays(now, -20),
      rsvps: buildRsvps(addDays(now, -20), [
        [1, "going"],
        [2, "going"],
        [4, "going"],
        [7, "going"],
        [9, "going"],
        [8, "maybe"],
      ]),
    },
    {
      id: MOCK_EVENT_IDS.edited,
      host_id: mockUserId(5),
      title: "배드민턴 복식 게임 (장소 변경)",
      description: null,
      location: "송파 구민체육센터 B코트",
      starts_at: kstAt(now, 6, 10),
      ends_at: kstAt(now, 6, 12),
      capacity: 12,
      rsvp_deadline: null,
      created_at: addDays(now, -4),
      updated_at: addDays(now, -2),
      rsvps: buildRsvps(addDays(now, -4), [
        [5, "going"],
        [6, "going"],
      ]),
    },
  ];
}

function countRsvps(rsvps: MockRsvp[]): Record<RsvpStatus, number> {
  const counts: Record<RsvpStatus, number> = {
    going: 0,
    not_going: 0,
    maybe: 0,
    waitlist: 0,
  };
  for (const rsvp of rsvps) counts[rsvp.status] += 1;
  return counts;
}

function toListItem({ rsvps, ...event }: MockEvent): EventListItem {
  const host = MOCK_PROFILES.find((profile) => profile.id === event.host_id);
  return {
    ...event,
    rsvp_counts: countRsvps(rsvps),
    host: {
      id: event.host_id,
      display_name: host?.display_name ?? "알 수 없음",
    },
    my_status:
      rsvps.find((rsvp) => rsvp.user_id === MOCK_CURRENT_USER_ID)?.status ??
      null,
  };
}

function toAttendees(rsvps: MockRsvp[]): Attendee[] {
  return rsvps.flatMap((rsvp) => {
    const profile = MOCK_PROFILES.find((p) => p.id === rsvp.user_id);
    if (!profile) return [];
    return [
      {
        user_id: rsvp.user_id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        status: rsvp.status,
        updated_at: rsvp.updated_at,
      },
    ];
  });
}

// 내 이벤트 목록 (정렬은 페이지에서 한다)
// hosting: 내가 주최 / attending: 타인 주최 중 내 응답이 불참이 아닌 이벤트
export function getMockMyEvents(now: Date): {
  hosting: EventListItem[];
  attending: EventListItem[];
} {
  const items = buildMockEvents(now).map(toListItem);
  return {
    hosting: items.filter((item) => item.host_id === MOCK_CURRENT_USER_ID),
    attending: items.filter(
      (item) =>
        item.host_id !== MOCK_CURRENT_USER_ID &&
        item.my_status !== null &&
        item.my_status !== "not_going"
    ),
  };
}

// 이벤트 상세. 없는 id면 null (페이지에서 notFound() 처리)
export function getMockEventDetail(id: string, now: Date): EventDetail | null {
  const event = buildMockEvents(now).find((item) => item.id === id);
  if (!event) return null;
  return { ...toListItem(event), attendees: toAttendees(event.rsvps) };
}
