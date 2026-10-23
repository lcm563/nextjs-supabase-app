// 일시 표시 포맷 (DB_SCHEMA.md 6장 타임존 규약)
// 서버(UTC)와 브라우저가 같은 결과를 내도록 timeZone을 항상 Asia/Seoul로 고정한다.

const KST = "Asia/Seoul";

// "10월 25일 (토)"
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST,
  month: "long",
  day: "numeric",
});
const weekdayFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST,
  weekday: "short",
});
// 24시간제 시·분. "오전/오후"는 직접 붙인다
// (ICU 버전에 따라 ko-KR dayPeriod가 "AM"으로 나와 서버·브라우저 결과가 달라질 수 있음)
const hourMinuteFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
// 같은 날 판정용 "2026. 10. 25."
const dayKeyFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(date: Date): string {
  return `${dateFormatter.format(date)} (${weekdayFormatter.format(date)})`;
}

// "오전 7:00", "오후 12:30", "오전 12:00"(자정)
function formatTime(date: Date): string {
  const parts = hourMinuteFormatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const period = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${hour12}:${minute}`;
}

// "10월 25일 (토) 오전 7:00"
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${formatDate(date)} ${formatTime(date)}`;
}

// 같은 날: "10월 25일 (토) 오전 7:00 ~ 오전 9:00"
// 다른 날: "10월 25일 (토) 오전 7:00 ~ 10월 26일 (일) 오전 9:00"
export function formatEventSchedule(
  startsAt: string,
  endsAt: string | null
): string {
  const start = formatDateTime(startsAt);
  if (!endsAt) return start;

  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);
  const sameDay =
    dayKeyFormatter.format(startDate) === dayKeyFormatter.format(endDate);

  return sameDay
    ? `${start} ~ ${formatTime(endDate)}`
    : `${start} ~ ${formatDateTime(endsAt)}`;
}
