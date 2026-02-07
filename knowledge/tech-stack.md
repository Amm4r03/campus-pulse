TECH STACK AND SYSTEM DESIGN
Repository Style
Single monorepo using Next.js with frontend and backend inside one Git repository for faster DX and shared types.

Tech Stack
Frontend:

Next.js (App Router)

Tailwind CSS

shadcn/ui components

PWA via manifest.json

Backend:

Next.js API routes / server actions

Supabase for database operations

Tooling:

Vitest for unit tests (e.g. triage/spam rules)

API response logger for audit/debug (lib/api-logger)