import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDefaultMessenger,
  getDefaultMicroblog,
  getDefaultPhotoPost,
} from "../domain/types";
import type { ProjectArchiveResult } from "../shared/lib/projectArchives";
import { useProjectStorage, type ProjectStorageConfig } from "./useProjectStorage";

const archive = vi.hoisted(() => ({
  finish: (() => undefined) as (result: unknown) => void,
}));

vi.mock("../shared/lib/projectArchives", () => ({
  readProjectArchive: vi.fn(
    () =>
      new Promise<ProjectArchiveResult>((resolve) => {
        archive.finish = resolve as (result: unknown) => void;
      }),
  ),
  disposeProjectImages: vi.fn(),
}));

function configWith(changed: boolean): ProjectStorageConfig {
  return {
    locale: "de",
    setLocale: vi.fn(),
    t: (key) => key,
    activeModule: "photoPost",
    setActiveModule: vi.fn(),
    setMobileView: vi.fn(),
    setImageError: vi.fn(),
    isModuleChanged: () => changed,
    photoPost: getDefaultPhotoPost("de"),
    messenger: getDefaultMessenger("de"),
    microblog: getDefaultMicroblog("de"),
    setPhotoPost: vi.fn(),
    setMessenger: vi.fn(),
    setMicroblog: vi.fn(),
    initialPhotoPost: { current: getDefaultPhotoPost("de") },
    initialMessenger: { current: getDefaultMessenger("de") },
    initialMicroblog: { current: getDefaultMicroblog("de") },
    photoImages: {},
    messengerImages: {},
    microblogImages: {},
    replaceModuleImages: vi.fn(),
    clearModuleImages: vi.fn(),
    cancelPendingSessionRestore: vi.fn(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useProjectStorage", () => {
  it("asks before overwriting edits made while a project was still loading", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result, rerender } = renderHook(
      ({ changed }) => useProjectStorage(configWith(changed)),
      { initialProps: { changed: false } },
    );
    const event = {
      target: { files: [new File(["zip"], "project.smc")], value: "" },
    } as unknown as ChangeEvent<HTMLInputElement>;

    let loading: Promise<void> = Promise.resolve();
    act(() => {
      loading = result.current.handleProjectUpload(event);
    });
    await act(async () => undefined);
    // The user edits while the archive is still being read.
    rerender({ changed: true });
    await act(async () => {
      archive.finish({
        config: { module: "photoPost", data: getDefaultPhotoPost("de"), locale: "de" },
        images: { photoPost: {}, messenger: {}, microblog: {} },
      });
      await loading;
    });

    expect(confirm).toHaveBeenCalledOnce();
  });
});
