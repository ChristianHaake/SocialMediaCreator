import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: true,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: process.env.CI
      ? "npm run preview -- --host 127.0.0.1"
      : "npm run build && npm run preview -- --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
