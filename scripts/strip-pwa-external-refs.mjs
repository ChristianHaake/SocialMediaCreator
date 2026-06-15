// Strips external http(s) URLs from the generated service worker bundle.
//
// vite-plugin-pwa bundles the Workbox runtime, which embeds documentation
// links (e.g. https://bit.ly/wb-precache) inside error-message strings. They
// are never fetched and are blocked by our connect-src 'self' CSP anyway, but
// we remove them so the shipped service worker contains zero external URLs.
//
// Only the generated SW files are touched; they contain no functional external
// URLs (precaching uses same-origin relative paths). The URL text is replaced
// with an empty string, leaving the surrounding string literal intact.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = "dist";
// Keep SVG/XML namespace URLs (not network requests).
const keep = /^https?:\/\/(?:www\.)?w3\.org\//;
const urlPattern = /https?:\/\/[^\s"'`)\\]+/g;

const targets = readdirSync(distDir).filter(
  (name) => name === "sw.js" || /^workbox-[\w-]+\.js$/.test(name),
);

let totalStripped = 0;
for (const name of targets) {
  const path = join(distDir, name);
  const source = readFileSync(path, "utf8");
  const stripped = [];
  const next = source.replace(urlPattern, (url) => {
    if (keep.test(url)) return url;
    stripped.push(url);
    return "";
  });
  if (stripped.length > 0) {
    writeFileSync(path, next);
    totalStripped += stripped.length;
    console.log(`strip-pwa-external-refs: ${name} -> removed ${stripped.length}`);
    for (const url of [...new Set(stripped)]) console.log(`  - ${url}`);
  }
}

if (targets.length === 0) {
  console.warn("strip-pwa-external-refs: no service worker files found in dist/");
} else if (totalStripped === 0) {
  console.log("strip-pwa-external-refs: no external URLs found");
}
