## Persevere Volunteer Management

This document explains the system architecture, data model, authentication, conventions, and operational details for contributors.

### Goals and Scope

- Automate volunteer onboarding, matching, scheduling, communications, and reporting.
- Provide role-based access for volunteers, staff, and admins.
- Keep the implementation simple, with room to scale features later.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: MUI 7
- **Forms**: React Hook Form + Zod
- **Auth**: NextAuth.js (Credentials) + JWT sessions + Drizzle Adapter
- **DB/ORM**: PostgreSQL (Neon serverless) + Drizzle ORM/Kit
- **Notifications**: Notistack (toasts)
- **Tooling**: ESLint, Prettier, Knip, Turbopack dev

Key packages: `next`, `react`, `@mui/material`, `drizzle-orm`, `@auth/drizzle-adapter`, `next-auth`, `react-hook-form`, `zod`, `@neondatabase/serverless`.

---

## Project Structure

```
/ (repo root)
  README.md                 — Quickstart and contributor basics
  ARCHITECTURE.md           — This document
  drizzle.config.ts         — Drizzle Kit config (schema input, out dir)
  drizzle/                  — Migrated SQL + metadata (generated)
  next.config.ts            — Next.js config
  middleware.ts             — Auth + RBAC gating for routes
  src/
    app/                    — Next.js App Router structure
      api/
        auth/[...nextauth]/ — NextAuth route + options
        protected/          — Example protected API route
      auth/login/           — Login page
      dashboard/            — Example protected page
      example-*/            — Example UI pages (form/table)
      layout.tsx, page.tsx  — Root layout/home
    components/             — UI components (MUI-based)
    db/                     — Drizzle DB client and schema
      index.ts              — Neon + Drizzle initialization
      schema/               — Drizzle schema modules
    providers/              — React providers (Auth, Notistack)
    types/                  — Global types, NextAuth augmentation
    utils/                  — Auth helpers, error handling, password utils
```

Conventions:

- Use `@/` alias for imports from `src`.
- Keep server-only code in server contexts (`app` route handlers, server utilities).
- Use role checks centrally (middleware and utilities) rather than ad-hoc in pages.

---

## Environment and Configuration

Required environment variables (see `README.md` for details):

- `DATABASE_URL`: PostgreSQL connection (Neon).
- `NEXTAUTH_SECRET`: Per-developer secret for JWT signing.
- `NEXTAUTH_URL`: Base URL for auth callbacks (dev: `http://localhost:3000`).

Drizzle Kit (`drizzle.config.ts`):

- Reads schema from `src/db/schema/index.ts`.
- Outputs SQL and meta to `./drizzle`.

Run scripts (`package.json`):

- `dev`: Next dev with Turbopack.
- `build`, `start`: Production build and start.
- `lint`, `lint:fix`: ESLint (Next config, Prettier).
- `check`: Lint + TypeScript typecheck concurrently.

---

## Database and ORM

Initialization (`src/db/index.ts`):

- Uses Neon HTTP driver with `drizzle-orm/neon-http`.
- Exports a typed Drizzle client bound to the schema.

Migrations:

- Generated via Drizzle Kit from code-first schema in `src/db/schema/*` into `drizzle/`.
- Snapshots and SQL increments are committed for reproducibility.

### Core Data Model

Entities live primarily in `src/db/schema/users.ts`, `opportunities.ts`, `communications.ts`, and enums in `enums.ts`. Highlights:

- **volunteers**: Central person record for login and participation
  - Fields: name, email (unique), password (bcrypt), phone, bio, role, alumni flag, background check status, media release, availability, notification preferences, active and verification flags, timestamps.

- **skills** and **volunteer_skills**: Many-to-many with proficiency enum to support matching.

- **interests** and **volunteer_interests**: Many-to-many for interest/category alignment.

- **opportunities**: Events/engagements with time, location, status, capacity, creator, recurrence data.
  - Linking tables: `opportunity_required_skills`, `opportunity_interests`.
  - Participation: `volunteer_rsvps` with status enum and timestamps.
  - Reporting: `volunteer_hours` for actual hour tracking and verification.

- **communications**: Outbound messaging records and templates
  - `communication_logs`: sender, recipient, subject/body, type, status, optional opportunity linkage.
  - `communication_templates`: reusable message content, types, categories.

### Auth Support Tables (NextAuth.js)

Defined in `src/db/schema/users.ts` for adapter compatibility:

- `user` (id, name, email, emailVerified, image)
- `account` (composite PK by provider and account id, linked to `user`)
- `session` (sessionToken PK, expires, user link)
- `verificationToken` (identifier + token composite PK, expires)

Enums (`enums.ts`):

- `volunteer_role`: mentor, guest_speaker, flexible, staff, admin
- `opportunity_status`: open, full, completed, canceled
- `rsvp_status`: pending, confirmed, declined, attended, no_show
- `background_check_status`: not_required, pending, approved, rejected
- `proficiency_level`: beginner, intermediate, advanced
- `notification_preference`: email, sms, both, none

Relations are declared via `drizzle-orm` `relations(...)` for typed joins and nested queries.

#### Schema Details

Below is a more granular, field-level overview of the primary tables and relationships defined in `src/db/schema/*`.

- volunteers
  - id: serial PK
  - firstName: text not null
  - lastName: text not null
  - email: text unique not null (login identifier)
  - password: text not null (bcrypt hash)
  - phone: text nullable
  - bio: text nullable
  - role: enum volunteer_role not null (mentor | guest_speaker | flexible | staff | admin)
  - isAlumni: boolean not null default false
  - backgroundCheckStatus: enum background_check_status not null default not_required
  - mediaRelease: boolean not null default false
  - profilePicture: text nullable
  - availability: jsonb nullable (serialized schedule preferences)
  - notificationPreference: enum notification_preference not null default email
  - isActive: boolean not null default true
  - isEmailVerified: boolean not null default false
  - createdAt: timestamp not null default now()
  - updatedAt: timestamp not null default now()
  - Relations: many volunteer_skills; many volunteer_interests; referenced by many opportunity/communication tables

- skills
  - id: serial PK
  - name: text not null
  - description: text nullable
  - category: text nullable
  - Relations: many volunteer_skills; many opportunity_required_skills

- volunteer_skills (junction)
  - volunteerId: int FK -> volunteers.id on delete cascade
  - skillId: int FK -> skills.id on delete cascade
  - level: enum proficiency_level not null (beginner | intermediate | advanced)
  - PK: composite (volunteerId, skillId)

- interests
  - id: serial PK
  - name: text not null
  - description: text nullable
  - Relations: many volunteer_interests; many opportunity_interests

- volunteer_interests (junction)
  - volunteerId: int FK -> volunteers.id on delete cascade
  - interestId: int FK -> interests.id on delete cascade
  - PK: composite (volunteerId, interestId)

- opportunities
  - id: serial PK
  - title: text not null
  - description: text not null
  - location: text not null
  - startDate: timestamp not null
  - endDate: timestamp not null
  - status: enum opportunity_status not null default open (open | full | completed | canceled)
  - maxVolunteers: int nullable
  - createdById: int FK -> volunteers.id on delete restrict (staff/admin creator)
  - recurrencePattern: jsonb nullable
  - isRecurring: boolean not null default false
  - createdAt: timestamp not null default now()
  - updatedAt: timestamp not null default now()
  - Relations: many opportunity_required_skills; many opportunity_interests; many volunteer_rsvps; many volunteer_hours; one createdBy (volunteer)

- opportunity_required_skills (junction)
  - opportunityId: int FK -> opportunities.id on delete cascade
  - skillId: int FK -> skills.id on delete cascade
  - PK: composite (opportunityId, skillId)

- opportunity_interests (junction)
  - opportunityId: int FK -> opportunities.id on delete cascade
  - interestId: int FK -> interests.id on delete cascade
  - PK: composite (opportunityId, interestId)

- volunteer_rsvps
  - volunteerId: int FK -> volunteers.id on delete cascade
  - opportunityId: int FK -> opportunities.id on delete cascade
  - status: enum rsvp_status not null default pending (pending | confirmed | declined | attended | no_show)
  - rsvpAt: timestamp not null default now()
  - notes: text nullable
  - PK: composite (volunteerId, opportunityId)

- volunteer_hours
  - id: serial PK
  - volunteerId: int FK -> volunteers.id on delete cascade
  - opportunityId: int FK -> opportunities.id on delete cascade
  - date: timestamp not null
  - hours: real not null (supports decimals like 2.5)
  - notes: text nullable
  - verifiedBy: int FK -> volunteers.id on delete set null (staff/admin verifier)
  - verifiedAt: timestamp nullable

- communication_logs
  - id: serial PK
  - senderId: int FK -> volunteers.id on delete restrict
  - recipientId: int FK -> volunteers.id on delete restrict
  - subject: text not null
  - body: text not null
  - type: text not null (email | sms | notification)
  - sentAt: timestamp not null default now()
  - status: text not null default "sent" (sent | delivered | failed)
  - relatedOpportunityId: int nullable

- communication_templates
  - id: serial PK
  - name: text not null
  - subject: text not null
  - body: text not null
  - type: text not null (email | sms | notification)
  - category: text nullable (welcome | reminder | confirmation | newsletter)
  - isActive: boolean not null default true
  - createdAt: timestamp not null default now()
  - updatedAt: timestamp not null default now()

- NextAuth tables (adapter)
  - user
    - id: text PK
    - name: text nullable
    - email: text nullable
    - emailVerified: timestamp nullable
    - image: text nullable
  - account
    - userId: text FK -> user.id on delete cascade
    - type, provider, providerAccountId: text not null
    - tokens/metadata fields as text/int nullable
    - PK: composite (provider, providerAccountId)
  - session
    - sessionToken: text PK
    - userId: text FK -> user.id on delete cascade
    - expires: timestamp not null
  - verificationToken
    - identifier: text not null
    - token: text not null
    - expires: timestamp not null
    - PK: composite (identifier, token)

---

## Authentication and Authorization

NextAuth route: `src/app/api/auth/[...nextauth]/route.ts` uses `auth-options.ts`.

### Strategy

- **Provider**: Credentials.
- **Session**: JWT strategy (no database sessions required for auth state; sessions table present for adapter completeness/OAuth future).
- **Adapter**: Drizzle Adapter configured with our Drizzle client and tables.

### Login Flow (Credentials)

1. User submits email/password.
2. `authorize` queries `volunteers` by email and verifies password via `bcrypt` (`utils/password.ts`).
3. Ensures a corresponding NextAuth `user` record exists (creates if missing) for adapter compatibility.
4. Returns a user payload including `role` and `isEmailVerified` merged into JWT via `jwt` callback.
5. `session` callback copies `token.user` into `session.user` for server/client access.

### Session Access Helpers

- `utils/auth.ts`: `getServerSession()` and `requireAuth(role?)` helpers wrap NextAuth for server code.
  - `requireAuth` throws `Unauthorized` if no session; `Forbidden` if role doesn’t match.
- `utils/auth/get-user-session.ts`: simple server-component accessor for session.

### Middleware and RBAC

`middleware.ts` uses `withAuth` to guard app routes:

- Redirects unauthenticated users to `/`.
- Enforces role-based redirects for `/admin` and `/staff` prefixes.
- Requires email verification for non-staff roles; otherwise redirects to `/verify-email`.
- Applies to: `/dashboard/*`, `/admin/*`, `/staff/*`, `/volunteer/*`.

### Protected API Pattern

Example in `src/app/api/protected/route.ts`:

- Calls `requireAuth("admin")` to enforce role.
- Returns structured 401/403/500 responses on errors.

---

## Frontend

Pages and routing (App Router):

- Public: `/` landing.
- Auth: `/auth/login` login page.
- Protected examples: `/dashboard`, example form/table pages.

Providers (`src/providers/`):

- NextAuth provider for session context.
- Notistack provider for toast notifications.

Components (`src/components/`):

- MUI-based examples: forms (`react-hook-form` + `zod`), tables (`@mui/x-data-grid`), home cards, auth components (login form, sign-out button), and protected UI wrapper.

Styling:

- MUI theme in `src/styles/theme.ts`.

---

## Error Handling

- Central utility in `src/utils/handle-error.ts` (pattern: normalize exceptions to user-safe messages).
- API routes follow a consistent error shape with status codes.

---

## Security Considerations

- Passwords stored as bcrypt hashes; verification via `utils/password.ts`.
- JWT contains only required user claims; role is enforced server-side.
- Middleware gate protects app routes; API routes use `requireAuth` directly.
- Background check and email verification modeled explicitly for policy enforcement.
- Use `useSecureCookies` set to false in dev; ensure secure cookies in production environments.

---

## Development Workflow

1. `pnpm install`
2. Set `.env` with `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
3. `pnpm dev` to run locally.
4. Drizzle migrations are managed by Drizzle Kit (schema-first). Update schema under `src/db/schema/*`, then generate/apply migrations as needed.
5. Lint and typecheck: `pnpm check`.

Branch/PR conventions: see `README.md` (conventional commits, example branch names).

---

## Reference Map

- Auth config: `src/app/api/auth/[...nextauth]/auth-options.ts`
- Auth route: `src/app/api/auth/[...nextauth]/route.ts`
- Middleware: `middleware.ts`
- DB client: `src/db/index.ts`
- Schema exports: `src/db/schema/index.ts`
- Domain schemas: `src/db/schema/users.ts`, `opportunities.ts`, `communications.ts`, `enums.ts`
- Providers: `src/providers/*`
- Utilities: `src/utils/*`
- Example API: `src/app/api/protected/route.ts`
