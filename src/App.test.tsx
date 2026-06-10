import { cleanup, render, screen, within } from "@testing-library/react";
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

  it("adds and edits messenger messages in the live preview", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Messenger-Chat" }),
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

    await user.click(screen.getByLabelText("Gesendet"));
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
      screen.getByRole("button", { name: "Messenger-Chat" }),
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
      screen.getByRole("button", { name: "Messenger-Chat" }),
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
      screen.getByRole("button", { name: "Messenger-Chat" }),
    );
    const contactName = screen.getByLabelText("Kontaktname");
    await user.clear(contactName);
    await user.type(contactName, "Medienkurs");

    await user.click(screen.getByRole("button", { name: "Foto-Post" }));
    await user.click(
      screen.getByRole("button", { name: "Messenger-Chat" }),
    );

    expect(screen.getByLabelText("Kontaktname")).toHaveValue("Medienkurs");
  });

  it("updates the microblog preview and keeps its state", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Mikroblog" }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Formuliere deinen Mikroblog-Beitrag.",
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

    await user.click(screen.getByRole("button", { name: "Foto-Post" }));
    await user.click(screen.getByRole("button", { name: "Mikroblog" }));
    expect(screen.getByLabelText("Anzeigename")).toHaveValue("Quellenlabor");
  });

  it("shows a non-blocking warning for long microblog posts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Mikroblog" }));
    const text = screen.getByLabelText("Beitragstext");
    await user.clear(text);
    await user.type(text, "a".repeat(281));

    expect(screen.getByText("281 Zeichen · länger als 280 Zeichen")).toBeInTheDocument();
    expect(text).toHaveValue("a".repeat(281));
  });

  it("can hide microblog date and time independently", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Mikroblog" }));
    const preview = document.querySelector(".microblog-preview");
    expect(preview).not.toBeNull();
    expect(within(preview as HTMLElement).getByText("10:15 · 11.06.2026")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Uhrzeit anzeigen"));
    expect(within(preview as HTMLElement).getByText("11.06.2026")).toBeInTheDocument();
    expect(within(preview as HTMLElement).queryByText("10:15 · 11.06.2026")).not.toBeInTheDocument();
  });
});
