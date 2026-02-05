# Authentication: Supabase for Campus Pulse

## Current behaviour

- **Demo mode** (`DEMO_MODE=true`): No Supabase Auth. `lib/auth.ts` returns fixed demo users; login page uses `auth-store` only (mock `login(role)`). API routes use `requireAdmin()` / `requireStudent()` which in demo mode always succeed with demo user IDs.
- **Production** (`DEMO_MODE=false`): API routes use Supabase server client (`createServerClient()` from `@supabase/ssr`) and cookies to get the real user and enforce roles via `getCurrentUser()` / `requireRole()`.

## What’s already in place

- **Server auth** (`lib/auth.ts`): `createServerClient()`, `getCurrentUser()`, `requireStudent()`, `requireAdmin()`, `createUserProfile()`, `userProfileExists()`.
- **DB**: `users` table with `id` (references `auth.users`), `role_id` → `roles` (student/admin).
- **Layouts**: `(admin)/layout.tsx` and `(student)/layout.tsx` use client-side `useAuthStore()` and redirect unauthenticated users to `/login`; they do **not** call the server auth helpers (so they don’t see real Supabase session yet when DEMO_MODE is off).

## Enabling real Supabase Auth (when DEMO_MODE=false)

1. **Login page**  
   Replace mock login with Supabase:
   - `supabase.auth.signInWithPassword({ email, password })` (or magic link / OAuth if you add it).
   - On success, redirect to `/submit` (student) or `/dashboard` (admin). Role must come from your DB (see below).

2. **Sync client with server session**  
   So layouts and client components know who is logged in and their role:
   - Either: from a server layout or a small API route, call `getCurrentUser()` and pass `{ user, role }` to the client (e.g. via a provider or initial props), and set `auth-store` from that (e.g. `setUser`, `setRole`).
   - Or: add a route like `GET /api/auth/session` that returns `getCurrentUser()` and have the client call it on load and after login, then update the auth store.

3. **Role source**  
   `getCurrentUser()` already loads role from `users` + `roles`. Ensure:
   - After Supabase sign-up, a row is created in `users` with the correct `role_id` (e.g. via trigger or by calling `createUserProfile(userId, role)` from your sign-up flow).
   - Admin users are created in `users` with the admin role; students with the student role.

4. **Protected routes**  
   API routes are already protected with `requireStudent()` / `requireAdmin()`. Page-level protection is done by the layouts (redirect to `/login` if not authenticated, and to the right area by role). When you sync the client with the server session (step 2), the same auth store will drive both API calls and layout redirects.

5. **Logout**  
   Call `supabase.auth.signOut()` and clear the auth store, then redirect to `/login` or `/`.

## Summary

- **Demo**: No schema or Supabase Auth required; app works with mock auth and existing layouts.
- **Production**: Keep `lib/auth.ts` as-is; add Supabase sign-in on the login page, a way to sync server session to the client auth store, and ensure `users` is populated with the correct role. No extra schema change is needed for auth.
