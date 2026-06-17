import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePwaUpdate } from "./usePwaUpdate";

type RegisterOptions = {
  onNeedRefresh?: () => void;
  onRegisteredSW?: (
    swUrl: string,
    registration: Pick<ServiceWorkerRegistration, "update"> | undefined,
  ) => void;
};

function createServiceWorker(controller: ServiceWorker | null = {} as ServiceWorker) {
  const listeners = new Map<string, EventListener>();
  const serviceWorker = {
    controller,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener);
    }),
    getRegistrations: vi.fn(() => Promise.resolve([])),
    removeEventListener: vi.fn((type: string) => {
      listeners.delete(type);
    }),
  } as unknown as ServiceWorkerContainer;
  return { listeners, serviceWorker };
}

describe("usePwaUpdate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows an update notice and refreshes through the registered service worker", () => {
    const { serviceWorker } = createServiceWorker();
    const updateServiceWorker = vi.fn();
    let onNeedRefresh: (() => void) | undefined;
    const register = vi.fn((options: RegisterOptions) => {
      onNeedRefresh = options.onNeedRefresh;
      return updateServiceWorker;
    });

    const { result } = renderHook(() =>
      usePwaUpdate({
        register: register as never,
        serviceWorker,
      }),
    );

    act(() => onNeedRefresh?.());
    expect(result.current.updateAvailable).toBe(true);

    act(() => result.current.refreshApp());
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it("reloads only once when an existing service worker takes control", () => {
    const { listeners, serviceWorker } = createServiceWorker();
    const reload = vi.fn();

    renderHook(() =>
      usePwaUpdate({
        register: vi.fn(() => vi.fn()) as never,
        reload,
        serviceWorker,
      }),
    );

    act(() => listeners.get("controllerchange")?.(new Event("controllerchange")));
    act(() => listeners.get("controllerchange")?.(new Event("controllerchange")));

    expect(reload).toHaveBeenCalledOnce();
  });

  it("does not reload when the first service worker claims the page", () => {
    const { listeners, serviceWorker } = createServiceWorker(null);
    const reload = vi.fn();

    renderHook(() =>
      usePwaUpdate({
        register: vi.fn(() => vi.fn()) as never,
        reload,
        serviceWorker,
      }),
    );

    act(() => listeners.get("controllerchange")?.(new Event("controllerchange")));

    expect(reload).not.toHaveBeenCalled();
  });
});
