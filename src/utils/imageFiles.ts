import type { ImageState } from "../types";
import type { ImageErrorCode } from "../i18n";

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSize = 10 * 1024 * 1024;

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

async function canDecodeImage(file: File) {
  if ("createImageBitmap" in globalThis) {
    try {
      const bitmap = await createImageBitmap(file);
      const valid = bitmap.width > 0 && bitmap.height > 0;
      bitmap.close();
      return valid;
    } catch {
      return false;
    }
  }

  return new Promise<boolean>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const finish = (valid: boolean) => {
      URL.revokeObjectURL(url);
      resolve(valid);
    };

    image.onload = () => finish(image.naturalWidth > 0 && image.naturalHeight > 0);
    image.onerror = () => finish(false);
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

  if (!(await canDecodeImage(file))) {
    return "image.decodeFailed";
  }

  return null;
}

export function createImageState(file: File): ImageState {
  return {
    fileName: file.name,
    url: URL.createObjectURL(file),
  };
}
