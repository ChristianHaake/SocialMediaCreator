import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePwaUpdate } from "./usePwaUpdate";

type RegisterOptions = {
  onNeedRefresh?: () => void;
  onNeedReload?: () => void;
  onRegisteredSW?: (
    swUrl: string,
    registration: Pick<ServiceWorkerRegistration, "update"> | undefined,
  ) => void;
};

const serviceWorker = {} as ServiceWorkerContainer;

describe("usePwaUpdate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the update action on a waiting worker and activates it only on request", () => {
    const updateServiceWorker = vi.fn();
    let callbacks: RegisterOptions = {};
    const register = vi.fn((options: RegisterOptions) => {
      callbacks = options;
      return updateServiceWorker;
    });

    const { result } = renderHook(() =>
      usePwaUpdate({ register: register as never, serviceWorker }),
    );

    act(() => callbacks.onNeedRefresh?.());
    expect(result.current.updateAvailable).toBe(true);
    expect(updateServiceWorker).not.toHaveBeenCalled();

    act(() => result.current.refreshApp());
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it("reloads only once after the requested update takes control", () => {
    let callbacks: RegisterOptions = {};
    const reload = vi.fn();

    renderHook(() =>
      usePwaUpdate({
        register: vi.fn((options: RegisterOptions) => {
          callbacks = options;
          return vi.fn();
        }) as never,
        reload,
        serviceWorker,
      }),
    );

    act(() => callbacks.onNeedReload?.());
    act(() => callbacks.onNeedReload?.());
    expect(reload).toHaveBeenCalledOnce();
  });

  it("checks for updates on registration and when an existing page becomes visible", () => {
    let callbacks: RegisterOptions = {};
    const update = vi.fn(() => Promise.resolve());
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const { unmount } = renderHook(() =>
      usePwaUpdate({
        register: vi.fn((options: RegisterOptions) => {
          callbacks = options;
          return vi.fn();
        }) as never,
        serviceWorker,
      }),
    );

    act(() => callbacks.onRegisteredSW?.("/sw.js", { update }));
    expect(update).toHaveBeenCalledOnce();

    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(update).toHaveBeenCalledTimes(2);

    unmount();
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(update).toHaveBeenCalledTimes(2);
  });
});
