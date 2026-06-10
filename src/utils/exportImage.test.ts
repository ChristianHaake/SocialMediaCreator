import { beforeEach, describe, expect, it, vi } from "vitest";

const { toPng, toJpeg } = vi.hoisted(() => ({
  toPng: vi.fn(),
  toJpeg: vi.fn(),
}));

vi.mock("html-to-image", () => ({ toPng, toJpeg }));

import { exportElementAsImage } from "./exportImage";

describe("exportElementAsImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toPng.mockResolvedValue("data:image/png;base64,result");
    toJpeg.mockResolvedValue("data:image/jpeg;base64,result");
  });

  it("exports PNG at the deterministic target width", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const element = document.createElement("div");
    Object.defineProperty(element, "offsetWidth", { value: 540 });

    await exportElementAsImage(element, "png");

    expect(toPng).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ backgroundColor: "#ffffff", pixelRatio: 2 }),
    );
    expect(click).toHaveBeenCalledOnce();
  });

  it("uses a high-quality JPEG export", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
    const element = document.createElement("div");
    Object.defineProperty(element, "offsetWidth", { value: 540 });

    await exportElementAsImage(element, "jpg");

    expect(toJpeg).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ quality: 0.92 }),
    );
  });

  it("uses the module-specific export file name", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const element = document.createElement("div");
    Object.defineProperty(element, "offsetWidth", { value: 540 });

    await exportElementAsImage(
      element,
      "png",
      "mockup-studio-messenger-chat",
    );

    expect(click).toHaveBeenCalledOnce();
    expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe(
      "mockup-studio-messenger-chat.png",
    );
  });
});
