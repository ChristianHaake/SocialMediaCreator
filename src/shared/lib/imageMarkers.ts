import type { ModuleType } from "../../domain/types";

const markerMagic = new TextEncoder().encode("SMC-MARKER-V1");
const markerLengthBytes = 4;
const maxMarkerSize = 4096;
export const maxVerificationImageSize = 25 * 1024 * 1024;

export type ImageMarker = {
  appId: "SocialMediaCreator";
  markerVersion: 1;
  module: ModuleType;
  exportedAt: string;
  sha256: string;
};

export type VerificationResult =
  | { status: "valid"; marker: ImageMarker }
  | { status: "modified"; marker: ImageMarker }
  | { status: "none" };

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function isValidExportedAt(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function isImageMarker(value: unknown): value is ImageMarker {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Partial<ImageMarker>).appId === "SocialMediaCreator" &&
    (value as Partial<ImageMarker>).markerVersion === 1 &&
    ((value as Partial<ImageMarker>).module === "photoPost" ||
      (value as Partial<ImageMarker>).module === "messenger" ||
      (value as Partial<ImageMarker>).module === "microblog") &&
    isValidExportedAt((value as Partial<ImageMarker>).exportedAt) &&
    typeof (value as Partial<ImageMarker>).sha256 === "string" &&
    /^[a-f0-9]{64}$/.test((value as Partial<ImageMarker>).sha256 ?? "")
  );
}

export async function addImageMarker(blob: Blob, module: ModuleType) {
  const imageBytes = new Uint8Array(await blob.arrayBuffer());
  const marker: ImageMarker = {
    appId: "SocialMediaCreator",
    markerVersion: 1,
    module,
    exportedAt: new Date().toISOString(),
    sha256: bytesToHex(await crypto.subtle.digest("SHA-256", imageBytes)),
  };
  const markerBytes = new TextEncoder().encode(JSON.stringify(marker));
  const length = new Uint8Array(markerLengthBytes);
  new DataView(length.buffer).setUint32(0, markerBytes.length);
  return new Blob([imageBytes, markerBytes, length, markerMagic], {
    type: blob.type,
  });
}

export async function verifyImageMarker(
  file: Blob,
): Promise<VerificationResult> {
  if (file.size > maxVerificationImageSize) return { status: "none" };
  const trailerLength = markerMagic.length + markerLengthBytes;
  if (file.size <= trailerLength) return { status: "none" };

  const trailer = new Uint8Array(
    await file.slice(file.size - trailerLength).arrayBuffer(),
  );
  const hasMagic = markerMagic.every(
    (byte, index) => trailer[markerLengthBytes + index] === byte,
  );
  if (!hasMagic) return { status: "none" };

  const markerLength = new DataView(
    trailer.buffer,
    trailer.byteOffset,
    markerLengthBytes,
  ).getUint32(0);
  if (markerLength === 0 || markerLength > maxMarkerSize) {
    return { status: "none" };
  }

  const lengthStart = file.size - trailerLength;
  const markerStart = lengthStart - markerLength;
  if (markerStart < 0) return { status: "none" };

  let marker: ImageMarker;
  try {
    marker = JSON.parse(await file.slice(markerStart, lengthStart).text());
  } catch {
    return { status: "none" };
  }
  if (!isImageMarker(marker)) {
    return { status: "none" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const digest = bytesToHex(
    await crypto.subtle.digest("SHA-256", bytes.slice(0, markerStart)),
  );
  return digest === marker.sha256
    ? { status: "valid", marker }
    : { status: "modified", marker };
}
