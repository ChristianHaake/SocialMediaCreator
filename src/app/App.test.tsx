import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  window.localStorage.setItem("social-media-creator-locale", "de");
  window.localStorage.setItem(
    "social-media-creator-export-consent",
    JSON.stringify({
      version: 1,
      acceptedAt: "2026-06-12T00:00:00.000Z",
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
  window.localStorage.clear();
});

function emojiControlsFor(field: HTMLElement) {
  const root = field.closest(".emoji-textarea");
  if (!(root instanceof HTMLElement)) {
    throw new Error("Emoji textarea wrapper missing.");
  }
  return within(root);
}

describe("App", () => {
  it("shows the educational simulation notice on the generator", () => {
    render(<App />);

    expect(
      screen.getByText(
        "Diese Simulation dient ausschließlich dem Bildungszweck.",
      ),
    ).toBeInTheDocument();
    expect(
      within(
        document.querySelector(".education-notice") as HTMLElement,
      ).getByRole("link", { name: "Verantwortungsvoller Einsatz" }),
    ).toHaveAttribute("href", "/verantwortungsvoll");
  });

  it("requires active consent before the first export", async () => {
    window.localStorage.removeItem("social-media-creator-export-consent");
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "PNG" }));
    const continueButton = screen.getByRole("button", {
      name: "Export fortsetzen",
    });
    expect(continueButton).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "Nutzungsbedingungen lesen" }),
    ).toHaveAttribute("href", "/nutzungsbedingungen");

    await user.click(
      screen.getByLabelText(
        "Ich habe die Nutzungsbedingungen gelesen und verwende den Export verantwortungsvoll.",
      ),
    );
    expect(continueButton).toBeEnabled();
  });

  it("detects English from the browser when no preference is stored", () => {
    window.localStorage.clear();
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("en-US");

    render(<App />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Create your photo posts.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("06/11/2026").length).toBeGreaterThan(0);
    expect(document.documentElement.lang).toBe("en");
  });

  it("switches language without changing user content and persists it", async () => {
    const user = userEvent.setup();
    render(<App />);

    const username = screen.getByLabelText("Benutzername");
    await user.clear(username);
    await user.type(username, "custom_account");
    await user.click(screen.getByRole("button", { name: "EN" }));

    expect(screen.getByLabelText("Username")).toHaveValue("custom_account");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Create your photo posts.",
      }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem("social-media-creator-locale")).toBe(
      "en",
    );
  });

  it("uses localized defaults for reset and new elements", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "EN" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("Learning Lab")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add new post" }));
    expect(screen.getByLabelText("Caption")).toHaveValue("New post");

    await user.click(screen.getByRole("button", { name: "Comment" }));
    expect(screen.getAllByLabelText("Comment text").at(-1)).toHaveValue(
      "New comment",
    );
  });

  it("updates the photo-post preview from the editor", async () => {
    const user = userEvent.setup();
    render(<App />);

    const usernameInput = screen.getByLabelText("Benutzername");
    await user.clear(usernameInput);
    await user.type(usernameInput, "quellen_check");

    const preview = document.querySelector(".photo-post");
    expect(preview).not.toBeNull();
    expect(within(preview as HTMLElement).getAllByText("quellen_check")).toHaveLength(
      2,
    );
  });

  it("separates project settings, post management and the active editor", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Projekteinstellungen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Beiträge verwalten" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Ausgewählter Beitrag",
      }),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll(".post-management .post-selector--active"),
    ).toHaveLength(1);
  });

  it("activates a new post and focuses its author field", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Neuen Beitrag hinzufügen" }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Benutzername")).toHaveFocus();
    });
    expect(screen.getByLabelText("Benutzername")).toHaveValue(
      "neuer_account",
    );
  });

  it("selects a post from the preview without changing its content", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Neuen Beitrag hinzufügen" }),
    );
    expect(screen.getByLabelText("Benutzername")).toHaveValue(
      "neuer_account",
    );

    const previewPosts = document.querySelectorAll(".photo-post");
    await user.click(previewPosts[previewPosts.length - 1] as HTMLElement);

    expect(screen.getByLabelText("Benutzername")).toHaveValue("projekt_kurs");
    expect(document.querySelectorAll(".photo-post--selected")).toHaveLength(1);
  });

  it("selects preview posts with keyboard activation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Neuen Beitrag hinzufügen" }),
    );
    const photoPosts = document.querySelectorAll(".photo-post");
    const originalPhotoPost = photoPosts[photoPosts.length - 1] as HTMLElement;
    originalPhotoPost.focus();
    fireEvent.keyDown(originalPhotoPost, { key: "Enter" });
    expect(screen.getByLabelText("Benutzername")).toHaveValue("projekt_kurs");
    expect(originalPhotoPost).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("tab", { name: "Mikroblog" }));
    await user.click(
      screen.getByRole("button", { name: "Neuen Beitrag hinzufügen" }),
    );
    const microblogPosts = document.querySelectorAll(".microblog-preview");
    const originalMicroblogPost = microblogPosts[
      microblogPosts.length - 1
    ] as HTMLElement;
    originalMicroblogPost.focus();
    fireEvent.keyDown(originalMicroblogPost, { key: " " });
    expect(screen.getByLabelText("Anzeigename")).toHaveValue("Medienprojekt");
    expect(originalMicroblogPost).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps a post when its localized deletion is cancelled", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Neuen Beitrag hinzufügen" }),
    );
    const deleteButton = screen
      .getAllByRole("button", { name: /^Beitrag von .* löschen$/ })
      .find((button) => !button.hasAttribute("disabled"));
    await user.click(deleteButton as HTMLElement);

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("neuer_account"),
    );
    expect(document.querySelectorAll(".photo-post")).toHaveLength(2);
  });

  it("can hide optional preview content", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("Lernwerkstatt")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Ort in der Vorschau anzeigen"));
    expect(screen.queryByText("Lernwerkstatt")).not.toBeInTheDocument();
  });

  it("creates multiple photo posts and attaches comments", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Neuen Beitrag hinzufügen" }),
    );
    const caption = screen.getByLabelText("Beschreibung");
    await user.clear(caption);
    await user.type(caption, "Zweiter Foto-Beitrag");

    await user.click(screen.getByRole("button", { name: "Kommentar" }));
    const commentInputs = screen.getAllByLabelText("Kommentartext");
    await user.clear(commentInputs.at(-1) as HTMLElement);
    await user.type(
      commentInputs.at(-1) as HTMLElement,
      "Kommentar am zweiten Beitrag",
    );

    expect(document.querySelectorAll(".photo-post")).toHaveLength(2);
    const previews = Array.from(document.querySelectorAll(".photo-post"));
    const newPreview = previews.find((preview) =>
      preview.textContent?.includes("Zweiter Foto-Beitrag"),
    );
    expect(newPreview).toBeDefined();
    expect(
      within(newPreview as HTMLElement).getByText("Zweiter Foto-Beitrag"),
    ).toBeInTheDocument();
    expect(
      within(newPreview as HTMLElement).getByText(
        "Kommentar am zweiten Beitrag",
      ),
    ).toBeInTheDocument();
  });

  it("adds emojis to photo captions", async () => {
    const user = userEvent.setup();
    render(<App />);

    const caption = screen.getByLabelText("Beschreibung");
    await user.clear(caption);
    await user.type(caption, "Projekt ");
    const captionEmoji = emojiControlsFor(caption);
    await user.click(captionEmoji.getByRole("button", { name: "Emoji auswählen" }));
    await user.click(captionEmoji.getByRole("button", { name: "Emoji einfügen 🙂" }));

    expect(caption).toHaveValue("Projekt 🙂");
    expect(
      within(document.querySelector(".photo-post") as HTMLElement).getByText(
        /Projekt 🙂/,
      ),
    ).toBeInTheDocument();
  });

  it("sorts photo posts by their structured timeline date", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Neuen Beitrag hinzufügen" }),
    );
    const caption = screen.getByLabelText("Beschreibung");
    await user.clear(caption);
    await user.type(caption, "Neuerer Beitrag");
    fireEvent.change(screen.getByLabelText("Datum"), {
      target: { value: "2026-06-12" },
    });

    let previews = document.querySelectorAll(".photo-post");
    expect(previews).toHaveLength(2);
    expect(previews[0]).toHaveTextContent("Neuerer Beitrag");

    await user.selectOptions(
      screen.getByLabelText("Timeline-Reihenfolge"),
      "oldest",
    );
    previews = document.querySelectorAll(".photo-post");
    expect(previews[1]).toHaveTextContent("Neuerer Beitrag");
    expect(screen.getByLabelText("Beschreibung")).toHaveValue(
      "Neuerer Beitrag",
    );
  });

  it("deletes first, middle and last feed posts without removing the project", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    const addPost = screen.getByRole("button", {
      name: "Neuen Beitrag hinzufügen",
    });
    await user.click(addPost);
    await user.click(addPost);
    await user.click(addPost);
    expect(document.querySelectorAll(".photo-post")).toHaveLength(4);

    for (let index = 0; index < 3; index += 1) {
      const deleteButton = screen
        .getAllByRole("button", { name: /^Beitrag von .* löschen$/ })
        .find((button) => !button.hasAttribute("disabled"));
      expect(deleteButton).toBeDefined();
      await user.click(deleteButton as HTMLElement);
    }

    expect(document.querySelectorAll(".photo-post")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /^Beitrag von .* löschen$/ }),
    ).toBeDisabled();
  });

  it("asks before resetting changed content", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);

    const usernameInput = screen.getByLabelText("Benutzername");
    await user.clear(usernameInput);
    await user.type(usernameInput, "anderer_name");
    await user.click(screen.getByRole("button", { name: "Zurücksetzen" }));

    expect(confirm).toHaveBeenCalledOnce();
    expect(usernameInput).toHaveValue("anderer_name");
  });

  it("opens the teacher information dialog", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Für Lehrkräfte" }));

    expect(
      screen.getByRole("dialog", { name: "Hinweise für Lehrkräfte" }),
    ).toBeInTheDocument();
  });

  it("returns focus after closing the teacher information dialog", async () => {
    const user = userEvent.setup();
    render(<App />);

    const trigger = screen.getByRole("button", { name: "Für Lehrkräfte" });
    await user.click(trigger);
    expect(
      screen.getByRole("button", { name: "Dialog schließen" }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Hinweise für Lehrkräfte" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("renders direct content routes", async () => {
    window.history.replaceState({}, "", "/datenschutz");
    render(<App />);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Datenschutz" }),
    ).toBeInTheDocument();
    expect(screen.getByText("4. Bereitstellung über Cloudflare")).toBeInTheDocument();
  });

  it("renders educator, responsible-use and terms content", async () => {
    window.history.replaceState({}, "", "/lehrkraefte");
    const { unmount } = render(<App />);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Hinweise für Lehrkräfte",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Unterrichtsszenario 5: Plattformmechaniken")).toBeInTheDocument();
    unmount();

    window.history.replaceState({}, "", "/nutzungsbedingungen");
    render(<App />);
    expect(
      await screen.findByText(
        "Identitätsmissbrauch oder Nachahmung realer Personen ohne Erlaubnis",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Cybermobbing, Belästigung, Einschüchterung oder Diskriminierung")).toBeInTheDocument();
  });

  it("renders an application-level not-found page", async () => {
    window.history.replaceState({}, "", "/existiert-nicht");
    render(<App />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Seite nicht gefunden",
      }),
    ).toBeInTheDocument();
  });

  it("renders the local image verification route", async () => {
    window.history.replaceState({}, "", "/verifizieren");
    render(<App />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Bild verifizieren",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/kein fälschungssicherer Echtheitsbeweis/),
    ).toBeInTheDocument();
  });

  it("adds and edits messenger messages in the live preview", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("tab", { name: "Messenger-Chat" }),
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Baue deinen Messenger-Chat.",
      }),
    ).toBeInTheDocument();

    const preview = document.querySelector(".messenger-preview");
    expect(preview).not.toBeNull();

    const firstMessage = screen.getByLabelText("Text von Nachricht 1");
    await user.clear(firstMessage);
    await user.type(firstMessage, "Geänderte erste Nachricht");
    expect(
      within(preview as HTMLElement).getByText("Geänderte erste Nachricht"),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getAllByLabelText("Absender")[0],
      "messenger-profile-right",
    );
    await user.type(
      screen.getByPlaceholderText("Was soll in der Nachricht stehen?"),
      "Neue Nachricht aus dem Test",
    );
    await user.click(screen.getByRole("button", { name: "Hinzufügen" }));

    expect(
      within(preview as HTMLElement).getByText("Neue Nachricht aus dem Test"),
    ).toBeInTheDocument();
    expect(screen.getByText("4 Nachrichten bearbeiten und sortieren")).toBeInTheDocument();
  });

  it("adds emojis to messenger drafts and existing messages", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Messenger-Chat" }));
    const preview = document.querySelector(".messenger-preview");
    expect(preview).not.toBeNull();

    const firstMessage = screen.getByLabelText("Text von Nachricht 1");
    await user.clear(firstMessage);
    await user.type(firstMessage, "Quelle ");
    const firstMessageEmoji = emojiControlsFor(firstMessage);
    await user.click(
      firstMessageEmoji.getByRole("button", { name: "Emoji auswählen" }),
    );
    await user.click(
      firstMessageEmoji.getByRole("button", { name: "Emoji einfügen 🙂" }),
    );
    expect(firstMessage).toHaveValue("Quelle 🙂");

    const draft = screen.getByPlaceholderText(
      "Was soll in der Nachricht stehen?",
    );
    await user.type(draft, "Neue ");
    const draftEmoji = emojiControlsFor(draft);
    await user.click(draftEmoji.getByRole("button", { name: "Emoji auswählen" }));
    await user.click(draftEmoji.getByRole("button", { name: "Emoji einfügen 🙂" }));
    await user.click(screen.getByRole("button", { name: "Hinzufügen" }));

    expect(
      within(preview as HTMLElement).getByText("Quelle 🙂"),
    ).toBeInTheDocument();
    expect(
      within(preview as HTMLElement).getByText("Neue 🙂"),
    ).toBeInTheDocument();
  });

  it("reorders messenger messages without losing content", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("tab", { name: "Messenger-Chat" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Nachricht 1 nach unten verschieben",
      }),
    );

    const bubbles = Array.from(
      document.querySelectorAll(".message-bubble__text"),
    ).map((element) => element.textContent);

    expect(bubbles[0]).toContain("zweite Quelle");
    expect(bubbles[1]).toContain("Quelle für unsere Aussage");
  });

  it("deletes messenger messages from editor and preview", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("tab", { name: "Messenger-Chat" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Nachricht 1 löschen" }),
    );

    expect(
      screen.queryByText("Hast du die Quelle für unsere Aussage geprüft?"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("2 Nachrichten bearbeiten und sortieren")).toBeInTheDocument();
  });

  it("keeps module state when switching between modules", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("tab", { name: "Messenger-Chat" }),
    );
    const contactName = screen.getAllByLabelText("Name")[0];
    await user.clear(contactName);
    await user.type(contactName, "Medienkurs");

    await user.click(screen.getByRole("tab", { name: "Foto-Post" }));
    await user.click(
      screen.getByRole("tab", { name: "Messenger-Chat" }),
    );

    expect(screen.getAllByLabelText("Name")[0]).toHaveValue("Medienkurs");
  });

  it("switches module tabs with arrow, home and end keys", async () => {
    const user = userEvent.setup();
    render(<App />);

    const photoTab = screen.getByRole("tab", { name: "Foto-Post" });
    const messengerTab = screen.getByRole("tab", { name: "Messenger-Chat" });
    const microblogTab = screen.getByRole("tab", { name: "Mikroblog" });

    photoTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(messengerTab).toHaveFocus();
    expect(messengerTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{End}");
    expect(microblogTab).toHaveFocus();
    expect(microblogTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Home}");
    expect(photoTab).toHaveFocus();
    expect(photoTab).toHaveAttribute("aria-selected", "true");
  });

  it("updates the microblog preview and keeps its state", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Mikroblog" }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Formuliere deine Mikroblog-Beiträge.",
      }),
    ).toBeInTheDocument();

    const displayName = screen.getByLabelText("Anzeigename");
    const text = screen.getByLabelText("Beitragstext");
    await user.clear(displayName);
    await user.type(displayName, "Quellenlabor");
    await user.clear(text);
    await user.type(text, "Kontext vor Reichweite.");

    const preview = document.querySelector(".microblog-preview");
    expect(preview).not.toBeNull();
    expect(
      within(preview as HTMLElement).getByText("Quellenlabor"),
    ).toBeInTheDocument();
    expect(
      within(preview as HTMLElement).getByText("Kontext vor Reichweite."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Foto-Post" }));
    await user.click(screen.getByRole("tab", { name: "Mikroblog" }));
    expect(screen.getByLabelText("Anzeigename")).toHaveValue("Quellenlabor");
  });

  it("creates multiple microblog posts and attaches comments", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Mikroblog" }));
    await user.click(
      screen.getByRole("button", { name: "Neuen Beitrag hinzufügen" }),
    );

    const postText = screen.getByLabelText("Beitragstext");
    await user.clear(postText);
    await user.type(postText, "Zweiter Mikroblog-Beitrag");

    await user.click(screen.getByRole("button", { name: "Kommentar" }));
    const commentInputs = screen.getAllByLabelText("Kommentartext");
    await user.clear(commentInputs.at(-1) as HTMLElement);
    await user.type(
      commentInputs.at(-1) as HTMLElement,
      "Antwort am zweiten Beitrag",
    );

    expect(document.querySelectorAll(".microblog-preview")).toHaveLength(2);
    const previews = Array.from(
      document.querySelectorAll(".microblog-preview"),
    );
    const newPreview = previews.find((preview) =>
      preview.textContent?.includes("Zweiter Mikroblog-Beitrag"),
    );
    expect(newPreview).toBeDefined();
    expect(
      within(newPreview as HTMLElement).getByText(
        "Zweiter Mikroblog-Beitrag",
      ),
    ).toBeInTheDocument();
    expect(
      within(newPreview as HTMLElement).getByText(
        "Antwort am zweiten Beitrag",
      ),
    ).toBeInTheDocument();
  });

  it("adds emojis to microblog posts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Mikroblog" }));
    const text = screen.getByLabelText("Beitragstext");
    await user.clear(text);
    await user.type(text, "Kontext ");
    const textEmoji = emojiControlsFor(text);
    await user.click(textEmoji.getByRole("button", { name: "Emoji auswählen" }));
    await user.click(textEmoji.getByRole("button", { name: "Emoji einfügen 🙂" }));

    expect(text).toHaveValue("Kontext 🙂");
    expect(
      within(
        document.querySelector(".microblog-preview") as HTMLElement,
      ).getByText("Kontext 🙂"),
    ).toBeInTheDocument();
  });

  it("adds emojis to comments and replies", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Kommentar" }));
    const comment = screen.getAllByLabelText("Kommentartext").at(-1);
    await user.clear(comment as HTMLElement);
    await user.type(comment as HTMLElement, "Kommentar ");
    const commentEmoji = emojiControlsFor(comment as HTMLElement);
    await user.click(
      commentEmoji.getByRole("button", { name: "Emoji auswählen" }),
    );
    await user.click(
      commentEmoji.getByRole("button", { name: "Emoji einfügen 🙂" }),
    );

    await user.click(screen.getAllByRole("button", { name: "Antwort" }).at(-1) as HTMLElement);
    const reply = screen.getAllByLabelText("Antworttext").at(-1) as HTMLElement;
    await user.clear(reply);
    await user.type(reply, "Antwort ");
    const replyEmoji = emojiControlsFor(reply);
    await user.click(
      replyEmoji.getByRole("button", { name: "Emoji auswählen" }),
    );
    await user.click(
      replyEmoji.getByRole("button", { name: "Emoji einfügen 🙂" }),
    );

    const preview = document.querySelector(".photo-post") as HTMLElement;
    expect(within(preview).getByText("Kommentar 🙂")).toBeInTheDocument();
    expect(within(preview).getByText("Antwort 🙂")).toBeInTheDocument();
  });

  it("applies the hard microblog text limit in the editor", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Mikroblog" }));

    expect(screen.getByLabelText("Beitragstext")).toHaveAttribute(
      "maxlength",
      "1000",
    );
  });

  it("switches microblog layouts and sorts posts chronologically", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Mikroblog" }));
    expect(
      document
        .querySelector("details.editor-disclosure")
        ?.hasAttribute("open"),
    ).toBe(true);
    expect(document.querySelector(".microblog-feed")).toHaveClass(
      "microblog-feed--feed",
    );

    await user.selectOptions(
      screen.getByLabelText("Timeline-Darstellung"),
      "thread",
    );
    expect(document.querySelector(".microblog-feed")).toHaveClass(
      "microblog-feed--thread",
    );

    await user.click(
      screen.getByRole("button", { name: "Neuen Beitrag hinzufügen" }),
    );
    const text = screen.getByLabelText("Beitragstext");
    await user.clear(text);
    await user.type(text, "Thread-Fortsetzung");
    fireEvent.change(screen.getByLabelText("Datum"), {
      target: { value: "2026-06-12" },
    });

    let posts = document.querySelectorAll(".microblog-preview");
    expect(posts[0]).toHaveTextContent("Thread-Fortsetzung");
    await user.selectOptions(
      screen.getByLabelText("Timeline-Reihenfolge"),
      "oldest",
    );
    posts = document.querySelectorAll(".microblog-preview");
    expect(posts[1]).toHaveTextContent("Thread-Fortsetzung");
    expect(screen.getByLabelText("Beitragstext")).toHaveValue(
      "Thread-Fortsetzung",
    );
  });

  it("shows a non-blocking warning for long microblog posts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Mikroblog" }));
    const text = screen.getByLabelText("Beitragstext");
    await user.clear(text);
    await user.type(text, "a".repeat(281));

    expect(screen.getByText("281 Zeichen · länger als 280 Zeichen")).toBeInTheDocument();
    expect(text).toHaveValue("a".repeat(281));
  });

  it("updates the structured microblog date and optional time", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Mikroblog" }));
    const preview = document.querySelector(".microblog-preview");
    expect(preview).not.toBeNull();
    expect(
      within(preview as HTMLElement).getByText("11.06.2026 · 10:15"),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Datum"));
    await user.type(screen.getByLabelText("Datum"), "2026-06-12");
    await user.clear(screen.getByLabelText("Uhrzeit (optional)"));
    expect(
      within(preview as HTMLElement).getByText("12.06.2026"),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Uhrzeit (optional)"), "15:00");
    expect(
      within(preview as HTMLElement).getByText("12.06.2026 · 15:00"),
    ).toBeInTheDocument();
  });

  it("switches themes and dedicated comment views", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText("Dark"));
    expect(document.querySelector(".photo-feed")).toHaveClass("theme-dark");

    await user.selectOptions(
      screen.getByLabelText("Darstellungsmodus"),
      "comments",
    );
    expect(document.querySelector(".photo-post")).toHaveClass(
      "photo-post--comments",
    );
    expect(screen.getByText("vor 5 Minuten")).toBeInTheDocument();
    expect(screen.getByText("vor 2 Minuten")).toBeInTheDocument();
  });

  it("adds and reorders carousel media with video metadata", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Bild" }));
    expect(screen.getByText("2/2")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Medientyp"), "video");
    await user.type(screen.getByLabelText("Videolänge"), "0:42");
    await user.type(screen.getByLabelText("Aufrufe"), "1.240");

    expect(screen.getByText("1.240 Aufrufe · 0:42")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Bild 2 nach oben verschieben" }),
    );
    expect(screen.getByRole("button", { name: "Bild 1 nach oben verschieben" }))
      .toBeDisabled();
  });
});
