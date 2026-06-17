import { afterEach, describe, expect, it, vi } from "vitest";
import {
  maxImageSize,
  prepareImageForUpload,
  validateImageFile,
} from "./imageFiles";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function pngFile(name: string, padTo = 0) {
  const bytes = new Uint8Array(Math.max(PNG_SIGNATURE.length, padTo));
  bytes.set(PNG_SIGNATURE);
  return new File([bytes], name, { type: "image/png" });
}

function stubBitmap(width: number, height: number) {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ width, height, close: vi.fn() }),
  );
}

function stubCanvas(blob: Blob) {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
  ) {
    callback(blob);
  });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
}

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

    await expect(validateImageFile(file)).resolves.toBe("image.invalidType");
  });

  it("rejects images larger than 5 MB", async () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", {
      type: "image/jpeg",
    });

    await expect(validateImageFile(file)).resolves.toBe("image.tooLarge");
  });

  it("rejects files with a forged image MIME type", async () => {
    const file = new File(["not an image"], "fake.png", {
      type: "image/png",
    });

    await expect(validateImageFile(file)).resolves.toBe("image.invalidData");
  });

  it("rejects signed but undecodable image files", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockRejectedValue(new Error("decode failed")),
    );
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 0;
        naturalHeight = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          queueMicrotask(() => this.onerror?.());
        }
      },
    );
    const file = new File(
      [new Uint8Array([0xff, 0xd8, 0xff, 0x00])],
      "broken.jpg",
      { type: "image/jpeg" },
    );

    await expect(validateImageFile(file)).resolves.toBe("image.decodeFailed");
  });

  it("rejects images wider or taller than 4096 pixels", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({
        width: 4097,
        height: 100,
        close: vi.fn(),
      }),
    );
    const file = new File(
      [new Uint8Array([0xff, 0xd8, 0xff, 0x00])],
      "wide.jpg",
      { type: "image/jpeg" },
    );

    await expect(validateImageFile(file)).resolves.toBe("image.tooManyPixels");
  });
});

describe("prepareImageForUpload", () => {
  it("accepts an in-limits image unchanged", async () => {
    stubBitmap(1000, 800);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const file = pngFile("ok.png");

    const result = await prepareImageForUpload(file);

    expect("image" in result).toBe(true);
    if ("image" in result) {
      expect(result.image.optimized).toBe(false);
      expect(result.image.blob).toBe(file);
    }
  });

  it("reduces a file larger than 5 MB instead of rejecting it", async () => {
    stubBitmap(2000, 2000);
    const reduced = new Blob([new Uint8Array(40_000)], { type: "image/webp" });
    stubCanvas(reduced);
    const file = pngFile("huge.png", maxImageSize + 1);

    const result = await prepareImageForUpload(file);

    expect("image" in result).toBe(true);
    if ("image" in result) {
      expect(result.image.optimized).toBe(true);
      expect(result.image.blob).toBe(reduced);
      expect(result.image.blob.size).toBeLessThanOrEqual(maxImageSize);
    }
  });

  it("downscales an image larger than 4096 px", async () => {
    stubBitmap(6000, 3000);
    const reduced = new Blob([new Uint8Array(30_000)], { type: "image/webp" });
    stubCanvas(reduced);
    const file = pngFile("wide.png");

    const result = await prepareImageForUpload(file);

    expect("image" in result).toBe(true);
    if ("image" in result) {
      expect(result.image.optimized).toBe(true);
      expect(result.image.blob).toBe(reduced);
    }
  });

  it("rejects an image beyond the hard source-dimension cap", async () => {
    stubBitmap(12001, 100);
    const file = pngFile("bomb.png");

    await expect(prepareImageForUpload(file)).resolves.toEqual({
      error: "image.tooManyPixels",
    });
  });

  it("rejects an unsupported type", async () => {
    const file = new File(["x"], "a.svg", { type: "image/svg+xml" });
    await expect(prepareImageForUpload(file)).resolves.toEqual({
      error: "image.invalidType",
    });
  });

  it("rejects a forged image", async () => {
    const file = new File(["not an image"], "fake.png", { type: "image/png" });
    await expect(prepareImageForUpload(file)).resolves.toEqual({
      error: "image.invalidData",
    });
  });

  it("rejects when reduction still exceeds the size limit", async () => {
    stubBitmap(2000, 2000);
    const stillBig = new Blob([new Uint8Array(maxImageSize + 1)], {
      type: "image/webp",
    });
    stubCanvas(stillBig);
    const file = pngFile("stubborn.png", maxImageSize + 1);

    await expect(prepareImageForUpload(file)).resolves.toEqual({
      error: "image.tooLarge",
    });
  });
});
