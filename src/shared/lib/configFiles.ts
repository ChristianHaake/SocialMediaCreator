import { fieldLimits } from "../../domain/constraints";
import type {
  CommentReply,
  MessengerMessage,
  MessengerProfile,
  MessengerState,
  MicroblogPost,
  MicroblogState,
  ModuleType,
  Locale,
  PhotoMedia,
  PhotoPost,
  PhotoPostState,
  PostComment,
  PostViewMode,
  Theme,
  TimelineSortOrder,
} from "../../domain/types";
import type { ConfigErrorCode } from "../../i18n";

type BaseConfigFile = {
  format: "social-media-creator-config";
  version: 6;
  locale: Locale;
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

export class ConfigFileError extends Error {
  constructor(public code: ConfigErrorCode) {
    super(code);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]) {
  const allowed = new Set(allowedKeys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function isStringWithin(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dim" || value === "dark";
}

function isLocale(value: unknown): value is Locale {
  return value === "de" || value === "en";
}

function isSortOrder(value: unknown): value is TimelineSortOrder {
  return value === "newest" || value === "oldest";
}

function isViewMode(value: unknown): value is PostViewMode {
  return value === "post" || value === "comments";
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isOptionalTime(value: unknown): value is string {
  return (
    value === "" ||
    (typeof value === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
  );
}

function hasUniqueIds(values: Array<{ id: string }>) {
  return new Set(values.map(({ id }) => id)).size === values.length;
}

function isReply(value: unknown): value is CommentReply {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, ["id", "author", "text", "timestamp"]) &&
    isStringWithin(value.id, fieldLimits.common.commentId) &&
    value.id.length > 0 &&
    isStringWithin(value.author, fieldLimits.common.commentAuthor) &&
    isStringWithin(value.text, fieldLimits.common.commentText) &&
    isStringWithin(value.timestamp, fieldLimits.common.timestamp)
  );
}

function isComment(value: unknown): value is PostComment {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, ["id", "author", "text", "timestamp", "replies"]) &&
    isStringWithin(value.id, fieldLimits.common.commentId) &&
    value.id.length > 0 &&
    isStringWithin(value.author, fieldLimits.common.commentAuthor) &&
    isStringWithin(value.text, fieldLimits.common.commentText) &&
    isStringWithin(value.timestamp, fieldLimits.common.timestamp) &&
    Array.isArray(value.replies) &&
    value.replies.length <= fieldLimits.common.replies &&
    value.replies.every(isReply) &&
    hasUniqueIds(value.replies)
  );
}

function hasValidComments(value: unknown): value is PostComment[] {
  if (
    !Array.isArray(value) ||
    value.length > fieldLimits.common.comments ||
    !value.every(isComment) ||
    !hasUniqueIds(value)
  ) {
    return false;
  }
  const ids = value.flatMap((comment) => [
    comment.id,
    ...comment.replies.map((reply) => reply.id),
  ]);
  return new Set(ids).size === ids.length;
}

function isPhotoMedia(value: unknown): value is PhotoMedia {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, [
      "id",
      "imageAlt",
      "mode",
      "videoDuration",
      "videoViews",
    ]) &&
    isStringWithin(value.id, fieldLimits.common.postId) &&
    value.id.length > 0 &&
    isStringWithin(value.imageAlt, fieldLimits.photoPost.imageAlt) &&
    (value.mode === "image" || value.mode === "video") &&
    isStringWithin(value.videoDuration, fieldLimits.photoPost.videoDuration) &&
    isStringWithin(value.videoViews, fieldLimits.photoPost.videoViews)
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
      "date",
      "time",
      "viewMode",
      "likes",
      "commentCount",
      "showLocation",
      "showComments",
      "activeMediaId",
      "media",
      "comments",
    ]) &&
    isStringWithin(value.id, fieldLimits.common.postId) &&
    value.id.length > 0 &&
    isStringWithin(value.username, fieldLimits.photoPost.username) &&
    isStringWithin(value.location, fieldLimits.photoPost.location) &&
    isStringWithin(value.caption, fieldLimits.photoPost.caption) &&
    isDate(value.date) &&
    isOptionalTime(value.time) &&
    isViewMode(value.viewMode) &&
    isNonNegativeNumber(value.likes) &&
    isNonNegativeNumber(value.commentCount) &&
    typeof value.showLocation === "boolean" &&
    typeof value.showComments === "boolean" &&
    isStringWithin(value.activeMediaId, fieldLimits.common.postId) &&
    Array.isArray(value.media) &&
    value.media.length > 0 &&
    value.media.length <= fieldLimits.photoPost.media &&
    value.media.every(isPhotoMedia) &&
    hasUniqueIds(value.media) &&
    value.media.some((media) => media.id === value.activeMediaId) &&
    hasValidComments(value.comments)
  );
}

function isPhotoPostState(value: unknown): value is PhotoPostState {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, ["theme", "sortOrder", "activePostId", "posts"]) &&
    isTheme(value.theme) &&
    isSortOrder(value.sortOrder) &&
    isStringWithin(value.activePostId, fieldLimits.common.postId) &&
    Array.isArray(value.posts) &&
    value.posts.length > 0 &&
    value.posts.length <= fieldLimits.common.posts &&
    value.posts.every(isPhotoPost) &&
    hasUniqueIds(value.posts) &&
    value.posts.some((post) => post.id === value.activePostId)
  );
}

function isMessengerProfile(value: unknown): value is MessengerProfile {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, ["id", "name", "status", "side"]) &&
    isStringWithin(value.id, fieldLimits.messenger.profileId) &&
    value.id.length > 0 &&
    isStringWithin(value.name, fieldLimits.messenger.contactName) &&
    isStringWithin(value.status, fieldLimits.messenger.status) &&
    (value.side === "left" || value.side === "right")
  );
}

function isMessengerMessage(value: unknown): value is MessengerMessage {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, ["id", "senderId", "text", "timestamp", "seen"]) &&
    isStringWithin(value.id, fieldLimits.messenger.messageId) &&
    value.id.length > 0 &&
    isStringWithin(value.senderId, fieldLimits.messenger.profileId) &&
    isStringWithin(value.text, fieldLimits.messenger.messageText) &&
    isStringWithin(value.timestamp, fieldLimits.common.timestamp) &&
    typeof value.seen === "boolean"
  );
}

function isMessengerState(value: unknown): value is MessengerState {
  if (!isRecord(value)) return false;
  if (
    !hasOnlyKeys(value, ["theme", "profiles", "messages"]) ||
    !isTheme(value.theme) ||
    !Array.isArray(value.profiles) ||
    value.profiles.length !== 2 ||
    !value.profiles.every(isMessengerProfile) ||
    !hasUniqueIds(value.profiles) ||
    new Set(value.profiles.map((profile) => profile.side)).size !== 2 ||
    !Array.isArray(value.messages) ||
    value.messages.length > fieldLimits.messenger.messages ||
    !value.messages.every(isMessengerMessage) ||
    !hasUniqueIds(value.messages)
  ) {
    return false;
  }
  const profileIds = new Set(value.profiles.map((profile) => profile.id));
  return value.messages.every((message) => profileIds.has(message.senderId));
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
      "viewMode",
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
    isDate(value.date) &&
    isOptionalTime(value.time) &&
    isViewMode(value.viewMode) &&
    isNonNegativeNumber(value.replies) &&
    isNonNegativeNumber(value.reposts) &&
    isNonNegativeNumber(value.likes) &&
    hasValidComments(value.comments)
  );
}

function isMicroblogState(value: unknown): value is MicroblogState {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, [
      "theme",
      "layoutMode",
      "sortOrder",
      "activePostId",
      "posts",
    ]) &&
    isTheme(value.theme) &&
    (value.layoutMode === "feed" || value.layoutMode === "thread") &&
    isSortOrder(value.sortOrder) &&
    isStringWithin(value.activePostId, fieldLimits.common.postId) &&
    Array.isArray(value.posts) &&
    value.posts.length > 0 &&
    value.posts.length <= fieldLimits.common.posts &&
    value.posts.every(isMicroblogPost) &&
    hasUniqueIds(value.posts) &&
    value.posts.some((post) => post.id === value.activePostId)
  );
}

export function createPhotoPostConfig(
  data: PhotoPostState,
  locale: Locale = "de",
): PhotoPostConfigFile {
  return {
    format: "social-media-creator-config",
    version: 6,
    locale,
    module: "photoPost",
    data,
  };
}

export function createMessengerConfig(
  data: MessengerState,
  locale: Locale = "de",
): MessengerConfigFile {
  return {
    format: "social-media-creator-config",
    version: 6,
    locale,
    module: "messenger",
    data,
  };
}

export function createMicroblogConfig(
  data: MicroblogState,
  locale: Locale = "de",
): MicroblogConfigFile {
  return {
    format: "social-media-creator-config",
    version: 6,
    locale,
    module: "microblog",
    data,
  };
}

export function parseConfig(contents: string): ConfigFile {
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new ConfigFileError("config.invalidJson");
  }

  if (!isRecord(value)) {
    throw new ConfigFileError("config.invalidFormat");
  }
  if (value.format !== "social-media-creator-config") {
    throw new ConfigFileError("config.invalidFormat");
  }
  if (value.version === 5) {
    if (value.module === "photoPost" && isPhotoPostState(value.data)) {
      return createPhotoPostConfig(value.data, "de");
    }
    if (value.module === "messenger" && isMessengerState(value.data)) {
      return createMessengerConfig(value.data, "de");
    }
    if (value.module === "microblog" && isMicroblogState(value.data)) {
      return createMicroblogConfig(value.data, "de");
    }
    throw new ConfigFileError("config.incomplete");
  }
  if (value.version !== 6) {
    throw new ConfigFileError("config.unsupportedVersion");
  }
  if (!isLocale(value.locale)) {
    throw new ConfigFileError("config.incomplete");
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
  throw new ConfigFileError("config.incomplete");
}

export function parsePhotoPostConfig(contents: string): PhotoPostConfigFile {
  const config = parseConfig(contents);
  if (config.module !== "photoPost") {
    throw new ConfigFileError("config.wrongModule");
  }
  return config;
}

export async function readConfigFile(file: File) {
  if (file.size > maxConfigSize) {
    throw new ConfigFileError("config.tooLarge");
  }
  return parseConfig(await file.text());
}

function downloadConfig(config: ConfigFile, fileName: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(config, null, 2)], { type: "application/json" }),
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
  locale: Locale,
) {
  if (module === "photoPost") {
    downloadConfig(
      createPhotoPostConfig(data as PhotoPostState, locale),
      "social-media-creator-foto-post.json",
    );
    return;
  }
  if (module === "messenger") {
    downloadConfig(
      createMessengerConfig(data as MessengerState, locale),
      "social-media-creator-messenger-chat.json",
    );
    return;
  }
  downloadConfig(
    createMicroblogConfig(data as MicroblogState, locale),
    "social-media-creator-mikroblog.json",
  );
}

export function downloadPhotoPostConfig(
  data: PhotoPostState,
  locale: Locale = "de",
) {
  downloadModuleConfig("photoPost", data, locale);
}
