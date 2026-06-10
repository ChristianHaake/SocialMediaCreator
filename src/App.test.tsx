import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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
});
