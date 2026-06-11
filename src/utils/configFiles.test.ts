import { describe, expect, it } from "vitest";
import {
  defaultMessenger,
  defaultMicroblog,
  defaultPhotoPost,
} from "../types";
import {
  createMessengerConfig,
  createMicroblogConfig,
  createPhotoPostConfig,
  parseConfig,
  parsePhotoPostConfig,
} from "./configFiles";

describe("configuration version 5", () => {
  it("roundtrips photo timelines with structured dates", () => {
    const parsed = parsePhotoPostConfig(
      JSON.stringify(createPhotoPostConfig(defaultPhotoPost)),
    );
    expect(parsed.format).toBe("social-media-creator-config");
    expect(parsed.version).toBe(5);
    expect(parsed.data).toEqual(defaultPhotoPost);
    expect(parsed.data.sortOrder).toBe("newest");
  });

  it("roundtrips two-profile messenger data", () => {
    const parsed = parseConfig(
      JSON.stringify(createMessengerConfig(defaultMessenger)),
    );
    expect(parsed.module).toBe("messenger");
    if (parsed.module === "messenger") {
      expect(parsed.data).toEqual(defaultMessenger);
    }
  });

  it("roundtrips microblog layout, timeline and replies", () => {
    const parsed = parseConfig(
      JSON.stringify(createMicroblogConfig(defaultMicroblog)),
    );
    expect(parsed.module).toBe("microblog");
    if (parsed.module === "microblog") {
      expect(parsed.data).toEqual(defaultMicroblog);
      expect(parsed.data.posts[0]).toMatchObject({
        date: "2026-06-11",
        time: "10:15",
      });
    }
  });

  it("rejects old configuration versions", () => {
    expect(() =>
      parseConfig(
        JSON.stringify({
          ...createPhotoPostConfig(defaultPhotoPost),
          version: 4,
        }),
      ),
    ).toThrow("Version 5");
  });

  it("rejects missing, impossible and malformed dates", () => {
    for (const date of ["", "2026-02-30", "11.06.2026"]) {
      const config = createPhotoPostConfig({
        ...defaultPhotoPost,
        posts: [{ ...defaultPhotoPost.posts[0], date }],
      });
      expect(() => parseConfig(JSON.stringify(config))).toThrow("unvollständig");
    }
  });

  it("accepts an empty time and rejects malformed times", () => {
    expect(() =>
      parseConfig(JSON.stringify(createPhotoPostConfig(defaultPhotoPost))),
    ).not.toThrow();

    const config = createPhotoPostConfig({
      ...defaultPhotoPost,
      posts: [{ ...defaultPhotoPost.posts[0], time: "24:15" }],
    });
    expect(() => parseConfig(JSON.stringify(config))).toThrow("unvollständig");
  });

  it("rejects invalid timeline sort orders", () => {
    const config = {
      ...createMicroblogConfig(defaultMicroblog),
      data: { ...defaultMicroblog, sortOrder: "manual" },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow("unvollständig");
  });

  it("rejects invalid sender references", () => {
    const config = createMessengerConfig({
      ...defaultMessenger,
      messages: [
        { ...defaultMessenger.messages[0], senderId: "unknown-profile" },
      ],
    });
    expect(() => parseConfig(JSON.stringify(config))).toThrow("unvollständig");
  });

  it("rejects duplicate ids across comments and replies", () => {
    const comment = defaultPhotoPost.posts[0].comments[0];
    const config = createPhotoPostConfig({
      ...defaultPhotoPost,
      posts: [
        {
          ...defaultPhotoPost.posts[0],
          comments: [
            {
              ...comment,
              replies: [{ ...comment.replies[0], id: comment.id }],
            },
          ],
        },
      ],
    });
    expect(() => parseConfig(JSON.stringify(config))).toThrow("unvollständig");
  });

  it("rejects invalid active media references and image fields", () => {
    const post = defaultPhotoPost.posts[0];
    expect(() =>
      parseConfig(
        JSON.stringify(
          createPhotoPostConfig({
            ...defaultPhotoPost,
            posts: [{ ...post, activeMediaId: "missing" }],
          }),
        ),
      ),
    ).toThrow("unvollständig");

    const invalid = {
      ...createPhotoPostConfig(defaultPhotoPost),
      data: { ...defaultPhotoPost, profileImageUrl: "blob:private" },
    };
    expect(() => parseConfig(JSON.stringify(invalid))).toThrow("unvollständig");
  });
});
