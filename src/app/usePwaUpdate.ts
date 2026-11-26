import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

type UsePwaUpdateOptions = {
  register?: typeof registerSW;
  reload?: () => void;
  serviceWorker?: ServiceWorkerContainer;
};

export function usePwaUpdate(options: UsePwaUpdateOptions = {}) {
  const { register = registerSW, reload, serviceWorker } = options;
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const refreshing = useRef(false);
  const updateServiceWorker = useRef<ReturnType<typeof registerSW> | null>(null);

  useEffect(() => {
    const activeServiceWorker =
      serviceWorker ??
      ("serviceWorker" in navigator ? navigator.serviceWorker : undefined);
    if (!activeServiceWorker) return;

    const reloadPage = reload ?? (() => window.location.reload());
    let updateInterval: number | undefined;
    let removeVisibilityListener: (() => void) | undefined;
    let disposed = false;
    updateServiceWorker.current = register({
      immediate: true,
      onNeedRefresh() {
        if (!disposed) setUpdateAvailable(true);
      },
      onNeedReload() {
        if (disposed || refreshing.current) return;
        refreshing.current = true;
        reloadPage();
      },
      onRegisteredSW(_swUrl, registration) {
        if (disposed || !registration) return;
        const checkForUpdate = () => {
          if (navigator.onLine) void registration.update().catch(() => {});
        };
        checkForUpdate();
        const onVisibilityChange = () => {
          if (document.visibilityState === "visible") checkForUpdate();
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        removeVisibilityListener = () =>
          document.removeEventListener("visibilitychange", onVisibilityChange);
        updateInterval = window.setInterval(
          checkForUpdate,
          60 * 60 * 1000,
        );
      },
    });

    return () => {
      disposed = true;
      removeVisibilityListener?.();
      if (updateInterval !== undefined) window.clearInterval(updateInterval);
    };
  }, [register, reload, serviceWorker]);

  function refreshApp() {
    updateServiceWorker.current?.(true);
  }

  async function resetAppVersion() {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    window.location.reload();
  }

  return {
    refreshApp,
    resetAppVersion,
    updateAvailable,
  };
}
