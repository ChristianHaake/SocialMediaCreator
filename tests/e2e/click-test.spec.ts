import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Set default locale to "de" if not already set, to ensure tests run in German
    if (!window.localStorage.getItem("social-media-creator-locale")) {
      window.localStorage.setItem("social-media-creator-locale", "de");
    }
    // Remove export consent by default so we can test the consent notice flow
    window.localStorage.removeItem("social-media-creator-export-consent");
  });
});

async function openSection(page: Page, title: string) {
  const details = page
    .locator("details.editor-disclosure")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  if ((await details.count()) === 0) return;
  if ((await details.getAttribute("open")) === null) {
    await details.locator("summary.section-heading").click();
  }
}

async function openProfileCard(page: Page, title: string) {
  const details = page
    .locator("details.message-editor-card--profile-disclosure")
    .filter({ hasText: title });
  if ((await details.getAttribute("open")) === null) {
    await details.locator("summary").click();
  }
}

test("General app controls, translations, and static page navigation", async ({ page }) => {
  await page.goto("/");

  // Switch to English and check HTML lang
  const enButton = page.getByRole("button", { name: "EN", exact: true });
  await enButton.click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  // Switch back to German
  const deButton = page.getByRole("button", { name: "DE", exact: true });
  await deButton.click();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");

  // Open teacher info dialog
  const teacherTrigger = page.getByRole("button", { name: "Für Lehrkräfte" });
  await teacherTrigger.click();

  const closeButton = page.getByRole("button", { name: "Dialog schließen" });
  await expect(closeButton).toBeFocused();

  // Close with Escape
  await page.keyboard.press("Escape");
  await expect(closeButton).toBeHidden();

  // Re-open and close with click
  await teacherTrigger.click();
  await closeButton.click();
  await expect(closeButton).toBeHidden();

  // Footer Navigation: visit internal pages
  const footerPages = [
    { name: "Hilfe", header: "Hilfe" },
    { name: "Über das Projekt", header: "Über das Projekt" },
    { name: "Verantwortungsvoller Einsatz", header: "Verantwortungsvoller Einsatz" },
    { name: "Nutzungsbedingungen", header: "Nutzungsbedingungen" },
    { name: "Bild verifizieren", header: "Bild verifizieren" },
    { name: "Datenschutz", header: "Datenschutz" },
    { name: "Impressum", header: "Impressum" },
  ];

  for (const pageInfo of footerPages) {
    const footerLink = page.getByRole("contentinfo").getByRole("link", { name: pageInfo.name, exact: true });
    await footerLink.click();
    await expect(page.getByRole("heading", { name: pageInfo.header, exact: true })).toBeVisible();

    // Go back using "Zurück zur App" link
    const backLink = page.getByRole("link", { name: "Zurück zur App", exact: true });
    await backLink.click();
    await expect(page.locator(".intro h1")).toBeVisible();
  }
});

test("Photo-Post editor detailed interaction flow", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Foto-Post" }).click();

  // 1. Appearance / Darstellung
  await openSection(page, "Projekteinstellungen");
  await page.locator(".segmented-control label").filter({ hasText: "Dim" }).click();
  await expect(page.locator(".photo-feed")).toHaveClass(/theme-dim/);
  await page.locator(".segmented-control label").filter({ hasText: "Dark" }).click();
  await expect(page.locator(".photo-feed")).toHaveClass(/theme-dark/);

  await page.getByLabel("Timeline-Reihenfolge").selectOption("oldest");

  // 2. Post Management
  await page.getByRole("button", { name: "Neuen Beitrag hinzufügen" }).click();
  const posts = page.locator(".post-management .post-selector");
  await expect(posts).toHaveCount(2);

  // Select the first post
  await posts.nth(0).locator("button.post-selector__select").click();

  // Delete the second post
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("löschen");
    await dialog.accept();
  });
  await posts.nth(1).locator(".post-selector__actions button").click();
  await expect(posts).toHaveCount(1);

  // 3. Edit Active Post metadata
  await page.getByLabel("Benutzername").fill("click_test_user");
  await page.getByLabel("Ort", { exact: true }).fill("Berlin, Germany");
  await page.getByLabel("Ort in der Vorschau anzeigen").check();
  await page.getByLabel("Datum").fill("2026-06-16");
  await page.getByLabel("Uhrzeit (optional)").fill("14:30");
  await page.getByLabel("Darstellungsmodus").selectOption("comments");
  await page.getByLabel("Darstellungsmodus").selectOption("post");

  await expect(page.locator(".photo-post").last().locator(".photo-post__identity strong")).toContainText("click_test_user");
  await expect(page.locator(".photo-post").last().locator(".photo-post__identity span")).toContainText("Berlin, Germany");
  await expect(page.locator(".photo-post").last().locator(".photo-post__date")).toContainText("16.06.2026 · 14:30");

  // 4. Carousel medium settings
  await openSection(page, "Beitragsbild");
  await page.getByRole("button", { name: "Bild", exact: true }).click();
  const carouselItems = page.locator(".media-editor-list li");
  await expect(carouselItems).toHaveCount(2);

  // Select first medium item and change to video
  await carouselItems.nth(0).locator("button.post-selector__select").click();
  await page.getByLabel("Medientyp").selectOption("video");
  await page.getByLabel("Videolänge").fill("1:20");
  await page.getByLabel("Aufrufe").fill("5.500");
  await page.getByLabel("Alternativtext").fill("A cute simulation video");

  // Move medium down
  await carouselItems.nth(0).locator('button[aria-label*="nach unten verschieben"]').click();
  // Move medium up
  await page.locator(".media-editor-list li").nth(1).locator('button[aria-label*="nach oben verschieben"]').click();

  await expect(page.locator(".photo-post__avatar")).toBeVisible();

  // 5. Content and Reactions
  await page.getByLabel("Beschreibung").fill("This is a click test caption.");
  await page.getByLabel("Likes").fill("42");
  await page.getByLabel("Kommentaranzahl").fill("10");
  await page.getByLabel("Kommentare anzeigen").uncheck();
  await page.getByLabel("Kommentare anzeigen").check();

  // 6. Comments & Replies section
  await openSection(page, "Kommentare und Antworten");
  await page.getByRole("button", { name: "Kommentar", exact: true }).click();
  await page.getByLabel("Kommentartext").first().fill("First test comment");
  await page.getByLabel("Autor").first().fill("commenter_1");
  await page.getByLabel("Zeitstempel").first().fill("2h");

  await page.locator(".message-editor-card").last().getByRole("button", { name: "Antwort", exact: true }).click();
  await page.getByLabel("Antworttext").first().fill("First reply to comment");
  await page.getByLabel("Autor").nth(1).fill("replier_1");
  await page.getByLabel("Zeitstempel").nth(1).fill("1h");

  // Delete reply
  await page.locator(".reply-editor__card button").first().click();

  // Delete comment
  await page.locator(".message-editor-card__header button").first().click();

  // 7. Project save and exports
  await page.getByRole("button", { name: "PNG" }).click();

  // Dialog must be visible
  await expect(page.getByRole("dialog", { name: "Hinweis vor dem Export" })).toBeVisible();
  const consentCheckbox = page.getByLabel(
    "Ich habe die Nutzungsbedingungen gelesen und verwende den Export verantwortungsvoll."
  );
  await consentCheckbox.check();

  const pngDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export fortsetzen", exact: true }).click();
  const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toContain(".png");

  // Export as PDF
  const pdfDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF" }).click();
  await page.getByRole("button", { name: "Export fortsetzen", exact: true }).click();
  const pdfDownload = await pdfDownloadPromise;
  expect(pdfDownload.suggestedFilename()).toContain(".pdf");
});

test("Messenger-Chat editor detailed interaction flow", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Messenger-Chat" }).click();

  // Theme change
  await openSection(page, "Darstellung");
  await page.locator(".segmented-control label").filter({ hasText: "Dim" }).click();
  await expect(page.locator(".messenger-preview")).toHaveClass(/theme-dim/);

  // Edit profiles
  await openSection(page, "Chat-Profile");
  await openProfileCard(page, "Profil links");
  await openProfileCard(page, "Profil rechts");
  await page.getByLabel("Name").nth(0).fill("Alice");
  await page.getByLabel("Name").nth(1).fill("Bob");
  await page.getByLabel("Online-Status").nth(0).fill("online");
  await page.getByLabel("Online-Status").nth(1).fill("zuletzt online vor 5m");

  await expect(page.locator(".messenger-preview__identity")).toContainText("Alice");

  // Profile image upload
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  await page.locator("#messenger-profile-image-left").setInputFiles({
    name: "alice.png",
    mimeType: "image/png",
    buffer: onePixelPng,
  });

  // Draft and add messages
  await page.getByRole("combobox", { name: "Absender", exact: true }).selectOption({ label: "Bob" });
  await page.getByPlaceholder("Was soll in der Nachricht stehen?").fill("Hello Alice, this is Bob!");
  await page.getByLabel("Zeitstempel", { exact: true }).fill("10:05");
  await page.getByLabel("Als gelesen oder gesehen markieren").check();
  await page.getByRole("button", { name: "Hinzufügen" }).click();

  await page.getByRole("combobox", { name: "Absender", exact: true }).selectOption({ label: "Alice" });
  await page.getByPlaceholder("Was soll in der Nachricht stehen?").fill("Hi Bob!");
  await page.getByLabel("Zeitstempel", { exact: true }).fill("10:06");
  await page.getByRole("button", { name: "Hinzufügen" }).click();

  const previewMessages = page.locator(".message-bubble");
  await expect(previewMessages).toHaveCount(5);
  await expect(previewMessages.nth(3)).toContainText("Hello Alice, this is Bob!");
  await expect(previewMessages.nth(4)).toContainText("Hi Bob!");

  // Move message 5 up (moves Alice's new message up so it swaps with Bob's message)
  await page.locator(".message-editor-list li").nth(4).locator('button[aria-label*="nach oben verschieben"]').click();
  await expect(previewMessages.nth(3)).toContainText("Hi Bob!");

  // Edit text of message 5 (which is Bob's message now)
  await page.locator(".message-editor-list li").nth(4).locator("summary").click();
  await page.locator(".message-editor-list li").nth(4).locator("textarea").fill("Hello Alice, this is Bob! (Edited)");
  await expect(previewMessages.nth(4)).toContainText("Hello Alice, this is Bob! (Edited)");

  // Delete message 5
  await page.locator(".message-editor-list li").nth(4).locator('button[aria-label*="löschen"]').click();
  await expect(previewMessages).toHaveCount(4);
});

test("Mikroblog editor detailed interaction flow", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Mikroblog" }).click();

  // 1. Appearance / Darstellung
  await openSection(page, "Projekteinstellungen");
  await page.locator(".segmented-control label").filter({ hasText: "Dim" }).click();
  await expect(page.locator(".microblog-feed")).toHaveClass(/theme-dim/);
  await page.getByLabel("Timeline-Darstellung").selectOption("thread");
  await expect(page.locator(".microblog-feed")).toHaveClass(/microblog-feed--thread/);
  await page.getByLabel("Timeline-Reihenfolge").selectOption("oldest");

  // 2. Post Management
  await page.getByRole("button", { name: "Neuen Beitrag hinzufügen" }).click();
  const posts = page.locator(".post-management .post-selector");
  await expect(posts).toHaveCount(2);

  // 3. Edit Active Post Profile
  await page.getByLabel("Anzeigename").fill("Microblog Tester");
  await page.getByLabel("Handle").fill("m_tester");

  // 4. Edit Content
  await page.getByLabel("Beitragstext").fill("Testing microblog post contents!");
  await page.getByLabel("Datum").fill("2026-06-16");
  await page.getByLabel("Uhrzeit (optional)").fill("15:00");
  await page.getByLabel("Darstellungsmodus").selectOption("comments");
  await page.getByLabel("Darstellungsmodus").selectOption("post");

  // 5. Reactions
  await openSection(page, "Reaktionen");
  await page.getByLabel("Antworten").fill("5");
  await page.getByLabel("Reposts").fill("15");
  await page.getByLabel("Likes").fill("25");

  // 6. Comments & Replies
  await openSection(page, "Kommentare und Antworten");
  await page.getByRole("button", { name: "Kommentar", exact: true }).click();
  await page.getByLabel("Kommentartext").first().fill("Microblog comment text");
  await page.getByLabel("Autor").first().fill("micro_commenter");

  // Verify preview
  await expect(page.locator(".microblog-preview").last().locator(".microblog-preview__identity strong")).toContainText("Microblog Tester");
  await expect(page.locator(".microblog-preview").last().locator(".microblog-preview__identity span")).toContainText("@m_tester");
  await expect(page.locator(".microblog-preview").last().locator(".microblog-preview__text")).toContainText("Testing microblog post contents!");

  // Delete comment
  await page.locator(".message-editor-card__header button").first().click();
});

test("Verification page upload and validation states", async ({ page }) => {
  await page.goto("/verifizieren");

  await expect(page.getByRole("heading", { name: "Bild verifizieren", exact: true })).toBeVisible();

  // Test uploading a non-decodable file
  const invalidBuffer = Buffer.from("this is a fake image file text");
  await page.locator('input[type="file"]').setInputFiles({
    name: "fake_verification.png",
    mimeType: "image/png",
    buffer: invalidBuffer,
  });

  await expect(page.getByRole("heading", { name: "Kein unterstützter Marker", exact: true })).toBeVisible();
});
