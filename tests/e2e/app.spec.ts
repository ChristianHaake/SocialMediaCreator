import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import { fieldLimits } from "../../src/domain/constraints";
import { defaultMessenger } from "../../src/domain/types";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem("social-media-creator-locale")) {
      window.localStorage.setItem("social-media-creator-locale", "de");
    }
    if (!window.localStorage.getItem("social-media-creator-export-consent")) {
      window.localStorage.setItem(
        "social-media-creator-export-consent",
        JSON.stringify({
          version: 1,
          acceptedAt: "2026-06-12T00:00:00.000Z",
        }),
      );
    }
  });
});

async function openSection(page: Page, title: string) {
  const details = page
    .locator("details.editor-disclosure")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  if ((await details.count()) === 0) return;
  if ((await details.getAttribute("open")) === null) {
    await details.locator("summary").click();
  }
}

async function continueExport(page: Page) {
  await expect(
    page.getByRole("dialog", { name: "Hinweis vor dem Export" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Export fortsetzen", exact: true })
    .click();
}

async function imageHasPixelNearColor(
  page: Page,
  bytes: Uint8Array,
  expected: { red: number; green: number; blue: number },
  mimeType = "image/png",
) {
  return page.evaluate(
    async ({ data, expectedColor, type }) => {
      const blob = new Blob([new Uint8Array(data)], { type });
      const url = URL.createObjectURL(blob);
      try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () =>
            reject(new Error("Downloaded image did not decode."));
          image.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas context unavailable.");
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        let matchedPixels = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          if (
            Math.abs(pixels[index] - expectedColor.red) < 48 &&
            Math.abs(pixels[index + 1] - expectedColor.green) < 48 &&
            Math.abs(pixels[index + 2] - expectedColor.blue) < 48 &&
            pixels[index + 3] > 240
          ) {
            matchedPixels += 1;
          }
        }
        return {
          found: matchedPixels > 0,
          height: canvas.height,
          matchedPixels,
          width: canvas.width,
        };
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    { data: Array.from(bytes), expectedColor: expected, type: mimeType },
  );
}

async function createSolidColorPng(
  page: Page,
  color: { red: number; green: number; blue: number },
  size = 128,
) {
  const base64 = await page.evaluate(
    ({ colorValue, imageSize }) => {
      const canvas = document.createElement("canvas");
      canvas.width = imageSize;
      canvas.height = imageSize;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas context unavailable.");
      context.fillStyle = `rgb(${colorValue.red}, ${colorValue.green}, ${colorValue.blue})`;
      context.fillRect(0, 0, imageSize, imageSize);
      return canvas.toDataURL("image/png").split(",")[1];
    },
    { colorValue: color, imageSize: size },
  );
  return Buffer.from(base64, "base64");
}

test("education notice and public guidance pages are visible and bilingual", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  const notice = page.getByText(
    "Diese Simulation dient ausschließlich dem Bildungszweck.",
  );
  await expect(notice).toBeVisible();
  const noticeBox = await notice.boundingBox();
  expect(noticeBox).not.toBeNull();
  expect(noticeBox!.y + noticeBox!.height).toBeLessThanOrEqual(720);
  await expect(
    page
      .getByRole("complementary")
      .getByRole("link", { name: "Verantwortungsvoller Einsatz" }),
  ).toBeVisible();

  await page.goto("/lehrkraefte");
  await expect(
    page.getByRole("heading", { name: "Hinweise für Lehrkräfte" }),
  ).toBeVisible();
  await expect(page.getByText("Unterrichtsszenario 5: Plattformmechaniken")).toBeVisible();
  await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Information for educators" }),
  ).toBeVisible();
  await expect(page.getByText("Scenario 5: Platform mechanics")).toBeVisible();
});

test("first export requires consent and every export shows the notice", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    window.localStorage.removeItem("social-media-creator-export-consent"),
  );

  await page.getByRole("button", { name: "PNG" }).click();
  const continueButton = page.getByRole("button", {
    name: "Export fortsetzen",
    exact: true,
  });
  await expect(continueButton).toBeDisabled();
  await page
    .getByLabel(
      "Ich habe die Nutzungsbedingungen gelesen und verwende den Export verantwortungsvoll.",
    )
    .check();

  const firstDownload = page.waitForEvent("download");
  await continueButton.click();
  await firstDownload;

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "PNG" }).click();
  await expect(
    page.getByRole("dialog", { name: "Hinweis vor dem Export" }),
  ).toBeVisible();
  await expect(
    page.getByLabel(
      "Ich habe die Nutzungsbedingungen gelesen und verwende den Export verantwortungsvoll.",
    ),
  ).toHaveCount(0);
  const secondDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export fortsetzen", exact: true })
    .click();
  await secondDownload;
});

test("language switch preserves content and exports locale in config v6", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Benutzername").fill("custom_account");
  await page.getByRole("button", { name: "EN", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Create your photo posts." }),
  ).toBeVisible();
  await expect(page.getByLabel("Username")).toHaveValue("custom_account");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".photo-post__date")).toHaveText("06/11/2026");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const archive = unzipSync(new Uint8Array(await readFile(path!)));
  const manifest = JSON.parse(strFromU8(archive["project.json"]));
  const config = manifest.config;
  expect(config.version).toBe(6);
  expect(config.locale).toBe("en");

  await page.goto("/hilfe");
  await expect(page.getByRole("heading", { name: "Help" })).toBeVisible();
  await expect(page.getByText("Quick start")).toBeVisible();
});

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

  const teacherDialog = page.getByRole("dialog", {
    name: "Hinweise für Lehrkräfte",
  });
  const close = page.getByRole("button", { name: "Dialog schließen" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  expect(
    await teacherDialog.locator(".info-dialog").evaluate((dialog) =>
      dialog.contains(document.activeElement),
    ),
  ).toBe(true);

  await page.keyboard.press("Escape");
  await expect(teacherDialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("all modules export images and project archives", async ({ page }) => {
  await page.goto("/");

  for (const moduleName of ["Foto-Post", "Messenger-Chat", "Mikroblog"]) {
    await page.getByRole("tab", { name: moduleName }).click();

    const configDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Speichern" }).click();
    expect((await configDownload).suggestedFilename()).toMatch(
      /social-media-creator-.+\.smc/,
    );

    const imageDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "PNG" }).click();
    await continueExport(page);
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

  await expect(page.getByRole("alert")).toContainText(
    "keine SocialMediaCreator-Konfiguration",
  );
  await expect(username).toHaveValue("bleibt_erhalten");

  await input.setInputFiles({
    name: "microblog.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "social-media-creator-config",
        version: 5,
        module: "microblog",
        data: {
          theme: "light",
          layoutMode: "feed",
          sortOrder: "newest",
          activePostId: "import-post",
          posts: [
            {
              id: "import-post",
              displayName: "Importiertes Projekt",
              handle: "import_test",
              text: "Importierter Beitrag",
              date: "2026-06-11",
              time: "12:30",
              viewMode: "post",
              replies: 1,
              reposts: 2,
              likes: 3,
              comments: [],
            },
          ],
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

  await input.setInputFiles({
    name: "microblog-en.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "social-media-creator-config",
        version: 6,
        locale: "en",
        module: "microblog",
        data: {
          theme: "light",
          layoutMode: "feed",
          sortOrder: "newest",
          activePostId: "english-post",
          posts: [
            {
              id: "english-post",
              displayName: "Imported project",
              handle: "import_test",
              text: "Imported post",
              date: "2026-06-11",
              time: "12:30",
              viewMode: "post",
              replies: 1,
              reposts: 2,
              likes: 3,
              comments: [],
            },
          ],
        },
      }),
    ),
  });

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Write your microblog posts." }),
  ).toBeVisible();
  await expect(page.getByLabel("Display name")).toHaveValue("Imported project");
  await expect(page.getByRole("status")).toContainText(
    "Project loaded.",
  );
});

test("project archives restore optimized images", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Beschreibung").fill("Archiv ");
  await page.getByRole("button", { name: "Emoji auswählen" }).click();
  await page.getByRole("button", { name: "Emoji einfügen 🙂" }).click();
  await expect(page.getByLabel("Beschreibung")).toHaveValue("Archiv 🙂");
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  await page.locator("#profile-image").setInputFiles({
    name: "profil-ä.png",
    mimeType: "image/png",
    buffer: onePixelPng,
  });
  await expect(page.getByText("profil-ä.png")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Speichern" }).click();
  const download = await downloadPromise;
  const archivePath = await download.path();
  expect(download.suggestedFilename()).toMatch(/\.smc$/);
  expect(archivePath).not.toBeNull();
  const archiveBytes = unzipSync(new Uint8Array(await readFile(archivePath!)));
  const archiveManifest = JSON.parse(
    strFromU8(archiveBytes["project.json"]),
  );
  expect(archiveManifest.media).toHaveLength(1);

  await page.reload();
  await expect(page.locator("img.photo-post__avatar")).toHaveCount(0);
  await page
    .locator('input[type="file"][accept*=".smc"]')
    .setInputFiles(archivePath!);
  await expect(page.locator("img.photo-post__avatar")).toHaveCount(1);
  await expect(page.getByLabel("Beschreibung")).toHaveValue("Archiv 🙂");
  await expect(page.locator(".photo-post")).toContainText("Archiv 🙂");
  await expect(page.getByText("profil-ä.png")).toBeVisible();
});

test("photo and microblog feeds support multiple posts with comments", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("button", { name: "Neuen Beitrag hinzufügen" })
    .click();
  await page.getByLabel("Beschreibung").fill("Zweiter Foto-Beitrag");
  await openSection(page, "Kommentare und Antworten");
  await page.getByRole("button", { name: "Kommentar", exact: true }).click();
  await page.getByLabel("Kommentartext").last().fill("Foto-Kommentar");

  await expect(page.locator(".photo-post")).toHaveCount(2);
  const photoPost = page
    .locator(".photo-post")
    .filter({ hasText: "Zweiter Foto-Beitrag" });
  await expect(photoPost).toContainText("Foto-Kommentar");

  await page.getByRole("tab", { name: "Mikroblog" }).click();
  await page
    .getByRole("button", { name: "Neuen Beitrag hinzufügen" })
    .click();
  await page.getByLabel("Beitragstext").fill("Zweiter Mikroblog-Beitrag");
  await openSection(page, "Kommentare und Antworten");
  await page.getByRole("button", { name: "Kommentar", exact: true }).click();
  await page.getByLabel("Kommentartext").last().fill("Mikroblog-Kommentar");

  await expect(page.locator(".microblog-preview")).toHaveCount(2);
  const microblogPost = page
    .locator(".microblog-preview")
    .filter({ hasText: "Zweiter Mikroblog-Beitrag" });
  await expect(microblogPost).toContainText("Mikroblog-Kommentar");
});

test("preview posts can be selected with keyboard activation", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("button", { name: "Neuen Beitrag hinzufügen" })
    .click();
  await expect(page.getByLabel("Benutzername")).toHaveValue("neuer_account");

  const originalPhotoPost = page.locator(".photo-post").last();
  await originalPhotoPost.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Benutzername")).toHaveValue("projekt_kurs");
  await expect(originalPhotoPost).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("tab", { name: "Mikroblog" }).click();
  await page
    .getByRole("button", { name: "Neuen Beitrag hinzufügen" })
    .click();
  await expect(page.getByLabel("Anzeigename")).toHaveValue("Neues Profil");

  const originalMicroblogPost = page.locator(".microblog-preview").last();
  await originalMicroblogPost.focus();
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Anzeigename")).toHaveValue("Medienprojekt");
  await expect(originalMicroblogPost).toHaveAttribute("aria-pressed", "true");
});

test("photo posts follow date, optional time and timeline order", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("button", { name: "Neuen Beitrag hinzufügen" })
    .click();
  await page.getByLabel("Beschreibung").fill("Chronologisch neuer");
  await page.getByLabel("Datum").fill("2026-06-12");
  await page.getByLabel("Uhrzeit (optional)").fill("08:30");
  await expect(page.getByLabel("Datum")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  await expect(page.getByLabel("Uhrzeit (optional)")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  await expect(page.locator(".photo-post").nth(0)).toContainText(
    "Chronologisch neuer",
  );

  await page.getByLabel("Timeline-Reihenfolge").selectOption("oldest");
  await expect(page.locator(".photo-post").nth(1)).toContainText(
    "Chronologisch neuer",
  );
  await expect(page.locator(".photo-post").nth(1)).toContainText(
    "12.06.2026 · 08:30",
  );
});

test("single-media photo exports keep the media area full width", async ({
  page,
}) => {
  await page.goto("/");

  const sizes = await page.locator(".photo-feed").evaluate((feed) => {
    const mediaList = feed.querySelector(".photo-post__media-list");
    const media = feed.querySelector(".photo-post__media");
    if (!(mediaList instanceof HTMLElement) || !(media instanceof HTMLElement)) {
      throw new Error("Photo media markup missing.");
    }
    feed.setAttribute("data-exporting", "true");
    const listBox = mediaList.getBoundingClientRect();
    const mediaBox = media.getBoundingClientRect();
    feed.removeAttribute("data-exporting");
    return {
      listWidth: Math.round(listBox.width),
      mediaWidth: Math.round(mediaBox.width),
    };
  });

  expect(sizes.mediaWidth).toBe(sizes.listWidth);
});

test("photo image exports include uploaded media pixels", async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName === "firefox",
    "Firefox download events are covered by lighter export tests; Safari PNG coverage runs in WebKit.",
  );

  await page.goto("/");
  const redPng = await createSolidColorPng(
    page,
    { red: 255, green: 0, blue: 0 },
    128,
  );
  const greenPng = await createSolidColorPng(
    page,
    { red: 0, green: 255, blue: 0 },
    128,
  );
  const bluePng = await createSolidColorPng(
    page,
    { red: 0, green: 0, blue: 255 },
    128,
  );

  await page.locator("#profile-image").setInputFiles({
    name: "green-profile.png",
    mimeType: "image/png",
    buffer: greenPng,
  });
  await page.locator("#post-image").setInputFiles({
    name: "red.png",
    mimeType: "image/png",
    buffer: redPng,
  });
  await openSection(page, "Kommentare und Antworten");
  await page.getByRole("button", { name: "Kommentar", exact: true }).click();
  await page
    .locator('input[id^="photo-comment-image-"]')
    .last()
    .setInputFiles({
      name: "blue-comment.png",
      mimeType: "image/png",
      buffer: bluePng,
    });
  await expect(page.locator(".photo-post__media img")).toBeVisible();
  await expect(page.locator(".comment-thread img")).toBeVisible();

  for (const format of ["PNG", "JPG"] as const) {
    const imageDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: format }).click();
    await continueExport(page);
    const image = await imageDownload;
    const path = await image.path();
    expect(path).not.toBeNull();
    const bytes = new Uint8Array(await readFile(path!));

    const pixelResult = await imageHasPixelNearColor(
      page,
      bytes,
      { red: 255, green: 0, blue: 0 },
      format === "PNG" ? "image/png" : "image/jpeg",
    );
    expect(
      pixelResult.matchedPixels,
      `${format} export did not contain uploaded red media pixels. Result: ${JSON.stringify(pixelResult)}`,
    ).toBeGreaterThan(0);

    if (format === "PNG") {
      const profilePixelResult = await imageHasPixelNearColor(page, bytes, {
        red: 0,
        green: 255,
        blue: 0,
      });
      expect(
        profilePixelResult.matchedPixels,
        `PNG export did not contain uploaded green profile pixels. Result: ${JSON.stringify(profilePixelResult)}`,
      ).toBeGreaterThan(0);

      const commentPixelResult = await imageHasPixelNearColor(page, bytes, {
        red: 0,
        green: 0,
        blue: 255,
      });
      expect(
        commentPixelResult.matchedPixels,
        `PNG export did not contain uploaded blue comment pixels. Result: ${JSON.stringify(commentPixelResult)}`,
      ).toBeGreaterThan(0);
    }
  }
});

test("carousel image export uses the selected medium", async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName === "firefox",
    "Firefox download events are covered by lighter export tests; Safari PNG coverage runs in WebKit.",
  );

  await page.goto("/");
  const redPng = await createSolidColorPng(
    page,
    { red: 255, green: 0, blue: 0 },
    128,
  );
  const greenPng = await createSolidColorPng(
    page,
    { red: 0, green: 255, blue: 0 },
    128,
  );
  await openSection(page, "Beitragsbild");
  await page.locator("#post-image").setInputFiles({
    name: "red-1.png",
    mimeType: "image/png",
    buffer: redPng,
  });
  await page.getByRole("button", { name: "Bild", exact: true }).click();
  await page.locator("#post-image").setInputFiles({
    name: "green-2.png",
    mimeType: "image/png",
    buffer: greenPng,
  });
  await expect(page.locator(".photo-post__media img")).toHaveCount(2);

  const imageDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG" }).click();
  await continueExport(page);
  const image = await imageDownload;
  const path = await image.path();
  expect(path).not.toBeNull();
  const bytes = new Uint8Array(await readFile(path!));

  const pixelResult = await imageHasPixelNearColor(page, bytes, {
    red: 0,
    green: 255,
    blue: 0,
  });
  expect(
    pixelResult.matchedPixels,
    `Carousel PNG export did not contain the selected green media pixels. Result: ${JSON.stringify(pixelResult)}`,
  ).toBeGreaterThan(0);
});

test("microblog feed and thread layouts follow the selected order", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Mikroblog" }).click();
  await expect(page.locator(".microblog-feed")).toHaveClass(
    /microblog-feed--feed/,
  );

  await expect(page.getByLabel("Timeline-Darstellung")).toBeVisible();
  await page.getByLabel("Timeline-Darstellung").selectOption("thread");
  await expect(page.locator(".microblog-feed")).toHaveClass(
    /microblog-feed--thread/,
  );

  await page
    .getByRole("button", { name: "Neuen Beitrag hinzufügen" })
    .click();
  await page.getByLabel("Beitragstext").fill("Zweiter Thread-Beitrag");
  await page.getByLabel("Datum").focus();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.type("2026-06-12");
  await page.getByLabel("Uhrzeit (optional)").fill("15:00");
  await expect(page.getByLabel("Datum")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  await expect(page.getByLabel("Uhrzeit (optional)")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  await expect(page.locator(".microblog-preview").nth(0)).toContainText(
    "Zweiter Thread-Beitrag",
  );
  await expect(page.locator(".microblog-preview").nth(0)).toContainText(
    "12.06.2026 · 15:00",
  );
  await page.getByLabel("Timeline-Reihenfolge").selectOption("oldest");
  await expect(page.locator(".microblog-preview").nth(1)).toContainText(
    "Zweiter Thread-Beitrag",
  );
});

test("two-profile messenger supports sender, timestamp, seen status and themes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Messenger-Chat" }).click();

  await openSection(page, "Chat-Profile");
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

test("messenger editor blocks messages beyond the domain limit", async ({
  page,
}) => {
  await page.goto("/");
  const config = {
    format: "social-media-creator-config",
    version: 6,
    locale: "de",
    module: "messenger",
    data: {
      ...defaultMessenger,
      messages: Array.from(
        { length: fieldLimits.messenger.messages },
        (_, index) => ({
          ...defaultMessenger.messages[0],
          id: `message-${index}`,
        }),
      ),
    },
  };

  await page
    .locator('input[type="file"][accept*=".smc"]')
    .setInputFiles({
      name: "messenger-limit.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(config)),
    });

  await expect(page.getByRole("tab", { name: "Messenger-Chat" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page
    .getByPlaceholder("Was soll in der Nachricht stehen?")
    .fill("Nachricht Nummer 201");
  await expect(page.getByRole("button", { name: "Hinzufügen" })).toBeDisabled();
  await expect(page.getByText("Maximal 200 Nachrichten erreicht.")).toBeVisible();
});

test("microblog post text enforces the hard input limit", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Mikroblog" }).click();

  const postText = page.getByLabel("Beitragstext");
  await expect(postText).toHaveAttribute("maxlength", String(fieldLimits.microblog.text));
  await postText.fill("");
  await postText.pressSequentially("x".repeat(fieldLimits.microblog.text + 5));

  await expect(postText).toHaveValue("x".repeat(fieldLimits.microblog.text));
  await expect(page.getByText("1000 Zeichen · länger als 280 Zeichen")).toBeVisible();
});

test("carousel, video simulation, reply chains and comment view work together", async ({
  page,
}) => {
  await page.goto("/");

  await openSection(page, "Beitragsbild");
  await page.getByRole("button", { name: "Bild", exact: true }).click();
  await page.getByLabel("Medientyp").selectOption("video");
  await page.getByLabel("Videolänge").fill("0:42");
  await page.getByLabel("Aufrufe").fill("1.240");
  await expect(page.locator(".carousel-counter").last()).toHaveText("2/2");
  await expect(page.locator(".video-meta")).toContainText(
    "1.240 Aufrufe · 0:42",
  );

  await openSection(page, "Kommentare und Antworten");
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
  await page
    .getByRole("button", { name: "Neuen Beitrag hinzufügen" })
    .click();
  await page.getByLabel("Beschreibung").fill("Export ");
  await page.getByRole("button", { name: "Emoji auswählen" }).click();
  await page.getByRole("button", { name: "Emoji einfügen 🙂" }).click();
  await expect(page.locator(".photo-post").first()).toContainText("Export 🙂");
  await openSection(page, "Beitragsbild");
  await page.getByRole("button", { name: "Bild", exact: true }).click();
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  await page.locator("#post-image").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: onePixelPng,
  });
  await expect(page.locator(".photo-post__media img")).toBeVisible();

  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF" }).click();
  await expect(
    page.getByText(
      "PDF-Exporte enthalten alle Beiträge und Medien des ausgewählten Formats.",
    ),
  ).toBeVisible();
  await continueExport(page);
  const pdf = await pdfDownload;
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  const pdfPath = await pdf.path();
  expect(pdfPath).not.toBeNull();
  const pdfText = await readFile(pdfPath!, "latin1");
  expect(pdfText.match(/\/Type \/Page\b/g)).toHaveLength(3);
  expect(pdfText).toContain("SocialMediaCreator");

  const imageDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG" }).click();
  await continueExport(page);
  const image = await imageDownload;
  const imagePath = await image.path();
  expect(imagePath).not.toBeNull();

  const jpgDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "JPG" }).click();
  await continueExport(page);
  expect((await jpgDownload).suggestedFilename()).toMatch(/\.jpg$/);

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
  const appOrigin = new URL(page.url()).origin;

  const requests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== appOrigin) requests.push(request.url());
  });

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
  await continueExport(page);
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
  await expect(page.locator(".microblog-preview")).toContainText("Mobile Vorschau");
  await expect(page.getByRole("button", { name: "PNG" })).toBeVisible();
});
