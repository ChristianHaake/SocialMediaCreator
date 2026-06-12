import {
  strFromU8,
  strToU8,
  unzipSync,
  zipSync,
  type Zippable,
} from "fflate";
import type {
  ConfigFile,
} from "./configFiles";
import {
  createMessengerConfig,
  createMicroblogConfig,
  createPhotoPostConfig,
  parseConfig,
} from "./configFiles";
import type {
  ImageState,
  Locale,
  MessengerImages,
  MessengerState,
  MicroblogImages,
  MicroblogState,
  ModuleType,
  PhotoPostImages,
  PhotoPostState,
} from "../../domain/types";
import type { TranslationKey } from "../../i18n/de";
import {
  createImageState,
  maxImageSize,
  optimizeImage,
  validateImageFile,
} from "./imageFiles";

export const maxProjectSize = 25 * 1024 * 1024;
const maxProjectJsonSize = 1024 * 1024;
const projectFileName = "project.json";
const mediaPathPattern = /^media\/[0-9]{4}\.(?:webp|png)$/;

type PhotoReference =
  | { kind: "photo-profile"; postId: string }
  | { kind: "photo-media"; postId: string; mediaId: string }
  | { kind: "photo-comment"; postId: string; itemId: string };

type MessengerReference = {
  kind: "messenger-profile";
  profileId: string;
};

type MicroblogReference =
  | { kind: "microblog-profile"; postId: string }
  | { kind: "microblog-comment"; postId: string; itemId: string };

export type MediaReference =
  | PhotoReference
  | MessengerReference
  | MicroblogReference;

type ProjectMediaEntry = {
  path: string;
  originalFileName: string;
  reference: MediaReference;
};

export type ProjectArchiveManifest = {
  format: "social-media-creator-project";
  version: 1;
  config: ConfigFile;
  media: ProjectMediaEntry[];
};

export type ProjectImageMaps = {
  photoPost: PhotoPostImages;
  messenger: MessengerImages;
  microblog: MicroblogImages;
};

export type ProjectArchiveResult = {
  config: ConfigFile;
  images: ProjectImageMaps;
};

export class ProjectArchiveError extends Error {
  constructor(public code: Extract<TranslationKey, `project.${string}`>) {
    super(code);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function hasSafeArchivePath(path: string) {
  return (
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.split("/").includes("..")
  );
}

function getConfig(
  module: ModuleType,
  data: PhotoPostState | MessengerState | MicroblogState,
  locale: Locale,
) {
  if (module === "photoPost") {
    return createPhotoPostConfig(data as PhotoPostState, locale);
  }
  if (module === "messenger") {
    return createMessengerConfig(data as MessengerState, locale);
  }
  return createMicroblogConfig(data as MicroblogState, locale);
}

function commentIds(comments: Array<{ id: string; replies: Array<{ id: string }> }>) {
  return new Set(
    comments.flatMap((comment) => [
      comment.id,
      ...comment.replies.map((reply) => reply.id),
    ]),
  );
}

function collectMedia(
  config: ConfigFile,
  images: PhotoPostImages | MessengerImages | MicroblogImages,
) {
  const collected: Array<{ image: ImageState; reference: MediaReference }> = [];

  if (config.module === "photoPost") {
    const photoImages = images as PhotoPostImages;
    for (const [postId, postImages] of Object.entries(photoImages)) {
      const post = config.data.posts.find((candidate) => candidate.id === postId);
      if (!post) throw new ProjectArchiveError("project.invalidManifest");
      if (postImages.profileImage) {
        collected.push({
          image: postImages.profileImage,
          reference: { kind: "photo-profile", postId },
        });
      }
      for (const [mediaId, image] of Object.entries(postImages.media)) {
        if (!post.media.some((media) => media.id === mediaId)) {
          throw new ProjectArchiveError("project.invalidManifest");
        }
        collected.push({
          image,
          reference: { kind: "photo-media", postId, mediaId },
        });
      }
      const validCommentIds = commentIds(post.comments);
      for (const [itemId, image] of Object.entries(postImages.commentImages)) {
        if (!validCommentIds.has(itemId)) {
          throw new ProjectArchiveError("project.invalidManifest");
        }
        collected.push({
          image,
          reference: { kind: "photo-comment", postId, itemId },
        });
      }
    }
  } else if (config.module === "messenger") {
    const messengerImages = images as MessengerImages;
    for (const [profileId, image] of Object.entries(messengerImages)) {
      if (!config.data.profiles.some((profile) => profile.id === profileId)) {
        throw new ProjectArchiveError("project.invalidManifest");
      }
      collected.push({
        image,
        reference: { kind: "messenger-profile", profileId },
      });
    }
  } else {
    const microblogImages = images as MicroblogImages;
    for (const [postId, postImages] of Object.entries(microblogImages)) {
      const post = config.data.posts.find((candidate) => candidate.id === postId);
      if (!post) throw new ProjectArchiveError("project.invalidManifest");
      if (postImages.profileImage) {
        collected.push({
          image: postImages.profileImage,
          reference: { kind: "microblog-profile", postId },
        });
      }
      const validCommentIds = commentIds(post.comments);
      for (const [itemId, image] of Object.entries(postImages.commentImages)) {
        if (!validCommentIds.has(itemId)) {
          throw new ProjectArchiveError("project.invalidManifest");
        }
        collected.push({
          image,
          reference: { kind: "microblog-comment", postId, itemId },
        });
      }
    }
  }

  return collected;
}

export async function createProjectArchive(
  module: ModuleType,
  data: PhotoPostState | MessengerState | MicroblogState,
  locale: Locale,
  images: PhotoPostImages | MessengerImages | MicroblogImages,
) {
  const config = getConfig(module, data, locale);
  const media = collectMedia(config, images);
  const entries: Zippable = {};
  const manifestMedia: ProjectMediaEntry[] = [];
  let totalSize = 0;

  for (const [index, item] of media.entries()) {
    const optimized = await optimizeImage(item.image.blob);
    if (optimized.size > maxImageSize) {
      throw new ProjectArchiveError("project.tooLarge");
    }
    totalSize += optimized.size;
    if (totalSize > maxProjectSize) {
      throw new ProjectArchiveError("project.tooLarge");
    }
    const extension =
      optimized.type === "image/webp"
        ? "webp"
        : optimized.type === "image/png"
          ? "png"
          : null;
    if (!extension) throw new ProjectArchiveError("project.saveFailed");
    const path = `media/${String(index + 1).padStart(4, "0")}.${extension}`;
    entries[path] = [
      new Uint8Array(await optimized.arrayBuffer()),
      { level: 0 },
    ];
    manifestMedia.push({
      path,
      originalFileName: item.image.fileName,
      reference: item.reference,
    });
  }

  const manifest: ProjectArchiveManifest = {
    format: "social-media-creator-project",
    version: 1,
    config,
    media: manifestMedia,
  };
  const projectJson = strToU8(JSON.stringify(manifest, null, 2));
  if (
    projectJson.byteLength > maxProjectJsonSize ||
    totalSize + projectJson.byteLength > maxProjectSize
  ) {
    throw new ProjectArchiveError("project.tooLarge");
  }
  entries[projectFileName] = [projectJson, { level: 6 }];
  return new Blob([zipSync(entries)], { type: "application/zip" });
}

export function downloadProjectArchive(blob: Blob, module: ModuleType) {
  const baseName =
    module === "photoPost"
      ? "social-media-creator-foto-post"
      : module === "messenger"
        ? "social-media-creator-messenger-chat"
        : "social-media-creator-mikroblog";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${baseName}.smc`;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

type CentralEntry = {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
};

function readCentralDirectory(bytes: Uint8Array): CentralEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimumEocdSize = 22;
  const start = Math.max(0, bytes.length - 65_557);
  let eocd = -1;
  for (let offset = bytes.length - minimumEocdSize; offset >= start; offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new ProjectArchiveError("project.invalidArchive");

  const entryCount = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff ||
    centralOffset + centralSize > eocd
  ) {
    throw new ProjectArchiveError("project.invalidArchive");
  }

  const decoder = new TextDecoder();
  const names = new Set<string>();
  const entries: CentralEntry[] = [];
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index++) {
    if (
      offset + 46 > bytes.length ||
      view.getUint32(offset, true) !== 0x02014b50
    ) {
      throw new ProjectArchiveError("project.invalidArchive");
    }
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const nextOffset = offset + 46 + nameLength + extraLength + commentLength;
    if (
      nextOffset > bytes.length ||
      (flags & 1) !== 0 ||
      (method !== 0 && method !== 8)
    ) {
      throw new ProjectArchiveError("project.invalidArchive");
    }
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (!hasSafeArchivePath(name) || names.has(name)) {
      throw new ProjectArchiveError("project.invalidArchive");
    }
    names.add(name);
    entries.push({ name, compressedSize, uncompressedSize });
    offset = nextOffset;
  }
  if (offset !== centralOffset + centralSize) {
    throw new ProjectArchiveError("project.invalidArchive");
  }
  return entries;
}

function isMediaReference(value: unknown): value is MediaReference {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  if (value.kind === "photo-profile" || value.kind === "microblog-profile") {
    return hasOnlyKeys(value, ["kind", "postId"]) && typeof value.postId === "string";
  }
  if (value.kind === "photo-media") {
    return (
      hasOnlyKeys(value, ["kind", "postId", "mediaId"]) &&
      typeof value.postId === "string" &&
      typeof value.mediaId === "string"
    );
  }
  if (value.kind === "photo-comment" || value.kind === "microblog-comment") {
    return (
      hasOnlyKeys(value, ["kind", "postId", "itemId"]) &&
      typeof value.postId === "string" &&
      typeof value.itemId === "string"
    );
  }
  return (
    value.kind === "messenger-profile" &&
    hasOnlyKeys(value, ["kind", "profileId"]) &&
    typeof value.profileId === "string"
  );
}

function parseManifest(bytes: Uint8Array): ProjectArchiveManifest {
  let value: unknown;
  try {
    value = JSON.parse(strFromU8(bytes));
  } catch {
    throw new ProjectArchiveError("project.invalidManifest");
  }
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["format", "version", "config", "media"]) ||
    value.format !== "social-media-creator-project"
  ) {
    throw new ProjectArchiveError("project.invalidManifest");
  }
  if (value.version !== 1) {
    throw new ProjectArchiveError("project.unsupportedVersion");
  }
  if (!Array.isArray(value.media)) {
    throw new ProjectArchiveError("project.invalidManifest");
  }
  const config = parseConfig(JSON.stringify(value.config));
  const paths = new Set<string>();
  const references = new Set<string>();
  const media: ProjectMediaEntry[] = value.media.map((entry) => {
    if (
      !isRecord(entry) ||
      !hasOnlyKeys(entry, ["path", "originalFileName", "reference"]) ||
      typeof entry.path !== "string" ||
      !mediaPathPattern.test(entry.path) ||
      typeof entry.originalFileName !== "string" ||
      entry.originalFileName.length > 255 ||
      !isMediaReference(entry.reference)
    ) {
      throw new ProjectArchiveError("project.invalidManifest");
    }
    const referenceKey = JSON.stringify(entry.reference);
    if (paths.has(entry.path) || references.has(referenceKey)) {
      throw new ProjectArchiveError("project.invalidManifest");
    }
    paths.add(entry.path);
    references.add(referenceKey);
    return entry as ProjectMediaEntry;
  });
  return {
    format: "social-media-creator-project",
    version: 1,
    config,
    media,
  };
}

function emptyImageMaps(): ProjectImageMaps {
  return { photoPost: {}, messenger: {}, microblog: {} };
}

function installImage(
  result: ProjectImageMaps,
  config: ConfigFile,
  reference: MediaReference,
  image: ImageState,
) {
  if (config.module === "photoPost") {
    if (
      reference.kind !== "photo-profile" &&
      reference.kind !== "photo-media" &&
      reference.kind !== "photo-comment"
    ) {
      throw new ProjectArchiveError("project.invalidManifest");
    }
    const post = config.data.posts.find((candidate) => candidate.id === reference.postId);
    if (!post) throw new ProjectArchiveError("project.invalidManifest");
    const postImages = result.photoPost[post.id] ?? {
      profileImage: null,
      media: {},
      commentImages: {},
    };
    if (reference.kind === "photo-profile") {
      postImages.profileImage = image;
    } else if (reference.kind === "photo-media") {
      if (!post.media.some((media) => media.id === reference.mediaId)) {
        throw new ProjectArchiveError("project.invalidManifest");
      }
      postImages.media[reference.mediaId] = image;
    } else if (reference.kind === "photo-comment") {
      if (!commentIds(post.comments).has(reference.itemId)) {
        throw new ProjectArchiveError("project.invalidManifest");
      }
      postImages.commentImages[reference.itemId] = image;
    }
    result.photoPost[post.id] = postImages;
    return;
  }

  if (config.module === "messenger") {
    if (
      reference.kind !== "messenger-profile" ||
      !config.data.profiles.some((profile) => profile.id === reference.profileId)
    ) {
      throw new ProjectArchiveError("project.invalidManifest");
    }
    result.messenger[reference.profileId] = image;
    return;
  }

  if (
    reference.kind !== "microblog-profile" &&
    reference.kind !== "microblog-comment"
  ) {
    throw new ProjectArchiveError("project.invalidManifest");
  }
  const post = config.data.posts.find((candidate) => candidate.id === reference.postId);
  if (!post) throw new ProjectArchiveError("project.invalidManifest");
  const postImages = result.microblog[post.id] ?? {
    profileImage: null,
    commentImages: {},
  };
  if (reference.kind === "microblog-profile") {
    postImages.profileImage = image;
  } else if (reference.kind === "microblog-comment") {
    if (!commentIds(post.comments).has(reference.itemId)) {
      throw new ProjectArchiveError("project.invalidManifest");
    }
    postImages.commentImages[reference.itemId] = image;
  }
  result.microblog[post.id] = postImages;
}

export function disposeProjectImages(images: ProjectImageMaps) {
  const revoke = (image: ImageState | null | undefined) => {
    if (image) URL.revokeObjectURL(image.url);
  };
  Object.values(images.photoPost).forEach((post) => {
    revoke(post.profileImage);
    Object.values(post.media).forEach(revoke);
    Object.values(post.commentImages).forEach(revoke);
  });
  Object.values(images.messenger).forEach(revoke);
  Object.values(images.microblog).forEach((post) => {
    revoke(post.profileImage);
    Object.values(post.commentImages).forEach(revoke);
  });
}

export async function readProjectArchive(file: File): Promise<ProjectArchiveResult> {
  if (file.size > maxProjectSize) {
    throw new ProjectArchiveError("project.tooLarge");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const centralEntries = readCentralDirectory(bytes);
  if (
    centralEntries.length === 0 ||
    centralEntries.reduce((sum, entry) => sum + entry.uncompressedSize, 0) >
      maxProjectSize
  ) {
    throw new ProjectArchiveError("project.tooLarge");
  }
  for (const entry of centralEntries) {
    const validName =
      entry.name === projectFileName ||
      mediaPathPattern.test(entry.name);
    const validSize =
      entry.name === projectFileName
        ? entry.uncompressedSize <= maxProjectJsonSize
        : entry.uncompressedSize <= maxImageSize;
    if (!validName) throw new ProjectArchiveError("project.invalidArchive");
    if (!validSize || entry.compressedSize > maxProjectSize) {
      throw new ProjectArchiveError("project.tooLarge");
    }
  }

  let extracted: Record<string, Uint8Array>;
  try {
    extracted = unzipSync(bytes);
  } catch {
    throw new ProjectArchiveError("project.invalidArchive");
  }
  if (
    Object.values(extracted).reduce((sum, entry) => sum + entry.byteLength, 0) >
    maxProjectSize
  ) {
    throw new ProjectArchiveError("project.tooLarge");
  }
  const projectJson = extracted[projectFileName];
  if (!projectJson) throw new ProjectArchiveError("project.invalidManifest");
  const manifest = parseManifest(projectJson);
  const expectedPaths = new Set([
    projectFileName,
    ...manifest.media.map((entry) => entry.path),
  ]);
  if (
    Object.keys(extracted).length !== expectedPaths.size ||
    Object.keys(extracted).some((path) => !expectedPaths.has(path))
  ) {
    throw new ProjectArchiveError("project.invalidManifest");
  }

  const images = emptyImageMaps();
  try {
    for (const entry of manifest.media) {
      const mediaBytes = extracted[entry.path];
      if (!mediaBytes) throw new ProjectArchiveError("project.invalidManifest");
      const fileName = entry.originalFileName || entry.path.split("/").at(-1)!;
      const mediaFile = new File([mediaBytes], fileName, {
        type: entry.path.endsWith(".webp") ? "image/webp" : "image/png",
      });
      if (await validateImageFile(mediaFile)) {
        throw new ProjectArchiveError("project.invalidMedia");
      }
      installImage(
        images,
        manifest.config,
        entry.reference,
        createImageState(mediaFile),
      );
    }
  } catch (error) {
    disposeProjectImages(images);
    throw error;
  }
  return { config: manifest.config, images };
}
