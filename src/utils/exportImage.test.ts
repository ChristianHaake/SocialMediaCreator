import { beforeEach, describe, expect, it, vi } from "vitest";

const { toPng, toJpeg } = vi.hoisted(() => ({
  toPng: vi.fn(),
  toJpeg: vi.fn(),
}));

vi.mock("html-to-image", () => ({ toPng, toJpeg }));
vi.mock("jspdf", () => ({
  jsPDF: vi.fn(),
}));

import {
  addImageMarker,
  calculatePageSlices,
  exportBadgeText,
  exportElementAsImage,
  verifyImageMarker,
} from "./exportImage";

describe("image export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toPng.mockResolvedValue("data:image/png;base64,aGVsbG8=");
    toJpeg.mockResolvedValue("data:image/jpeg;base64,aGVsbG8=");
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

    expect(toPng).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ pixelRatio: 2 }),
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

    expect(toJpeg).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ quality: 0.92 }),
    );
  });

  it("renders the visible simulation badge before adding the marker", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
    const element = document.createElement("div");
    document.body.append(element);
    Object.defineProperty(element, "offsetWidth", { value: 540 });
    toPng.mockImplementationOnce(async (renderedElement: HTMLElement) => {
      expect(
        renderedElement.querySelector("[data-export-badge]")?.textContent,
      ).toBe(exportBadgeText);
      return "data:image/png;base64,aGVsbG8=";
    });

    await exportElementAsImage(element, "png", "test", "photoPost");

    expect(element.querySelector("[data-export-badge]")).toBeNull();
    element.remove();
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
