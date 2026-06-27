import { fireEvent, render, screen } from "@testing-library/react";
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
  it("does not allow adding messages beyond the domain limit", () => {
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

    fireEvent.change(
      screen.getByRole("textbox", {
        name: /message text|nachrichtentext/i,
      }),
      {
      target: { value: "Noch eine Nachricht" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /add|hinzufügen/i }),
    );

    expect(
      screen.getByRole("button", { name: /add|hinzufügen/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/maximum of 200 messages|maximal 200 nachrichten/i),
    ).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
  });
});
