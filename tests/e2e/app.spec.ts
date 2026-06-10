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
      name: "Formuliere deinen Mikroblog-Beitrag.",
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
      /mockup-studio-.+\.json/,
    );

    const imageDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "PNG" }).click();
    expect((await imageDownload).suggestedFilename()).toMatch(
      /mockup-studio-.+\.png/,
    );
  }
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
