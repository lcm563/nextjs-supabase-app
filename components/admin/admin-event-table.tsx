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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EyeOff, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export type AdminEventRow = {
  id: string;
  title: string;
  host_name: string;
  /** 서버에서 formatDateTime으로 만든 표시 문자열 */
  starts_at_label: string;
  rsvp_total: number;
  hidden: boolean;
  hidden_reason: string | null;
};

// 모의 처리 지연 (Task 009-1에서 제거)
const MOCK_DELAY_MS = 300;
// DB_SCHEMA.md 9-3: hidden_reason 200자 제한
const HIDDEN_REASON_MAX = 200;

const wait = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

// 전체 이벤트 관리 표 (숨김·복구·강제 삭제)
export function AdminEventTable({
  rows: initialRows,
}: {
  rows: AdminEventRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hideTarget, setHideTarget] = useState<AdminEventRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminEventRow | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const updateRow = (id: string, patch: Partial<AdminEventRow>) =>
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );

  const openHideDialog = (row: AdminEventRow) => {
    setReason("");
    setReasonError(null);
    setHideTarget(row);
  };

  const hide = async () => {
    if (!hideTarget) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError("숨김 사유를 입력해주세요");
      return;
    }
    const target = hideTarget;
    setHideTarget(null);
    setBusyId(target.id);
    // TODO(Task 009-1): admin_set_event_hidden(target.id, true, trimmed) RPC
    await wait();
    updateRow(target.id, { hidden: true, hidden_reason: trimmed });
    setBusyId(null);
    toast.success(`‘${target.title}’을(를) 숨겼습니다`);
  };

  const restore = async (row: AdminEventRow) => {
    setBusyId(row.id);
    // TODO(Task 009-1): admin_set_event_hidden(row.id, false, null) RPC
    await wait();
    updateRow(row.id, { hidden: false, hidden_reason: null });
    setBusyId(null);
    toast.success(`‘${row.title}’을(를) 다시 공개했습니다`);
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusyId(target.id);
    // TODO(Task 009-1): 관리자 권한으로 events 행 delete (RLS에 is_admin() 허용 추가)
    await wait();
    setRows((prev) => prev.filter((row) => row.id !== target.id));
    setBusyId(null);
    toast.success(`‘${target.title}’을(를) 삭제했습니다`);
  };

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        조건에 맞는 이벤트가 없습니다
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableCaption className="sr-only">전체 이벤트 목록</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">제목</TableHead>
            <TableHead scope="col" className="hidden md:table-cell">
              주최자
            </TableHead>
            <TableHead scope="col" className="hidden sm:table-cell">
              일시
            </TableHead>
            <TableHead scope="col" className="hidden text-right md:table-cell">
              응답
            </TableHead>
            <TableHead scope="col">상태</TableHead>
            <TableHead scope="col" className="w-12">
              <span className="sr-only">작업</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} aria-busy={busyId === row.id}>
              <TableCell className="w-full max-w-0">
                <Link
                  href={`/events/${row.id}`}
                  className="line-clamp-2 break-words font-medium underline-offset-4 hover:underline"
                >
                  {row.title}
                </Link>
                {row.hidden && row.hidden_reason && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    사유: {row.hidden_reason}
                  </p>
                )}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap md:table-cell">
                {row.host_name}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                {row.starts_at_label}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">
                {row.rsvp_total}
              </TableCell>
              <TableCell>
                <Badge
                  variant={row.hidden ? "destructive" : "secondary"}
                  className="whitespace-nowrap"
                >
                  {row.hidden ? "숨김" : "공개"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busyId === row.id}
                      aria-label={`‘${row.title}’ 작업`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {row.hidden ? (
                      <DropdownMenuItem onSelect={() => restore(row)}>
                        <RotateCcw />
                        다시 공개
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => openHideDialog(row)}>
                        <EyeOff />
                        숨기기
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setDeleteTarget(row)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 />
                      강제 삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={hideTarget !== null}
        onOpenChange={(open) => !open && setHideTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이벤트 숨기기</DialogTitle>
            <DialogDescription>
              ‘{hideTarget?.title}’은(는) 주최자와 관리자만 볼 수 있게 되고, 새
              응답을 받지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="hidden-reason">
              숨김 사유
              <span className="text-destructive" aria-hidden="true">
                {" "}
                *
              </span>
            </Label>
            <Textarea
              id="hidden-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError(null);
              }}
              maxLength={HIDDEN_REASON_MAX}
              placeholder="예: 외부 홍보 링크 포함"
              aria-required="true"
              aria-invalid={reasonError !== null}
              aria-describedby={reasonError ? "hidden-reason-error" : undefined}
            />
            <p
              id="hidden-reason-error"
              aria-live="polite"
              className="text-sm font-medium text-destructive"
            >
              {reasonError}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHideTarget(null)}>
              취소
            </Button>
            <Button onClick={hide}>숨기기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              ‘{deleteTarget?.title}’과(와) 모든 응답 내역이 삭제되며 되돌릴 수
              없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
