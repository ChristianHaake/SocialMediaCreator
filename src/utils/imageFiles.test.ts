import { afterEach, describe, expect, it, vi } from "vitest";
import { validateImageFile } from "./imageFiles";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("validateImageFile", () => {
  it("accepts supported image formats below the size limit", async () => {
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 1, height: 1, close }),
    );
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      "example.png",
      { type: "image/png" },
    );

    await expect(validateImageFile(file)).resolves.toBeNull();
    expect(close).toHaveBeenCalledOnce();
  });

  it("rejects unsupported image formats", async () => {
    const file = new File(["image"], "example.svg", {
      type: "image/svg+xml",
    });

    await expect(validateImageFile(file)).resolves.toContain(
      "PNG-, JPG- oder WebP",
    );
  });

  it("rejects images larger than 10 MB", async () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.jpg", {
      type: "image/jpeg",
    });

    await expect(validateImageFile(file)).resolves.toContain("höchstens 10 MB");
  });

  it("rejects files with a forged image MIME type", async () => {
    const file = new File(["not an image"], "fake.png", {
      type: "image/png",
    });

    await expect(validateImageFile(file)).resolves.toContain(
      "kein gültiges",
    );
  });

  it("rejects signed but undecodable image files", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockRejectedValue(new Error("decode failed")),
    );
    const file = new File(
      [new Uint8Array([0xff, 0xd8, 0xff, 0x00])],
      "broken.jpg",
      { type: "image/jpeg" },
    );

    await expect(validateImageFile(file)).resolves.toContain("beschädigt");
  });
});
