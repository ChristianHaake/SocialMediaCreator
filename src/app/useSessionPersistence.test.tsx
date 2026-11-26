import { useRef, useState } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDefaultMessenger,
  getDefaultMicroblog,
  getDefaultPhotoPost,
  type ModuleType,
  type Locale,
} from "../domain/types";
import type { ProjectArchiveResult, ProjectImageMaps } from "../shared/lib/projectArchives";
import { createProjectArchive, disposeProjectImages, readProjectArchive } from "../shared/lib/projectArchives";
import { clearSessionSnapshots, getSessionSnapshots, putSessionSnapshot } from "../shared/lib/sessionStore";
import { useSessionPersistence } from "./useSessionPersistence";

vi.mock("../shared/lib/sessionStore", () => ({
  getSessionSnapshots: vi.fn(),
  putSessionSnapshot: vi.fn().mockResolvedValue(undefined),
  deleteSessionSnapshot: vi.fn().mockResolvedValue(undefined),
  clearSessionSnapshots: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../shared/lib/projectArchives", () => ({
  readProjectArchive: vi.fn(),
  createProjectArchive: vi.fn().mockResolvedValue(new Blob(["saved"])),
  disposeProjectImages: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function useSession() {
  const initialPhotoPost = useRef(getDefaultPhotoPost("de"));
  const initialMessenger = useRef(getDefaultMessenger("de"));
  const initialMicroblog = useRef(getDefaultMicroblog("de"));
  const [photoPost, setPhotoPost] = useState(initialPhotoPost.current);
  const [messenger, setMessenger] = useState(initialMessenger.current);
  const [microblog, setMicroblog] = useState(initialMicroblog.current);
  const [locale, setLocale] = useState<Locale>("de");
  const [activeModule, setActiveModule] = useState<ModuleType>("photoPost");
  const [images, setImages] = useState<ProjectImageMaps>({ photoPost: {}, messenger: {}, microblog: {} });
  const persistence = useSessionPersistence({
    locale, activeModule, setActiveModule,
    photoPost, setPhotoPost, messenger, setMessenger, microblog, setMicroblog,
    initialPhotoPost, initialMessenger, initialMicroblog,
    photoImages: images.photoPost, messengerImages: images.messenger, microblogImages: images.microblog,
    replaceModuleImages: (module, next) => setImages((current) => ({ ...current, [module]: next[module] })),
  });
  return { ...persistence, locale, setLocale, photoPost, setPhotoPost, messenger, setMessenger, activeModule, setActiveModule, images };
}

function savedPhoto(): ProjectArchiveResult {
  return {
    config: { format: "social-media-creator-config", version: 6, module: "photoPost", locale: "en", data: { ...getDefaultPhotoPost("de"), theme: "dark" } },
    images: { photoPost: {}, messenger: {}, microblog: {} },
  };
}

async function settle() {
  await act(async () => { await vi.dynamicImportSettled(); });
}

async function saveDebounce() {
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  await settle();
}

describe("useSessionPersistence startup", () => {
  let snapshots: ReturnType<typeof deferred<Partial<Record<ModuleType, Blob>>>>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(putSessionSnapshot).mockResolvedValue(undefined);
    vi.mocked(clearSessionSnapshots).mockResolvedValue(undefined);
    localStorage.clear();
    snapshots = deferred();
    vi.mocked(getSessionSnapshots).mockReturnValue(snapshots.promise);
    vi.mocked(readProjectArchive).mockResolvedValue(savedPhoto());
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("saves a quick edit after delayed hydration without another edit", async () => {
    const { result } = renderHook(useSession);
    act(() => result.current.setPhotoPost((current) => ({ ...current, theme: "dim" })));
    await saveDebounce();
    expect(putSessionSnapshot).not.toHaveBeenCalled();
    await act(async () => snapshots.resolve({}));
    await saveDebounce();
    expect(createProjectArchive).toHaveBeenCalledWith("photoPost", expect.objectContaining({ theme: "dim" }), "de", {});
    expect(putSessionSnapshot).toHaveBeenCalledOnce();
  });

  it("does not overwrite an edit made while a snapshot is decoding", async () => {
    const decoded = deferred<ProjectArchiveResult>();
    vi.mocked(readProjectArchive).mockReturnValue(decoded.promise);
    const { result } = renderHook(useSession);
    await act(async () => snapshots.resolve({ photoPost: new Blob(["old"]) }));
    await settle();
    expect(readProjectArchive).toHaveBeenCalledOnce();
    act(() => result.current.setPhotoPost((current) => ({ ...current, theme: "dim" })));
    await act(async () => decoded.resolve(savedPhoto()));
    expect(result.current.photoPost.theme).toBe("dim");
    expect(disposeProjectImages).toHaveBeenCalledOnce();
    await saveDebounce();
    expect(createProjectArchive).toHaveBeenCalledWith("photoPost", expect.objectContaining({ theme: "dim" }), "de", {});
    expect(putSessionSnapshot).toHaveBeenCalledOnce();
  });

  it("restores an untouched project and saved tab without rewriting it", async () => {
    localStorage.setItem("social-media-creator-active-module", "messenger");
    const { result } = renderHook(useSession);
    await act(async () => snapshots.resolve({ photoPost: new Blob(["old"]) }));
    await settle();
    expect(result.current.photoPost.theme).toBe("dark");
    expect(result.current.activeModule).toBe("messenger");
    await saveDebounce();
    expect(putSessionSnapshot).not.toHaveBeenCalled();
  });

  it("restores saved content after a language-only change", async () => {
    const decoded = deferred<ProjectArchiveResult>();
    vi.mocked(readProjectArchive).mockReturnValue(decoded.promise);
    const { result } = renderHook(useSession);
    await act(async () => snapshots.resolve({ photoPost: new Blob(["old"]) }));
    await settle();
    act(() => result.current.setLocale("en"));
    await act(async () => decoded.resolve(savedPhoto()));
    expect(result.current.photoPost.theme).toBe("dark");
    expect(result.current.locale).toBe("en");
    expect(disposeProjectImages).not.toHaveBeenCalled();
    await saveDebounce();
    expect(createProjectArchive).not.toHaveBeenCalledWith("photoPost", expect.anything(), expect.anything(), expect.anything());
  });

  it("restores an untouched module while preserving another module's quick edit", async () => {
    vi.mocked(readProjectArchive).mockImplementation(async (file) => file.name === "photoPost.smc"
      ? savedPhoto()
      : {
          config: { format: "social-media-creator-config", version: 6, module: "messenger", locale: "de", data: { ...getDefaultMessenger("de"), theme: "dark" } },
          images: { photoPost: {}, messenger: {}, microblog: {} },
        });
    const { result } = renderHook(useSession);
    act(() => result.current.setPhotoPost((current) => ({ ...current, theme: "dim" })));
    await act(async () => snapshots.resolve({ photoPost: new Blob(["old"]), messenger: new Blob(["chat"]) }));
    await settle();
    expect(result.current.photoPost.theme).toBe("dim");
    expect(result.current.messenger.theme).toBe("dark");
    await saveDebounce();
    expect(putSessionSnapshot).toHaveBeenCalledOnce();
    expect(putSessionSnapshot).toHaveBeenCalledWith("photoPost", expect.any(Blob));
  });

  it("keeps and remembers a tab selected before hydration", async () => {
    localStorage.setItem("social-media-creator-active-module", "messenger");
    const { result } = renderHook(useSession);
    act(() => result.current.setActiveModule("microblog"));
    await act(async () => snapshots.resolve({}));
    expect(result.current.activeModule).toBe("microblog");
    expect(localStorage.getItem("social-media-creator-active-module")).toBe("microblog");
  });

  it("keeps a tab selection that returns to the initial tab while waiting", async () => {
    localStorage.setItem("social-media-creator-active-module", "messenger");
    const { result } = renderHook(useSession);
    act(() => result.current.setActiveModule("microblog"));
    act(() => result.current.setActiveModule("photoPost"));
    await act(async () => snapshots.resolve({}));
    expect(result.current.activeModule).toBe("photoPost");
    expect(localStorage.getItem("social-media-creator-active-module")).toBe("photoPost");
  });

  it("keeps manual import cancellation effective while decoding", async () => {
    const decoded = deferred<ProjectArchiveResult>();
    vi.mocked(readProjectArchive).mockReturnValue(decoded.promise);
    const { result } = renderHook(useSession);
    await act(async () => snapshots.resolve({ photoPost: new Blob(["old"]) }));
    await settle();
    act(() => {
      result.current.cancelPendingSessionRestore();
      result.current.setPhotoPost((current) => ({ ...current, theme: "dim" }));
    });
    await act(async () => decoded.resolve(savedPhoto()));
    expect(result.current.photoPost.theme).toBe("dim");
    expect(disposeProjectImages).toHaveBeenCalledOnce();
    await saveDebounce();
    expect(putSessionSnapshot).toHaveBeenCalledOnce();
  });

  it("disposes decoded images after unmount without scheduling a save", async () => {
    const decoded = deferred<ProjectArchiveResult>();
    vi.mocked(readProjectArchive).mockReturnValue(decoded.promise);
    const { unmount } = renderHook(useSession);
    await act(async () => snapshots.resolve({ photoPost: new Blob(["old"]) }));
    await settle();
    unmount();
    await act(async () => decoded.resolve(savedPhoto()));
    await saveDebounce();
    expect(disposeProjectImages).toHaveBeenCalledOnce();
    expect(putSessionSnapshot).not.toHaveBeenCalled();
  });
  it("reports a failed write without changing content and clears after a real retry", async () => {
    vi.mocked(putSessionSnapshot).mockRejectedValueOnce(new Error("Blob storage failed"));
    const { result } = renderHook(useSession);
    await act(async () => snapshots.resolve({}));
    act(() => result.current.setPhotoPost((current) => ({ ...current, theme: "dim" })));
    await saveDebounce();
    expect(result.current.sessionSaveError).toBe(true);
    expect(result.current.photoPost.theme).toBe("dim");
    // An unrelated unchanged module cannot count as a successful retry.
    act(() => result.current.setMessenger((current) => ({ ...current })));
    await saveDebounce();
    expect(result.current.sessionSaveError).toBe(true);
    expect(putSessionSnapshot).toHaveBeenCalledOnce();
    act(() => result.current.setPhotoPost((current) => ({ ...current })));
    await saveDebounce();
    expect(putSessionSnapshot).toHaveBeenCalledTimes(2);
    expect(result.current.sessionSaveError).toBe(false);
  });

  it("keeps the error until every failed module has successfully retried", async () => {
    vi.mocked(putSessionSnapshot).mockRejectedValue(new Error("Storage failed"));
    const { result } = renderHook(useSession);
    await act(async () => snapshots.resolve({}));
    act(() => {
      result.current.setPhotoPost((current) => ({ ...current, theme: "dim" }));
      result.current.setMessenger((current) => ({ ...current, theme: "dim" }));
    });
    await saveDebounce();
    expect(result.current.sessionSaveError).toBe(true);
    vi.mocked(putSessionSnapshot).mockResolvedValue(undefined);
    act(() => result.current.setPhotoPost((current) => ({ ...current })));
    await saveDebounce();
    expect(result.current.sessionSaveError).toBe(true);
    act(() => result.current.setMessenger((current) => ({ ...current })));
    await saveDebounce();
    expect(result.current.sessionSaveError).toBe(false);
  });

  it("reports failed reads and blocks autosave until explicit restore cancellation", async () => {
    vi.mocked(getSessionSnapshots).mockRejectedValueOnce(new Error("Read failed"));
    const { result } = renderHook(useSession);
    await settle();
    expect(result.current.sessionSaveError).toBe(true);
    act(() => result.current.setPhotoPost((current) => ({ ...current, theme: "dim" })));
    await saveDebounce();
    expect(putSessionSnapshot).not.toHaveBeenCalled();
    act(() => result.current.cancelPendingSessionRestore());
    expect(result.current.sessionSaveError).toBe(true);
    await saveDebounce();
    expect(putSessionSnapshot).toHaveBeenCalledOnce();
    expect(result.current.sessionSaveError).toBe(false);
  });

  it("rejects a failed clear without resetting content, active tab, or saved signatures", async () => {
    const { result } = renderHook(useSession);
    await act(async () => snapshots.resolve({}));
    act(() => {
      result.current.setPhotoPost((current) => ({ ...current, theme: "dim" }));
      result.current.setActiveModule("messenger");
    });
    await saveDebounce();
    const error = new Error("Clear failed");
    vi.mocked(clearSessionSnapshots).mockRejectedValueOnce(error);
    await act(async () => { await expect(result.current.clearSession()).rejects.toBe(error); });
    expect(result.current.photoPost.theme).toBe("dim");
    expect(localStorage.getItem("social-media-creator-active-module")).toBe("messenger");
    act(() => result.current.setPhotoPost((current) => ({ ...current })));
    await saveDebounce();
    expect(putSessionSnapshot).toHaveBeenCalledOnce();
  });

  it("retains a pending autosave when clearing storage fails", async () => {
    const { result } = renderHook(useSession);
    await act(async () => snapshots.resolve({}));
    act(() => result.current.setPhotoPost((current) => ({ ...current, theme: "dim" })));
    vi.mocked(clearSessionSnapshots).mockRejectedValueOnce(new Error("Clear failed"));
    await act(async () => { await expect(result.current.clearSession()).rejects.toThrow("Clear failed"); });
    await saveDebounce();
    expect(putSessionSnapshot).toHaveBeenCalledOnce();
    expect(result.current.photoPost.theme).toBe("dim");
  });

  it("flushes an early edit after hydration and reports a failed update save", async () => {
    const { result } = renderHook(useSession);
    act(() => result.current.setPhotoPost((current) => ({ ...current, theme: "dim" })));
    await act(async () => snapshots.resolve({}));
    await act(async () => {
      expect(await result.current.flushPendingSave()).toBe(true);
    });
    expect(putSessionSnapshot).toHaveBeenCalledOnce();

    vi.mocked(putSessionSnapshot).mockRejectedValueOnce(new Error("Storage full"));
    act(() => result.current.setPhotoPost((current) => ({ ...current, theme: "dark" })));
    await act(async () => {
      expect(await result.current.flushPendingSave()).toBe(false);
    });
    expect(result.current.sessionSaveError).toBe(true);
  });

});
