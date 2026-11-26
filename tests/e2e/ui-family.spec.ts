import { expect, test } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.route("https://static.cloudflareinsights.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    }),
  );
  await page.addInitScript(() => {
    localStorage.setItem("social-media-creator-locale", "de");
  });
});

for (const width of [320, 390, 768, 1440]) {
  test(`family workflow, keyboard and footer at ${width}px`, async ({
    page,
    browserName,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".intro h1")).toBeVisible();
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    await expect(
      page.getByRole("link", { name: "Zum Inhalt springen" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#workspace")).toBeFocused();
    expect(
      (await page.getByRole("button", { name: "English", exact: true }).boundingBox())!
        .height,
    ).toBeGreaterThanOrEqual(44);
    await page
      .getByLabel("Beschreibung", { exact: true })
      .fill("Unser Schulweg bleibt erhalten.");
    if (width <= 1023)
      await page.getByRole("button", { name: "Vorschau", exact: true }).click();
    await expect(page.locator(".photo-post")).toContainText(
      "Unser Schulweg bleibt erhalten.",
    );
    if (width <= 1023)
      await page
        .getByRole("button", { name: "Bearbeiten", exact: true })
        .click();
    const footer = page.getByRole("contentinfo");
    for (const name of [
      "Hilfe",
      "Über das Projekt",
      "AGB",
      "Spendier mir einen Kaffee",
      "Datenschutz",
      "Impressum",
    ]) {
      const link = footer.getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const github = footer.getByRole("link", {
      name: "GitHub",
    });
    await footer.getByRole("link", { name: "Spendier mir einen Kaffee" }).focus();
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    await expect(github).toBeFocused();
    await expect(github.locator(".repository-tooltip")).toBeVisible();
    expect(
      await github.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe("solid");
    const contrast = await page.evaluate(() => {
      const luminance = (value: string) => {
        const rgb = value
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((n) => n / 255)
          .map((n) =>
            n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4,
          );
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const ratio = (a: string, b: string) => {
        const x = luminance(a),
          y = luminance(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      const action = getComputedStyle(
        document.querySelector(".app-footer__coffee")!,
      );
      const field = getComputedStyle(document.querySelector(".field input")!);
      const body = getComputedStyle(document.body);
      const focus = getComputedStyle(
        document.querySelector(".app-footer__github")!,
      );
      return {
        action: ratio(action.color, action.backgroundColor),
        field: ratio(field.color, field.backgroundColor),
        boundary: ratio(field.borderColor, field.backgroundColor),
        focus: ratio(
          focus.outlineColor,
          body.backgroundColor === "rgba(0, 0, 0, 0)"
            ? getComputedStyle(document.documentElement).backgroundColor
            : body.backgroundColor,
        ),
      };
    });
    expect(contrast.action).toBeGreaterThanOrEqual(4.5);
    expect(contrast.field).toBeGreaterThanOrEqual(4.5);
    expect(contrast.boundary).toBeGreaterThanOrEqual(3);
    expect(contrast.focus).toBeGreaterThanOrEqual(3);
    await github.evaluate((el) => (el as HTMLElement).blur());
    await page.locator(".app-header").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath(`family-${width}.png`),
      fullPage: true,
    });
  });
}

test("internal pages and history preserve edits, focus and translated titles", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Beschreibung", { exact: true })
    .fill("Navigation behält diesen Inhalt.");
  const support = page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Spendier mir einen Kaffee", exact: true });
  await support.click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Unterstützen", exact: true }),
  ).toBeFocused();
  await expect(page).toHaveURL(/\/unterstuetzung$/);
  const coffee = page.getByRole("link", {
    name: "Kaffee spendieren",
    exact: true,
  });
  await expect(coffee).toHaveAttribute(
    "href",
    "https://buymeacoffee.com/Haake",
  );
  await expect(coffee).toHaveAttribute("rel", "noopener noreferrer");
  await expect(coffee).toHaveAttribute("target", "_blank");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page).toHaveTitle("Support · SocialMediaCreator");
  await expect(
    page.getByRole("article").getByRole("link", { name: "Buy me a coffee", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Back to the app", exact: true })
    .click();
  await expect(page.getByLabel("Caption", { exact: true })).toHaveValue(
    "Navigation behält diesen Inhalt.",
  );
  await expect(
    page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Buy me a coffee", exact: true }),
  ).toBeFocused();
  await expect(page).toHaveTitle("SocialMediaCreator");
  await page.goBack();
  await expect(
    page.getByRole("heading", { level: 1, name: "Support", exact: true }),
  ).toBeFocused();
  await page.goForward();
  await expect(page.locator("#workspace")).toBeFocused();
  await expect(page.getByLabel("Caption", { exact: true })).toHaveValue(
    "Navigation behält diesen Inhalt.",
  );
});

test("language menu works with unavailable preference storage", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("storage blocked");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByLabel(/Beschreibung|Caption/, { exact: true })
    .fill("Unveränderter Inhalt");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByLabel("Caption", { exact: true })).toHaveValue(
    "Unveränderter Inhalt",
  );
  expect(errors).toEqual([]);
});

test("information links inside dialogs preserve work and close the overlay", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Beschreibung", { exact: true })
    .fill("Auch aus Dialogen erhalten");
  await page
    .getByRole("button", { name: "Für Lehrkräfte", exact: true })
    .click();
  await page.getByRole("dialog").locator('a[href="/lehrkraefte"]').click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Hinweise für Lehrkräfte",
      exact: true,
    }),
  ).toBeFocused();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Zurück zur App", exact: true }).click();
  await page.getByRole("button", { name: "PNG", exact: true }).click();
  await page
    .getByRole("dialog")
    .locator('a[href="/nutzungsbedingungen"]')
    .click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "AGB",
      exact: true,
    }),
  ).toBeFocused();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Zurück zur App", exact: true }).click();
  await expect(page.getByLabel("Beschreibung", { exact: true })).toHaveValue(
    "Auch aus Dialogen erhalten",
  );
});

test("existing session schema restores edits after reload", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Installed headless WebKit rejects IndexedDB Blob writes with UnknownError, also on the baseline. Actual Safari recovery remains a release gate; backup fallback is tested separately.",
  );
  await page.goto("/");
  await page
    .getByLabel("Beschreibung", { exact: true })
    .fill("Gesicherter UI-Migrationsstand");
  await expect
    .poll(async () => {
      const data = await page.evaluate(async () => {
        const open = indexedDB.open("smc-session", 1);
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          open.onsuccess = () => resolve(open.result);
          open.onerror = () => reject(open.error);
        });
        try {
          const request = db
            .transaction("snapshots")
            .objectStore("snapshots")
            .get("photoPost");
          const record = await new Promise<{ blob?: Blob; bytes?: ArrayBuffer } | undefined>(
            (resolve, reject) => {
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            },
          );
          return record
            ? Array.from(new Uint8Array(record.bytes ?? await record.blob!.arrayBuffer()))
            : null;
        } finally {
          db.close();
        }
      });
      return data
        ? strFromU8(unzipSync(new Uint8Array(data))["project.json"])
        : "";
    })
    .toContain("Gesicherter UI-Migrationsstand");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Beschreibung", { exact: true })).toHaveValue(
    "Gesicherter UI-Migrationsstand",
  );
});

test("failed browser storage preserves work and offers a real project backup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      if (this.name === "snapshots")
        throw new DOMException(
          "Test storage unavailable",
          "QuotaExceededError",
        );
      return put.apply(this, args);
    };
    const clear = IDBObjectStore.prototype.clear;
    IDBObjectStore.prototype.clear = function () {
      if (this.name === "snapshots")
        throw new DOMException("Test clear unavailable", "UnknownError");
      return clear.call(this);
    };
  });
  await page.goto("/");
  await page
    .getByLabel("Beschreibung", { exact: true })
    .fill("Dateisicherung bei Speicherfehler");
  await expect(
    page.getByText("Die lokalen Änderungen konnten nicht gespeichert werden.", {
      exact: false,
    }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Projektdatei jetzt herunterladen", exact: true })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.smc$/);
  const archive = unzipSync(await readFile((await file.path())!));
  const manifest = JSON.parse(strFromU8(archive["project.json"]));
  expect(manifest.version).toBe(1);
  expect(manifest.config.version).toBe(6);
  expect(manifest.config.data.posts[0].caption).toBe(
    "Dateisicherung bei Speicherfehler",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Daten löschen", exact: true })
    .click();
  await expect(
    page.getByText("Die lokalen Daten konnten nicht vollständig gelöscht werden.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Beschreibung", { exact: true })).toHaveValue(
    "Dateisicherung bei Speicherfehler",
  );
  await expect(
    page.getByText("Lokale Daten gelöscht.", { exact: true }),
  ).toHaveCount(0);
});

test("installed app shell and support page remain usable offline", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Installed Playwright WebKit offline emulation fails SW navigations (microsoft/playwright#42775); real Safari offline remains a release gate.",
  );
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page
    .getByLabel("Beschreibung", { exact: true })
    .fill("Offline bearbeitbar");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Spendier mir einen Kaffee", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Unterstützen", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Zurück zur App", exact: true }).click();
  await expect(page.getByLabel("Beschreibung", { exact: true })).toHaveValue(
    "Offline bearbeitbar",
  );
});
