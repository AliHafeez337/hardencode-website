# hardencode.com

The live website for **Hardencode**. A static site, plain HTML, CSS, and a small amount of vanilla JavaScript, hosted on **Cloudflare Pages**. Contact form submissions are handled by a same-origin Pages Function that emails via **Resend**.

## Structure

| Path | What it is |
|---|---|
| `index.html` | The single page site: hero, services banner, services, proof, case studies, contact |
| `privacy.html` | Privacy page, linked only from the footer |
| `404.html` | Branded not found page, served automatically by Cloudflare Pages |
| `functions/api/contact.js` | Pages Function for the quick query form (`POST /api/contact`) |
| `styles.min.css`, `script.min.js` | Minified build outputs, what the pages actually load |
| `src/styles.css`, `src/script.js` | Readable sources for the two files above |
| `src/make-icons.ps1` | Regenerates the favicon, touch icons, and Open Graph image |
| `fonts/` | Self hosted woff2 files, only the weights actually used |
| `_headers` | Security headers served by Cloudflare Pages |
| `_redirects` | Redirects www.hardencode.com to the bare domain |

## Contact form setup (one-time)

The form stays on your domain and only loads Koalendar when someone opens the booking modal. Email delivery needs Resend:

1. Create a free account at [resend.com](https://resend.com) and create an API key.
2. In Cloudflare Pages → your project → **Settings** → **Environment variables**, add:
   - `RESEND_API_KEY` (encrypt / secret)
   - Optional: `CONTACT_TO` (default `hello@hardencode.com`)
   - Optional: `CONTACT_FROM` (default `Hardencode <onboarding@resend.dev>`)
3. For branded From addresses, verify `hardencode.com` in Resend (add their DNS records), then set `CONTACT_FROM` to e.g. `Hardencode <hello@hardencode.com>`.
4. Redeploy (or retry the latest deployment) so the Function picks up the secrets.

Until `RESEND_API_KEY` is set, the form returns a clear error and visitors can still use email or the booking modal.

## Editing

Edit `src/styles.css` or `src/script.js`, then rebuild the minified files:

```
npx esbuild src/styles.css --minify --outfile=styles.min.css
npx esbuild src/script.js --minify --outfile=script.min.js
```

Every push to `main` deploys automatically through Cloudflare Pages.
