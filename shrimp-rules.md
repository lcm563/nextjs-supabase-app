# Development Guidelines

## Project Overview

- Product: 모임 이벤트 관리 웹 MVP (공지 + 참석 응답 관리). Source of truth: `docs/PRD.md`, `docs/ROADMAP.md`, `CLAUDE.md`.
- Stack: Next.js 16 (App Router, `cacheComponents` enabled), Supabase (`@supabase/ssr`), Tailwind CSS v3, shadcn/ui (new-york), next-themes, lucide-react, TypeScript strict.
- Domain: `profiles`, `events`, `rsvps`. RSVP status values: `going | not_going | maybe | waitlist`.
- **MVP excludes**: 카풀, 정산, 푸시/이메일 알림, 자동 반복 일정, Group. DO NOT implement them.

## Directory Map

| Path                                    | Role                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `app/`                                  | Routes (App Router). Existing: `/`, `/auth/*`, `/events/**`                                                      |
| `app/events/**`                         | `/events`, `/events/new`, `/events/[id]`, `/events/[id]/edit`; Server Actions in `actions.ts`                    |
| `app/admin/**`                          | Admin screens (dashboard, events, users, reports). Gate = DB `is_admin()`; writes in `app/admin/actions.ts`      |
| `components/ui/`                        | shadcn/ui primitives ONLY                                                                                        |
| `components/`                           | Domain/shared components (kebab-case filenames)                                                                  |
| `lib/supabase/{server,client,proxy}.ts` | Three Supabase clients (see Supabase Rules)                                                                      |
| `lib/utils.ts`                          | `cn()`, `hasEnvVars`                                                                                             |
| `lib/supabase/database.types.ts`        | Generated types (regenerate after every schema change). DO NOT edit by hand                                      |
| `lib/queries/`                          | Server-only read layer (`events.ts`, `admin.ts`): maps DB rows / admin RPCs to view models                       |
| `lib/storage/event-covers.ts`           | Cover image Storage path / owner check / public URL helpers                                                      |
| `types/`                                | Domain types (`event`, `rsvp`, `admin`) and `ActionResult` (`action`)                                            |
| `lib/validations/`                      | zod schemas, KST ↔ UTC (`kstLocalToIso`, `isoToKstLocal`)                                                        |
| `lib/format.ts`, `lib/event-status.ts`  | KST display formatting; `getEventPhase(event, now)`, RSVP labels                                                 |
| `lib/safe-next.ts`                      | `sanitizeNext()` — the ONLY way to validate `next` redirect values                                               |
| `lib/auth/`                             | Auth constants (`SOCIAL_PROVIDERS`, `LOGIN_SOCIAL_PROVIDERS`, `isSocialProviderEnabled`, `AUTH_PROVIDER_LABELS`) |
| `proxy.ts` (root)                       | Calls `updateSession()`. Next.js 16: NEVER create `middleware.ts`                                                |
| `docs/guides/`                          | Read the matching guide before the related work                                                                  |
| `shrimp_data/`                          | Task manager data. DO NOT edit manually                                                                          |

## Code Standards

- Use `@/` alias for imports (project root). DO NOT use deep relative paths across directories.
- Files: kebab-case. Components: PascalCase exports. Default to Server Components; add `"use client"` only when state/effects/event handlers/browser APIs are required.
- Compose classNames with `cn()` from `@/lib/utils`. Tailwind v3 syntax only (config in `tailwind.config.ts`). DO NOT use Tailwind v4 syntax (`@import "tailwindcss"`, `@theme`).
- Prettier (`prettier-plugin-tailwindcss`) and ESLint flat config are authoritative. DO NOT hand-sort Tailwind classes.
- Write UI copy and code comments in Korean, matching existing docs. Identifiers in English.
- Mobile first: every P0 screen MUST work at 360px width. Support dark mode via CSS variables/tokens; DO NOT hardcode colors.

## Supabase Rules

- Server Components / Route Handlers / Server Actions: `import { createClient } from "@/lib/supabase/server"`; call `await createClient()` **inside each function**. NEVER store the client in a module-level variable.
- Client Components: `import { createClient } from "@/lib/supabase/client"`.
- `lib/supabase/proxy.ts`:
  - NEVER add code between `createServerClient(...)` and `supabase.auth.getClaims()`.
  - NEVER remove `getClaims()`.
  - When creating a new `NextResponse`, pass `request` and copy cookies.
  - Preserve original path as `next` query param on redirect to `/auth/login`; accept only internal paths starting with a single `/` (reject `//` and absolute URLs) to block open redirects.
  - Remove the `/instruments` public-path remnants (Task 001). Public paths after cleanup: `/`, `/login*`, `/auth/*`.
- Auth check in server code: use `supabase.auth.getClaims()`; re-verify host ownership server-side for edit/delete (never trust client input).
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. DO NOT commit `.env*` or secrets. DO NOT use service-role key in client code.

## Database Rules

- Schema changes ONLY via Supabase MCP `apply_migration`. DO NOT run DDL via `execute_sql`.
- New `public` tables get NO default privileges for `anon`/`authenticated` in this project. Every migration that adds a table/column MUST also GRANT the minimum privileges (column-level for INSERT/UPDATE). NEVER grant TRUNCATE.
- Every table MUST have RLS enabled. Policies per PRD §7: profiles (self write), events (authenticated read, host write), rsvps (authenticated read, self write); `rsvps` has `unique(event_id, user_id)`.
- Capacity check, waitlist assignment, and waitlist promotion MUST run in a DB function (RPC) or trigger inside a transaction. DO NOT implement in app code with read-then-write.
- `profiles` row creation: `auth.users` insert trigger.
- After every schema change, in order: `get_advisors` (security + performance) → fix findings → `generate_typescript_types` → save to `lib/supabase/database.types.ts`.
- Indexes required: `rsvps(event_id)`, `events(host_id, starts_at)`.
- Reports (`event_reports`): uniqueness is ONLY for `open` reports (partial unique index `event_reports_open_unique`). DO NOT restore `unique (event_id, reporter_id)` — closed reports must not block a new report. Status changes go through admin RPCs only; hiding → `open`→`resolved`, restoring → `resolved`→`dismissed`, so event visibility and report status never disagree.

## Feature Implementation Rules

- Mutations (create/update/delete event, RSVP change) use Server Actions. Validate input with zod server-side. Return the shared result type defined in `types/` (do not invent per-action shapes).
- After a mutation, refresh UI with `revalidatePath` or cache tag invalidation.
- NEVER swallow an error into `null`/a generic message without logging it. Cover upload (`components/event-form.tsx`) maps Storage errors with `coverUploadErrorMessage()` (`lib/storage/event-covers.ts`) and `console.error`s the raw `status`/`statusCode`/`message`. A Storage error without `status` means the request never reached Supabase (network / security software); confirm with edge logs (`OPTIONS` present, `POST` missing).
- Event detail page (`/events/[id]`) renders as Server Component; only interactive pieces (`RsvpButtons`, `ShareLinkButton`, delete dialog) are Client Components.
- Share link target is `/events/[id]`. Non-existent ID → `notFound()`.
- Block RSVP changes after `rsvp_deadline` or after the event ended (F-12, F-14), both in UI and server action.
- Forms: react-hook-form + zod v4 + `@hookform/resolvers` v5 (installed). Read `docs/guides/forms-react-hook-form.md` first. DO NOT add other form libraries.
- New route segments MUST include `loading.tsx`, `error.tsx` where data is fetched; add `not-found.tsx` for `[id]` routes.
- Next.js 16 / Cache Components: read `docs/guides/nextjs-16.md` before using `use cache`, `params`/`searchParams` (async), or dynamic APIs.

## UI Rules

- Add shadcn components with `npx shadcn@latest add <name>` (or shadcn MCP). DO NOT hand-write files in `components/ui/`. Config: `components.json`.
- Domain components live in `components/` (`EventCard`, `EventForm`, `EventCover`, `RsvpButtons`, `AttendeeList`, `CapacityBadge`, `ShareLinkButton`, `DeleteEventDialog`, `SocialLoginButtons`, landing: `LandingPreview`, `LandingActions`).
- Landing (`/`): keep it Partial Prerender. Only login-dependent parts (`components/landing-actions.tsx`) read the session, each inside its own `<Suspense>` after `await connection()`. Never show sign-up/login CTAs to a logged-in user. Landing copy must match real behavior (participants must log in to respond); structure is in `docs/PRD.md` §6 "랜딩 구성".
- Read `docs/guides/component-patterns.md` and `docs/guides/styling-guide.md` before building components.
- All screens read via `lib/queries/` and write via Server Actions. There is no mock data layer (`lib/mock/` was deleted in Task 009-1); DO NOT reintroduce dummy data or simulated delays.
- `profiles.role` and `events.hidden_*` are NOT selectable by `authenticated`. NEVER `select("*")` on `events`/`profiles`; list columns (`EVENT_COLUMNS`) and read hidden state via `getHiddenStates()`, admin status via `getIsAdmin()`.
- Colors: use theme tokens only (`bg-primary`, `text-destructive`, `text-muted-foreground`, …). DO NOT use raw palette classes (`text-red-500`). Theme = tweakcn Clean Slate in `app/globals.css` (HSL, AA-adjusted); keep every text/background pair ≥ 4.5:1.

## Multi-file Coordination

| When you change                                           | Also update                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| DB schema / migration                                     | `lib/supabase/database.types.ts`, `types/`, zod schemas, `docs/PRD.md` §7 |
| Public/protected route set                                | `lib/supabase/proxy.ts`, `CLAUDE.md` "공개 경로" line                     |
| Task completed                                            | `docs/ROADMAP.md` (mark ✅) — use `/docs:update-roadmap`                  |
| Scope/feature requirement                                 | `docs/PRD.md` AND `docs/ROADMAP.md` (PRD 요구사항 매핑 table)             |
| Dependencies, scripts, tooling                            | `CLAUDE.md` tech stack / command sections                                 |
| New route                                                 | Navigation component, matching `loading/error/not-found` files            |
| Auth flow (`login-form`, `sign-up-form`, `/auth/confirm`) | Apply `next` param handling consistently in all three                     |

## Workflow

- Follow ROADMAP order (Task 001 → 010). Do one Task at a time.
- API/business-logic tasks: test with Playwright MCP (E2E scenarios in a "## 테스트 체크리스트" section of the task).
- Browser testing that needs login: the linked Supabase project has only the user's own accounts (see `CLAUDE.md`). DO NOT create accounts or try other credentials; ask the user to log in in the Playwright window. Admin screens: log in as the admin account (`lcm563@naver.com`). Non-admin checks: the user accounts (`lcm563@kakao.com`, or the email-signup test account `cmlucky.lee@gmail.com`) or one rolled-back SQL call with `request.jwt.claims`/`role` set. After role-change tests, confirm the first admin is still admin. Audit script: `.playwright-mcp/audit-phase3.js` (set the event ids at the top first).
- Completion gate after each task: `npm run check-all` AND `npm run build` must pass. Then stop and wait for user instruction.
- Git: pre-commit runs lint-staged; pre-push runs `npm run typecheck`. DO NOT use `--no-verify`. Commit messages follow `.claude/commands/git/commit.md` (emoji + conventional). Commit only when asked.

## AI Decision Rules

- Ambiguous requirement → check `docs/PRD.md` first, then `docs/ROADMAP.md`; PRD wins on behavior, ROADMAP wins on order.
- Feature not in PRD §4 "포함" → treat as out of scope; do not implement.
- Choosing client: server code → `lib/supabase/server.ts`; browser → `lib/supabase/client.ts`; request interception → `lib/supabase/proxy.ts` only.
- Component needs state? No → Server Component. Yes → smallest possible Client Component leaf.
- Need DB atomicity (capacity, promotion)? → RPC/trigger, never app code.
- Task spec in `docs/ROADMAP.md` conflicts with `CLAUDE.md` → follow `CLAUDE.md`, report conflict.

## Prohibited

- Creating `middleware.ts`.
- Global/module-level Supabase client instances.
- Code between `createServerClient` and `getClaims()` in `lib/supabase/proxy.ts`.
- Tables without RLS; DDL through `execute_sql`; skipping `get_advisors`.
- Implementing 카풀/정산/알림/Group or Naver login in MVP (post-MVP roadmap; the Naver button stays hidden via `HIDDEN_SOCIAL_PROVIDERS`).
- Editing `components/ui/*` by hand, `shrimp_data/*`, or `package-lock.json` by hand.
- Adding Tailwind v4 syntax or new styling libraries.
- Redirecting to unvalidated `next` values.
- Committing secrets or `.env.local`.
- Calling a task done without passing `npm run check-all` and `npm run build`.
