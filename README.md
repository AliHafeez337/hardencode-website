# hardencode.com

The live website for **Hardencode**. Plain HTML, CSS, and a small amount of vanilla JavaScript, hosted on **Cloudflare Workers + static assets**. Contact form submissions hit a same-origin Worker route that emails via **Resend**.

## Structure

| Path | What it is |
|---|---|
| `index.html` | The single page site: hero, services banner, services, proof, case studies, contact |
| `privacy.html` | Privacy page, linked only from the footer |
| `404.html` | Branded not found page |
| `worker.js` | Worker entry: routes `/api/*`, serves everything else from assets |
| `functions/api/contact.js` | Contact form handler (`POST /api/contact`) used by the Worker |
| `wrangler.jsonc` | Cloudflare Workers config (assets + Worker entry) |
| `styles.min.css`, `script.min.js` | Minified build outputs, what the pages actually load |
| `src/styles.css`, `src/script.js` | Readable sources for the two files above |
| `src/make-icons.ps1` | Regenerates the favicon, touch icons, and Open Graph image |
| `fonts/` | Self hosted woff2 files, only the weights actually used |
| `_headers` | Security headers for static responses |
| `.assetsignore` | Files that must not be uploaded as public static assets |

## Contact form setup (one-time)

Order matters: the Worker must be deployed before Cloudflare allows runtime secrets.

1. Deploy a build that includes `worker.js` + `wrangler.jsonc` (push to `main`).
2. Confirm `POST https://hardencode.com/api/contact` no longer returns a bare 404 (a JSON 503 about missing config is fine).
3. Create a free account at [resend.com](https://resend.com) and create an API key.
4. In Cloudflare → your Worker → **Settings** → **Variables and Secrets**, add:
   - `RESEND_API_KEY` (Secret)
5. Deploy once more so the Worker picks up the secret.

**Important:** every git deploy applies `CONTACT_FROM` / `CONTACT_TO` from `wrangler.jsonc`. Leaving `onboarding@resend.dev` there overwrites dashboard vars on each push.

**Production setup (required for `hello@hardencode.com`):**
1. Resend → [Domains](https://resend.com/domains) → add `hardencode.com` → add the DNS records Resend shows (in Cloudflare DNS).
2. Wait until the domain status is **Verified** (not Pending).
3. Confirm vars are:
   - `CONTACT_FROM` = `Hardencode <hello@hardencode.com>`
   - `CONTACT_TO` = `hello@hardencode.com`
4. Redeploy, then test again. Failed responses include a `reason` field with Resend's exact error.

**Quick test without domain verify:** temporarily set `CONTACT_FROM` back to `Hardencode <onboarding@resend.dev>` and `CONTACT_TO` to the exact email on your Resend account.

Non-secret defaults (`CONTACT_TO`, `CONTACT_FROM`) also live in `wrangler.jsonc` under `vars`. The Resend key stays a dashboard secret — never put it in `wrangler.jsonc`.

For local `wrangler dev`, copy `.dev.vars.example` to `.dev.vars` and paste your key.

## Editing

Edit `src/styles.css` or `src/script.js`, then rebuild the minified files:

```
npx esbuild src/styles.css --minify --outfile=styles.min.css
npx esbuild src/script.js --minify --outfile=script.min.js
```

Every push to `main` deploys automatically through Cloudflare Pages.
