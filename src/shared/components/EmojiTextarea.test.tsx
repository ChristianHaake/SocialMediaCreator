import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n";
import { EmojiTextarea } from "./EmojiTextarea";

function TestTextarea({
  initialValue = "Hallo Welt",
  maxLength = 100,
}: {
  initialValue?: string;
  maxLength?: number;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <LocaleProvider>
      <EmojiTextarea
        aria-label="Testfeld"
        maxLength={maxLength}
        onChange={setValue}
        rows={3}
        value={value}
      />
    </LocaleProvider>
  );
}

describe("EmojiTextarea", () => {
  beforeEach(() => {
    window.localStorage.setItem("social-media-creator-locale", "de");
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("inserts an emoji at the cursor and restores focus", async () => {
    const user = userEvent.setup();
    render(<TestTextarea />);

    const textarea = screen.getByLabelText("Testfeld");
    textarea.focus();
    (textarea as HTMLTextAreaElement).setSelectionRange(6, 6);
    await user.click(screen.getByRole("button", { name: "Emoji auswählen" }));
    await user.click(screen.getByRole("button", { name: "Emoji einfügen 🙂" }));

    expect(textarea).toHaveValue("Hallo 🙂Welt");
    await waitFor(() => expect(textarea).toHaveFocus());
    expect((textarea as HTMLTextAreaElement).selectionStart).toBe(8);
  });

  it("replaces selected text with an emoji", async () => {
    const user = userEvent.setup();
    render(<TestTextarea />);

    const textarea = screen.getByLabelText("Testfeld");
    textarea.focus();
    (textarea as HTMLTextAreaElement).setSelectionRange(6, 10);
    await user.click(screen.getByRole("button", { name: "Emoji auswählen" }));
    await user.click(screen.getByRole("button", { name: "Emoji einfügen 🙂" }));

    expect(textarea).toHaveValue("Hallo 🙂");
  });

  it("does not insert beyond maxLength", async () => {
    const user = userEvent.setup();
    render(<TestTextarea initialValue="12345" maxLength={5} />);

    await user.click(screen.getByRole("button", { name: "Emoji auswählen" }));
    await user.click(screen.getByRole("button", { name: "Emoji einfügen 🙂" }));

    expect(screen.getByLabelText("Testfeld")).toHaveValue("12345");
  });

  it("closes the emoji popover with Escape", async () => {
    const user = userEvent.setup();
    render(<TestTextarea />);

    await user.click(screen.getByRole("button", { name: "Emoji auswählen" }));
    expect(
      screen.getByRole("button", { name: "Emoji einfügen 🙂" }),
    ).toBeVisible();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("button", { name: "Emoji einfügen 🙂" }),
    ).not.toBeInTheDocument();
  });
});
