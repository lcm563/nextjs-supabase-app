// 관리자 화면 전용 더미 데이터 (사용자·신고·통계). Task 009-1에서 관리자 RPC로 교체 후 삭제한다.
// 일시는 호출 시점(now) 기준 상대값으로 만든다. 모듈 최상위에서 현재 시각을 읽지 않는다.

import { getEventPhase } from "@/lib/event-status";
import { MOCK_EVENT_IDS, getMockAllEvents } from "@/lib/mock/events";
import { MOCK_PROFILES, mockUserId } from "@/lib/mock/profiles";
import type {
  AdminStats,
  AdminUserRow,
  AuthProvider,
  EventReport,
  ReportReason,
  ReportStatus,
} from "@/types/admin";
import type { EventListItem } from "@/types/event";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function ago(now: Date, ms: number): string {
  return new Date(now.getTime() - ms).toISOString();
}

// MOCK_PROFILES 순서(1~10번)와 같다. 로그인 수단: 이메일 3 · Google 3 · 카카오 2 · 네이버 2
const USER_SEEDS: {
  email: string | null;
  provider: AuthProvider;
  joinedDaysAgo: number;
  /** null = 가입 후 로그인 기록 없음 */
  lastSignInHoursAgo: number | null;
}[] = [
  {
    email: "minjun.kim@example.com",
    provider: "email",
    joinedDaysAgo: 60,
    lastSignInHoursAgo: 1,
  },
  {
    email: "seoyeon.lee@example.com",
    provider: "google",
    joinedDaysAgo: 52,
    lastSignInHoursAgo: 5,
  },
  // 카카오는 이메일 제공 동의가 선택이라 없을 수 있다
  { email: null, provider: "kakao", joinedDaysAgo: 45, lastSignInHoursAgo: 30 },
  {
    email: "sua.choi@example.com",
    provider: "email",
    joinedDaysAgo: 38,
    lastSignInHoursAgo: 72,
  },
  {
    email: "doyun.jung@example.com",
    provider: "google",
    joinedDaysAgo: 30,
    lastSignInHoursAgo: 12,
  },
  {
    email: "haeun.kang@example.com",
    provider: "custom:naver",
    joinedDaysAgo: 21,
    lastSignInHoursAgo: 48,
  },
  {
    email: "hyunwoo.jo@example.com",
    provider: "kakao",
    joinedDaysAgo: 14,
    lastSignInHoursAgo: 3,
  },
  {
    email: "jia.yoon@example.com",
    provider: "email",
    joinedDaysAgo: 9,
    lastSignInHoursAgo: null,
  },
  {
    email: "seojun.jang@example.com",
    provider: "google",
    joinedDaysAgo: 3,
    lastSignInHoursAgo: 20,
  },
  {
    email: "chaewon.lim@example.com",
    provider: "custom:naver",
    joinedDaysAgo: 1,
    lastSignInHoursAgo: 2,
  },
];

function buildAdminUsers(now: Date): AdminUserRow[] {
  return MOCK_PROFILES.map((profile, index) => {
    const seed = USER_SEEDS[index];
    return {
      id: profile.id,
      display_name: profile.display_name,
      email: seed.email,
      provider: seed.provider,
      role: profile.role,
      created_at: ago(now, seed.joinedDaysAgo * DAY_MS),
      last_sign_in_at:
        seed.lastSignInHoursAgo === null
          ? null
          : ago(now, seed.lastSignInHoursAgo * HOUR_MS),
    };
  });
}

function includesQuery(values: (string | null)[], q?: string): boolean {
  const query = q?.trim().toLowerCase();
  if (!query) return true;
  return values.some((value) => value?.toLowerCase().includes(query));
}

// 사용자 목록 (가입 최신순). q: 이름·이메일 부분 일치
export function getMockAdminUsers(
  now: Date,
  { q }: { q?: string } = {}
): AdminUserRow[] {
  return buildAdminUsers(now)
    .filter((user) => includesQuery([user.display_name, user.email], q))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

const REPORT_SEEDS: {
  eventId: string;
  reporterNo: number;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  hoursAgo: number;
}[] = [
  {
    eventId: MOCK_EVENT_IDS.edited,
    reporterNo: 8,
    reason: "misleading",
    detail: "장소가 여러 번 바뀌었는데 공지 없이 수정됐어요.",
    status: "open",
    hoursAgo: 2,
  },
  {
    eventId: MOCK_EVENT_IDS.deadlineSoon,
    reporterNo: 10,
    reason: "spam",
    detail: null,
    status: "open",
    hoursAgo: 9,
  },
  {
    eventId: MOCK_EVENT_IDS.hostedHidden,
    reporterNo: 6,
    reason: "spam",
    detail: "설명에 외부 쇼핑몰 홍보 링크가 있습니다.",
    status: "resolved",
    hoursAgo: 30,
  },
  {
    eventId: MOCK_EVENT_IDS.hostedUnlimited,
    reporterNo: 7,
    reason: "other",
    detail: "모임 시간이 너무 이른 것 같아요.",
    status: "dismissed",
    hoursAgo: 50,
  },
];

function buildReports(now: Date, events: EventListItem[]): EventReport[] {
  return REPORT_SEEDS.map((seed, index) => {
    const reporterId = mockUserId(seed.reporterNo);
    return {
      id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      event_id: seed.eventId,
      event_title:
        events.find((event) => event.id === seed.eventId)?.title ??
        "삭제된 이벤트",
      reporter: {
        id: reporterId,
        display_name:
          MOCK_PROFILES.find((profile) => profile.id === reporterId)
            ?.display_name ?? "알 수 없음",
      },
      reason: seed.reason,
      detail: seed.detail,
      status: seed.status,
      created_at: ago(now, seed.hoursAgo * HOUR_MS),
    };
  });
}

// 신고 목록 (최신순)
export function getMockReports(
  now: Date,
  status: ReportStatus | "all" = "all"
): EventReport[] {
  return buildReports(now, getMockAllEvents(now))
    .filter((report) => status === "all" || report.status === status)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export type AdminEventStatusFilter = "all" | "visible" | "hidden";

// 이벤트 관리 목록 (숨김 포함, 시작 최신순). q: 제목·주최자 이름 부분 일치
export function getMockAdminEvents(
  now: Date,
  { q, status = "all" }: { q?: string; status?: AdminEventStatusFilter } = {}
): EventListItem[] {
  return getMockAllEvents(now)
    .filter((event) => {
      if (status === "visible") return event.hidden_at === null;
      if (status === "hidden") return event.hidden_at !== null;
      return true;
    })
    .filter((event) => includesQuery([event.title, event.host.display_name], q))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
}

// 대시보드 통계. 이번 주 = now 기준 최근 7일
// 예정·종료 수는 숨김 이벤트를 포함한 전체 기준이고, 숨김 수는 따로 센다
export function getMockAdminStats(now: Date): AdminStats {
  const users = buildAdminUsers(now);
  const events = getMockAllEvents(now);
  const weekAgo = now.getTime() - 7 * DAY_MS;

  const usersByProvider: Record<AuthProvider, number> = {
    email: 0,
    google: 0,
    kakao: 0,
    "custom:naver": 0,
  };
  for (const user of users) usersByProvider[user.provider] += 1;

  const endedCount = events.filter(
    (event) => getEventPhase(event, now) === "ended"
  ).length;

  return {
    users_total: users.length,
    users_new_this_week: users.filter(
      (user) => Date.parse(user.created_at) >= weekAgo
    ).length,
    events_upcoming: events.length - endedCount,
    events_ended: endedCount,
    events_hidden: events.filter((event) => event.hidden_at !== null).length,
    rsvps_total: events.reduce(
      (sum, event) =>
        sum + Object.values(event.rsvp_counts).reduce((a, b) => a + b, 0),
      0
    ),
    reports_open: buildReports(now, events).filter(
      (report) => report.status === "open"
    ).length,
    users_by_provider: usersByProvider,
  };
}
