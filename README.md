# hardencode.com

The live website for **Hardencode**. A static site, plain HTML, CSS, and a small amount of vanilla JavaScript, hosted on **Cloudflare Pages**.

## Structure

| Path | What it is |
|---|---|
| `index.html` | The single page site: hero, services banner, services, proof, case studies, contact |
| `privacy.html` | Privacy page, linked only from the footer |
| `404.html` | Branded not found page, served automatically by Cloudflare Pages |
| `styles.min.css`, `script.min.js` | Minified build outputs, what the pages actually load |
| `src/styles.css`, `src/script.js` | Readable sources for the two files above |
| `src/make-icons.ps1` | Regenerates the favicon, touch icons, and Open Graph image |
| `fonts/` | Self hosted woff2 files, only the weights actually used |
| `_headers` | Security headers served by Cloudflare Pages |
| `_redirects` | Redirects www.hardencode.com to the bare domain |

## Editing

Edit `src/styles.css` or `src/script.js`, then rebuild the minified files:

```
npx esbuild src/styles.css --minify --outfile=styles.min.css
npx esbuild src/script.js --minify --outfile=script.min.js
```

Every push to `main` deploys automatically through Cloudflare Pages.
