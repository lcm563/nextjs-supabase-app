"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setMockRole } from "@/lib/mock/role-actions";
import { CircleUser, LogOut, ShieldCheck, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type UserMenuProps = {
  email: string;
  isAdmin: boolean;
  /** 개발 모드에서만 true: 역할 전환 토글 표시 (TODO(Task 009-1): 삭제) */
  showRoleSwitch: boolean;
};

// 로그인 사용자 메뉴: 모바일에서는 헤더 네비게이션 링크도 이 메뉴에서 제공
export function UserMenu({ email, isAdmin, showRoleSwitch }: UserMenuProps) {
  const router = useRouter();

  const switchRole = async () => {
    await setMockRole(isAdmin ? "user" : "admin");
    router.refresh();
    toast.success(
      isAdmin ? "일반 사용자로 전환했습니다" : "관리자로 전환했습니다"
    );
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="사용자 메뉴">
          <CircleUser className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/events">내 이벤트</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/events/new">이벤트 만들기</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck />
              관리자
            </Link>
          </DropdownMenuItem>
        )}
        {showRoleSwitch && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={switchRole}>
              <UserCog />
              {isAdmin ? "일반 사용자로 보기" : "관리자로 보기"} (개발용)
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOut />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
