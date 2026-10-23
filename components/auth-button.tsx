import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";

// 요청 시점의 인증 정보를 읽으므로 반드시 <Suspense> 안에서 렌더링
export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <UserMenu email={user.email ?? ""} />
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">로그인</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">회원가입</Link>
      </Button>
    </div>
  );
}
