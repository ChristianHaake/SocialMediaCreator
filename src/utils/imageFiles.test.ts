import { describe, expect, it } from "vitest";
import { validateImageFile } from "./imageFiles";

describe("validateImageFile", () => {
  it("accepts supported image formats below the size limit", () => {
    const file = new File(["image"], "example.png", { type: "image/png" });

    expect(validateImageFile(file)).toBeNull();
  });

  it("rejects unsupported image formats", () => {
    const file = new File(["image"], "example.svg", {
      type: "image/svg+xml",
    });

    expect(validateImageFile(file)).toContain("PNG-, JPG- oder WebP");
  });

  it("rejects images larger than 10 MB", () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.jpg", {
      type: "image/jpeg",
    });

    expect(validateImageFile(file)).toContain("höchstens 10 MB");
  });
});
