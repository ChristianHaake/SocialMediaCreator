import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

const icon = (src: string, sizes: string, type: string, purpose: string) => ({
  src,
  sizes,
  type,
  purpose,
});

// The production Content-Security-Policy lives in public/_headers, applied by
// the host at deploy time. `vite preview` — which the Playwright E2E suite runs
// against — does not read that file, so without this the suite runs with no CSP
// and misses regressions like connect-src dropping blob: (breaks image export).
// Derive the header from the same file so the policy can never drift.
function productionContentSecurityPolicy(): string {
  const headersPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "public/_headers",
  );
  const match = readFileSync(headersPath, "utf8").match(
    /^\s*Content-Security-Policy:\s*(.+)$/m,
  );
  if (!match) {
    throw new Error(`Content-Security-Policy not found in ${headersPath}`);
  }
  return match[1].trim();
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // External registration script — CSP is script-src 'self' (no unsafe-inline).
      injectRegister: "script-defer",
      includeAssets: ["favicon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "SocialMediaCreator",
        short_name: "SocialMediaCreator",
        description:
          "Fiktive digitale Kommunikationsformate lokal im Browser erstellen.",
        lang: "de",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f3f5f8",
        theme_color: "#245dcc",
        icons: [
          icon("/pwa-192x192.png", "192x192", "image/png", "any"),
          icon("/pwa-512x512.png", "512x512", "image/png", "any"),
          icon("/maskable-512x512.png", "512x512", "image/png", "maskable"),
          icon("/favicon.svg", "any", "image/svg+xml", "any"),
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest,woff2}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
  preview: {
    // Enforce the real production CSP so E2E export tests catch policy
    // regressions (e.g. connect-src must keep blob: for html-to-image).
    // `upgrade-insecure-requests` is dropped here only: vite preview serves over
    // plain http on localhost, and WebKit (unlike Chromium/Firefox) upgrades
    // http://127.0.0.1 to https for that directive, which fails the TLS
    // handshake and breaks the app — so it would block all WebKit E2E. The
    // directive stays in public/_headers, where production is served over https.
    headers: {
      "Content-Security-Policy": productionContentSecurityPolicy().replace(
        /;\s*upgrade-insecure-requests\s*/i,
        "",
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: "./src/test/setup.ts",
  },
});
