import { afterEach, describe, expect, it, vi } from "vitest";
import { getSessionSnapshots, putSessionSnapshot } from "./sessionStore";

// Minimal IndexedDB stub whose transactions abort without firing onerror,
// as browsers do for QuotaExceededError at commit time.
function stubAbortingIndexedDb() {
  const close = vi.fn();
  const quota = new DOMException("Quota exceeded", "QuotaExceededError");
  const transaction: {
    error: DOMException | null;
    onabort: (() => void) | null;
    objectStore: () => unknown;
  } = {
    error: null,
    onabort: null,
    objectStore: () => ({
      put: () => ({}),
      get: () => ({}),
    }),
  };
  const db = {
    close,
    transaction: () => {
      setTimeout(() => {
        transaction.error = quota;
        transaction.onabort?.();
      });
      return transaction;
    },
  };
  vi.stubGlobal("indexedDB", {
    open: () => {
      const request: { result: unknown; onsuccess: (() => void) | null } = {
        result: db,
        onsuccess: null,
      };
      setTimeout(() => request.onsuccess?.());
      return request;
    },
  });
  return { close, quota };
}

describe("session store", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects writes and closes the db when the transaction aborts", async () => {
    const { close, quota } = stubAbortingIndexedDb();
    await expect(putSessionSnapshot("photoPost", new Blob())).rejects.toBe(
      quota,
    );
    expect(close).toHaveBeenCalled();
  });

  it("rejects reads and closes the db when the transaction aborts", async () => {
    const { close, quota } = stubAbortingIndexedDb();
    await expect(getSessionSnapshots()).rejects.toBe(quota);
    expect(close).toHaveBeenCalled();
  });
});
