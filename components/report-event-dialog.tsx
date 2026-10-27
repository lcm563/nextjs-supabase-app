"use client";

import { reportEvent } from "@/app/events/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  REPORT_DETAIL_MAX_LENGTH,
  REPORT_REASON_LABELS,
  reportInputSchema,
  type ReportInput,
} from "@/lib/validations/report";
import { REPORT_REASONS } from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flag } from "lucide-react";
import { useState } from "react";
import {
  useForm,
  useWatch,
  type Control,
  type DefaultValues,
} from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

type ReportFormValues = z.input<typeof reportInputSchema>;

// 사유는 선택 전이면 비워 둔다 (미선택 제출 시 검증 오류)
const DEFAULT_VALUES: DefaultValues<ReportFormValues> = { detail: "" };

// 이벤트 신고 대화상자 (주최자가 아닌 사용자에게만 표시)
export function ReportEventDialog({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<ReportFormValues, unknown, ReportInput>({
    resolver: zodResolver(reportInputSchema),
    defaultValues: DEFAULT_VALUES,
  });
  // shadcn FormField는 변환 출력 타입을 받지 않으므로 렌더링용 control만 입력 타입으로 맞춘다
  const control = form.control as unknown as Control<ReportFormValues>;
  const detail = useWatch({ control, name: "detail" });
  const { isSubmitting } = form.formState;

  // 검증 통과 후 변환 전 원본 값(빈 상세 = "")을 보낸다. 서버가 같은 스키마로 다시 검증·변환한다
  const onSubmit = async () => {
    const result = await reportEvent({
      event_id: eventId,
      ...form.getValues(),
    });
    if (!result.success) {
      toast.error(result.error.message);
      // 이미 신고했으면 다시 제출해도 같은 결과이므로 닫는다
      if (result.error.code === "ALREADY_REPORTED") {
        setOpen(false);
        form.reset(DEFAULT_VALUES);
      }
      return;
    }

    toast.success("신고가 접수되었습니다. 관리자가 검토합니다");
    setOpen(false);
    form.reset(DEFAULT_VALUES);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // 접수 중에는 닫지 않는다
        if (isSubmitting) return;
        setOpen(next);
        if (!next) form.reset(DEFAULT_VALUES);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Flag aria-hidden="true" />
          신고
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이벤트 신고</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{eventTitle}</span>{" "}
            이벤트를 신고합니다. 관리자가 검토 후 조치합니다.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    신고 사유
                    <span className="text-destructive" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                      aria-required="true"
                      className="gap-1"
                    >
                      {REPORT_REASONS.map((reason) => (
                        <div key={reason} className="flex items-center gap-2">
                          <RadioGroupItem
                            value={reason}
                            id={`report-reason-${reason}`}
                          />
                          <Label
                            htmlFor={`report-reason-${reason}`}
                            className="flex-1 py-2 font-normal"
                          >
                            {REPORT_REASON_LABELS[reason]}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="detail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상세 내용 (선택)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      maxLength={REPORT_DETAIL_MAX_LENGTH}
                      placeholder="신고 사유를 자세히 적어주세요"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-right text-xs text-muted-foreground">
                    {detail.length}/{REPORT_DETAIL_MAX_LENGTH}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setOpen(false);
                  form.reset(DEFAULT_VALUES);
                }}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "접수 중…" : "신고하기"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
