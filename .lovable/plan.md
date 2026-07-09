
## Goal
Add a single global chat room to StudBud. Messages live in **your own Supabase project** (`voogcsgjglhbscoxmcgb`), completely separate from the Lovable Cloud backend that powers exams/homework/auth.

## How the two backends coexist
- **Lovable Cloud** (existing) — auth, exams, homework, rewards, profiles. Untouched.
- **Your Supabase** (new) — one `messages` table + realtime. Client uses your project's **anon key** with no RLS restrictions on insert/select (anonymous chat, as you chose).

Users must still be signed into StudBud (Lovable Cloud) to reach the chat page. We read their `display_name` from the Lovable profile and stamp it onto each message when posting. There's no cryptographic identity check on your Supabase side — anyone with the anon key could technically post. That's the tradeoff of the "anonymous" option.

## What you'll do once, in your Supabase dashboard
Run this SQL in the SQL editor of `voogcsgjglhbscoxmcgb`:

```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_name text not null,
  author_id text not null,        -- Lovable user id, stored as text for reference/moderation
  content text not null check (char_length(content) between 1 and 500)
);
grant select, insert on public.messages to anon;
alter table public.messages enable row level security;
create policy "anon read"   on public.messages for select to anon using (true);
create policy "anon insert" on public.messages for insert to anon with check (true);
-- Enable Realtime for this table in Database → Replication → supabase_realtime
```

Then in **Database → Replication**, add `public.messages` to the `supabase_realtime` publication so live updates work.

I'll walk you through this in chat when we get there.

## What I'll build

### 1. Second Supabase client
New file `src/integrations/chat-supabase/client.ts` — a separate `createClient` instance pointed at your project. It reads:
- `VITE_CHAT_SUPABASE_URL` — `https://voogcsgjglhbscoxmcgb.supabase.co`
- `VITE_CHAT_SUPABASE_ANON_KEY` — your anon key (stored via the secure secret form)

`persistSession: false` so it doesn't fight the main Lovable Cloud auth session in localStorage.

### 2. Hand-maintained types
`src/integrations/chat-supabase/types.ts` — small hand-written type for the `messages` row. No generated types, since Lovable doesn't manage your project.

### 3. Chat route
New protected route `src/routes/_authenticated/chat.tsx`:
- Loads last ~100 messages via `useQuery` against the chat client.
- Subscribes to Postgres changes (`postgres_changes` on `public.messages`) and appends new messages to the cache.
- Sticky-to-bottom scrolling, timestamps, user's own messages right-aligned.
- Input + send button. On submit: read `display_name` from the Lovable profile, insert into your Supabase with `author_id = supabase.auth.getUser().id`.
- Bilingual (EN/Farsi) via `src/lib/i18n.tsx` — I'll add the needed keys.
- Uses existing StudBud glass-card + pink-gradient styling. No new design language.

### 4. Nav entry
Add a "Chat" item to `AppShell` sidebar/nav alongside Dashboard/Exams/Homework/Rewards/Tools.

### 5. Secrets
I'll open the secure secret form for `VITE_CHAT_SUPABASE_ANON_KEY`. The URL constant I can hardcode in `.env` since it's already public (in your dashboard link). The anon key is also public-safe by design, but we store it as a secret so it stays out of the repo.

## Files to create / edit
- **create** `src/integrations/chat-supabase/client.ts`
- **create** `src/integrations/chat-supabase/types.ts`
- **create** `src/routes/_authenticated/chat.tsx`
- **edit** `src/components/AppShell.tsx` — add Chat nav link
- **edit** `src/lib/i18n.tsx` — add `chat`, `sendMessage`, `chatPlaceholder`, `chatEmpty` keys (EN + FA)
- **edit** `.env` — add `VITE_CHAT_SUPABASE_URL`
- Regenerated `src/routeTree.gen.ts` (automatic)

## Explicit non-goals
- No moderation UI, no delete, no edit, no reactions, no DMs, no rooms.
- No RLS on your Supabase beyond the permissive anon policies above.
- No syncing chat data back to Lovable Cloud.
- Not touching the existing exam Jalali picker or any Lovable Cloud tables.

## Known limitations (worth knowing before we build)
1. **Spammable.** Anyone who inspects the network tab can grab your anon key and post directly to your project. If it becomes a problem, we'd move to the "shared secret + Edge Function" option later.
2. **No cross-backend RLS.** Your Supabase can't verify a Lovable Cloud JWT, so `author_id` is trust-based.
3. **You maintain the schema.** If we later change the messages shape, you'll re-run SQL in your dashboard — I can't migrate it for you.
