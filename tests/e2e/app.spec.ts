import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

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

test("feed posts support pointer and keyboard sorting", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Beitrag", exact: true }).click();
  await page.getByLabel("Beschreibung").fill("Per Drag verschoben");

  const handles = page.getByRole("button", { name: /Beitrag \d verschieben/ });
  await expect(handles).toHaveCount(2);
  const secondHandle = handles.nth(1);
  await secondHandle.scrollIntoViewIfNeeded();

  await secondHandle.focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".post-selector-list")).toHaveAttribute(
    "aria-busy",
    "true",
  );
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");
  await expect(page.locator(".photo-post").nth(0)).toContainText(
    "Per Drag verschoben",
  );

  const reorderedHandles = page.getByRole("button", {
    name: /Beitrag \d verschieben/,
  });
  const reorderedFirst = reorderedHandles.nth(0);
  const reorderedSecond = reorderedHandles.nth(1);
  await reorderedFirst.scrollIntoViewIfNeeded();
  const firstBox = await reorderedFirst.boundingBox();
  const secondBox = await reorderedSecond.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  await page.mouse.move(
    firstBox!.x + firstBox!.width / 2,
    firstBox!.y + firstBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    firstBox!.x + firstBox!.width / 2,
    firstBox!.y + firstBox!.height / 2 + 12,
    { steps: 4 },
  );
  await page.mouse.move(
    secondBox!.x + secondBox!.width / 2,
    secondBox!.y + secondBox!.height / 2,
    { steps: 12 },
  );
  await page.mouse.up();
  await expect(page.locator(".photo-post").nth(1)).toContainText(
    "Per Drag verschoben",
  );
});

test("feed posts support touch sorting", async ({
  browser,
  browserName,
}, testInfo) => {
  test.skip(browserName !== "chromium", "Touch input is covered in Chromium.");
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL as string,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Beitrag", exact: true }).click();
  await page.getByLabel("Beschreibung").fill("Per Touch verschoben");

  const handles = page.getByRole("button", { name: /Beitrag \d verschieben/ });
  await expect(handles).toHaveCount(2);
  const first = handles.nth(0);
  const second = handles.nth(1);
  await second.scrollIntoViewIfNeeded();
  const firstBox = await first.boundingBox();
  const secondBox = await second.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();

  const touchX = secondBox!.x + secondBox!.width / 2;
  const startY = secondBox!.y + secondBox!.height / 2;
  const endY = firstBox!.y + firstBox!.height / 2;
  await second.dispatchEvent("touchstart", {
    changedTouches: [{ identifier: 1, clientX: touchX, clientY: startY }],
    targetTouches: [{ identifier: 1, clientX: touchX, clientY: startY }],
    touches: [{ identifier: 1, clientX: touchX, clientY: startY }],
  });
  await page.waitForTimeout(180);
  await expect(page.locator(".post-selector-list")).toHaveAttribute(
    "aria-busy",
    "true",
  );
  for (const progress of [0.15, 0.35, 0.6, 0.85, 1]) {
    const clientY = startY + (endY - startY) * progress;
    await second.dispatchEvent("touchmove", {
      changedTouches: [{ identifier: 1, clientX: touchX, clientY }],
      targetTouches: [{ identifier: 1, clientX: touchX, clientY }],
      touches: [{ identifier: 1, clientX: touchX, clientY }],
    });
  }
  await second.dispatchEvent("touchend", {
    changedTouches: [{ identifier: 1, clientX: touchX, clientY: endY }],
    targetTouches: [],
    touches: [],
  });

  await expect(page.locator(".photo-post").nth(0)).toContainText(
    "Per Touch verschoben",
  );
  await context.close();
});

test("microblog feed and thread layouts follow the selected order", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Mikroblog" }).click();
  await expect(page.locator(".microblog-feed")).toHaveClass(
    /microblog-feed--feed/,
  );

  await page.getByLabel("Timeline-Darstellung").selectOption("thread");
  await expect(page.locator(".microblog-feed")).toHaveClass(
    /microblog-feed--thread/,
  );

  await page.getByRole("button", { name: "Beitrag", exact: true }).click();
  await page.getByLabel("Beitragstext").fill("Zweiter Thread-Beitrag");
  await page
    .getByRole("button", { name: "Beitrag 2 nach oben verschieben" })
    .click();
  await expect(page.locator(".microblog-preview").nth(0)).toContainText(
    "Zweiter Thread-Beitrag",
  );
});

test("two-profile messenger supports sender, timestamp, seen status and themes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Messenger-Chat" }).click();

  await page.getByLabel("Name").nth(0).fill("Linkes Profil");
  await page.getByLabel("Name").nth(1).fill("Rechtes Profil");
  await page.getByLabel("Online-Status").nth(0).fill("beschäftigt");
  await page
    .locator(".segmented-control label")
    .filter({ hasText: "Dark" })
    .click();
  await expect(page.locator(".messenger-preview")).toHaveClass(/theme-dark/);

  await page.getByLabel("Absender").nth(0).selectOption({
    label: "Rechtes Profil",
  });
  await page
    .getByPlaceholder("Was soll in der Nachricht stehen?")
    .fill("Nachricht von rechts");
  await page.getByLabel("Zeitstempel").nth(0).fill("vor 1 Minute");
  await page.getByLabel("Als gelesen oder gesehen markieren").check();
  await page.getByRole("button", { name: "Hinzufügen" }).click();

  const lastMessage = page.locator(".message-row").last();
  await expect(lastMessage).toHaveClass(/message-row--right/);
  await expect(lastMessage).toContainText("Nachricht von rechts");
  await expect(lastMessage).toContainText("vor 1 Minute");
  await expect(lastMessage.getByText("Gesehen")).toBeAttached();
});

test("carousel, video simulation, reply chains and comment view work together", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Medium", exact: true }).click();
  await page.getByLabel("Medientyp").selectOption("video");
  await page.getByLabel("Videolänge").fill("0:42");
  await page.getByLabel("Aufrufe").fill("1.240");
  await expect(page.locator(".carousel-counter").last()).toHaveText("2/2");
  await expect(page.locator(".video-meta")).toContainText(
    "1.240 Aufrufe · 0:42",
  );

  await page.getByRole("button", { name: "Antwort", exact: true }).click();
  await page.getByLabel("Antworttext").last().fill("Neue verschachtelte Antwort");
  await page.getByLabel("Darstellungsmodus").selectOption("comments");

  await expect(page.locator(".photo-post")).toHaveClass(
    /photo-post--comments/,
  );
  await expect(page.locator(".photo-post__media-list")).toBeHidden();
  await expect(page.locator(".comment-thread__item--reply").last()).toContainText(
    "Neue verschachtelte Antwort",
  );
});

test("PDF export and local image verification are available", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Beitrag", exact: true }).click();
  await page.getByRole("button", { name: "Medium", exact: true }).click();

  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF" }).click();
  const pdf = await pdfDownload;
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  const pdfPath = await pdf.path();
  expect(pdfPath).not.toBeNull();
  const pdfText = await readFile(pdfPath!, "latin1");
  expect(pdfText.match(/\/Type \/Page\b/g)).toHaveLength(3);

  const imageDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG" }).click();
  const image = await imageDownload;
  const imagePath = await image.path();
  expect(imagePath).not.toBeNull();

  await page.goto("/verifizieren");
  await page.locator('input[type="file"]').setInputFiles(imagePath!);
  await expect(
    page.getByRole("heading", { name: "Gültiger Herkunftsmarker" }),
  ).toBeVisible();
  await expect(page.getByText("kein fälschungssicherer Echtheitsbeweis")).toBeVisible();
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
