"use client";

import { SOCIAL_PROVIDERS, type SocialProvider } from "@/lib/auth/providers";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SocialLoginButtonsProps = {
  /** 로그인 후 이동할 내부 경로 (콜백에서 sanitizeNext로 다시 검증) */
  next?: string;
  className?: string;
};

// 모의 이동 지연 (Task 006-1에서 제거)
const MOCK_DELAY_MS = 600;

// 브랜드 색은 각 사 로그인 버튼 가이드를 따르므로 디자인 토큰 예외로 둔다.
// 대비(글자/배경): Google 라이트 #1F1F1F/흰색, 다크 #E3E3E3/#131314, 카카오 85% 검정/#FEE500, 네이버 #1F1F1F/흰색 — 모두 4.5:1 이상
const PROVIDER_STYLES: Record<SocialProvider, string> = {
  google:
    "border border-[#747775] bg-white text-[#1F1F1F] hover:bg-[#F2F2F2] dark:border-[#8E918F] dark:bg-[#131314] dark:text-[#E3E3E3] dark:hover:bg-[#1F1F20]",
  kakao: "bg-[#FEE500] text-black/85 hover:bg-[#F5DC00]",
  // 사용자 결정: 다크 모드에서도 흰 배경 유지 (녹색 배경 + 흰 글자는 대비 4.5:1 미달)
  "custom:naver":
    "border border-[#DADCE0] bg-white text-[#1F1F1F] hover:bg-[#F2F2F2]",
};

// 소셜 로그인 버튼 목록 (현재는 목업: 클릭하면 준비 중 안내)
export function SocialLoginButtons({
  next,
  className,
}: SocialLoginButtonsProps) {
  const [pendingId, setPendingId] = useState<SocialProvider | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const signIn = (id: SocialProvider, label: string) => {
    if (pendingId) return;
    setPendingId(id);
    // TODO(Task 006-1): supabase.auth.signInWithOAuth({ provider: id, options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? "/events")}` } })
    void next;
    timerRef.current = setTimeout(() => {
      toast.info(`${label} 로그인은 준비 중입니다`);
      setPendingId(null);
    }, MOCK_DELAY_MS);
  };

  return (
    <div
      role="group"
      aria-label="소셜 계정으로 로그인"
      aria-busy={pendingId !== null}
      className={cn("flex flex-col gap-2", className)}
    >
      {SOCIAL_PROVIDERS.map(({ id, label }) => {
        const isPending = pendingId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => signIn(id, label)}
            // disabled 대신 aria-disabled: 누른 버튼에서 키보드 포커스가 사라지지 않도록 (재클릭은 signIn에서 차단)
            aria-disabled={pendingId !== null}
            className={cn(
              "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
              PROVIDER_STYLES[id]
            )}
          >
            <ProviderLogo id={id} />
            {isPending ? "이동 중…" : `${label}로 계속하기`}
          </button>
        );
      })}
    </div>
  );
}

function ProviderLogo({ id }: { id: SocialProvider }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 18 18",
    "aria-hidden": true,
    focusable: false,
  } as const;

  if (id === "google") {
    return (
      <svg {...common}>
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        />
      </svg>
    );
  }

  if (id === "kakao") {
    return (
      <svg {...common}>
        <path
          fill="#000000"
          d="M9 1.5C4.58 1.5 1 4.31 1 7.78c0 2.24 1.5 4.2 3.75 5.31l-.96 3.52c-.08.31.27.56.54.38l4.2-2.78c.15.01.31.02.47.02 4.42 0 8-2.81 8-6.28S13.42 1.5 9 1.5z"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path
        fill="#03C75A"
        d="M12.17 9.63 5.6 1H1v16h4.83V8.37L12.4 17H17V1h-4.83v8.63z"
      />
    </svg>
  );
}
