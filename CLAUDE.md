> Last synced with codebase: `c6ce1f7` (2026-06-27)

# Persevere

Volunteer management platform for Persevere nonprofit (reducing recidivism through tech education).

**Two portals:** `/staff/*` — staff/admin manage volunteers, events, communications | `/volunteer/*` — volunteers browse opportunities, RSVP, track hours.

## Stack

Next.js 15 App Router · TypeScript strict · Drizzle ORM + Neon PostgreSQL · NextAuth.js v4 JWT · Material UI v7 · pnpm · `@/*` → `src/*`

## Before Writing Code

All Claude-reference docs live in `planning/context/`:

- **Domain vocab:** `planning/context/CONTEXT.md` — canonical domain terms (Event, RSVP, Hours, Announcement, etc.)
- **Patterns:** `planning/context/PATTERNS.md` — all recurring implementation patterns with code snippets
- **Architecture:** `planning/context/ARCHITECTURE.md` — source layout, layers, data flow, design decisions
- **UI:** `planning/context/UI.md` — design tokens, component patterns, loading/empty state rules, modal conventions; consult before writing or editing any frontend component

## Verification

`pnpm run check` (ESLint + TypeScript) must pass before every commit.

```bash
pnpm run dev          # Start dev server (Turbopack) at http://localhost:3000
pnpm run build        # Production build
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm run check        # Lint + TypeScript type check (must pass before task is done)
```

## Rules

### Process

- **Before writing any code, check `planning/context/PATTERNS.md` and the Rules below** — find the applicable pattern and follow it exactly. Do not invent a new approach when a pattern already covers the case.
- **Fix violations on sight** — whenever you encounter code that violates any rule in this file or any pattern in `planning/context/PATTERNS.md` (even while working on an unrelated task), fix it immediately in the same edit. If fixing a violation requires a non-trivial change that could affect behavior, note it to the user but still fix it.
- **Always load the relevant skill before starting any task** — use the `Skill` tool proactively, even without being asked:
  - Frontend UI / components / MUI styling → `frontend-design`
  - New feature or significant new functionality → `feature-dev`
  - Bug, test failure, or unexpected behavior → `systematic-debugging`
  - Committing work → `commit`; committing + pushing + opening PR → `commit-push-pr`
  - Code review → `review-code` (which will in turn load domain skills)
  - Multiple independent tasks → `dispatching-parallel-agents`
  - If multiple skills apply, load all of them — they compose.
- **This project uses `CLAUDE.md` as the source of truth for developer instructions.** Tool-specific entry points like `.cursorrules` and `.agents/AGENTS.md` are symbolic links pointing to this file.
- **Before every commit:** update `planning/context/ARCHITECTURE.md`, `planning/context/PATTERNS.md`, and/or `CLAUDE.md` as needed to reflect the changes in the commit — add new entries AND remove or correct stale ones. Then update the `Last synced` line in each file you touched with the new commit hash and today's date.
- **After every commit:** if the work revealed a new pattern, an anti-pattern to avoid, or a rule violation that was fixed, record it in `planning/context/PATTERNS.md` and/or the Rules section of `CLAUDE.md`.
- **Never post comments on GitHub PRs or issues** — report findings directly in the conversation only.

### Auth

- **Never use `requireAuth("staff")`** — it uses strict role equality, so it blocks admins. Use the inline check: `const session = await requireAuth(); if (!["staff", "admin"].includes(session.user.role)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }`.
- **In route handlers, call `requireAuth()` before parsing URL params or reading the request body** — prevents unauthenticated callers from probing resource existence via IDs.
- **Always import `getServerSession` from `@/utils/server/auth`** — never import it directly from `next-auth`.
- **Never match auth errors by string** — use `instanceof AuthError` (server) or `instanceof AuthenticationError` (client).

### Data Access

- **No DB logic in route handlers** — extract to `src/services/`. Routes are: auth → validate → service → response.
- **No data-fetching logic in components** — extract to `src/hooks/`. Hook files have no `"use client"` directive; consuming components add it.
- **Never use raw `fetch()` in client code** — use `apiClient` from `@/lib/api-client`.
- **Never call `apiClient` directly in components** — extract data-fetching and mutations to hooks in `src/hooks/`.
- **Always handle both `AuthenticationError` and `AuthorizationError` in hooks** — `AuthenticationError` (401) → redirect to login. `AuthorizationError` (403) → set inline error state (no redirect).
- **Never write inline `z.enum([...])` for status fields** — import the canonical Zod schemas from `@/lib/status-enums`: `rsvpStatusSchema`, `hoursStatusSchema`, `backgroundCheckStatusSchema`, `opportunityStatusSchema`, `proficiencyLevelSchema` (or `assignableProficiencyLevelSchema` to exclude `"no_selection"`), `notificationPreferenceSchema`, `recipientTypeSchema`. They derive their values from the Drizzle enums, so adding a new enum value updates validators automatically.
- **For many-to-many junction tables, use the helpers in `@/services/shared/entity-checks`** — `assertJunctionAbsent(table, where, message)` before inserts (throws `ConflictError` on duplicate) and `deleteJunctionRow(table, where, message)` for deletes (throws `NotFoundError` on zero rows). Don't hand-roll select-then-conditional-insert. Existence checks: `requireVolunteer`, `requireSkill`, `requireInterest`, `requireOpportunity`.
- **For volunteer profile/detail updates that touch both the `users` and `volunteers` tables, delegate to `applyVolunteerUpdate(volunteerId, fields)` in `@/services/shared/volunteer-update`** — it owns the email-uniqueness check, the sequential users-then-volunteers writes, and the partial-write logging. Don't hand-roll a third copy of the diff/update logic. The route-layer Zod schema is the permission seam — restrict each portal's writable fields there, not inside the helper.

### Error Handling

- **Never throw generic `Error` in services for domain errors** — use `NotFoundError`, `ConflictError`, or `ValidationError` from `@/utils/errors`; route handlers catch with `instanceof`. Infrastructure errors (unexpected DB failures) may still use generic `Error` → 500.
- **Always use `handleRouteError(error)` as the sole catch-block statement in route handlers** — import from `@/utils/server/route-helpers`; it maps all typed domain errors to the correct HTTP responses. Routes with custom service errors (e.g. `RsvpError`) handle those first, then call `handleRouteError(error)` as the fallback.

### Code Organization

- **Never access `process.env.X` directly in app code** — add to `src/utils/env.ts` and use `env.X`.
- **Never hardcode `"10"` as a page size** — use `DEFAULT_PAGE_SIZE` from `@/lib/constants`.
- **Always use `validateAndParseId()` for `[id]` URL params** — from `@/utils/validate-id`; returns `null` if invalid.
- **Never use `Math.random()` for security-sensitive operations** — use `crypto.randomInt()`.
- **Use `usePaginatedSearch()` from `@/hooks/use-paginated-search` for debounced search + pagination reset** — don't re-create the dual-`useEffect`/`useRef` pattern inline in components.

### Mobile / Responsive

- **Always use `<MobileDialog>` from `@/components/shared` instead of MUI `<Dialog>`** — it auto-applies `fullScreen` on viewports below `md`. The theme strips paper border-radius and adds safe-area padding when `fullScreen` is true. Existing `<Dialog>` usage should be migrated.
- **Use `<ResponsiveTable>` for any list view that uses a `<Table>`** — it renders the table on `md+` and a card stack on `< md`. Don't ship raw `<Table>` to users on phones; horizontal scroll is not acceptable UX.
- **Use `<FilterDrawer>` to collapse secondary filters on mobile** — search inputs stay inline, but selects / date ranges collapse behind a `[Filters (N)]` button that opens a bottom drawer. Pattern from `src/app/volunteer/opportunities/page.tsx`.
- **Use `useIsMobile()` from `@/hooks/use-is-mobile` for conditional rendering** — never re-create `useMediaQuery(theme.breakpoints.down("md"))` inline. For pure styling (no JSX branching), prefer `sx={{ xs: …, md: … }}`.
- **Mobile-specific patterns and anti-patterns are documented in `planning/context/UI.md` § 10 ("Mobile Patterns")** — consult before building any new page or shared component.

## Critical Infrastructure

| What | Where |
|------|-------|
| Server auth helper | `src/utils/server/auth.ts` — `requireAuth()`, `requireStaffAuth()`, `authErrorResponse()`, `AuthError` |
| Client API wrapper | `src/lib/api-client.ts` — `apiClient`, `AuthenticationError`, `AuthorizationError` |
| Error handling | `src/utils/handle-error.ts` — `handleError()` |
| Domain error types | `src/utils/errors.ts` — `NotFoundError`, `ConflictError`, `ValidationError` |
| ID validation | `src/utils/validate-id.ts` — `validateAndParseId()` |
| Env var access | `src/utils/env.ts` — `env.X` |
| Constants | `src/lib/constants.ts` — `DEFAULT_PAGE_SIZE`, `RSVP_STATUS_COLORS` |
| Status enum schemas | `src/lib/status-enums.ts` — `rsvpStatusSchema`, `hoursStatusSchema`, `backgroundCheckStatusSchema`, `opportunityStatusSchema`, `proficiencyLevelSchema`, `assignableProficiencyLevelSchema`, `notificationPreferenceSchema`, `recipientTypeSchema` (and matching inferred types: `RsvpStatus`, `HoursStatus`, etc.) — Zod schemas derived from Drizzle enums |
| Route helpers | `src/utils/server/route-helpers.ts` — `parseBodyOrError()`, `handleRouteError()` (maps `AuthError`, `NotFoundError`, `ConflictError`, `ValidationError` to 401/403/404/409/400; falls through to 500 with `handleError()`) |
| Entity check / junction helpers | `src/services/shared/entity-checks.ts` — `requireVolunteer`, `requireSkill`, `requireInterest`, `requireOpportunity` (existence-check, throw `NotFoundError`); `assertJunctionAbsent(table, where, message)` (pre-insert duplicate guard, throws `ConflictError`); `deleteJunctionRow(table, where, message)` (delete + zero-row guard, throws `NotFoundError`) |
| Volunteer update helper | `src/services/shared/volunteer-update.ts` — `applyVolunteerUpdate(volunteerId, fields)` (shared helper backing both `updateVolunteerDetail` and `updateVolunteerProfile`; always enforces email uniqueness via `ConflictError`, sequentially writes `users` then `volunteers`, logs partial-write failures); `VolunteerUpdateFields` type covers the union of writable user + volunteer fields — per-portal Zod schemas at the route layer remain the permission seam |
| Auth config | `src/app/api/auth/[...nextauth]/auth-options.ts` |
| Middleware | `middleware.ts` |
| DB schema | `src/db/schema/` |
| Shared UI | `src/components/shared/` — `TablePaginationFooter`, `ModalTitleBar`, `AsyncContent`, `DetailField`, `ConfirmDialog`, `ChangePasswordSection`, `PageHeader`, `ResponsiveTable`, `FilterDrawer`, `MobileDialog` |
| Mobile/responsive | `src/hooks/use-is-mobile.ts` — `useIsMobile()` (`< md`), `useIsCompact()` (`< sm`); `src/components/layout/role-layout.tsx` (responsive shell with drawer); `src/components/layout/mobile-top-bar.tsx` (hamburger + logo + profile on `< md`); `src/components/layout/profile-menu.tsx` (shared profile popover for both sidebar and top-bar) |
| UI primitives | `src/components/ui/` — `StatusBadge` (+ `getRsvpStatusColor`, `getBackgroundCheckColor/Label`, `getHoursStatusColor`, `getHoursStatusLabel`), `EmptyState`, `LoadingSkeleton`, `HomeCard` |
| API error handler hook | `src/hooks/use-api-error-handler.ts` — `useApiErrorHandler()` |
| Paginated search hook | `src/hooks/use-paginated-search.ts` — `usePaginatedSearch(load, searchText, pageDeps, skip?)` (debounces search 300ms, resets pagination via second effect; consumes `useRef` to keep `load` fresh) |
| Portal label hook | `src/hooks/use-portal-label.ts` — `usePortalLabel()` (returns `"Admin Portal"` for admin role, `"Staff Portal"` otherwise; use as `PageHeader` eyebrow on staff pages) |
| Volunteer types hook | `src/hooks/use-volunteer-types.ts` — `useVolunteerTypes()` |
| Change password hook | `src/hooks/use-change-password.ts` — `useChangePassword(role)` |
| Staff self-profile hook | `src/hooks/use-staff-self-profile.ts` — `useStaffSelfProfile()` |
| Volunteer types service | `src/services/volunteer-types.service.ts` — `listActiveVolunteerTypes`, `listAllVolunteerTypes`, `createVolunteerType`, `updateVolunteerType`, `deleteVolunteerType` |
| Email templates service | `src/services/email-templates.service.ts` — `listTemplates`, `listActiveTemplates`, `getTemplateById`, `createTemplate`, `updateTemplate`, `deleteTemplate` |
| Email templates hook | `src/hooks/use-email-templates.ts` — `useEmailTemplates()` (active + all templates, CRUD mutations, 60s TTL cache) |
| Notifications service | `src/services/notifications.service.ts` — `sendUpcomingReminders()` |
| User service | `src/services/user.service.ts` — `changeUserPassword()` |
| Schema helpers | `src/db/schema/helpers.ts` — `timestamps` |
| Onboarding documents service | `src/services/onboarding-documents.service.ts` — `listDocuments`, `createDocument`, `updateDocument`, `deleteDocument`, `signDocument`, `listDocumentsWithSignatures` (`DocumentWithSignature`), `getVolunteerSignatures` |
| Volunteer detail service | `src/services/volunteer-detail.service.ts` — `getVolunteerDetail`, `updateVolunteerDetail`, `deleteVolunteer`, `deactivateVolunteer` |
| Volunteer skills service | `src/services/volunteer-skills.service.ts` — `assignSkill` (level defaults to `"no_selection"`), `removeSkill`, `getVolunteerSkills` |
| Volunteer detail hook | `src/hooks/use-volunteer-detail.ts` — `useVolunteerDetail()` (profile, updateVolunteer, deleteVolunteer, signDocumentForVolunteer) |
| Volunteer skills/interests hook | `src/hooks/use-volunteer-skills-interests.ts` — `useVolunteerSkillsInterests()` (addSkill no longer requires proficiencyLevel) |
| Volunteer profile hook | `src/hooks/use-volunteer-profile.ts` — `useVolunteerProfile()` (volunteer self-profile fetch + update, incl. firstName, lastName, email, phone, employer, jobTitle, city, state, referralSource, notificationPreference) |
| Volunteer account settings component | `src/components/volunteer/volunteer-account-settings.tsx` — `VolunteerAccountSettings` (name/email/phone/notification settings, change password, account deactivation with `DELETE /api/volunteer/profile`) |
| Volunteer client service | `src/services/volunteer-client.service.ts` — `fetchVolunteers` (accepts `VolunteerFilters`: `search`, `type`, `alumni`, `emailVerified`, `isActive`, `page`, `limit`), `fetchVolunteerById` |
| Volunteer import service | `src/services/volunteer-import.service.ts` — `importVolunteers` (bulk CSV import: validates, deduplicates, returns `ImportResult`) |
| Volunteer import hook | `src/hooks/use-volunteer-import.ts` — `useVolunteerImport()` (file upload via `apiClient.postForm`, returns `importing`, `result`, `error`, `importFile`, `reset`) |
| Volunteer export service | `src/services/volunteer-export.service.ts` — `getVolunteerExportData()` (returns `VolunteerExportData`: active docs + per-volunteer profile/paperwork/hours rows for CSV export) |
| Volunteer hours service | `src/services/volunteer-hours.service.ts` — `listAllHours`, `listVolunteerHours`, `logHours`, `updateHours`, `approveHours`, `rejectHours`, `volunteerLogHours`, `volunteerEditHoursRequest`, `listVolunteerOwnHours`, `volunteerDeleteHours`, `deleteHours` |
| Calendar events service | `src/services/calendar-events.service.ts` — `listCalendarEvents`, `autoCompleteExpiredEvents` (also invoked by `/api/cron/close-expired-events`) |
| Volunteer hours hook (self-service) | `src/hooks/use-volunteer-hours.ts` — `useVolunteerHours()` (hours list, `logHours`, `editHours`, `deleteHours`; `VolunteerHourEntry`, `LogHoursInput`, `EditHoursInput`) |
| Staff hours hook | `src/hooks/use-hours.ts` — `useHours()` (staff approve/reject/delete hours; `VolunteerHour`) |

## Code Style (ESLint enforced)

- All functions must have explicit return types (`@typescript-eslint/explicit-function-return-type`)
- Use `type` not `interface`
- No floating promises — always `void` or `await`
- No `console.log` — only `console.error` allowed
- Imports auto-sorted by `simple-import-sort`: external → `@/` internal → relative

## Planning Convention

All planning and design docs live in `planning/`. Claude-reference docs (domain vocab, architecture, patterns, UI) live in `planning/context/`. Sprint docs live in `planning/sprints/`. After any PR that adds, moves, or removes significant structure, update `planning/context/ARCHITECTURE.md` under Key Design Decisions.

Do NOT create a `docs/` directory.

## Project Conventions

- **Branches:** include your name — e.g., `kevin-rsvp-ui`
- **Commit messages:** one line, conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`), no body, no `Co-Authored-By`
- **Shared dev database** — all developers share one DB; use unique `NEXTAUTH_SECRET` per dev

## Test Credentials

The production database has a single seeded admin (`utkpersevere@gmail.com`). The seed script was a one-shot tool that was removed after use; if the admin record is ever lost, restore it via SQL or use the forgot-password flow. Volunteers and staff are created through the running app.

## Important Notes

- `@/*` path alias maps to `src/*`
- NextAuth uses JWT strategy (stateless — no session table in DB)
- Admin is a superset of staff — admin record references staff record
- Settings portal (`/staff/settings/*`) is admin-only with its own nested layout
- Run migrations manually with `pnpm drizzle-kit migrate` after schema changes
