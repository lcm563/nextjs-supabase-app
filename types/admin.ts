// 관리자 화면 도메인 타입 (사용자 역할·로그인 수단·통계·신고)
// 날짜/시간(timestamptz)은 ISO 8601 문자열로 다룬다.

export type UserRole = "user" | "admin";

// Supabase Auth provider 값 (네이버는 커스텀 OIDC provider라 "custom:" 접두사)
export type AuthProvider = "email" | "google" | "kakao" | "custom:naver";

// 사용자 관리 목록 행
export type AdminUserRow = {
  id: string;
  display_name: string;
  email: string | null;
  provider: AuthProvider;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
};

// 대시보드 통계
export type AdminStats = {
  users_total: number;
  users_new_this_week: number;
  events_upcoming: number;
  events_ended: number;
  events_hidden: number;
  rsvps_total: number;
  reports_open: number;
  users_by_provider: Record<AuthProvider, number>;
};

export type ReportStatus = "open" | "resolved" | "dismissed";

export const REPORT_REASONS = [
  "spam",
  "inappropriate",
  "misleading",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

// 이벤트 신고 (관리자 신고 목록 표시용)
export type EventReport = {
  id: string;
  event_id: string;
  event_title: string;
  reporter: { id: string; display_name: string };
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  created_at: string;
};
