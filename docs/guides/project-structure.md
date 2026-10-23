# 프로젝트 구조 가이드

이 문서는 Next.js 16 프로젝트의 폴더 구조, 파일 조직 및 네이밍 컨벤션을 정의합니다.

## 🏗️ 전체 프로젝트 구조

이 프로젝트는 `src/` 디렉터리를 사용하지 않고 **프로젝트 루트에 `app/`, `components/`, `lib/`를 둡니다.**

```
nextjs-supabase-app/
├── app/                    # 📱 App Router (페이지, 레이아웃, 라우트 핸들러)
├── components/             # 🧩 React 컴포넌트
├── lib/                    # 🛠️ 유틸리티 및 Supabase 클라이언트
├── docs/                   # 📚 프로젝트 문서
│   └── guides/            # 개발 가이드 모음
├── .claude/                # 🤖 Claude Code 에이전트/명령어/훅
├── .husky/                 # 🪝 Git 훅 (pre-commit, pre-push)
├── proxy.ts                # 🔐 Next.js 16 Proxy (인증 세션 갱신/보호)
├── components.json         # shadcn/ui 설정
├── eslint.config.mjs       # ESLint (flat config)
├── lint-staged.config.mjs  # lint-staged 설정
├── next.config.ts          # Next.js 설정 (cacheComponents)
├── tailwind.config.ts      # Tailwind CSS v3 설정
├── tsconfig.json           # TypeScript 설정
├── package.json            # 의존성 및 스크립트
└── CLAUDE.md               # 개발 지침 메인 문서
```

## 📁 세부 폴더 구조

### app/ - App Router 페이지

```
app/
├── layout.tsx              # 🎨 루트 레이아웃 (ThemeProvider, Geist 폰트)
├── page.tsx                # 🏠 홈페이지 (/)
├── globals.css             # 🎨 전역 CSS (Tailwind 지시문 + HSL 변수)
├── favicon.ico             # 🔖 파비콘
├── opengraph-image.png     # 🖼️ OG 이미지
├── twitter-image.png       # 🖼️ Twitter 이미지
├── auth/                   # 🔐 인증 페이지 (공개 경로)
│   ├── login/page.tsx
│   ├── sign-up/page.tsx
│   ├── sign-up-success/page.tsx
│   ├── forgot-password/page.tsx
│   ├── update-password/page.tsx
│   ├── error/page.tsx
│   └── confirm/route.ts    # 이메일 확인 Route Handler
└── protected/              # 🔒 인증 필요 페이지
    ├── layout.tsx
    └── page.tsx
```

**🚀 App Router 규칙:**

- `page.tsx`: 해당 경로의 메인 페이지
- `layout.tsx`: 레이아웃 컴포넌트 (자식 페이지 감쌈)
- `loading.tsx`: 로딩 UI (필요시)
- `error.tsx`: 에러 UI (필요시)
- `not-found.tsx`: 404 페이지 (필요시)

### components/ - 컴포넌트 조직

```
components/
├── ui/                       # 🎛️ shadcn/ui 기본 컴포넌트
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── checkbox.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   └── label.tsx
├── tutorial/                 # 📖 스타터 튜토리얼 컴포넌트 (정리 대상)
├── auth-button.tsx           # 🔐 인증 상태 버튼
├── login-form.tsx            # 🔐 로그인 폼
├── sign-up-form.tsx          # ✍️ 회원가입 폼
├── forgot-password-form.tsx  # 🔑 비밀번호 찾기 폼
├── update-password-form.tsx  # 🔑 비밀번호 변경 폼
├── logout-button.tsx         # 🚪 로그아웃 버튼
├── theme-switcher.tsx        # 🌓 테마 토글
└── ...                       # hero, 로고 등 스타터 컴포넌트
```

**🧩 컴포넌트 분류 규칙:**

1. **ui/**: shadcn/ui 기반 재사용 가능한 기본 컴포넌트
   - 순수 UI 컴포넌트만 포함
   - 비즈니스 로직 없음
   - props로 모든 동작 제어
   - `npx shadcn@latest add`로 추가 (직접 수정 시 재생성 주의)

2. **루트(`components/*.tsx`)**: 기능 단위 컴포넌트 (폼, 버튼 등)

**📚 컴포넌트가 늘어날 때의 확장 규칙 (현재는 없음, 필요 시 생성):**

```
components/
├── layout/            # 🏗️ 레이아웃 컴포넌트 (header, footer, container)
├── navigation/        # 🧭 네비게이션 (main-nav, mobile-nav)
├── sections/          # 📄 페이지 섹션 (hero, features, cta)
└── providers/         # 🔧 Context 프로바이더
```

### lib/ - 유틸리티 및 설정

```
lib/
├── utils.ts            # 🛠️ cn() 헬퍼, hasEnvVars
└── supabase/           # 🗄️ Supabase 클라이언트
    ├── client.ts       # 브라우저(Client Components)용
    ├── server.ts       # Server Components/Route Handlers용
    └── proxy.ts        # Proxy용 updateSession()
```

**📚 lib/ 확장 가이드 (현재는 없음, 필요 시 생성):**

```
lib/
├── constants.ts       # 상수 정의
├── types/             # TypeScript 타입 정의
├── hooks/             # 커스텀 훅
├── schemas/           # Zod 스키마 (zod 설치 후)
└── supabase/
    └── database.types.ts  # Supabase 생성 타입 (아직 없음)
```

## 🏷️ 파일 네이밍 컨벤션

### 파일명 규칙

```bash
# ✅ 올바른 파일명
user-profile.tsx        # kebab-case (권장)
UserProfile.tsx         # PascalCase (컴포넌트)
userProfile.tsx         # camelCase (허용)

# ❌ 잘못된 파일명
user_profile.tsx        # snake_case (금지)
userprofile.tsx         # 소문자만 (금지)
```

### 컴포넌트 네이밍

```typescript
// ✅ 올바른 컴포넌트 네이밍
export function UserProfile() {} // PascalCase
export function LoginForm() {} // PascalCase
export function APIEndpoint() {} // 약어도 PascalCase

// ❌ 잘못된 컴포넌트 네이밍
export function userProfile() {} // camelCase (금지)
export function login_form() {} // snake_case (금지)
```

### 폴더 네이밍

```bash
# ✅ 올바른 폴더명
components/             # 소문자
user-settings/          # kebab-case
api-routes/            # kebab-case

# ❌ 잘못된 폴더명
Components/            # PascalCase (금지)
user_settings/         # snake_case (금지)
```

## 🔗 경로 별칭 (Path Aliases)

`tsconfig.json`의 `paths`에서 `@/*`를 **프로젝트 루트(`./*`)** 로 매핑하며, `components.json`의 shadcn 별칭도 이를 따릅니다:

```typescript
// ✅ 경로 별칭 사용 (권장)
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoginForm } from "@/components/login-form";

// ❌ 상대 경로 사용 (금지)
import { Button } from "../../../components/ui/button";
import { cn } from "../../lib/utils";
```

**📍 정의된 별칭:**

- `@/*` → `./*` (예: `@/components/ui/button` → `components/ui/button.tsx`)
- `@/components` → `components`
- `@/lib` → `lib`
- `@/hooks` → `hooks` (shadcn 별칭, 폴더는 아직 없음)
- `@/components/ui` → `components/ui`
- `@/lib/utils` → `lib/utils.ts`

## 📝 새 파일/폴더 추가 규칙

### 1. 새 UI 컴포넌트 추가

```bash
# shadcn/ui 컴포넌트 추가
npx shadcn@latest add [component-name]

# 커스텀 UI 컴포넌트 추가
components/ui/custom-component.tsx
```

### 2. 새 페이지 추가

```bash
# 정적 페이지
app/about/page.tsx

# 동적 페이지
app/users/[id]/page.tsx

# 그룹 라우트
app/(auth)/login/page.tsx
```

### 3. 새 비즈니스 컴포넌트 추가

```bash
# 위치 결정 기준:
1. 특정 페이지에서만 사용 → 해당 페이지 폴더 내
2. 여러 페이지에서 사용 → components/ 적절한 카테고리
3. 레이아웃 관련 → components/layout/
4. 네비게이션 관련 → components/navigation/
```

### 4. 새 유틸리티 추가

```bash
# 공통 유틸리티
lib/utils.ts            # 기존 파일에 추가

# 특화된 유틸리티
lib/date-utils.ts       # 새 파일 생성
lib/api-utils.ts        # 새 파일 생성
```

## 🎯 코드 조직 베스트 프랙티스

### 1. 단일 책임 원칙

- 하나의 파일은 하나의 주요 기능만 담당
- 관련된 타입과 유틸리티는 같은 파일에 포함 가능

### 2. 의존성 순서

```typescript
// 1. 외부 라이브러리
import React from "react";
import { NextPage } from "next";

// 2. 내부 라이브러리 (@/ 경로)
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 3. 상대 경로
import "./component.css";
```

### 3. Export 규칙

```typescript
// ✅ Named export 사용 (권장)
export function LoginForm() {}

// ✅ Default export (페이지 컴포넌트)
export default function LoginPage() {}

// ❌ 혼재 사용 지양
export function LoginForm() {}
export default LoginForm; // 같은 컴포넌트를 두 방식으로 export
```

### 4. 파일 크기 관리

- 단일 파일: 300줄 이하 권장
- 300줄 초과 시 분할 고려
- 관련 기능별로 분리

## 🚫 금지사항

### ❌ 피해야 할 구조

```bash
# 깊은 중첩 구조 (4단계 이상)
components/pages/auth/forms/login/LoginForm.tsx

# 의미 없는 폴더명
components/misc/
components/common/
components/shared/

# 혼재된 케이스
Components/userProfile/LoginForm.tsx
```

### ❌ 피해야 할 패턴

```typescript
// 거대한 파일
export function SuperMegaComponent() {
  // 500줄 이상의 코드
}

// 혼재된 import
import Button from "@/components/ui/button"; // default
import { Card } from "@/components/ui/card"; // named

// 깊은 상대 경로
import { utils } from "../../../../../lib/utils";
```

## ✅ 체크리스트

새 파일/폴더 추가 시 확인사항:

- [ ] 적절한 카테고리 폴더에 배치
- [ ] kebab-case 파일명 사용
- [ ] PascalCase 컴포넌트명 사용
- [ ] 경로 별칭 사용
- [ ] 단일 책임 원칙 준수
- [ ] 적절한 export 방식 선택
- [ ] 의존성 import 순서 준수
- [ ] 파일 크기 300줄 이하 유지

이 가이드를 따라 일관성 있고 유지보수하기 쉬운 프로젝트 구조를 만들어보세요!
