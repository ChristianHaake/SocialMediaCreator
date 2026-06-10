import type {
  MessengerMessage,
  MessengerState,
  MicroblogState,
  ModuleType,
  PhotoPostState,
} from "../types";

type BaseConfigFile = {
  format: "mockup-studio-config";
  version: 1;
};

export type PhotoPostConfigFile = BaseConfigFile & {
  module: "photoPost";
  data: PhotoPostState;
};

export type MessengerConfigFile = BaseConfigFile & {
  module: "messenger";
  data: MessengerState;
};

export type MicroblogConfigFile = BaseConfigFile & {
  module: "microblog";
  data: MicroblogState;
};

export type ConfigFile =
  | PhotoPostConfigFile
  | MessengerConfigFile
  | MicroblogConfigFile;

const maxConfigSize = 1024 * 1024;
const maxMessages = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]) {
  const allowed = new Set(allowedKeys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPhotoPostState(value: unknown): value is PhotoPostState {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, [
      "username",
      "location",
      "caption",
      "imageAlt",
      "likes",
      "comments",
      "showLocation",
      "showComments",
    ]) &&
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

function isMessengerMessage(value: unknown): value is MessengerMessage {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, ["id", "type", "text", "time"]) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    (value.type === "sent" || value.type === "received") &&
    typeof value.text === "string" &&
    typeof value.time === "string"
  );
}

function isMessengerState(value: unknown): value is MessengerState {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, ["contactName", "status", "messages"]) &&
    typeof value.contactName === "string" &&
    typeof value.status === "string" &&
    Array.isArray(value.messages) &&
    value.messages.length <= maxMessages &&
    value.messages.every(isMessengerMessage) &&
    new Set(value.messages.map((message) => message.id)).size ===
      value.messages.length
  );
}

function isMicroblogState(value: unknown): value is MicroblogState {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, [
      "displayName",
      "handle",
      "text",
      "date",
      "time",
      "showDate",
      "showTime",
      "replies",
      "reposts",
      "likes",
    ]) &&
    typeof value.displayName === "string" &&
    typeof value.handle === "string" &&
    typeof value.text === "string" &&
    typeof value.date === "string" &&
    typeof value.time === "string" &&
    typeof value.showDate === "boolean" &&
    typeof value.showTime === "boolean" &&
    isNonNegativeNumber(value.replies) &&
    isNonNegativeNumber(value.reposts) &&
    isNonNegativeNumber(value.likes)
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

export function createMessengerConfig(
  data: MessengerState,
): MessengerConfigFile {
  return {
    format: "mockup-studio-config",
    version: 1,
    module: "messenger",
    data,
  };
}

export function createMicroblogConfig(
  data: MicroblogState,
): MicroblogConfigFile {
  return {
    format: "mockup-studio-config",
    version: 1,
    module: "microblog",
    data,
  };
}

export function parseConfig(contents: string): ConfigFile {
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

  if (value.module === "photoPost" && isPhotoPostState(value.data)) {
    return value as PhotoPostConfigFile;
  }

  if (value.module === "messenger" && isMessengerState(value.data)) {
    return value as MessengerConfigFile;
  }

  if (value.module === "microblog" && isMicroblogState(value.data)) {
    return value as MicroblogConfigFile;
  }

  throw new Error("Die Modulkonfiguration ist unvollständig.");
}

export function parsePhotoPostConfig(contents: string): PhotoPostConfigFile {
  const config = parseConfig(contents);
  if (config.module !== "photoPost") {
    throw new Error("Die Datei enthält keine Foto-Post-Konfiguration.");
  }
  return config;
}

export async function readConfigFile(file: File) {
  if (file.size > maxConfigSize) {
    throw new Error("Die Konfigurationsdatei darf höchstens 1 MB groß sein.");
  }

  return parseConfig(await file.text());
}

function downloadConfig(config: ConfigFile, fileName: string) {
  const contents = JSON.stringify(config, null, 2);
  const url = URL.createObjectURL(
    new Blob([contents], { type: "application/json" }),
  );
  const link = document.createElement("a");

  link.download = fileName;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadModuleConfig(
  module: ModuleType,
  data: PhotoPostState | MessengerState | MicroblogState,
) {
  if (module === "photoPost") {
    downloadConfig(
      createPhotoPostConfig(data as PhotoPostState),
      "mockup-studio-foto-post.json",
    );
    return;
  }

  if (module === "messenger") {
    downloadConfig(
      createMessengerConfig(data as MessengerState),
      "mockup-studio-messenger-chat.json",
    );
    return;
  }

  downloadConfig(
    createMicroblogConfig(data as MicroblogState),
    "mockup-studio-mikroblog.json",
  );
}

export function downloadPhotoPostConfig(data: PhotoPostState) {
  downloadModuleConfig("photoPost", data);
}
