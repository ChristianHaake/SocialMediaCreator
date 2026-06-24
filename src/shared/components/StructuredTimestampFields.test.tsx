import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n";
import { StructuredTimestampFields } from "./StructuredTimestampFields";

function TestTimestampFields() {
  const [date, setDate] = useState("2026-06-11");
  const [time, setTime] = useState("10:15");

  return (
    <LocaleProvider>
      <StructuredTimestampFields
        date={date}
        onDateChange={setDate}
        onTimeChange={setTime}
        time={time}
      />
      <output aria-label="Stored timestamp">
        {date}|{time}
      </output>
    </LocaleProvider>
  );
}

describe("StructuredTimestampFields", () => {
  beforeEach(() => {
    window.localStorage.setItem("social-media-creator-locale", "de");
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("accepts valid date and time values", async () => {
    const user = userEvent.setup();
    render(<TestTimestampFields />);

    await user.clear(screen.getByLabelText("Datum"));
    await user.type(screen.getByLabelText("Datum"), "2026-06-16");
    await user.clear(screen.getByLabelText("Uhrzeit (optional)"));
    await user.type(screen.getByLabelText("Uhrzeit (optional)"), "15:00");

    expect(screen.getByLabelText("Stored timestamp")).toHaveTextContent(
      "2026-06-16|15:00",
    );
    expect(screen.getByLabelText("Datum")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    expect(screen.getByLabelText("Uhrzeit (optional)")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });

  it("keeps invalid drafts visible without changing stored state", async () => {
    const user = userEvent.setup();
    render(<TestTimestampFields />);

    await user.clear(screen.getByLabelText("Datum"));
    await user.type(screen.getByLabelText("Datum"), "2026-02-30");
    await user.clear(screen.getByLabelText("Uhrzeit (optional)"));
    await user.type(screen.getByLabelText("Uhrzeit (optional)"), "25:99");

    expect(screen.getByLabelText("Datum")).toHaveValue("2026-02-30");
    expect(screen.getByLabelText("Uhrzeit (optional)")).toHaveValue("25:99");
    expect(screen.getByLabelText("Stored timestamp")).toHaveTextContent(
      "2026-06-11|",
    );
    expect(screen.getByLabelText("Datum")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Uhrzeit (optional)")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("allows clearing the optional time", async () => {
    const user = userEvent.setup();
    render(<TestTimestampFields />);

    await user.clear(screen.getByLabelText("Uhrzeit (optional)"));

    expect(screen.getByLabelText("Uhrzeit (optional)")).toHaveValue("");
    expect(screen.getByLabelText("Stored timestamp")).toHaveTextContent(
      "2026-06-11|",
    );
  });

  it("keeps normal keyboard selection behavior in the inputs", async () => {
    const user = userEvent.setup();
    render(<TestTimestampFields />);

    const date = screen.getByLabelText("Datum") as HTMLInputElement;
    await user.click(date);
    await user.keyboard("{Control>}a{/Control}2026-06-18");

    expect(date).toHaveFocus();
    expect(date).toHaveValue("2026-06-18");
    expect(screen.getByLabelText("Stored timestamp")).toHaveTextContent(
      "2026-06-18|10:15",
    );
  });
});
