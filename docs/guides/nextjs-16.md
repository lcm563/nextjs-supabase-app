# Next.js 16 개발 지침

이 문서는 Claude Code에서 Next.js 16 프로젝트를 개발할 때 따라야 할 핵심 규칙과 가이드라인을 제공합니다.

## 🚀 필수 규칙 (엄격 준수)

### App Router 아키텍처

```typescript
// ✅ 올바른 방법: App Router 사용
app/
├── layout.tsx          // 루트 레이아웃
├── page.tsx           // 메인 페이지
├── loading.tsx        // 로딩 UI
├── error.tsx          // 에러 UI
├── not-found.tsx      // 404 페이지
└── dashboard/
    ├── layout.tsx     // 대시보드 레이아웃
    └── page.tsx       // 대시보드 페이지

// ❌ 금지: Pages Router 사용
pages/
├── index.tsx
└── dashboard.tsx
```

### Server Components 우선 설계

```typescript
// 🚀 필수: 기본적으로 모든 컴포넌트는 Server Components
export default async function UserDashboard() {
  // 서버에서 데이터 가져오기
  const user = await getUser()

  return (
    <div>
      <h1>{user.name}님의 대시보드</h1>
      {/* 클라이언트 컴포넌트가 필요한 경우에만 분리 */}
      <InteractiveChart data={user.analytics} />
    </div>
  )
}

// ✅ 클라이언트 컴포넌트는 최소한으로 사용
'use client'

import { useState } from 'react'

export function InteractiveChart({ data }: { data: Analytics[] }) {
  const [selectedRange, setSelectedRange] = useState('week')
  // 상호작용 로직만 클라이언트에서 처리
  return <Chart data={data} range={selectedRange} />
}
```

### 🔄 New: async request APIs 처리

```typescript
// 🔄 Next.js 16 새로운 방식
import { cookies, headers } from 'next/headers'

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // 🚀 필수: async request APIs 올바른 처리
  const { id } = await params
  const query = await searchParams
  const cookieStore = await cookies()
  const headersList = await headers()

  const user = await getUser(id)

  return <UserProfile user={user} />
}

// ❌ 금지: 동기식 접근 (Next.js 16에서 완전히 제거됨)
export default function Page({ params }: { params: { id: string } }) {
  const user = getUser(params.id) // 에러 발생
  return <UserProfile user={user} />
}
```

### Typed Routes 활용

```typescript
// 🚀 필수: Typed Routes로 타입 안전성 보장
import Link from 'next/link'

// next.config.ts에서 typedRoutes: true 설정 필요 (현재 프로젝트에는 미설정)
export function Navigation() {
  return (
    <nav>
      {/* ✅ 타입 안전한 링크 */}
      <Link href="/dashboard/users/123">사용자 상세</Link>
      <Link href={{
        pathname: '/products/[id]',
        params: { id: 'abc' }
      }}>제품 상세</Link>

      {/* ❌ 컴파일 에러: 존재하지 않는 경로 */}
      <Link href="/nonexistent-route">잘못된 링크</Link>
    </nav>
  )
}
```

## ✅ 권장 사항 (성능 최적화)

### Streaming과 Suspense 활용

```typescript
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <h1>대시보드</h1>

      {/* ✅ 빠른 컨텐츠는 즉시 렌더링 */}
      <QuickStats />

      {/* ✅ 느린 컨텐츠는 Suspense로 감싸기 */}
      <Suspense fallback={<SkeletonChart />}>
        <SlowChart />
      </Suspense>

      <Suspense fallback={<SkeletonTable />}>
        <SlowDataTable />
      </Suspense>
    </div>
  )
}

async function SlowChart() {
  // 무거운 데이터 처리
  await new Promise(resolve => setTimeout(resolve, 2000))
  const data = await getComplexAnalytics()

  return <Chart data={data} />
}
```

### 🔄 New: after() API 활용

```typescript
import { after } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  // 즉시 응답 반환
  const result = await processUserData(body);

  // 🔄 비블로킹 작업은 after()로 처리
  after(async () => {
    await sendAnalytics(result);
    await updateCache(result.id);
    await sendNotification(result.userId);
  });

  return Response.json({ success: true, id: result.id });
}
```

### 캐싱 전략 (Cache Components)

이 프로젝트는 `next.config.ts`에서 `cacheComponents: true`를 사용합니다. 이 모드에서는 `'use cache'` 디렉티브로 **명시적으로 캐시를 선택(opt-in)** 합니다.

```typescript
import { cacheLife, cacheTag } from "next/cache";

// ✅ 'use cache' + cacheLife + cacheTag로 세밀한 캐시 제어
export async function getProductData(id: string) {
  "use cache";
  cacheLife("hours"); // 내장 프로필 또는 next.config.ts의 cacheLife 커스텀 프로필
  cacheTag(`product-${id}`, "products"); // 태그 기반 무효화

  const res = await fetch(`https://api.example.com/products/${id}`);
  return res.json();
}

// 캐시 무효화 (Server Action 등에서 호출)
import { revalidateTag } from "next/cache";

export async function updateProduct(id: string, data: ProductData) {
  await updateDatabase(id, data);

  // 관련 캐시 무효화 (cacheTag로 지정한 태그)
  revalidateTag(`product-${id}`, "max");
  revalidateTag("products", "max");
}
```

**⚠️ Supabase 사용 시 주의:**

- `cookies()` 등 요청 시점 데이터에 의존하는 코드(예: `lib/supabase/server.ts`의 `createClient()`)는 `'use cache'` 내부에서 사용할 수 없습니다. 인증이 필요한 데이터는 캐시하지 말고 `<Suspense>` 안에서 요청 시점에 가져오세요.
- 사용자와 무관한 공개 데이터만 `'use cache'`로 캐시하세요.

### Turbopack 설정

Next.js 16에서 Turbopack은 `next dev`와 `next build`의 **기본 번들러**입니다(별도 `--turbopack` 플래그 불필요). 설정은 `experimental.turbo`가 아니라 **최상위 `turbopack`** 옵션을 사용합니다.

```typescript
// next.config.ts (현재 프로젝트 설정)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

```typescript
// 필요할 때만 추가하는 옵션 예시
const nextConfig: NextConfig = {
  cacheComponents: true,
  // ✅ Turbopack 전용 설정은 최상위 turbopack 옵션 (experimental.turbo 아님)
  turbopack: {
    // resolveAlias, rules 등
  },
  experimental: {
    // 🔄 패키지 import 최적화
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};
```

## ⚠️ Breaking Changes 대응

### React 19 호환성

```typescript
// ⚠️ React 19에서 변경된 사항들

// ✅ 새로운 방식: useFormStatus 훅
'use client'

import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? '제출 중...' : '제출'}
    </button>
  )
}

// ✅ Server Actions와 form 통합
export async function createUser(formData: FormData) {
  'use server'

  const name = formData.get('name') as string
  const email = formData.get('email') as string

  await saveUser({ name, email })
  redirect('/users')
}

export default function UserForm() {
  return (
    <form action={createUser}>
      <input name="name" required />
      <input name="email" type="email" required />
      <SubmitButton />
    </form>
  )
}
```

### Proxy (`proxy.ts`) — middleware 대체

Next.js 16에서 `middleware.ts`는 **`proxy.ts`로 이름이 바뀌었고**(export 함수도 `middleware` → `proxy`), 런타임은 **`nodejs`로 고정**되어 설정할 수 없습니다(Edge 런타임 미지원).

이 프로젝트는 루트 `proxy.ts`가 `lib/supabase/proxy.ts`의 `updateSession()`을 호출해 Supabase 세션을 갱신하고 인증을 확인합니다.

```typescript
// proxy.ts (프로젝트 루트)
import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일, 이미지 최적화, 파비콘, 이미지 확장자는 제외
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**⚠️ Supabase 주의사항** (`lib/supabase/proxy.ts`):

- `createServerClient`와 `supabase.auth.getClaims()` 사이에 다른 코드를 넣지 않습니다.
- 새 `NextResponse`를 만들면 반드시 쿠키를 복사합니다.
- 공개 경로(`/`, `/login*`, `/auth/*`) 외에는 `/auth/login`으로 리다이렉트합니다.

### 🔄 New: unauthorized/forbidden API (실험적)

`unauthorized()`/`forbidden()`은 `next/navigation`에서 import 하며, `next.config.ts`에 `experimental.authInterrupts: true`를 켜야 합니다(현재 프로젝트에는 미설정). 호출하면 값을 반환하지 않고 **예외를 던져** `unauthorized.tsx`/`forbidden.tsx` UI를 렌더링합니다.

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: { authInterrupts: true },
};
```

```typescript
// app/admin/page.tsx
import { unauthorized, forbidden } from "next/navigation";

export default async function AdminPage() {
  const session = await getSession();

  // 🔄 로그인하지 않은 경우 401 UI (unauthorized.tsx)
  if (!session) {
    unauthorized();
  }

  // 🔄 권한이 없는 경우 403 UI (forbidden.tsx)
  if (!session.user.isAdmin) {
    forbidden();
  }

  return <AdminDashboard />;
}
```

## 🔄 New Features 활용

### Route Groups 고급 패턴

```typescript
// ✅ Route Groups로 레이아웃 분리
app/
├── (marketing)/
│   ├── layout.tsx     // 마케팅 레이아웃
│   ├── page.tsx       // 홈페이지
│   └── about/
│       └── page.tsx   // 소개 페이지
├── (dashboard)/
│   ├── layout.tsx     // 대시보드 레이아웃
│   └── analytics/
│       └── page.tsx   // 분석 페이지
└── (auth)/
    ├── login/
    │   └── page.tsx
    └── register/
        └── page.tsx

// (marketing)/layout.tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="marketing-layout">
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  )
}
```

### Parallel Routes 활용

```typescript
// ✅ Parallel Routes로 동시 렌더링
app/
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── @analytics/
│   │   └── page.tsx
│   └── @notifications/
│       └── page.tsx

// dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  notifications,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  notifications: React.ReactNode
}) {
  return (
    <div className="dashboard-grid">
      <main>{children}</main>
      <aside className="analytics-panel">
        <Suspense fallback={<AnalyticsSkeleton />}>
          {analytics}
        </Suspense>
      </aside>
      <div className="notifications-panel">
        <Suspense fallback={<NotificationsSkeleton />}>
          {notifications}
        </Suspense>
      </div>
    </div>
  )
}
```

### Intercepting Routes

```typescript
// ✅ Intercepting Routes로 모달 구현
app/
├── gallery/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx    // 전체 페이지 보기
└── @modal/
    └── (.)gallery/
        └── [id]/
            └── page.tsx // 모달 보기

// @modal/(.)gallery/[id]/page.tsx
import { Modal } from '@/components/modal'

export default async function PhotoModal({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const photo = await getPhoto(id)

  return (
    <Modal>
      <img src={photo.url} alt={photo.title} />
    </Modal>
  )
}
```

## ❌ 금지 사항

### Pages Router 사용 금지

```typescript
// ❌ 절대 금지: Pages Router 패턴
pages/
├── _app.tsx
├── _document.tsx
├── index.tsx
└── api/
    └── users.ts

// ❌ 금지: getServerSideProps, getStaticProps 사용
export async function getServerSideProps() {
  // 이 방식은 사용하지 마세요
}
```

### 안티패턴 방지

```typescript
// ❌ 금지: 불필요한 'use client' 사용
'use client'

export default function SimpleComponent({ title }: { title: string }) {
  // 상태나 이벤트 핸들러가 없는데 'use client' 사용
  return <h1>{title}</h1>
}

// ✅ 올바른 방법: Server Component로 유지
export default function SimpleComponent({ title }: { title: string }) {
  return <h1>{title}</h1>
}

// ❌ 금지: 클라이언트에서 서버 함수 직접 호출
'use client'

import { getUser } from '@/lib/database' // 서버 전용 함수

export function UserProfile() {
  const user = getUser() // 에러 발생
  return <div>{user.name}</div>
}

// ✅ 올바른 방법: 서버에서 데이터 전달
export default async function UserPage() {
  const user = await getUser()
  return <UserProfile user={user} />
}

function UserProfile({ user }: { user: User }) {
  return <div>{user.name}</div>
}
```

## 코드 품질 체크리스트

개발 완료 후 다음 명령어들을 반드시 실행하세요:

```bash
# 🚀 필수: 타입 체크
npm run typecheck

# 🚀 필수: 린트 검사
npm run lint

# ✅ 권장: 포맷 검사
npm run format:check

# 🚀 필수: 통합 검사
npm run check-all

# 🚀 필수: 빌드 테스트
npm run build
```

이 지침을 따라 Next.js 16의 모든 기능을 최대한 활용하여 현대적이고 성능 최적화된 애플리케이션을 개발하세요.
