import { act, renderHook } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDefaultMessenger,
  getDefaultMicroblog,
  getDefaultPhotoPost,
  type ImageState,
  type MessengerImages,
  type MicroblogImages,
  type ModuleType,
  type PhotoPostImages,
  type PhotoPostState,
} from "../domain/types";
import type { ProjectImageMaps } from "../shared/lib/projectArchives";
import { useSessionPersistence } from "./useSessionPersistence";

const store = vi.hoisted(() => ({
  snapshots: {} as Record<string, Blob>,
  pending: [] as Array<() => void>,
}));

vi.mock("../shared/lib/sessionStore", () => ({
  getSessionSnapshots: vi.fn(async () => ({ ...store.snapshots })),
  // Commit happens when the test releases the write, like an IDB transaction.
  putSessionSnapshot: vi.fn(
    (module: string, blob: Blob) =>
      new Promise<void>((resolve) => {
        store.pending.push(() => {
          store.snapshots[module] = blob;
          resolve();
        });
      }),
  ),
  deleteSessionSnapshot: vi.fn(async (module: string) => {
    delete store.snapshots[module];
  }),
  clearSessionSnapshots: vi.fn(async () => {
    store.snapshots = {};
  }),
}));

vi.mock("../shared/lib/projectArchives", () => ({
  createProjectArchive: vi.fn(async (_m: string, state: PhotoPostState) =>
    new Blob([state.theme]),
  ),
  readProjectArchive: vi.fn(),
}));

const sessionStore = await import("../shared/lib/sessionStore");
const archives = await import("../shared/lib/projectArchives");

function useHarness() {
  const [photoPost, setPhotoPost] = useState(getDefaultPhotoPost("de"));
  const [messenger, setMessenger] = useState(getDefaultMessenger("de"));
  const [microblog, setMicroblog] = useState(getDefaultMicroblog("de"));
  const [photoImages, setPhotoImages] = useState<PhotoPostImages>({});
  const [messengerImages, setMessengerImages] = useState<MessengerImages>({});
  const [microblogImages, setMicroblogImages] = useState<MicroblogImages>({});
  const [activeModule, setActiveModule] = useState<ModuleType>("photoPost");
  const initialPhotoPost = useRef(photoPost);
  const initialMessenger = useRef(messenger);
  const initialMicroblog = useRef(microblog);
  const persistence = useSessionPersistence({
    locale: "de",
    activeModule,
    setActiveModule,
    photoPost,
    messenger,
    microblog,
    setPhotoPost,
    setMessenger,
    setMicroblog,
    initialPhotoPost,
    initialMessenger,
    initialMicroblog,
    photoImages,
    messengerImages,
    microblogImages,
    replaceModuleImages: (module: ModuleType, images: ProjectImageMaps) => {
      if (module === "photoPost") setPhotoImages(images.photoPost);
      if (module === "messenger") setMessengerImages(images.messenger);
      if (module === "microblog") setMicroblogImages(images.microblog);
    },
  });
  return { ...persistence, setPhotoPost, photoImagesForTest: photoImages };
}

async function settle(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function releaseNextWrite() {
  await act(async () => {
    store.pending.shift()?.();
    await vi.advanceTimersByTimeAsync(0);
  });
}

function setTheme(
  result: { current: ReturnType<typeof useHarness> },
  theme: PhotoPostState["theme"],
) {
  act(() =>
    result.current.setPhotoPost({ ...getDefaultPhotoPost("de"), theme }),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  store.snapshots = {};
  store.pending = [];
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSessionPersistence", () => {
  it("never runs two saves at once, so the newest edit is what stays stored", async () => {
    const { result } = renderHook(() => useHarness());
    await settle();

    setTheme(result, "dark");
    await settle(1000);
    expect(sessionStore.putSessionSnapshot).toHaveBeenCalledTimes(1);

    setTheme(result, "dim");
    await settle(1000);
    // Second save waits for the first write to commit.
    expect(sessionStore.putSessionSnapshot).toHaveBeenCalledTimes(1);

    await releaseNextWrite();
    expect(sessionStore.putSessionSnapshot).toHaveBeenCalledTimes(2);
    await releaseNextWrite();

    expect(await store.snapshots.photoPost.text()).toBe("dim");
  });

  it("does not write anything back after clearing saved data", async () => {
    const { result } = renderHook(() => useHarness());
    await settle();

    setTheme(result, "dark");
    await settle(1000);
    expect(store.pending).toHaveLength(1);

    // An edit still waiting for its debounce when the user clears.
    setTheme(result, "dim");
    const clearing = result.current.clearSession();
    await releaseNextWrite();
    await act(async () => {
      await clearing;
    });
    await settle(2000);

    expect(store.pending).toHaveLength(0);
    expect(store.snapshots).toEqual({});
  });

  it("does not re-save a restored module whose images are unchanged", async () => {
    const restored = { ...getDefaultPhotoPost("de"), theme: "dark" as const };
    const postId = restored.posts[0].id;
    const image: ImageState = {
      blob: new Blob(["x"]),
      fileName: "a.webp",
      url: "blob:restored",
      optimized: true,
    };
    store.snapshots.photoPost = new Blob(["snapshot"]);
    vi.mocked(archives.readProjectArchive).mockResolvedValue({
      config: { module: "photoPost", data: restored, locale: "de" },
      images: {
        photoPost: {
          [postId]: { profileImage: image, media: {}, commentImages: {} },
        },
        messenger: {},
        microblog: {},
      },
    } as never);

    const { result } = renderHook(() => useHarness());
    await settle();
    await settle(2000);

    expect(archives.readProjectArchive).toHaveBeenCalledTimes(1);
    expect(result.current.photoImagesForTest[postId]?.profileImage).toBe(image);
    expect(archives.createProjectArchive).not.toHaveBeenCalled();
  });

  it("saves pending edits immediately on flush", async () => {
    const { result } = renderHook(() => useHarness());
    await settle();

    setTheme(result, "dark");
    const flushing = result.current.flushPendingSave();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await releaseNextWrite();
    await act(async () => {
      await flushing;
    });

    expect(await store.snapshots.photoPost.text()).toBe("dark");
  });
});
