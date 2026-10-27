"use client";

import { setUserRole } from "@/app/admin/actions";
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AUTH_PROVIDER_LABELS } from "@/lib/auth/providers";
import type { AdminUserRow, UserRole } from "@/types/admin";
import { useState } from "react";
import { toast } from "sonner";

export type AdminUserTableRow = Omit<
  AdminUserRow,
  "created_at" | "last_sign_in_at"
> & {
  /** 서버에서 formatDateTime으로 만든 표시 문자열 */
  created_at_label: string;
  last_sign_in_label: string | null;
};

const LAST_ADMIN_NOTE_ID = "last-admin-note";

// 사용자 관리 표 (역할 변경)
export function AdminUserTable({
  rows: initialRows,
  totalAdmins,
}: {
  rows: AdminUserTableRow[];
  /** 검색과 무관한 전체 관리자 수 (마지막 관리자 해제 방지) */
  totalAdmins: number;
}) {
  const [rows, setRows] = useState(initialRows);
  const [adminCount, setAdminCount] = useState(totalAdmins);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [target, setTarget] = useState<AdminUserTableRow | null>(null);
  const isLastAdmin = adminCount <= 1;

  const changeRole = async () => {
    if (!target) return;
    const user = target;
    const nextRole: UserRole = user.role === "admin" ? "user" : "admin";
    setTarget(null);
    setBusyId(user.id);
    // 마지막 관리자 해제는 DB에서도 LAST_ADMIN으로 거부한다
    const result = await setUserRole({ user_id: user.id, role: nextRole });
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    setRows((prev) =>
      prev.map((row) => (row.id === user.id ? { ...row, role: nextRole } : row))
    );
    setAdminCount((count) => count + (nextRole === "admin" ? 1 : -1));
    toast.success(
      nextRole === "admin"
        ? `${user.display_name}님을 관리자로 지정했습니다`
        : `${user.display_name}님의 관리자 권한을 해제했습니다`
    );
  };

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        조건에 맞는 사용자가 없습니다
      </p>
    );
  }

  return (
    <>
      {isLastAdmin && (
        <p id={LAST_ADMIN_NOTE_ID} className="text-sm text-muted-foreground">
          마지막 관리자는 해제할 수 없습니다
        </p>
      )}
      <Table>
        <TableCaption className="sr-only">사용자 목록</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">사용자</TableHead>
            <TableHead scope="col" className="hidden sm:table-cell">
              가입 방식
            </TableHead>
            <TableHead scope="col" className="hidden md:table-cell">
              가입일
            </TableHead>
            <TableHead scope="col" className="hidden md:table-cell">
              최근 로그인
            </TableHead>
            <TableHead scope="col">역할</TableHead>
            <TableHead scope="col">
              <span className="sr-only">작업</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isAdmin = row.role === "admin";
            const locked = isAdmin && isLastAdmin;
            return (
              <TableRow key={row.id} aria-busy={busyId === row.id}>
                <TableCell className="w-full max-w-0">
                  <p className="truncate font-medium">{row.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.email ?? "이메일 없음"}
                  </p>
                  {/* 좁은 화면에서는 가입 방식 열 대신 이름 아래 표시 */}
                  <p className="text-xs text-muted-foreground sm:hidden">
                    {AUTH_PROVIDER_LABELS[row.provider]}
                  </p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="whitespace-nowrap">
                    {AUTH_PROVIDER_LABELS[row.provider]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                  {row.created_at_label}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                  {row.last_sign_in_label ?? "기록 없음"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isAdmin ? "default" : "secondary"}
                    className="whitespace-nowrap"
                  >
                    {isAdmin ? "관리자" : "일반"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                    // 마지막 관리자: disabled 대신 aria-disabled로 포커스를 남겨 사유가 읽히게 한다
                    disabled={busyId === row.id}
                    aria-disabled={locked || undefined}
                    aria-describedby={locked ? LAST_ADMIN_NOTE_ID : undefined}
                    onClick={() => !locked && setTarget(row)}
                  >
                    {isAdmin ? "해제" : "관리자 지정"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {target?.role === "admin"
                ? "관리자 권한을 해제할까요?"
                : "관리자로 지정할까요?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {target?.role === "admin"
                ? `${target?.display_name}님은 더 이상 관리자 화면에 접근할 수 없습니다.`
                : `${target?.display_name}님이 모든 이벤트·사용자·신고를 관리할 수 있게 됩니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={changeRole}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
