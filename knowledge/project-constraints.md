REPO_AND_CONSTRAINTS
Purpose
Ensures agents generate code and plans that fit your stack and repo.

Content

The project uses a single Next.js monorepo.

Frontend and backend live in the same repository.

Stack:

Next.js (App Router)

Tailwind CSS

shadcn/ui

Supabase (Postgres)

PWA via manifest.json

Backend is implemented using:

Next.js API routes or server actions

Shared domain logic imported across frontend and backend

Constraints:

No microservices

No background job queues for MVP

No external orchestration

No additional roles beyond student and admin