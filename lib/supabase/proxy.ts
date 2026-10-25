import type { Database } from "@/lib/supabase/database.types";
import { createServerClient } from "@supabase/ssr";
import { sanitizeNext } from "@/lib/safe-next";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

// 로그인 없이 접근할 수 있는 경로: /, /login*, /auth/*
function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 환경 변수가 없으면 인증을 확인할 수 없다.
  // 개발 중에는 설정 전 화면 확인을 위해 통과시키고, 프로덕션에서는 보호 경로를 막는다(fail-closed).
  if (!hasEnvVars) {
    if (
      process.env.NODE_ENV === "production" &&
      !isPublicPath(request.nextUrl.pathname)
    ) {
      return new NextResponse("서비스 설정이 완료되지 않았습니다", {
        status: 503,
      });
    }
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    // 로그인 후 원래 화면으로 돌아오도록 경로+쿼리를 next로 보존한다 (PRD F-05)
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    url.searchParams.set(
      "next",
      sanitizeNext(request.nextUrl.pathname + request.nextUrl.search)
    );
    const redirectResponse = NextResponse.redirect(url);
    // getClaims()가 갱신·삭제한 세션 쿠키를 리다이렉트 응답에도 옮긴다
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
