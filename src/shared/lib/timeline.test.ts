import { describe, expect, it } from "vitest";
import { formatTimelineDate } from "./timeline";

describe("formatTimelineDate", () => {
  it("formats a date for each supported language", () => {
    expect(formatTimelineDate("2026-11-26", "", "de")).toBe("26.11.2026");
    expect(formatTimelineDate("2026-11-26", "", "en")).toBe("11/26/2026");
    expect(formatTimelineDate("2026-11-26", "", "fr")).toBe("26/11/2026");
    expect(formatTimelineDate("2026-11-26", "", "es")).toBe("26/11/2026");
    expect(formatTimelineDate("2026-11-26", "14:30", "nl")).toBe("26-11-2026 · 14:30");
  });
});
