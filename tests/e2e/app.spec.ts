import { expect, test } from "@playwright/test";

test("module tabs support keyboard navigation and preserve state", async ({
  page,
}) => {
  await page.goto("/");

  const username = page.getByLabel("Benutzername");
  await username.fill("browser_test");

  const photoTab = page.getByRole("tab", { name: "Foto-Post" });
  const messengerTab = page.getByRole("tab", { name: "Messenger-Chat" });
  const microblogTab = page.getByRole("tab", { name: "Mikroblog" });

  await photoTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(messengerTab).toBeFocused();
  await expect(messengerTab).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("End");
  await expect(microblogTab).toBeFocused();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Formuliere deine Mikroblog-Beiträge.",
    }),
  ).toBeVisible();

  await page.keyboard.press("Home");
  await expect(photoTab).toBeFocused();
  await expect(username).toHaveValue("browser_test");
});

test("teacher dialog traps and restores focus", async ({ page }) => {
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Für Lehrkräfte" });
  await trigger.click();

  const close = page.getByRole("button", { name: "Dialog schließen" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Hinweise für Lehrkräfte" }),
  ).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("all modules export images and configuration files", async ({ page }) => {
  await page.goto("/");

  for (const moduleName of ["Foto-Post", "Messenger-Chat", "Mikroblog"]) {
    await page.getByRole("tab", { name: moduleName }).click();

    const configDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Speichern" }).click();
    expect((await configDownload).suggestedFilename()).toMatch(
      /social-media-creator-.+\.json/,
    );

    const imageDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "PNG" }).click();
    expect((await imageDownload).suggestedFilename()).toMatch(
      /social-media-creator-.+\.png/,
    );
  }
});

test("configuration import validates before replacing editor state", async ({
  page,
}) => {
  await page.goto("/");
  const username = page.getByLabel("Benutzername");
  await username.fill("bleibt_erhalten");

  const input = page.locator('input[type="file"][accept*="json"]');
  await input.setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"mockup-studio-config","version":1}'),
  });

  await expect(page.getByRole("alert")).toContainText("unvollständig");
  await expect(username).toHaveValue("bleibt_erhalten");

  await input.setInputFiles({
    name: "microblog.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "mockup-studio-config",
        version: 1,
        module: "microblog",
        data: {
          displayName: "Importiertes Projekt",
          handle: "import_test",
          text: "Importierter Beitrag",
          date: "2026-06-11",
          time: "12:30",
          showDate: true,
          showTime: true,
          replies: 1,
          reposts: 2,
          likes: 3,
        },
      }),
    ),
  });

  await expect(page.getByRole("tab", { name: "Mikroblog" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("Anzeigename")).toHaveValue(
    "Importiertes Projekt",
  );
  await expect(
    page.locator(".microblog-preview").getByText("Importierter Beitrag", {
      exact: true,
    }),
  ).toBeVisible();
});

test("photo and microblog feeds support multiple posts with comments", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Beitrag", exact: true }).click();
  await page.getByLabel("Beschreibung").fill("Zweiter Foto-Beitrag");
  await page.getByRole("button", { name: "Kommentar", exact: true }).click();
  await page.getByLabel("Kommentartext").last().fill("Foto-Kommentar");

  await expect(page.locator(".photo-post")).toHaveCount(2);
  await expect(page.locator(".photo-post").nth(1)).toContainText(
    "Zweiter Foto-Beitrag",
  );
  await expect(page.locator(".photo-post").nth(1)).toContainText(
    "Foto-Kommentar",
  );

  await page.getByRole("tab", { name: "Mikroblog" }).click();
  await page.getByRole("button", { name: "Beitrag", exact: true }).click();
  await page.getByLabel("Beitragstext").fill("Zweiter Mikroblog-Beitrag");
  await page.getByRole("button", { name: "Kommentar", exact: true }).click();
  await page.getByLabel("Kommentartext").last().fill("Mikroblog-Kommentar");

  await expect(page.locator(".microblog-preview")).toHaveCount(2);
  await expect(page.locator(".microblog-preview").nth(1)).toContainText(
    "Zweiter Mikroblog-Beitrag",
  );
  await expect(page.locator(".microblog-preview").nth(1)).toContainText(
    "Mikroblog-Kommentar",
  );
});

test("image uploads reject invalid files and accept decodable images", async ({
  page,
}) => {
  await page.goto("/");

  const input = page.locator("#profile-image");
  await input.setInputFiles({
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.getByRole("alert")).toContainText("kein gültiges");

  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  await input.setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: onePixelPng,
  });

  await expect(page.getByText("pixel.png")).toBeVisible();
  await expect(page.getByRole("alert")).toBeHidden();
});

test("core workflows do not request network resources after loading", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.getByLabel("Benutzername").fill("offline_test");
  await page.getByRole("tab", { name: "Messenger-Chat" }).click();
  await page
    .getByPlaceholder("Was soll in der Nachricht stehen?")
    .fill("Lokaler Test");
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await page.getByRole("tab", { name: "Mikroblog" }).click();
  await page.getByLabel("Beitragstext").fill("Keine Netzwerkverbindung nötig.");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG" }).click();
  await download;

  expect(requests).toEqual([]);
});

test("mobile editor and preview work at 320 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await page.getByRole("tab", { name: "Mikroblog" }).click();
  await page.getByLabel("Beitragstext").fill("Mobile Vorschau");

  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBe(dimensions.innerWidth);

  await page.getByRole("button", { name: "Vorschau" }).click();
  await expect(page.getByRole("article")).toContainText("Mobile Vorschau");
  await expect(page.getByRole("button", { name: "PNG" })).toBeVisible();
});
