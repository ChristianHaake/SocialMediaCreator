import type { ModuleType } from "../../domain/types";

// Local, automatic "last session" storage. Each module's project is saved as a
// .smc archive Blob (same format as manual Save) under its module key, so a
// page reload no longer wipes uploaded images or edits. IndexedDB is used
// because it can store Blobs directly (localStorage can't). All local, no
// upload — consistent with the app's privacy stance. CSP needs nothing extra.

const DB_NAME = "smc-session";
const STORE = "snapshots";
const DB_VERSION = 1;
const MODULES: ModuleType[] = ["photoPost", "messenger", "microblog"];
const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;

type StoredSnapshot = {
  blob: Blob;
  savedAt: number;
};

function isStoredSnapshot(value: unknown): value is StoredSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    "blob" in value &&
    (value as { blob?: unknown }).blob instanceof Blob &&
    "savedAt" in value &&
    typeof (value as { savedAt?: unknown }).savedAt === "number"
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function write(
  run: (store: IDBObjectStore) => void,
): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, "readwrite");
        run(transaction.objectStore(STORE));
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error ?? new Error("IndexedDB write failed"));
        };
      }),
  );
}

export function putSessionSnapshot(
  module: ModuleType,
  blob: Blob,
): Promise<void> {
  return write((store) => store.put({ blob, savedAt: Date.now() }, module));
}

export function deleteSessionSnapshot(module: ModuleType): Promise<void> {
  return write((store) => store.delete(module));
}

export function clearSessionSnapshots(): Promise<void> {
  return write((store) => store.clear());
}

export async function getSessionSnapshots(): Promise<
  Partial<Record<ModuleType, Blob>>
> {
  const db = await openDb();
  try {
    return await new Promise<Partial<Record<ModuleType, Blob>>>(
      (resolve, reject) => {
        const out: Partial<Record<ModuleType, Blob>> = {};
        const transaction = db.transaction(STORE, "readwrite");
        const store = transaction.objectStore(STORE);
        for (const module of MODULES) {
          const request = store.get(module);
          request.onsuccess = () => {
            if (request.result instanceof Blob) {
              out[module] = request.result;
              return;
            }
            if (!isStoredSnapshot(request.result)) return;
            if (Date.now() - request.result.savedAt > SNAPSHOT_TTL_MS) {
              store.delete(module);
              return;
            }
            out[module] = request.result.blob;
          };
        }
        transaction.oncomplete = () => resolve(out);
        transaction.onerror = () =>
          reject(transaction.error ?? new Error("IndexedDB read failed"));
      },
    );
  } finally {
    db.close();
  }
}
