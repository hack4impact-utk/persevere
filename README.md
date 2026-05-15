<h1 align="center">
  <br>
    <img src="https://static-assets.justserve.org/images/2ac73db0-c154-472b-9746-eeaa54f0b457.png" alt="Repository Banner" width="25%">  
  <br>
    Persevere Volunteer Management 
</h1>

# Description

Persevere, a non-profit that reduces recidivism through tech education, is hampered by a manual and inconsistent volunteer management process that makes it difficult to track volunteers and report data for funding. To solve this, we are building a platform to automate volunteer matching, streamline reporting, and provide a clear system for managing their growing community of mentors and guest speakers.

## Getting Started

### Prerequisites

Please have the following installed on your machine:

- Node.js
- PNPM
- VSCode

Please have the following VSCode extensions installed:

- Prettier
- ESLint
- Code Spell Checker
- markdownlint

### Environment Variables

Create a `.env` file at the project root and paste in the block below, then fill each value:

```text
DATABASE_URL=<ask leadership — Neon pooled connection string>
NEXTAUTH_SECRET=<self-generate — see below>
NEXTAUTH_URL=http://localhost:8888
GMAIL_USER=utkpersevere@gmail.com
GMAIL_APP_PASSWORD=<ask leadership — 16-char Gmail app password>
CRON_SECRET=<self-generate — see below>
APP_TIMEZONE=America/Chicago
```

**Where to get each value:**

1. **Ask leadership / H4I for:** `DATABASE_URL` and `GMAIL_APP_PASSWORD`. These are shared production secrets and cannot be self-generated.
2. **Self-generate** the following with `openssl rand -base64 32`:
   - `NEXTAUTH_SECRET` — each developer **must** use a unique value.
   - `CRON_SECRET` — any random value works locally.

### Running the App

This project uses Netlify infra (Blobs for file storage, Scheduled Functions for cron) that only works locally under `netlify dev`. **Use `pnpm run netlify:dev`, not `pnpm run dev`, for any work that touches uploads, cron, or auth.**

1. `pnpm install` — installs dependencies, including `netlify-cli` as a devDependency (no global install needed).
2. `pnpm run netlify:dev` — starts Netlify Dev, which wraps the Next.js server and serves the app at <http://localhost:8888>.
3. Open <http://localhost:8888> in your browser.

### Before Committing

`pnpm run check` (ESLint + `tsc --noEmit`) must pass before every commit:

```bash
pnpm run check     # lint + typecheck — must pass before any commit
pnpm run lint:fix  # auto-fix most ESLint issues
```

### Database Setup

The project uses Drizzle ORM with PostgreSQL (Neon). Migrations are run manually with `pnpm drizzle-kit migrate` after schema changes.

### Authentication

Test credentials for development:

| Role  | Email            | Password   |
| ----- | ---------------- | ---------- |
| Admin | `admin@test.com` | `admin123` |
| Staff | `staff@test.com` | `staff123` |

**Creating yourself as a volunteer:**

1. Log in as staff or admin
2. Go to Volunteers page → Add Volunteer
3. Fill in your details and select "No background check required"
4. Check your email for the welcome email with credentials
5. Log out and log in with your new volunteer account

**Role permissions:**

- **Admin**: Full system access, can manage all users and settings
- **Staff**: Can manage volunteers and opportunities, limited admin access
- **Volunteer**: Can view and sign up for opportunities, limited to their own data

### Contributing

Branch protections are enabled on this repository.
To contribute, please create a new branch and make a pull request.
The rules for branch names are lax, just be sure to include your name.

An example branch name for a card that adds a reset password email would be:

```text
rudra-reset-password-email
```

Your pull request title must follow the conventional commits specification. An example of a valid pull request title is:

```text
feat: Add pending form submissions table
```

#### Debugging

The `.vscode/launch.json` file is configured to run Next.js in debug mode. This can let you step through your code line by line and inspect variables.
To start debug mode, navigate to the `Run and Debug` tab in VSCode, select the mode, and click the green play button.
