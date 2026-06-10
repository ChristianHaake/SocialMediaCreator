import type { ImageState } from "../types";

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSize = 10 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!acceptedImageTypes.has(file.type)) {
    return "Bitte wähle eine PNG-, JPG- oder WebP-Datei aus.";
  }

  if (file.size > maxImageSize) {
    return "Das Bild darf höchstens 10 MB groß sein.";
  }

  return null;
}

export function createImageState(file: File): ImageState {
  return {
    fileName: file.name,
    url: URL.createObjectURL(file),
  };
}
