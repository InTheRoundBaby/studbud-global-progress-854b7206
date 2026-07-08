# Deploy StudBud to your own Cloudflare account

Goal: let you run `bun run deploy` (or connect the GitHub repo in the Cloudflare dashboard) and have StudBud live on **your** Cloudflare Workers account, hitting the same Lovable Cloud (Supabase) backend.

Note: this app is SSR (TanStack Start + server functions), so it deploys as a **Cloudflare Worker with static assets**, not classic Cloudflare Pages. Cloudflare's dashboard now unifies both under "Workers & Pages" — the Worker preset is the right one.

## What I'll add

1. **`wrangler.toml`** at the project root:
   - `name = "studbud"` (you can rename)
   - `main = ".output/server/index.mjs"` (nitro's Cloudflare build output)
   - `compatibility_date` set to today, `compatibility_flags = ["nodejs_compat"]`
   - `[assets] directory = ".output/public"` so static files are served from the Worker
   - `[vars]` block with the **public** values only: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
   - Comment noting secrets go through `wrangler secret put`, not the file

2. **`package.json` scripts**:
   - `"deploy": "bun run build && wrangler deploy"`
   - `"cf:tail": "wrangler tail"` for live logs
   - Add `wrangler` as a devDependency

3. **`.dev.vars.example`** — template for any extra runtime env you might set locally (empty by default; StudBud doesn't need service-role for normal use).

4. **`CLOUDFLARE_DEPLOY.md`** — short readme with the exact steps:
   - `bun install`
   - `bunx wrangler login`
   - `bun run deploy`
   - How to connect the GitHub repo in the Cloudflare dashboard as an alternative (build cmd `bun install && bun run build`, output dir handled by wrangler.toml)
   - Where to add your Supabase auth redirect URL (the `*.workers.dev` URL Cloudflare gives you, plus any custom domain) inside Lovable Cloud → Users → Auth Settings

## What I will NOT change

- No code changes to routes, components, or server functions — the app already builds a Cloudflare-compatible Worker via the existing `vite.config.ts` (nitro Cloudflare preset).
- No new backend. It keeps talking to the same Lovable Cloud project (`qjanrpsoxehreijcgstv`).
- `.env` stays as-is for local dev.

## Caveats to know before you deploy

- **`SUPABASE_SERVICE_ROLE_KEY` is not available on Lovable Cloud**, so any code path that needs admin/service-role access won't work from your self-hosted Worker. StudBud's current features don't need it.
- **Auth redirects**: after the first deploy, add your Worker URL (e.g. `https://studbud.<your-subdomain>.workers.dev`) to the allowed redirect URLs in Lovable Cloud auth settings, or Google sign-in will bounce.
- **Recommendation**: publishing via Lovable's own button is still the simplest path — self-hosting on Cloudflare is only worth it if you specifically want the app on your own account/billing.

Ready to switch to build mode and add these files?
