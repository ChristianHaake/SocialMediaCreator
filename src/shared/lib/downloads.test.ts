import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "./downloads";

describe("downloadBlob", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:download"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("downloads through an attached anchor and revokes the object URL later", () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    downloadBlob(new Blob(["data"], { type: "text/plain" }), "test.txt");
    const link = click.mock.instances[0] as unknown as HTMLAnchorElement;

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(link.download).toBe("test.txt");
    expect(document.body.contains(link)).toBe(false);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:download");
  });

  it("sets target and rel for standalone PWA mode", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });

    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    downloadBlob(new Blob(["data"], { type: "text/plain" }), "test.txt");
    const link = click.mock.instances[0] as unknown as HTMLAnchorElement;

    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener");
    expect(link.download).toBe("test.txt");

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (window as unknown as Record<string, unknown>)["matchMedia"];
  });
});

