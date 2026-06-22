import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import type {
  Locale,
  MessengerImages,
  MessengerState,
  MicroblogImages,
  MicroblogState,
  ModuleType,
  PhotoPostImages,
  PhotoPostState,
} from "../domain/types";
import {
  getDefaultMessenger,
  getDefaultMicroblog,
  getDefaultPhotoPost,
} from "../domain/types";
import type { ProjectImageMaps } from "../shared/lib/projectArchives";
import {
  clearSessionSnapshots,
  deleteSessionSnapshot,
  getSessionSnapshots,
  putSessionSnapshot,
} from "../shared/lib/sessionStore";

const ACTIVE_MODULE_KEY = "social-media-creator-active-module";
const SAVE_DEBOUNCE_MS = 1000;
const MODULES: ModuleType[] = ["photoPost", "messenger", "microblog"];

type ModuleState = PhotoPostState | MessengerState | MicroblogState;
type ModuleImages = PhotoPostImages | MessengerImages | MicroblogImages;

export interface SessionPersistenceConfig {
  locale: Locale;
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  photoPost: PhotoPostState;
  messenger: MessengerState;
  microblog: MicroblogState;
  setPhotoPost: (data: PhotoPostState) => void;
  setMessenger: (data: MessengerState) => void;
  setMicroblog: (data: MicroblogState) => void;
  initialPhotoPost: MutableRefObject<PhotoPostState>;
  initialMessenger: MutableRefObject<MessengerState>;
  initialMicroblog: MutableRefObject<MicroblogState>;
  photoImages: PhotoPostImages;
  messengerImages: MessengerImages;
  microblogImages: MicroblogImages;
  replaceModuleImages: (module: ModuleType, images: ProjectImageMaps) => void;
}

// Stable signature for change detection. Blobs are dropped (not serializable);
// the image url is stable per ImageState and changes when an image is replaced.
function signature(
  state: ModuleState,
  images: ModuleImages,
  locale: Locale,
): string {
  return JSON.stringify({ state, images, locale }, (key, value) =>
    key === "blob" ? undefined : value,
  );
}

function stateFor(config: SessionPersistenceConfig, module: ModuleType): ModuleState {
  if (module === "photoPost") return config.photoPost;
  if (module === "messenger") return config.messenger;
  return config.microblog;
}

function imagesFor(config: SessionPersistenceConfig, module: ModuleType): ModuleImages {
  if (module === "photoPost") return config.photoImages;
  if (module === "messenger") return config.messengerImages;
  return config.microblogImages;
}

function defaultStateFor(module: ModuleType, locale: Locale): ModuleState {
  if (module === "photoPost") return getDefaultPhotoPost(locale);
  if (module === "messenger") return getDefaultMessenger(locale);
  return getDefaultMicroblog(locale);
}

function isPristine(
  module: ModuleType,
  state: ModuleState,
  images: ModuleImages,
  locale: Locale,
): boolean {
  return (
    Object.keys(images).length === 0 &&
    JSON.stringify(state) === JSON.stringify(defaultStateFor(module, locale))
  );
}

function applyModule(
  config: SessionPersistenceConfig,
  module: ModuleType,
  data: ModuleState,
  images: ProjectImageMaps,
) {
  if (module === "photoPost") {
    config.initialPhotoPost.current = data as PhotoPostState;
    config.setPhotoPost(data as PhotoPostState);
  } else if (module === "messenger") {
    config.initialMessenger.current = data as MessengerState;
    config.setMessenger(data as MessengerState);
  } else {
    config.initialMicroblog.current = data as MicroblogState;
    config.setMicroblog(data as MicroblogState);
  }
  config.replaceModuleImages(module, images);
}

export function useSessionPersistence(config: SessionPersistenceConfig) {
  const configRef = useRef(config);
  configRef.current = config;
  const hydratedRef = useRef(false);
  const restoreTokenRef = useRef(0);
  const lastSigRef = useRef<Record<ModuleType, string>>({
    photoPost: "",
    messenger: "",
    microblog: "",
  });
  const timerRef = useRef<number | null>(null);
  const pendingModulesRef = useRef<Set<ModuleType>>(new Set());
  const persistRef = useRef<(modules: ModuleType[]) => Promise<void>>(
    async () => undefined,
  );

  function seedCurrentSignatures() {
    for (const module of MODULES) {
      lastSigRef.current[module] = signature(
        stateFor(configRef.current, module),
        imagesFor(configRef.current, module),
        configRef.current.locale,
      );
    }
  }

  const schedulePersist = useCallback((modules: ModuleType[]) => {
    if (!hydratedRef.current) return;
    modules.forEach((module) => pendingModulesRef.current.add(module));
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const pending = Array.from(pendingModulesRef.current);
      pendingModulesRef.current.clear();
      void persistRef.current(pending);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  function cancelPendingSessionRestore() {
    restoreTokenRef.current += 1;
    if (!hydratedRef.current) {
      seedCurrentSignatures();
      hydratedRef.current = true;
    }
  }

  // Restore the last session once, before any auto-save can run.
  useEffect(() => {
    let cancelled = false;
    const restoreToken = restoreTokenRef.current;
    const isStale = () =>
      cancelled || restoreToken !== restoreTokenRef.current;
    void (async () => {
      try {
        const snapshots = await getSessionSnapshots().catch(
          (): Partial<Record<ModuleType, Blob>> => ({}),
        );
        if (isStale()) return;
        if (Object.keys(snapshots).length > 0) {
          const { readProjectArchive } = await import(
            "../shared/lib/projectArchives"
          );
          if (isStale()) return;
          for (const module of MODULES) {
            const blob = snapshots[module];
            if (!blob) continue;
            try {
              const file = new File([blob], `${module}.smc`, {
                type: "application/zip",
              });
              const { config: parsed, images } = await readProjectArchive(file);
              if (isStale()) return;
              if (parsed.module !== module) continue;
              applyModule(configRef.current, module, parsed.data, images);
              lastSigRef.current[module] = signature(
                parsed.data,
                imagesFor(configRef.current, module),
                parsed.locale,
              );
            } catch {
              // Corrupt/unsupported snapshot — drop it so it can't keep failing.
              await deleteSessionSnapshot(module).catch(() => undefined);
            }
          }
        }
        let storedModule: string | null = null;
        try {
          storedModule = localStorage.getItem(ACTIVE_MODULE_KEY);
        } catch {
          storedModule = null;
        }
        if (
          !isStale() &&
          (storedModule === "photoPost" ||
            storedModule === "messenger" ||
            storedModule === "microblog")
        ) {
          configRef.current.setActiveModule(storedModule);
        }
      } finally {
        if (!isStale()) {
          // Seed signatures for modules that had no snapshot so the first
          // auto-save pass doesn't redundantly re-write unchanged defaults.
          for (const module of MODULES) {
            if (!lastSigRef.current[module]) {
              lastSigRef.current[module] = signature(
                stateFor(configRef.current, module),
                imagesFor(configRef.current, module),
                configRef.current.locale,
              );
            }
          }
          hydratedRef.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
     
  }, []);

  // Debounced auto-save of whichever module actually changed.
  useEffect(() => {
    schedulePersist(["photoPost"]);
  }, [
    config.photoPost,
    config.photoImages,
    schedulePersist,
  ]);

  useEffect(() => {
    schedulePersist(["messenger"]);
  }, [
    config.messenger,
    config.messengerImages,
    schedulePersist,
  ]);

  useEffect(() => {
    schedulePersist(["microblog"]);
  }, [
    config.microblog,
    config.microblogImages,
    schedulePersist,
  ]);

  useEffect(() => {
    schedulePersist(MODULES);
  }, [config.locale, schedulePersist]);

  // Remember the open module so a reload returns to the same tab.
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(ACTIVE_MODULE_KEY, config.activeModule);
    } catch {
      // ignore storage failures
    }
  }, [config.activeModule]);

  async function persist(modules: ModuleType[]) {
    const current = configRef.current;
    let archiveTools: typeof import("../shared/lib/projectArchives") | null = null;
    for (const module of modules) {
      const state = stateFor(current, module);
      const images = imagesFor(current, module);
      const sig = signature(state, images, current.locale);
      if (sig === lastSigRef.current[module]) continue;
      try {
        if (isPristine(module, state, images, current.locale)) {
          await deleteSessionSnapshot(module);
        } else {
          archiveTools ??= await import("../shared/lib/projectArchives");
          const blob = await archiveTools.createProjectArchive(
            module,
            state,
            current.locale,
            images,
          );
          await putSessionSnapshot(module, blob);
        }
        lastSigRef.current[module] = sig;
      } catch {
        // Save failed (e.g. too large). Leave the signature so we retry on the
        // next change rather than silently giving up.
      }
    }
  }
  persistRef.current = persist;

  async function clearSession() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    await clearSessionSnapshots().catch(() => undefined);
    try {
      localStorage.removeItem(ACTIVE_MODULE_KEY);
    } catch {
      // ignore
    }
    lastSigRef.current = { photoPost: "", messenger: "", microblog: "" };
    }

  return { cancelPendingSessionRestore, clearSession };
}
