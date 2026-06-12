import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { strToU8, zipSync } from "fflate";
import {
  createMessengerConfig,
  createMicroblogConfig,
  createPhotoPostConfig,
} from "./configFiles";
import {
  defaultMessenger,
  defaultMicroblog,
  defaultPhotoPost,
} from "../../domain/types";
import {
  disposeProjectImages,
  readProjectArchive,
  type MediaReference,
} from "./projectArchives";

const webp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

function makeArchive(
  config:
    | ReturnType<typeof createPhotoPostConfig>
    | ReturnType<typeof createMessengerConfig>
    | ReturnType<typeof createMicroblogConfig>,
  references: MediaReference[],
  extraEntries: Record<string, Uint8Array> = {},
) {
  const media = references.map((reference, index) => ({
    path: `media/${String(index + 1).padStart(4, "0")}.webp`,
    originalFileName: index === 0 ? "bild-ä.png" : "duplicate.png",
    reference,
  }));
  const entries: Record<string, Uint8Array> = {
    "project.json": strToU8(
      JSON.stringify({
        format: "social-media-creator-project",
        version: 1,
        config,
        media,
      }),
    ),
    ...extraEntries,
  };
  media.forEach(({ path }) => {
    entries[path] = webp;
  });
  return new File([zipSync(entries)], "project.smc", {
    type: "application/zip",
  });
}

function replaceCentralName(
  archive: File,
  from: string,
  to: string,
): Promise<File> {
  if (from.length !== to.length) throw new Error("Names must have equal length");
  return archive.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    for (let offset = 0; offset + 46 <= bytes.length; offset += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) continue;
      const nameLength = view.getUint16(offset + 28, true);
      const nameStart = offset + 46;
      const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));
      if (name === from) bytes.set(encoder.encode(to), nameStart);
    }
    return new File([bytes], "duplicate.smc");
  });
}

async function setDeclaredUncompressedSize(archive: File, size: number) {
  const buffer = await archive.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  for (let offset = 0; offset + 46 <= bytes.length; offset += 1) {
    if (view.getUint32(offset, true) === 0x02014b50) {
      view.setUint32(offset + 24, size, true);
      break;
    }
  }
  return new File([bytes], "oversized.smc");
}

beforeEach(() => {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ width: 1, height: 1, close: vi.fn() }),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("project archives", () => {
  it("restores every photo-post image slot", async () => {
    const post = defaultPhotoPost.posts[0];
    const comment = post.comments[0];
    const result = await readProjectArchive(
      makeArchive(createPhotoPostConfig(defaultPhotoPost), [
        { kind: "photo-profile", postId: post.id },
        { kind: "photo-media", postId: post.id, mediaId: post.media[0].id },
        { kind: "photo-comment", postId: post.id, itemId: comment.id },
        {
          kind: "photo-comment",
          postId: post.id,
          itemId: comment.replies[0].id,
        },
      ]),
    );

    expect(result.images.photoPost[post.id].profileImage).not.toBeNull();
    expect(result.images.photoPost[post.id].media).toHaveProperty(post.media[0].id);
    expect(result.images.photoPost[post.id].commentImages).toHaveProperty(
      comment.id,
    );
    expect(result.images.photoPost[post.id].commentImages).toHaveProperty(
      comment.replies[0].id,
    );
    disposeProjectImages(result.images);
  });

  it("restores messenger and microblog image slots", async () => {
    const messenger = await readProjectArchive(
      makeArchive(
        createMessengerConfig(defaultMessenger),
        defaultMessenger.profiles.map((profile) => ({
          kind: "messenger-profile" as const,
          profileId: profile.id,
        })),
      ),
    );
    expect(Object.keys(messenger.images.messenger)).toHaveLength(2);
    disposeProjectImages(messenger.images);

    const post = defaultMicroblog.posts[0];
    const comment = post.comments[0];
    const microblog = await readProjectArchive(
      makeArchive(createMicroblogConfig(defaultMicroblog), [
        { kind: "microblog-profile", postId: post.id },
        { kind: "microblog-comment", postId: post.id, itemId: comment.id },
        {
          kind: "microblog-comment",
          postId: post.id,
          itemId: comment.replies[0].id,
        },
      ]),
    );
    expect(microblog.images.microblog[post.id].profileImage).not.toBeNull();
    expect(microblog.images.microblog[post.id].commentImages).toHaveProperty(
      comment.replies[0].id,
    );
    disposeProjectImages(microblog.images);
  });

  it("rejects unknown and traversal archive entries", async () => {
    const unknown = makeArchive(createPhotoPostConfig(defaultPhotoPost), [], {
      "unexpected.txt": strToU8("no"),
    });
    await expect(readProjectArchive(unknown)).rejects.toMatchObject({
      code: "project.invalidArchive",
    });

    const traversal = makeArchive(createPhotoPostConfig(defaultPhotoPost), [], {
      "../outside.webp": webp,
    });
    await expect(readProjectArchive(traversal)).rejects.toMatchObject({
      code: "project.invalidArchive",
    });
  });

  it("rejects duplicate paths, truncation and declared zip bombs", async () => {
    const post = defaultPhotoPost.posts[0];
    const archive = makeArchive(createPhotoPostConfig(defaultPhotoPost), [
      { kind: "photo-profile", postId: post.id },
      { kind: "photo-media", postId: post.id, mediaId: post.media[0].id },
    ]);
    const duplicate = await replaceCentralName(
      archive,
      "media/0002.webp",
      "media/0001.webp",
    );
    await expect(readProjectArchive(duplicate)).rejects.toMatchObject({
      code: "project.invalidArchive",
    });

    const bytes = new Uint8Array(await archive.arrayBuffer());
    await expect(
      readProjectArchive(new File([bytes.subarray(0, bytes.length - 8)], "cut.smc")),
    ).rejects.toMatchObject({ code: "project.invalidArchive" });

    const bomb = await setDeclaredUncompressedSize(archive, 25 * 1024 * 1024 + 1);
    await expect(readProjectArchive(bomb)).rejects.toMatchObject({
      code: "project.tooLarge",
    });
  });

  it("rejects missing and invalid media references", async () => {
    const post = defaultPhotoPost.posts[0];
    const missing = makeArchive(createPhotoPostConfig(defaultPhotoPost), [
      { kind: "photo-media", postId: post.id, mediaId: "missing" },
    ]);
    await expect(readProjectArchive(missing)).rejects.toMatchObject({
      code: "project.invalidManifest",
    });

    const missingMediaManifest = {
      format: "social-media-creator-project",
      version: 1,
      config: createPhotoPostConfig(defaultPhotoPost),
      media: [
        {
          path: "media/0001.webp",
          originalFileName: "missing.webp",
          reference: { kind: "photo-profile", postId: post.id },
        },
      ],
    };
    const missingMedia = new File(
      [
        zipSync({
          "project.json": strToU8(JSON.stringify(missingMediaManifest)),
        }),
      ],
      "missing-media.smc",
    );
    await expect(readProjectArchive(missingMedia)).rejects.toMatchObject({
      code: "project.invalidManifest",
    });

    const archive = makeArchive(createPhotoPostConfig(defaultPhotoPost), []);
    const bytes = new Uint8Array(await archive.arrayBuffer());
    const extracted = zipSync({
      "project.json": strToU8(
        JSON.stringify({
          format: "social-media-creator-project",
          version: 2,
          config: createPhotoPostConfig(defaultPhotoPost),
          media: [],
        }),
      ),
    });
    expect(bytes.byteLength).toBeGreaterThan(0);
    await expect(
      readProjectArchive(new File([extracted], "future.smc")),
    ).rejects.toMatchObject({
      code: "project.unsupportedVersion",
    });
  });
});
