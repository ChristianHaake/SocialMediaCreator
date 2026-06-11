import { fieldLimits } from "../constraints";
import type {
  CommentReply,
  MessengerMessage,
  MessengerProfile,
  MessengerState,
  MicroblogPost,
  MicroblogState,
  ModuleType,
  PhotoMedia,
  PhotoPost,
  PhotoPostState,
  PostComment,
  PostViewMode,
  Theme,
} from "../types";

type BaseConfigFile = {
  format: "social-media-creator-config";
  version: 4;
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
const legacyFormat = "mockup-studio-config";

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

function isViewMode(value: unknown): value is PostViewMode {
  return value === "post" || value === "comments";
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
      "timestamp",
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
    isStringWithin(value.timestamp, fieldLimits.common.timestamp) &&
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
    hasOnlyKeys(value, ["theme", "activePostId", "posts"]) &&
    isTheme(value.theme) &&
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
      "timestamp",
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
    isStringWithin(value.timestamp, fieldLimits.common.timestamp) &&
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
    hasOnlyKeys(value, ["theme", "layoutMode", "activePostId", "posts"]) &&
    isTheme(value.theme) &&
    (value.layoutMode === "feed" || value.layoutMode === "thread") &&
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
): PhotoPostConfigFile {
  return {
    format: "social-media-creator-config",
    version: 4,
    module: "photoPost",
    data,
  };
}

export function createMessengerConfig(
  data: MessengerState,
): MessengerConfigFile {
  return {
    format: "social-media-creator-config",
    version: 4,
    module: "messenger",
    data,
  };
}

export function createMicroblogConfig(
  data: MicroblogState,
): MicroblogConfigFile {
  return {
    format: "social-media-creator-config",
    version: 4,
    module: "microblog",
    data,
  };
}

function migrateComments(value: unknown): PostComment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((comment, index) => ({
      id:
        typeof comment.id === "string"
          ? comment.id
          : `migrated-comment-${index + 1}`,
      author: typeof comment.author === "string" ? comment.author : "",
      text: typeof comment.text === "string" ? comment.text : "",
      timestamp: "",
      replies: [],
    }));
}

function migratePhotoData(data: Record<string, unknown>): PhotoPostState | null {
  const sourcePosts = Array.isArray(data.posts) ? data.posts : [data];
  const posts = sourcePosts.filter(isRecord).map((post, index) => {
    const id =
      typeof post.id === "string" ? post.id : `photo-post-imported-${index + 1}`;
    const mediaId = `photo-media-imported-${index + 1}`;
    return {
      id,
      username: post.username as string,
      location: post.location as string,
      caption: post.caption as string,
      timestamp: "vor einem Moment",
      viewMode: "post" as const,
      likes: post.likes as number,
      commentCount:
        typeof post.commentCount === "number"
          ? post.commentCount
          : typeof post.comments === "number"
            ? post.comments
            : Array.isArray(post.comments)
              ? post.comments.length
              : 0,
      showLocation: post.showLocation as boolean,
      showComments: post.showComments as boolean,
      activeMediaId: mediaId,
      media: [
        {
          id: mediaId,
          imageAlt: typeof post.imageAlt === "string" ? post.imageAlt : "",
          mode: "image" as const,
          videoDuration: "",
          videoViews: "",
        },
      ],
      comments: migrateComments(post.comments),
    };
  });
  if (posts.length === 0) return null;
  const activePostId =
    typeof data.activePostId === "string" ? data.activePostId : posts[0].id;
  const migrated: PhotoPostState = { theme: "light", activePostId, posts };
  return isPhotoPostState(migrated) ? migrated : null;
}

function migrateMessengerData(
  data: Record<string, unknown>,
): MessengerState | null {
  if (!Array.isArray(data.messages)) return null;
  const leftId = "messenger-profile-left";
  const rightId = "messenger-profile-right";
  const messages = data.messages.filter(isRecord).map((message, index) => ({
    id:
      typeof message.id === "string"
        ? message.id
        : `message-imported-${index + 1}`,
    senderId: message.type === "sent" ? rightId : leftId,
    text: message.text as string,
    timestamp:
      typeof message.time === "string"
        ? message.time
        : (message.timestamp as string),
    seen: message.type === "sent",
  }));
  const migrated: MessengerState = {
    theme: "light",
    profiles: [
      {
        id: leftId,
        name:
          typeof data.contactName === "string"
            ? data.contactName
            : "Kontakt",
        status: typeof data.status === "string" ? data.status : "",
        side: "left",
      },
      { id: rightId, name: "Ich", status: "", side: "right" },
    ],
    messages,
  };
  return isMessengerState(migrated) ? migrated : null;
}

function legacyMicroblogTimestamp(post: Record<string, unknown>) {
  const parts = [];
  if (post.showTime !== false && typeof post.time === "string" && post.time) {
    parts.push(post.time);
  }
  if (post.showDate !== false && typeof post.date === "string" && post.date) {
    const [year, month, day] = post.date.split("-");
    parts.push(year && month && day ? `${day}.${month}.${year}` : post.date);
  }
  return parts.join(" · ");
}

function migrateMicroblogData(
  data: Record<string, unknown>,
): MicroblogState | null {
  const sourcePosts = Array.isArray(data.posts) ? data.posts : [data];
  const posts = sourcePosts.filter(isRecord).map((post, index) => ({
    id:
      typeof post.id === "string"
        ? post.id
        : `microblog-post-imported-${index + 1}`,
    displayName: post.displayName as string,
    handle: post.handle as string,
    text: post.text as string,
    timestamp: legacyMicroblogTimestamp(post),
    viewMode: "post" as const,
    replies: post.replies as number,
    reposts: post.reposts as number,
    likes: post.likes as number,
    comments: migrateComments(post.comments),
  }));
  if (posts.length === 0) return null;
  const activePostId =
    typeof data.activePostId === "string" ? data.activePostId : posts[0].id;
  const migrated: MicroblogState = {
    theme: "light",
    layoutMode: "feed",
    activePostId,
    posts,
  };
  return isMicroblogState(migrated) ? migrated : null;
}

function migrateLegacy(value: Record<string, unknown>): ConfigFile | null {
  if (!isRecord(value.data)) return null;
  if (value.module === "photoPost") {
    const data = migratePhotoData(value.data);
    return data ? createPhotoPostConfig(data) : null;
  }
  if (value.module === "messenger") {
    const data = migrateMessengerData(value.data);
    return data ? createMessengerConfig(data) : null;
  }
  if (value.module === "microblog") {
    const data = migrateMicroblogData(value.data);
    return data ? createMicroblogConfig(data) : null;
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

  if (!isRecord(value)) {
    throw new Error("Die Datei ist keine SocialMediaCreator-Konfiguration.");
  }

  if (
    value.format === legacyFormat &&
    (value.version === 1 || value.version === 2)
  ) {
    const migrated = migrateLegacy(value);
    if (migrated) return migrated;
    throw new Error("Die Modulkonfiguration ist unvollständig.");
  }

  if (value.format !== "social-media-creator-config") {
    throw new Error("Die Datei ist keine SocialMediaCreator-Konfiguration.");
  }
  if (value.version === 3) {
    if (value.module === "photoPost" && isPhotoPostState(value.data)) {
      return createPhotoPostConfig(value.data);
    }
    if (value.module === "messenger" && isMessengerState(value.data)) {
      return createMessengerConfig(value.data);
    }
    if (value.module === "microblog" && isRecord(value.data)) {
      const data = { ...value.data, layoutMode: "feed" };
      if (isMicroblogState(data)) return createMicroblogConfig(data);
    }
    throw new Error("Die Modulkonfiguration ist unvollständig.");
  }
  if (value.version !== 4) {
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
