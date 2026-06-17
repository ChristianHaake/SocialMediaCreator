import type { ImageState } from "../../domain/types";
import type { ImageErrorCode } from "../../i18n";

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export const maxImageSize = 5 * 1024 * 1024;
export const maxImageDimension = 4096;
// Hard ceiling for an uploaded image we are willing to decode and downscale.
// Above this we reject outright instead of allocating a giant bitmap — a guard
// against decompression bombs and runaway memory.
export const maxSourceImageDimension = 12000;
export const optimizedImageDimension = 2048;
export const optimizedImageQuality = 0.82;

function hasImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }

  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  return (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
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
  if (!acceptedImageTypes.has(file.type)) {
    return "image.invalidType";
  }

  if (file.size > maxImageSize) {
    return "image.tooLarge";
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasImageSignature(file.type, header)) {
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
  if (!acceptedImageTypes.has(file.type)) {
    return { error: "image.invalidType" };
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasImageSignature(file.type, header)) {
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
    return { error: "image.tooManyPixels" };
  }

  const oversized =
    file.size > maxImageSize ||
    dimensions.width > maxImageDimension ||
    dimensions.height > maxImageDimension;
  if (!oversized) {
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
