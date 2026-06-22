# Cloud Sync Setup (optional)

Jorata is **local-first by default**. Without the steps below, the app behaves
exactly as before: a visitor types a display name, works fully offline, and their
data never leaves the device. No account, no sign-in UI, no network calls.

Cloud Sync is an **opt-in** feature. Turn it on and a signed-in user sees the same
mind maps, tasks, goals, focus and reflections on every device they sign in on.
Anonymous local users are completely unaffected.

This guide is everything the project owner must do to activate it.

---

## What you'll set up

- A **Supabase** project (free tier is plenty) — provides email auth + Postgres.
- Two tables: `profiles` (carries the display name) and `user_state` (one row per
  user holding the synced store snapshots as JSON), both protected by **Row-Level
  Security** so each user can only read/write their own row.
- Two **public** env vars in your deployment.

Estimated time: ~10 minutes.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> → **New project**.
2. Pick a name, a strong database password, and a region close to your users.
3. Wait for it to finish provisioning.

## 2. Configure auth (magic links)

1. **Authentication → Sign In / Providers → Email**: ensure **Email** is enabled.
   Magic links work out of the box — no password required. (You may turn off
   "Confirm email" if you want the very first link to also act as confirmation.)
2. **Authentication → URL Configuration**:
   - Set **Site URL** to where the app runs (e.g. `http://localhost:3000` for local
     dev, or your production URL).
   - Add the same URL(s) under **Redirect URLs**. The magic link returns the user
     to this origin, where the app finishes sign-in client-side.

> The app uses the **implicit (hash) auth flow** with `detectSessionInUrl`, so the
> magic link resolves entirely in the browser — there is no server callback route
> to deploy.

## 3. Create the tables + RLS policies

Open **SQL Editor → New query**, paste the following, and **Run**:

```sql
-- ── profiles: carries the display name into the cloud ───────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile - select" on public.profiles
  for select using (auth.uid() = id);
create policy "own profile - insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "own profile - update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── user_state: one row per user, all synced store snapshots as JSON ────────
-- `stores` shape:  { "jmind:tasks": { "data": {...}, "updatedAt": "ISO" }, ... }
-- The per-store `updatedAt` drives last-writer-wins conflict handling.
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  stores     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

create policy "own state - select" on public.user_state
  for select using (auth.uid() = user_id);
create policy "own state - insert" on public.user_state
  for insert with check (auth.uid() = user_id);
create policy "own state - update" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## 4. Enable Realtime on `user_state` (recommended)

So a change on one device shows up on another without waiting for a tab focus:

- **Database → Replication** (or **Realtime**) → enable replication for the
  `public.user_state` table.

If you skip this, sync still works — it just refreshes on load, on window focus,
and after each local change instead of instantly.

## 5. Set the env vars

Copy `.env.example` → `.env.local` and fill in **both**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

Find both at **Project Settings → API**.

- These are `NEXT_PUBLIC_*` on purpose — they ship to the browser. The anon key is
  a **public** key; your data is protected by the RLS policies above, not by
  hiding the key.
- **Never** put the `service_role` key in the client or in `.env.local`.

Restart `npm run dev` (env vars are read at build/boot).

## 6. Verify

1. Open **Settings → Cloud Sync** → enter your email → **Send magic link**.
2. Open the link from your inbox on the same device → you're signed in.
3. Create a task / node, then open the app on a second device and sign in with the
   same email → your data appears.
4. On a device that already had local work, the first sign-in shows a one-time
   **Keep / Use synced / Merge** prompt before anything is combined.

---

## How sync behaves (for reference)

- **Opt-in only.** No env vars → no sync UI at all. Signed out → local-only.
- **Push:** local store changes are debounced (~1.5s) and written to your row.
- **Pull:** on load, on window focus, and on realtime change.
- **Offline:** changes are queued and flushed automatically on reconnect — the app
  stays fully usable offline.
- **Conflicts:** last-writer-wins **per store** using the per-store `updatedAt`.
- **First sign-in with existing local data:** a one-time, non-destructive choice —
  *Keep this device's data*, *Use my synced data*, or *Merge both*. Merge takes the
  union of your items so nothing is thrown away.
- **Sign out:** stops syncing and leaves all local data on the device intact.

---

## What needs live testing

This was built and type-checked/built green in a sandbox **without network access
to Supabase**, so the end-to-end auth + database round-trip must be verified by the
owner against a real project. Specifically confirm: magic-link delivery and
redirect, the RLS policies (a second account must NOT see your row), realtime
propagation, and the first-run reconcile prompt. The local-first path (no env vars)
is fully exercised by `npm run build` and needs no Supabase.
