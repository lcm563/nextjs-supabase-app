// 이벤트 생성/수정 입력 검증 스키마 (클라이언트 폼 + Server Action 공용)
// 입력: 폼 문자열 값(datetime-local, number input 포함) → 출력: EventInput (DB 컬럼 snake_case)
// 일시는 한국 시간(Asia/Seoul, UTC+9 고정)으로 해석해 UTC ISO 문자열로 변환한다.
import { z } from "zod";

import type { EventInput } from "@/types/event";

// 폼 필드 값: 모두 문자열이며 비어 있으면 ""
export type EventFormValues = {
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: string;
  rsvp_deadline: string;
};

const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

// "2026-10-25T07:00" (한국 시간) → "2026-10-24T22:00:00.000Z", 잘못된 값이면 null
export function kstLocalToIso(value: string): string | null {
  if (!DATETIME_LOCAL_PATTERN.test(value)) return null;
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${withSeconds}+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function requiredDateTime(emptyMessage: string, invalidMessage: string) {
  return z
    .string()
    .trim()
    .min(1, emptyMessage)
    .transform((value, ctx) => {
      const iso = kstLocalToIso(value);
      if (!iso) {
        ctx.addIssue({ code: "custom", message: invalidMessage });
        return z.NEVER;
      }
      return iso;
    });
}

function optionalDateTime(invalidMessage: string) {
  return z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const iso = kstLocalToIso(value);
      if (!iso) {
        ctx.addIssue({ code: "custom", message: invalidMessage });
        return z.NEVER;
      }
      return iso;
    });
}

export const EVENT_LIMITS = {
  titleMax: 100,
  locationMax: 200,
  descriptionMax: 2000,
  capacityMax: 1000,
} as const;

export const eventInputSchema: z.ZodType<EventInput, EventFormValues> = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "제목을 입력해주세요")
      .max(
        EVENT_LIMITS.titleMax,
        `제목은 ${EVENT_LIMITS.titleMax}자 이하로 입력해주세요`
      ),
    description: z
      .string()
      .trim()
      .max(
        EVENT_LIMITS.descriptionMax,
        `설명은 ${EVENT_LIMITS.descriptionMax}자 이하로 입력해주세요`
      )
      .transform((value) => (value === "" ? null : value)),
    location: z
      .string()
      .trim()
      .min(1, "장소를 입력해주세요")
      .max(
        EVENT_LIMITS.locationMax,
        `장소는 ${EVENT_LIMITS.locationMax}자 이하로 입력해주세요`
      ),
    starts_at: requiredDateTime(
      "시작 일시를 입력해주세요",
      "시작 일시 형식이 올바르지 않습니다"
    ),
    ends_at: optionalDateTime("종료 일시 형식이 올바르지 않습니다"),
    // 빈 값 = 정원 무제한(null)
    capacity: z
      .string()
      .trim()
      .transform((value, ctx) => {
        if (value === "") return null;
        const capacity = Number(value);
        if (
          !Number.isInteger(capacity) ||
          capacity < 1 ||
          capacity > EVENT_LIMITS.capacityMax
        ) {
          ctx.addIssue({
            code: "custom",
            message: `정원은 1~${EVENT_LIMITS.capacityMax} 사이의 정수로 입력해주세요`,
          });
          return z.NEVER;
        }
        return capacity;
      }),
    rsvp_deadline: optionalDateTime("응답 마감 일시 형식이 올바르지 않습니다"),
  })
  .superRefine((data, ctx) => {
    const startsAt = Date.parse(data.starts_at);

    if (data.ends_at && Date.parse(data.ends_at) <= startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["ends_at"],
        message: "종료 일시는 시작 일시 이후여야 합니다",
      });
    }

    if (data.rsvp_deadline && Date.parse(data.rsvp_deadline) > startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["rsvp_deadline"],
        message: "응답 마감 일시는 시작 일시 이전이어야 합니다",
      });
    }
  });

export const emptyEventFormValues: EventFormValues = {
  title: "",
  description: "",
  location: "",
  starts_at: "",
  ends_at: "",
  capacity: "",
  rsvp_deadline: "",
};
