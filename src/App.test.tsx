import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
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

    await user.click(screen.getByRole("button", { name: "Beitrag" }));
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
    const previews = document.querySelectorAll(".photo-post");
    expect(
      within(previews[1] as HTMLElement).getByText("Zweiter Foto-Beitrag"),
    ).toBeInTheDocument();
    expect(
      within(previews[1] as HTMLElement).getByText(
        "Kommentar am zweiten Beitrag",
      ),
    ).toBeInTheDocument();
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

  it("renders direct content routes", () => {
    window.history.replaceState({}, "", "/datenschutz");
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Datenschutz" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hosting und technische Verbindungsdaten")).toBeInTheDocument();
  });

  it("renders an application-level not-found page", () => {
    window.history.replaceState({}, "", "/existiert-nicht");
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Seite nicht gefunden" }),
    ).toBeInTheDocument();
  });

  it("renders the local image verification route", () => {
    window.history.replaceState({}, "", "/verifizieren");
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Bild verifizieren" }),
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
    await user.click(screen.getByRole("button", { name: "Beitrag" }));

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
    const previews = document.querySelectorAll(".microblog-preview");
    expect(
      within(previews[1] as HTMLElement).getByText(
        "Zweiter Mikroblog-Beitrag",
      ),
    ).toBeInTheDocument();
    expect(
      within(previews[1] as HTMLElement).getByText(
        "Antwort am zweiten Beitrag",
      ),
    ).toBeInTheDocument();
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

  it("updates the free microblog timestamp", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Mikroblog" }));
    const preview = document.querySelector(".microblog-preview");
    expect(preview).not.toBeNull();
    expect(within(preview as HTMLElement).getByText("10:15 · 11.06.2026")).toBeInTheDocument();

    const timestamp = screen.getAllByLabelText("Zeitstempel")[0];
    await user.clear(timestamp);
    await user.type(timestamp, "vor 2 Stunden");
    expect(
      within(preview as HTMLElement).getByText("vor 2 Stunden"),
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

    await user.click(screen.getByRole("button", { name: "Medium" }));
    expect(screen.getByText("2/2")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Medientyp"), "video");
    await user.type(screen.getByLabelText("Videolänge"), "0:42");
    await user.type(screen.getByLabelText("Aufrufe"), "1.240");

    expect(screen.getByText("1.240 Aufrufe · 0:42")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Medium 2 nach oben verschieben" }),
    );
    expect(screen.getByRole("button", { name: "Medium 1 nach oben verschieben" }))
      .toBeDisabled();
  });
});
