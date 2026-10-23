"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

// 모의 삭제 지연 (Task 007에서 제거)
const MOCK_DELAY_MS = 300;

// 이벤트 삭제 확인 대화상자
export function DeleteEventDialog({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const deleteEvent = (e: React.MouseEvent) => {
    // 처리가 끝날 때까지 대화상자를 열어둔다
    e.preventDefault();

    startTransition(async () => {
      // TODO(Task 007): deleteEvent Server Action 호출로 교체 (eventId)
      void eventId;
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

      toast.success("이벤트를 삭제했습니다");
      setOpen(false);
      router.push("/events");
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2 aria-hidden="true" />
          이벤트 삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>이벤트를 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{eventTitle}</span>{" "}
            이벤트를 삭제합니다. 응답 내역도 함께 삭제되며 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={deleteEvent}
            disabled={isPending}
            className={buttonVariants({ variant: "destructive" })}
          >
            {isPending ? "삭제 중…" : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
