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
import { CircleUser, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";

type UserMenuProps = {
  email: string;
  /** 서버에서 is_admin()으로 판정한 값 */
  isAdmin: boolean;
};

// 로그인 사용자 메뉴: 모바일에서는 헤더 네비게이션 링크도 이 메뉴에서 제공
export function UserMenu({ email, isAdmin }: UserMenuProps) {
  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // 전체 페이지 이동: 숨겨진 이전 화면(Activity)과 라우터 캐시에 남은
    // 로그인 입력값·이전 사용자 데이터를 메모리에서 모두 버린다
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 클라이언트 이동은 숨겨진 화면 상태를 남기므로 의도적으로 전체 이동
    window.location.assign("/auth/login");
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOut />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
