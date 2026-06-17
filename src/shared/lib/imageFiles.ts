import type { ImageState } from "../../domain/types";
import type { ImageErrorCode } from "../../i18n";

// Formats we store/serialize directly (export, archive, marker all assume these).
const canonicalImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export const maxImageSize = 5 * 1024 * 1024;
export const maxImageDimension = 4096;
// Hard ceiling for an uploaded image we are willing to decode and downscale.
// Above this we reject outright instead of allocating a giant bitmap — a guard
// against decompression bombs and runaway memory.
export const maxSourceImageDimension = 12000;
export const optimizedImageDimension = 2048;
export const optimizedImageQuality = 0.82;

// Detect the real image format from the file's magic bytes, ignoring the
// (often wrong or empty) declared MIME type and the file extension. This is what
// fixes uploads from tools like fobizz, where a saved image arrives as AVIF or
// with a mismatched type/extension. Returns the canonical MIME, or null when the
// bytes don't match any image format we support.
function detectImageType(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return "image/webp";
  }
  if (bytes.length >= 6 && ascii(0, 3) === "GIF") {
    return "image/gif";
  }
  // ISO-BMFF container: AVIF / HEIC share the `....ftyp<brand>` header.
  if (bytes.length >= 12 && ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (["heic", "heix", "heif", "hevc", "mif1", "msf1"].includes(brand)) {
      return "image/heic";
    }
  }
  return null;
}

async function getImageDimensions(file: Blob) {
  if ("createImageBitmap" in globalThis) {
    try {
      const bitmap = await createImageBitmap(file);
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch {
      // Safari/WebKit can reject WebP here while normal image decoding works.
    }
  }

  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const finish = (dimensions: { width: number; height: number } | null) => {
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };

    image.onload = () =>
      finish(
        image.naturalWidth > 0 && image.naturalHeight > 0
          ? { width: image.naturalWidth, height: image.naturalHeight }
          : null,
      );
    image.onerror = () => finish(null);
    image.src = url;
  });
}

export async function validateImageFile(
  file: File,
): Promise<ImageErrorCode | null> {
  if (file.size > maxImageSize) {
    return "image.tooLarge";
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const detected = detectImageType(header);
  if (!detected || !canonicalImageTypes.has(detected)) {
    return "image.invalidData";
  }

  const dimensions = await getImageDimensions(file);
  if (!dimensions) {
    return "image.decodeFailed";
  }
  if (
    dimensions.width > maxImageDimension ||
    dimensions.height > maxImageDimension
  ) {
    return "image.tooManyPixels";
  }

  return null;
}

export function createImageState(
  blob: Blob,
  fileName?: string,
  optimized = false,
): ImageState {
  return {
    blob,
    fileName: fileName ?? (blob instanceof File ? blob.name : "image.webp"),
    url: URL.createObjectURL(blob),
    optimized,
  };
}

export async function optimizeImage(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(
      1,
      optimizedImageDimension / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    context.drawImage(bitmap, 0, 0, width, height);
    const optimized = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error("WebP encoding failed")),
        "image/webp",
        optimizedImageQuality,
      );
    });
    canvas.width = 0;
    canvas.height = 0;
    return optimized;
  } finally {
    bitmap.close();
  }
}

// Upload-time preparation: validate the file, and instead of rejecting an
// oversized image (too many bytes or too many pixels), downscale it via
// optimizeImage and accept the smaller result. validateImageFile stays strict
// for the project-import path; this is only for direct uploads.
export async function prepareImageForUpload(
  file: File,
): Promise<{ image: ImageState } | { error: ImageErrorCode }> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const detected = detectImageType(header);
  if (!detected) {
    return { error: "image.invalidData" };
  }

  const dimensions = await getImageDimensions(file);
  if (!dimensions) {
    return { error: "image.decodeFailed" };
  }
  if (
    dimensions.width > maxSourceImageDimension ||
    dimensions.height > maxSourceImageDimension
  ) {
    return { error: "image.tooLargeToProcess" };
  }

  // Non-canonical but decodable formats (e.g. AVIF/HEIC/GIF) are re-encoded to a
  // format the rest of the app (export, archive, marker) can handle.
  const needsReencode = !canonicalImageTypes.has(detected);
  const oversized =
    file.size > maxImageSize ||
    dimensions.width > maxImageDimension ||
    dimensions.height > maxImageDimension;
  if (!needsReencode && !oversized) {
    return { image: createImageState(file) };
  }

  let optimized: Blob;
  try {
    optimized = await optimizeImage(file);
  } catch {
    return { error: "image.decodeFailed" };
  }
  if (optimized.size > maxImageSize) {
    return { error: "image.tooLarge" };
  }
  return { image: createImageState(optimized, file.name, true) };
}
