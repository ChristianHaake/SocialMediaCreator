import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
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
  const initialConfigRef = useRef(config);
  configRef.current = config;
  const hydratedRef = useRef(false);
  const readFailedRef = useRef(false);
  const failedModulesRef = useRef(new Set<ModuleType>());
  const [sessionSaveError, setSessionSaveError] = useState(false);
  const initialActiveModuleRef = useRef(config.activeModule);
  const activeModuleChangedRef = useRef(false);
  const restoreTokenRef = useRef(0);
  const lastSigRef = useRef<Record<ModuleType, string>>({
    photoPost: "",
    messenger: "",
    microblog: "",
  });
  const timerRef = useRef<number | null>(null);
  const pendingModulesRef = useRef<Set<ModuleType>>(new Set());
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const persistRef = useRef<(modules: ModuleType[]) => Promise<boolean>>(
    async () => true,
  );

  const queuePersist = useCallback((modules: ModuleType[]) => {
    const operation = saveQueueRef.current.then(() => persistRef.current(modules));
    saveQueueRef.current = operation.then(() => undefined, () => undefined);
    return operation;
  }, []);

  const schedulePersist = useCallback((modules: ModuleType[]) => {
    if (!hydratedRef.current) return;
    modules.forEach((module) => pendingModulesRef.current.add(module));
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const pending = Array.from(pendingModulesRef.current);
      pendingModulesRef.current.clear();
      timerRef.current = null;
      void queuePersist(pending);
    }, SAVE_DEBOUNCE_MS);
  }, [queuePersist]);

  const flushPendingSave = useCallback(async () => {
    if (!hydratedRef.current || readFailedRef.current) return false;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = Array.from(pendingModulesRef.current);
    pendingModulesRef.current.clear();
    return queuePersist(pending.length > 0 ? pending : MODULES);
  }, [queuePersist]);

  function cancelPendingSessionRestore() {
    restoreTokenRef.current += 1;
    readFailedRef.current = false;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      schedulePersist(MODULES);
    }
  }

  // Restore the last session once, before any auto-save can run.
  useEffect(() => {
    let cancelled = false;
    const pendingModules = pendingModulesRef.current;
    const restoreToken = restoreTokenRef.current;
    const initial = initialConfigRef.current;
    const initialSignatures = Object.fromEntries(
      MODULES.map((module) => [
        module,
        signature(stateFor(initial, module), imagesFor(initial, module), initial.locale),
      ]),
    ) as Record<ModuleType, string>;
    // Early edits must differ from this baseline when hydration finishes.
    lastSigRef.current = { ...initialSignatures };
    const isStale = () =>
      cancelled || restoreToken !== restoreTokenRef.current;
    void (async () => {
      try {
        const snapshots = await getSessionSnapshots();
        if (isStale()) return;
        if (Object.keys(snapshots).length > 0) {
          const { readProjectArchive, disposeProjectImages } = await import(
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
              if (isStale()) {
                disposeProjectImages(images);
                return;
              }
              const current = configRef.current;
              if (
                parsed.module !== module ||
                signature(stateFor(current, module), imagesFor(current, module), initial.locale) !==
                  initialSignatures[module]
              ) {
                disposeProjectImages(images);
                continue;
              }
              applyModule(current, module, parsed.data, images);
              lastSigRef.current[module] = signature(
                parsed.data,
                images[module],
                current.locale,
              );
            } catch {
              if (isStale()) return;
              // Corrupt/unsupported snapshot — drop it so it can't keep failing.
              await deleteSessionSnapshot(module).catch(() => {
                if (isStale()) return;
                failedModulesRef.current.add(module);
                setSessionSaveError(true);
              });
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
          !activeModuleChangedRef.current &&
          (storedModule === "photoPost" ||
            storedModule === "messenger" ||
            storedModule === "microblog")
        ) {
          configRef.current.setActiveModule(storedModule);
        }
      } catch {
        if (!isStale()) {
          // Preserve unread snapshots until the user explicitly imports or clears.
          readFailedRef.current = true;
          setSessionSaveError(true);
        }
      } finally {
        if (!isStale() && !readFailedRef.current) {
          hydratedRef.current = true;
          schedulePersist(MODULES);
          try {
            if (activeModuleChangedRef.current) {
              localStorage.setItem(ACTIVE_MODULE_KEY, configRef.current.activeModule);
            }
          } catch {
            // ignore storage failures
          }
        }
      }
    })();
    return () => {
      cancelled = true;
      hydratedRef.current = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      pendingModules.clear();
    };
  }, [schedulePersist]);

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
    if (!hydratedRef.current) {
      if (config.activeModule !== initialActiveModuleRef.current) {
        activeModuleChangedRef.current = true;
      }
      return;
    }
    try {
      localStorage.setItem(ACTIVE_MODULE_KEY, config.activeModule);
    } catch {
      // ignore storage failures
    }
  }, [config.activeModule]);

  async function persist(modules: ModuleType[]) {
    const current = configRef.current;
    let archiveTools: typeof import("../shared/lib/projectArchives") | null = null;
    let saved = true;
    for (const module of modules) {
      const state = stateFor(current, module);
      const images = imagesFor(current, module);
      const sig = signature(state, images, current.locale);
      if (sig === lastSigRef.current[module] && !failedModulesRef.current.has(module)) continue;
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
        failedModulesRef.current.delete(module);
        if (hydratedRef.current) {
          setSessionSaveError(readFailedRef.current || failedModulesRef.current.size > 0);
        }
      } catch {
        failedModulesRef.current.add(module);
        if (hydratedRef.current) setSessionSaveError(true);
        // Save failed (e.g. too large). Leave the signature so we retry on the
        // next change rather than silently giving up.
        saved = false;
      }
    }
    return saved && !readFailedRef.current && failedModulesRef.current.size === 0;
  }
  persistRef.current = persist;

  async function clearSession() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    await saveQueueRef.current;
    try {
      await clearSessionSnapshots();
    } catch (error) {
      schedulePersist(Array.from(pendingModulesRef.current));
      throw error;
    }
    cancelPendingSessionRestore();
    pendingModulesRef.current.clear();
    readFailedRef.current = false;
    failedModulesRef.current.clear();
    setSessionSaveError(false);
    try {
      localStorage.removeItem(ACTIVE_MODULE_KEY);
    } catch {
      // ignore
    }
    lastSigRef.current = { photoPost: "", messenger: "", microblog: "" };
  }

  return { cancelPendingSessionRestore, clearSession, flushPendingSave, sessionSaveError };
}
