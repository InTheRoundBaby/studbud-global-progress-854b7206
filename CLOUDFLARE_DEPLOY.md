# Deploying StudBud to your own Cloudflare account

StudBud is a TanStack Start SSR app, so it runs as a **Cloudflare Worker with
static assets** (not classic Pages). The Vite build already targets Cloudflare
via nitro — you just need `wrangler.toml` (included) and a Cloudflare account.

> Easiest path is still Lovable's built-in **Publish** button. Use this guide
> only if you specifically want the app on your own Cloudflare account/billing.

## One-time setup

1. Create a free Cloudflare account: <https://dash.cloudflare.com/sign-up>
2. Install deps and log in:
   ```bash
   bun install
   bunx wrangler login
   ```
3. (Optional) Rename the Worker by editing `name = "studbud"` in `wrangler.toml`.

## Deploy

```bash
bun run deploy
```

This runs `vite build` (nitro emits `.output/server/index.mjs` + `.output/public/`)
and then `wrangler deploy`. When it finishes, Cloudflare prints your live URL,
e.g. `https://studbud.<your-subdomain>.workers.dev`.

Tail live logs:

```bash
bun run cf:tail
```

## Alternative: GitHub → Cloudflare dashboard

1. Push this repo to GitHub (use the GitHub button in the Lovable editor).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Import a repository**.
3. Framework preset: **None** (wrangler.toml drives the build).
4. Build command: `bun install && bun run build`
5. Deploy command: `bunx wrangler deploy` (Cloudflare's Workers Builds runs this).

## After the first deploy — auth redirect URLs

Google sign-in and email confirmation links will bounce unless your new URL is
in the Supabase auth allowlist. In the Lovable editor:

**Cloud → Users → Auth Settings → URL Configuration**

Add:

- `https://studbud.<your-subdomain>.workers.dev`
- your custom domain (if you attach one in Cloudflare)

## Backend

The deployed Worker talks to the **same** Lovable Cloud backend
(`qjanrpsoxehreijcgstv.supabase.co`) as the Lovable-hosted preview. Users, exams,
and stats are shared across both.

`SUPABASE_SERVICE_ROLE_KEY` is **not available** on Lovable Cloud, so any future
admin/service-role code paths won't work from your self-hosted Worker. Current
StudBud features don't need it.

## Secrets (if you ever add any)

Don't put secrets in `wrangler.toml`. Use:

```bash
bunx wrangler secret put MY_SECRET
```

Cloudflare stores it encrypted and injects it as `process.env.MY_SECRET` at
request time inside your server functions.