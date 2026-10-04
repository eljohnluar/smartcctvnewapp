# SmartCCTV Teacher Portal

Teacher-facing web app for SmartCCTV: attendance dashboard, student roster,
reports, and alerts. Connects directly to Supabase — no backend required.
Teachers only; no live camera feed.

## Stack

Vite + React 19, Tailwind CSS v4, Supabase JS, React Router, Recharts.

## Local development

```sh
npm install
cp .env.example .env   # fill in your Supabase URL and anon key
npm run dev
```

## Deploying to Vercel

1. Push this folder to a Git repository and import it in Vercel
   (Vite is auto-detected; `vercel.json` handles SPA routes).
2. In Vercel → Project → Settings → Environment Variables, add:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon (publishable) key
   Never use the service role key here.
3. One-time Supabase setup: run `supabase/portal_policies.sql` in
   Supabase Studio → SQL Editor. It grants the portal read access to
   students/attendance/alerts and lets teachers resolve alerts.

Sign in uses the same teacher accounts as the main app (`users` table).

## Project layout

```
supabase/portal_policies.sql  # one-time RLS policies for the portal
src/pages/        # Login, Dashboard, Students, Reports, Alerts
src/services/     # Supabase client + data queries
src/context/      # auth provider (custom users-table sign-in)
src/components/   # shared layout (sidebar, header, spinner)
src/hooks/        # scoped students (respects teacher year/section limits)
```
