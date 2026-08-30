import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

execSync("npx --yes esbuild src/styles.css --minify --outfile=styles.min.css", {
  cwd: root,
  stdio: "inherit",
});

execSync("npx --yes esbuild src/script.js --minify --outfile=script.min.js", {
  cwd: root,
  stdio: "inherit",
});

const css = readFileSync(join(root, "styles.min.css"), "utf8").trim();
const styleHash = createHash("sha256").update(css, "utf8").digest("base64");
const styleBlock = `<style>${css}</style>`;

const indexPath = join(root, "index.html");
let html = readFileSync(indexPath, "utf8");
const cssPattern = /<!-- inject-css -->[\s\S]*?<!-- \/inject-css -->/;
if (!cssPattern.test(html)) {
  throw new Error("index.html is missing <!-- inject-css --> markers");
}
html = html.replace(
  cssPattern,
  `<!-- inject-css -->\n${styleBlock}\n<!-- /inject-css -->`
);
writeFileSync(indexPath, html);

const headersPath = join(root, "_headers");
let headers = readFileSync(headersPath, "utf8");
const cspPattern = /(style-src )(?:'self'(?: 'sha256-[^']+')?)/;
if (!cspPattern.test(headers)) {
  throw new Error("_headers is missing a style-src directive to update");
}
headers = headers.replace(cspPattern, `$1'self' 'sha256-${styleHash}'`);
writeFileSync(headersPath, headers);

console.log(`Inlined CSS into index.html (sha256-${styleHash})`);
