# CareLog

Family care coordination app for managing an aging parent's health and daily needs. One hub for the whole family — medications, appointments, visit notes, and tasks.

## Features

- **Medication tracking** — log doses, skips, and notes with a full history
- **Appointments** — track upcoming and past doctor visits with outcomes
- **Visit notes** — record mood, observations, and notes after each visit
- **Shared task list** — assign tasks to family members with priorities and due dates
- **Family groups** — invite caregivers via invite code; everyone sees the same data
- **Dashboard** — at-a-glance summary of everything that matters

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router, Server Actions, proxy middleware
- [Supabase](https://supabase.com/) — Postgres database, Row Level Security, Auth
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Base UI](https://base-ui.com/) — headless UI primitives
- [shadcn/ui](https://ui.shadcn.com/) — component library built on Base UI
- [date-fns](https://date-fns.org/) — date formatting
- [Sonner](https://sonner.emilkowal.ski/) — toast notifications
- [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/) — form validation

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd carelog
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase/schema.sql`
3. Copy your project URL and anon key from **Project Settings → API**

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (auth)/         # Login and signup pages
  (dashboard)/    # Protected app pages (dashboard, medications, etc.)
  actions/        # Server Actions for all data mutations
  api/auth/       # Supabase auth callback route
components/
  ui/             # Base UI / shadcn primitives
  layout/         # Sidebar and navigation
  onboarding/     # Group setup flow
  dashboard/      # Dashboard-specific components
  medications/    # Feature components per section
  ...
lib/
  supabase/       # Server and browser Supabase clients
supabase/
  schema.sql      # Full database schema with RLS policies
proxy.ts          # Next.js 16 middleware — session refresh + auth guard
```

## Database

The schema is in `supabase/schema.sql`. It includes:

- Tables: `profiles`, `care_groups`, `care_recipients`, `group_members`, `medications`, `medication_logs`, `appointments`, `visit_notes`, `tasks`
- Row Level Security on every table, scoped to care group membership
- A trigger to auto-create a user profile on signup
