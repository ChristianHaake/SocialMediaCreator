import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

const icon = (src: string, sizes: string, type: string, purpose: string) => ({
  src,
  sizes,
  type,
  purpose,
});

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
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: "./src/test/setup.ts",
  },
});
