import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fieldLimits } from "../../domain/constraints";
import { defaultMessenger, type MessengerState } from "../../domain/types";
import { LocaleProvider } from "../../i18n";
import { MessengerEditor } from "./MessengerEditor";

function renderEditor(value: MessengerState) {
  const onChange = vi.fn();
  render(
    <LocaleProvider>
      <MessengerEditor
        images={{}}
        onChange={onChange}
        onImageError={() => undefined}
        onProfileImageChange={() => undefined}
        value={value}
      />
    </LocaleProvider>,
  );
  return onChange;
}

describe("MessengerEditor", () => {
  it("does not allow adding messages beyond the domain limit", async () => {
    const user = userEvent.setup();
    const value: MessengerState = {
      ...defaultMessenger,
      messages: Array.from(
        { length: fieldLimits.messenger.messages },
        (_, index) => ({
          ...defaultMessenger.messages[0],
          id: `message-${index}`,
        }),
      ),
    };
    const onChange = renderEditor(value);

    await user.type(
      screen.getByPlaceholderText("What should the message say?"),
      "Noch eine Nachricht",
    );

    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(screen.getByText("Maximum of 200 messages reached.")).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
  });
});
