import { fieldLimits } from "../constraints";
import type {
  MessengerMessage,
  MessengerState,
  MicroblogPost,
  MicroblogState,
  ModuleType,
  PhotoPost,
  PhotoPostState,
  PostComment,
} from "../types";

type BaseConfigFile = {
  format: "mockup-studio-config";
  version: 2;
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

function isStringWithin(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function isTimeString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value === "" || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))
  );
}

function isDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value === "") return true;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];

  return daysInMonth !== undefined && day >= 1 && day <= daysInMonth;
}

function isPostComment(value: unknown): value is PostComment {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, ["id", "author", "text"]) &&
    isStringWithin(value.id, fieldLimits.common.commentId) &&
    value.id.length > 0 &&
    isStringWithin(value.author, fieldLimits.common.commentAuthor) &&
    isStringWithin(value.text, fieldLimits.common.commentText)
  );
}

function hasValidComments(value: unknown): value is PostComment[] {
  return (
    Array.isArray(value) &&
    value.length <= fieldLimits.common.comments &&
    value.every(isPostComment) &&
    new Set(value.map((comment) => comment.id)).size === value.length
  );
}

function isPhotoPost(value: unknown): value is PhotoPost {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, [
      "id",
      "username",
      "location",
      "caption",
      "imageAlt",
      "likes",
      "commentCount",
      "showLocation",
      "showComments",
      "comments",
    ]) &&
    isStringWithin(value.id, fieldLimits.common.postId) &&
    value.id.length > 0 &&
    isStringWithin(value.username, fieldLimits.photoPost.username) &&
    isStringWithin(value.location, fieldLimits.photoPost.location) &&
    isStringWithin(value.caption, fieldLimits.photoPost.caption) &&
    isStringWithin(value.imageAlt, fieldLimits.photoPost.imageAlt) &&
    isNonNegativeNumber(value.likes) &&
    isNonNegativeNumber(value.commentCount) &&
    typeof value.showLocation === "boolean" &&
    typeof value.showComments === "boolean" &&
    hasValidComments(value.comments)
  );
}

function isPhotoPostState(value: unknown): value is PhotoPostState {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, ["activePostId", "posts"]) &&
    isStringWithin(value.activePostId, fieldLimits.common.postId) &&
    Array.isArray(value.posts) &&
    value.posts.length > 0 &&
    value.posts.length <= fieldLimits.common.posts &&
    value.posts.every(isPhotoPost) &&
    new Set(value.posts.map((post) => post.id)).size === value.posts.length &&
    value.posts.some((post) => post.id === value.activePostId)
  );
}

function isMessengerMessage(value: unknown): value is MessengerMessage {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, ["id", "type", "text", "time"]) &&
    isStringWithin(value.id, fieldLimits.messenger.messageId) &&
    value.id.length > 0 &&
    (value.type === "sent" || value.type === "received") &&
    isStringWithin(value.text, fieldLimits.messenger.messageText) &&
    isTimeString(value.time)
  );
}

function isMessengerState(value: unknown): value is MessengerState {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, ["contactName", "status", "messages"]) &&
    isStringWithin(value.contactName, fieldLimits.messenger.contactName) &&
    isStringWithin(value.status, fieldLimits.messenger.status) &&
    Array.isArray(value.messages) &&
    value.messages.length <= fieldLimits.messenger.messages &&
    value.messages.every(isMessengerMessage) &&
    new Set(value.messages.map((message) => message.id)).size ===
      value.messages.length
  );
}

function isMicroblogPost(value: unknown): value is MicroblogPost {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, [
      "id",
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
      "comments",
    ]) &&
    isStringWithin(value.id, fieldLimits.common.postId) &&
    value.id.length > 0 &&
    isStringWithin(value.displayName, fieldLimits.microblog.displayName) &&
    isStringWithin(value.handle, fieldLimits.microblog.handle) &&
    typeof value.text === "string" &&
    isDateString(value.date) &&
    isTimeString(value.time) &&
    typeof value.showDate === "boolean" &&
    typeof value.showTime === "boolean" &&
    isNonNegativeNumber(value.replies) &&
    isNonNegativeNumber(value.reposts) &&
    isNonNegativeNumber(value.likes) &&
    hasValidComments(value.comments)
  );
}

function isMicroblogState(value: unknown): value is MicroblogState {
  if (!isRecord(value)) return false;

  return (
    hasOnlyKeys(value, ["activePostId", "posts"]) &&
    isStringWithin(value.activePostId, fieldLimits.common.postId) &&
    Array.isArray(value.posts) &&
    value.posts.length > 0 &&
    value.posts.length <= fieldLimits.common.posts &&
    value.posts.every(isMicroblogPost) &&
    new Set(value.posts.map((post) => post.id)).size === value.posts.length &&
    value.posts.some((post) => post.id === value.activePostId)
  );
}

export function createPhotoPostConfig(
  data: PhotoPostState,
): PhotoPostConfigFile {
  return {
    format: "mockup-studio-config",
    version: 2,
    module: "photoPost",
    data,
  };
}

export function createMessengerConfig(
  data: MessengerState,
): MessengerConfigFile {
  return {
    format: "mockup-studio-config",
    version: 2,
    module: "messenger",
    data,
  };
}

export function createMicroblogConfig(
  data: MicroblogState,
): MicroblogConfigFile {
  return {
    format: "mockup-studio-config",
    version: 2,
    module: "microblog",
    data,
  };
}

function migrateVersionOne(value: Record<string, unknown>): ConfigFile | null {
  if (!isRecord(value.data)) return null;

  if (value.module === "photoPost") {
    const data = value.data;
    const migrated: PhotoPostState = {
      activePostId: "photo-post-imported-1",
      posts: [
        {
          id: "photo-post-imported-1",
          username: data.username as string,
          location: data.location as string,
          caption: data.caption as string,
          imageAlt: data.imageAlt as string,
          likes: data.likes as number,
          commentCount: data.comments as number,
          showLocation: data.showLocation as boolean,
          showComments: data.showComments as boolean,
          comments: [],
        },
      ],
    };
    return isPhotoPostState(migrated)
      ? createPhotoPostConfig(migrated)
      : null;
  }

  if (value.module === "messenger" && isMessengerState(value.data)) {
    return createMessengerConfig(value.data);
  }

  if (value.module === "microblog") {
    const data = value.data;
    const migrated: MicroblogState = {
      activePostId: "microblog-post-imported-1",
      posts: [
        {
          id: "microblog-post-imported-1",
          displayName: data.displayName as string,
          handle: data.handle as string,
          text: data.text as string,
          date: data.date as string,
          time: data.time as string,
          showDate: data.showDate as boolean,
          showTime: data.showTime as boolean,
          replies: data.replies as number,
          reposts: data.reposts as number,
          likes: data.likes as number,
          comments: [],
        },
      ],
    };
    return isMicroblogState(migrated)
      ? createMicroblogConfig(migrated)
      : null;
  }

  return null;
}

export function parseConfig(contents: string): ConfigFile {
  let value: unknown;

  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error("Die Datei enthält kein gültiges JSON.");
  }

  if (!isRecord(value) || value.format !== "mockup-studio-config") {
    throw new Error("Die Datei ist keine SocialMediaCreator-Konfiguration.");
  }

  if (value.version === 1) {
    const migrated = migrateVersionOne(value);
    if (migrated) return migrated;
    throw new Error("Die Modulkonfiguration ist unvollständig.");
  }

  if (value.version !== 2) {
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
      "social-media-creator-foto-post.json",
    );
    return;
  }

  if (module === "messenger") {
    downloadConfig(
      createMessengerConfig(data as MessengerState),
      "social-media-creator-messenger-chat.json",
    );
    return;
  }

  downloadConfig(
    createMicroblogConfig(data as MicroblogState),
    "social-media-creator-mikroblog.json",
  );
}

export function downloadPhotoPostConfig(data: PhotoPostState) {
  downloadModuleConfig("photoPost", data);
}
