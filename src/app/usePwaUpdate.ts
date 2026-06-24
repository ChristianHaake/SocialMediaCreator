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
  const hadController = useRef(false);
  const updateServiceWorker = useRef<ReturnType<typeof registerSW> | null>(null);

  useEffect(() => {
    const activeServiceWorker =
      serviceWorker ??
      ("serviceWorker" in navigator ? navigator.serviceWorker : undefined);
    if (!activeServiceWorker) return;

    const reloadPage = reload ?? (() => window.location.reload());
    let updateInterval: number | undefined;
    hadController.current = !!activeServiceWorker.controller;

    const onControllerChange = () => {
      if (!hadController.current || refreshing.current) return;
      refreshing.current = true;
      reloadPage();
    };

    activeServiceWorker.addEventListener("controllerchange", onControllerChange);
    updateServiceWorker.current = register({
      immediate: true,
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        updateInterval = window.setInterval(
          () => void registration.update(),
          60 * 60 * 1000,
        );
      },
    });

    return () => {
      activeServiceWorker.removeEventListener("controllerchange", onControllerChange);
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
