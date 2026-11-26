import { expect, test } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { AddressInfo } from "node:net";

const dist = resolve(process.cwd(), "dist");
const mimeTypes: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

test("an installed PWA offers its update on a content route and keeps local data", async ({
  page,
  context,
  browserName,
}) => {
  let serviceWorkerScript = await readFile(resolve(dist, "sw.js"));
  let server: Server | undefined;
  try {
    server = createServer(async (request, response) => {
      const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
      const relativePath =
        pathname === "/sw.js"
          ? "sw.js"
          : pathname.includes(".")
            ? pathname.slice(1)
            : "index.html";
      const filePath = resolve(dist, relativePath);
      if (!filePath.startsWith(dist + "/")) {
        response.writeHead(400).end();
        return;
      }
      try {
        const body =
          pathname === "/sw.js"
            ? serviceWorkerScript
            : await readFile(filePath);
        response.setHeader(
          "Content-Type",
          mimeTypes[extname(relativePath)] ?? "application/octet-stream",
        );
        if (pathname === "/sw.js" || relativePath === "index.html") {
          response.setHeader("Cache-Control", "no-store");
        }
        response.writeHead(200).end(body);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    await page.addInitScript(() =>
      localStorage.setItem("social-media-creator-locale", "de"),
    );
    await page.goto(`${origin}/unterstuetzung`);
    await expect(page.getByRole("heading", { name: "Unterstützen" })).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await page.evaluate(() => localStorage.setItem("pwa-update-test", "kept"));
    serviceWorkerScript = Buffer.concat([
      serviceWorkerScript,
      Buffer.from("\n// simulated next deploy\n"),
    ]);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });

    await expect(page.getByRole("button", { name: "Aktualisieren" })).toBeVisible();
    await page.getByRole("link", { name: "Zurück zur App" }).click();
    await page.getByLabel("Benutzername").fill("pwa_update_test");
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("button", { name: "Aktualisieren" }).click(),
    ]);
    expect(
      await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => !r?.waiting)),
    ).toBe(true);
    await expect(page.getByLabel("Benutzername")).toHaveValue("pwa_update_test");
    expect(await page.evaluate(() => localStorage.getItem("pwa-update-test"))).toBe("kept");

    if (browserName === "chromium") {
      await context.setOffline(true);
      await page.reload();
      await expect(page.getByLabel("Benutzername")).toHaveValue("pwa_update_test");
    }
  } finally {
    await context.setOffline(false).catch(() => undefined);
    const openServer = server;
    if (openServer) {
      await new Promise<void>((resolve) => openServer.close(() => resolve()));
    }
  }
});

test("legacy Blob autosaves still restore after the storage change", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "This legacy fixture needs IndexedDB Blob writes.");
  await page.addInitScript(() =>
    localStorage.setItem("social-media-creator-locale", "de"),
  );
  await page.goto("/");
  await page.getByLabel("Benutzername").fill("legacy_blob_project");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Speichern" }).click();
  const archive = await readFile(await (await downloadPromise).path());

  await page.evaluate(
    (bytes) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("smc-session", 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("snapshots");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("snapshots", "readwrite");
          transaction.objectStore("snapshots").put(
            {
              blob: new Blob([new Uint8Array(bytes)], {
                type: "application/zip",
              }),
              savedAt: Date.now(),
            },
            "photoPost",
          );
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
      }),
    Array.from(archive),
  );

  await page.reload();
  await expect(page.getByLabel("Benutzername")).toHaveValue("legacy_blob_project");
});
