import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportConsentStorageKey,
  hasExportConsent,
  storeExportConsent,
} from "./exportConsent";

describe("export consent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores versioned consent locally", () => {
    expect(hasExportConsent()).toBe(false);
    expect(storeExportConsent()).toBe(true);
    expect(hasExportConsent()).toBe(true);

    expect(
      JSON.parse(window.localStorage.getItem(exportConsentStorageKey) ?? ""),
    ).toMatchObject({
      version: 1,
      acceptedAt: expect.any(String),
    });
  });

  it("rejects invalid or outdated consent", () => {
    window.localStorage.setItem(
      exportConsentStorageKey,
      JSON.stringify({ version: 0, acceptedAt: "2026-06-12" }),
    );
    expect(hasExportConsent()).toBe(false);

    window.localStorage.setItem(exportConsentStorageKey, "invalid");
    expect(hasExportConsent()).toBe(false);
  });

  it("requires consent again when local storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });

    expect(storeExportConsent()).toBe(false);
    expect(hasExportConsent()).toBe(false);
  });
});
