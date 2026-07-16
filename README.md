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
   - Optional: `CONTACT_TO` (default `hello@hardencode.com`)
   - Optional: `CONTACT_FROM` (default `Hardencode <onboarding@resend.dev>`)
5. Deploy once more so the Worker picks up the secret.

Until `RESEND_API_KEY` is set, the form returns a clear error and visitors can still use email or the booking modal.

## Editing

Edit `src/styles.css` or `src/script.js`, then rebuild the minified files:

```
npx esbuild src/styles.css --minify --outfile=styles.min.css
npx esbuild src/script.js --minify --outfile=script.min.js
```

Every push to `main` deploys automatically through Cloudflare Pages.
