import { beforeEach, describe, expect, it, vi } from "vitest";

const { jsPDF, pdfInstance, toCanvas } = vi.hoisted(() => {
  const pdfInstance = {
    addImage: vi.fn(),
    addPage: vi.fn(),
    output: vi.fn(() => new Blob(["pdf"], { type: "application/pdf" })),
    setFontSize: vi.fn(),
    setProperties: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
  };
  return {
    jsPDF: vi.fn(
      class {
        constructor() {
          return pdfInstance;
        }
      },
    ),
    pdfInstance,
    toCanvas: vi.fn(),
  };
});

vi.mock("html-to-image", () => ({ toCanvas }));
vi.mock("jspdf", () => ({ jsPDF }));

import {
  addImageMarker,
  calculatePageSlices,
  canvasToImageBlob,
  exportBadgeText,
  exportElementAsImage,
  exportElementAsPdf,
  verifyImageMarker,
} from "./exportImage";

function createEncodingCanvas() {
  const canvas = document.createElement("canvas");
  const toBlob = vi.fn(
    (
      callback: BlobCallback,
      type?: string,
    ) => {
      callback(new Blob(["hello"], { type }));
    },
  );
  Object.defineProperty(canvas, "toBlob", {
    configurable: true,
    value: toBlob,
  });
  return { canvas, toBlob };
}

describe("image export", () => {
  let encoded: ReturnType<typeof createEncodingCanvas>;

  beforeEach(() => {
    vi.clearAllMocks();
    encoded = createEncodingCanvas();
    toCanvas.mockResolvedValue(encoded.canvas);
  });

  it("exports PNG at the deterministic target width", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const element = document.createElement("div");
    Object.defineProperty(element, "offsetWidth", { value: 540 });

    await exportElementAsImage(
      element,
      "png",
      "social-media-creator-foto-post",
      "photoPost",
    );

    expect(toCanvas).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ pixelRatio: 2 }),
    );
    expect(encoded.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/png",
      undefined,
    );
    expect(click).toHaveBeenCalledOnce();
    expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe(
      "social-media-creator-foto-post.png",
    );
  });

  it("uses high-quality JPEG output", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
    const element = document.createElement("div");
    Object.defineProperty(element, "offsetWidth", { value: 540 });

    await exportElementAsImage(element, "jpg", "test", "messenger");

    expect(toCanvas).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ pixelRatio: 2 }),
    );
    expect(encoded.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/jpeg",
      0.92,
    );
  });

  it("renders the visible simulation badge before adding the marker", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
    const element = document.createElement("div");
    document.body.append(element);
    Object.defineProperty(element, "offsetWidth", { value: 540 });
    toCanvas.mockImplementationOnce(async (renderedElement: HTMLElement) => {
      expect(
        renderedElement.querySelector("[data-export-badge]")?.textContent,
      ).toBe(exportBadgeText);
      return encoded.canvas;
    });

    await exportElementAsImage(element, "png", "test", "photoPost");

    expect(element.querySelector("[data-export-badge]")).toBeNull();
    element.remove();
  });

  it("rejects failed canvas encoding", async () => {
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "toBlob", {
      configurable: true,
      value: (callback: BlobCallback) => callback(null),
    });
    Object.defineProperty(canvas, "toDataURL", {
      configurable: true,
      value: () => {
        throw new Error("Data URL fallback unavailable.");
      },
    });

    await expect(canvasToImageBlob(canvas, "image/png")).rejects.toThrow(
      "Canvas image encoding failed.",
    );
  });

  it("falls back to a PNG data URL when PNG blob encoding fails", async () => {
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "toBlob", {
      configurable: true,
      value: (callback: BlobCallback) => callback(null),
    });
    Object.defineProperty(canvas, "toDataURL", {
      configurable: true,
      value: vi.fn(() => "data:image/png;base64,aGVsbG8="),
    });

    const blob = await canvasToImageBlob(canvas, "image/png");

    expect(blob.type).toBe("image/png");
    expect(await blob.text()).toBe("hello");
  });

  it("renders PDFs from the shared canvas renderer as JPEG pages", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
    Object.defineProperty(encoded.canvas, "width", { value: 1080 });
    Object.defineProperty(encoded.canvas, "height", { value: 1080 });
    Object.defineProperty(encoded.canvas, "toDataURL", {
      configurable: true,
      value: vi.fn(() => "data:image/jpeg;base64,aGVsbG8="),
    });
    const element = document.createElement("div");
    element.innerHTML = '<div class="photo-post"><div class="photo-post__media"></div></div>';
    Object.defineProperty(element, "offsetWidth", { value: 540 });

    await exportElementAsPdf(element, "test", "en");

    expect(toCanvas).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ pixelRatio: 2 }),
    );
    expect(encoded.canvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.92);
    expect(pdfInstance.addImage).toHaveBeenCalledWith(
      "data:image/jpeg;base64,aGVsbG8=",
      "JPEG",
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
  });
});

describe("local image marker", () => {
  it("recognizes an intact SocialMediaCreator marker", async () => {
    const marked = await addImageMarker(
      new Blob(["image-data"], { type: "image/png" }),
      "microblog",
    );
    const result = await verifyImageMarker(marked);

    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.marker.module).toBe("microblog");
      expect(result.marker.appId).toBe("SocialMediaCreator");
    }
  });

  it("recognizes changed image bytes while preserving the marker", async () => {
    const marked = await addImageMarker(
      new Blob(["image-data"], { type: "image/png" }),
      "photoPost",
    );
    const bytes = new Uint8Array(await marked.arrayBuffer());
    bytes[0] ^= 1;

    expect(
      await verifyImageMarker(new Blob([bytes], { type: "image/png" })),
    ).toMatchObject({ status: "modified" });
  });

  it("returns none for files without a supported marker", async () => {
    expect(
      await verifyImageMarker(
        new Blob(["ordinary-image"], { type: "image/png" }),
      ),
    ).toEqual({ status: "none" });
  });
});

describe("PDF pagination", () => {
  it("uses logical item boundaries before the page limit", () => {
    expect(calculatePageSlices(2500, 1000, [650, 1300, 1950])).toEqual([
      { y: 0, height: 650 },
      { y: 650, height: 650 },
      { y: 1300, height: 650 },
      { y: 1950, height: 550 },
    ]);
  });

  it("falls back to the page limit for oversized items", () => {
    expect(calculatePageSlices(2200, 1000, [1500])).toEqual([
      { y: 0, height: 1000 },
      { y: 1000, height: 500 },
      { y: 1500, height: 700 },
    ]);
  });
});
