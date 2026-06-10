import type { PhotoPostState } from "../types";

export type PhotoPostConfigFile = {
  format: "mockup-studio-config";
  version: 1;
  module: "photoPost";
  data: PhotoPostState;
};

const maxConfigSize = 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPhotoPostState(value: unknown): value is PhotoPostState {
  if (!isRecord(value)) return false;

  const allowedKeys = new Set([
    "username",
    "location",
    "caption",
    "imageAlt",
    "likes",
    "comments",
    "showLocation",
    "showComments",
  ]);

  return (
    Object.keys(value).every((key) => allowedKeys.has(key)) &&
    typeof value.username === "string" &&
    typeof value.location === "string" &&
    typeof value.caption === "string" &&
    typeof value.imageAlt === "string" &&
    isNonNegativeNumber(value.likes) &&
    isNonNegativeNumber(value.comments) &&
    typeof value.showLocation === "boolean" &&
    typeof value.showComments === "boolean"
  );
}

export function createPhotoPostConfig(
  data: PhotoPostState,
): PhotoPostConfigFile {
  return {
    format: "mockup-studio-config",
    version: 1,
    module: "photoPost",
    data,
  };
}

export function parsePhotoPostConfig(contents: string): PhotoPostConfigFile {
  let value: unknown;

  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error("Die Datei enthält kein gültiges JSON.");
  }

  if (!isRecord(value) || value.format !== "mockup-studio-config") {
    throw new Error("Die Datei ist keine Mockup-Studio-Konfiguration.");
  }

  if (value.version !== 1) {
    throw new Error("Diese Konfigurationsversion wird nicht unterstützt.");
  }

  if (value.module !== "photoPost" || !isPhotoPostState(value.data)) {
    throw new Error("Die Foto-Post-Konfiguration ist unvollständig.");
  }

  return value as PhotoPostConfigFile;
}

export async function readConfigFile(file: File) {
  if (file.size > maxConfigSize) {
    throw new Error("Die Konfigurationsdatei darf höchstens 1 MB groß sein.");
  }

  return parsePhotoPostConfig(await file.text());
}

export function downloadPhotoPostConfig(data: PhotoPostState) {
  const contents = JSON.stringify(createPhotoPostConfig(data), null, 2);
  const url = URL.createObjectURL(
    new Blob([contents], { type: "application/json" }),
  );
  const link = document.createElement("a");

  link.download = "mockup-studio-foto-post.json";
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
