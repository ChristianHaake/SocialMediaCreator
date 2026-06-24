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

// Production security headers live in public/_headers, applied by the host at
// deploy time. `vite preview` — which the Playwright E2E suite runs against —
// does not read that file, so mirror the global header block here to keep local
// release checks aligned with production.
function productionPreviewHeaders(): Record<string, string> {
  const headersPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "public/_headers",
  );
  const match = readFileSync(headersPath, "utf8").match(
    /^\/\*\n(?<headers>(?:\s{2}.+\n)+)/m,
  );
  const headerLines = match?.groups?.headers;
  if (!headerLines) {
    throw new Error(`Global security headers not found in ${headersPath}`);
  }

  return Object.fromEntries(
    headerLines
      .trim()
      .split("\n")
      .map((line) => {
        const separator = line.indexOf(":");
        if (separator <= 0) {
          throw new Error(`Invalid header line in ${headersPath}: ${line}`);
        }
        const name = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();
        return [
          name,
          name.toLowerCase() === "content-security-policy"
            ? value.replace(/;\s*upgrade-insecure-requests\s*/i, "")
            : value,
        ];
      }),
  );
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
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
        globIgnores: [
          "brand/*.png",
          "favicon.svg",
          "manifest.webmanifest",
          "maskable-512x512.png",
          "pwa-*.png",
          "**/html2canvas*.js",
          "**/jspdf*.js",
          "**/purify*.js",
        ],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 4000000,
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
    headers: productionPreviewHeaders(),
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: "./src/test/setup.ts",
  },
});
