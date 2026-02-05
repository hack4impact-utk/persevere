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

Create a `.env` file in the root directory with the following variables:

```text
DATABASE_URL=<ask lead for credentials>
NEXTAUTH_SECRET=<generate your own>
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=<ask lead for credentials>
RESEND_FROM_EMAIL=<ask lead for credentials>
```

**Setup steps:**

1. Ask your team lead for `DATABASE_URL`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`
2. Generate your own NextAuth secret: `openssl rand -base64 32`
3. Each developer must use their own unique `NEXTAUTH_SECRET`

**Note:** All developers share the same database for development, but each needs their own `NEXTAUTH_SECRET` to prevent session conflicts.

### Running the App

1. Run `pnpm install` to install the dependencies.
2. Run `pnpm run dev` to start the development server.
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

The project uses Drizzle ORM with PostgreSQL. Database migrations are automatically applied on startup.

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
