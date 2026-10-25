"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // 전체 페이지 이동: 숨겨진 이전 화면(Activity)과 라우터 캐시를 모두 버린다 (user-menu.tsx와 동일)
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 클라이언트 이동은 숨겨진 화면 상태를 남기므로 의도적으로 전체 이동
    window.location.assign("/auth/login");
  };

  return <Button onClick={logout}>Logout</Button>;
}
