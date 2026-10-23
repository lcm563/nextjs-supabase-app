"use client";

import { Button } from "@/components/ui/button";
import { Check, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const COPIED_DURATION_MS = 2000;

// 이벤트 상세 링크 복사
export function ShareLinkButton({
  eventId,
  className,
}: {
  eventId: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyLink = async () => {
    const url = `${window.location.origin}/events/${eventId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("링크를 복사했습니다");
    } catch {
      // 권한 거부·비보안 컨텍스트 등. 직접 복사할 수 있게 URL을 보여준다
      toast.error("복사하지 못했습니다", { description: url });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={copyLink}
      className={className}
    >
      {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
      공유
    </Button>
  );
}
