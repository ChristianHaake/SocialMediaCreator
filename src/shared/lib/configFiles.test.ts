import { describe, expect, it } from "vitest";
import { fieldLimits } from "../../domain/constraints";
import {
  defaultMessenger,
  defaultMicroblog,
  defaultPhotoPost,
} from "../../domain/types";
import {
  createMessengerConfig,
  createMicroblogConfig,
  createPhotoPostConfig,
  parseConfig,
  parsePhotoPostConfig,
} from "./configFiles";

describe("configuration version 6", () => {
  it("roundtrips photo timelines with structured dates", () => {
    const parsed = parsePhotoPostConfig(
      JSON.stringify(createPhotoPostConfig(defaultPhotoPost)),
    );
    expect(parsed.format).toBe("social-media-creator-config");
    expect(parsed.version).toBe(6);
    expect(parsed.locale).toBe("de");
    expect(parsed.data).toEqual(defaultPhotoPost);
    expect(parsed.data.sortOrder).toBe("newest");
  });

  it("roundtrips two-profile messenger data", () => {
    const parsed = parseConfig(
      JSON.stringify(createMessengerConfig(defaultMessenger, "en")),
    );
    expect(parsed.module).toBe("messenger");
    expect(parsed.locale).toBe("en");
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

  it("migrates version 5 configurations as German", () => {
    const current = createPhotoPostConfig(defaultPhotoPost, "en");
    const parsed = parseConfig(
      JSON.stringify({
        format: current.format,
        version: 5,
        module: current.module,
        data: current.data,
      }),
    );
    expect(parsed.version).toBe(6);
    expect(parsed.locale).toBe("de");
  });

  it("rejects missing, impossible and malformed dates", () => {
    for (const date of ["", "2026-02-30", "11.06.2026"]) {
      const config = createPhotoPostConfig({
        ...defaultPhotoPost,
        posts: [{ ...defaultPhotoPost.posts[0], date }],
      });
      expect(() => parseConfig(JSON.stringify(config))).toThrow(
        "config.incomplete",
      );
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
    expect(() => parseConfig(JSON.stringify(config))).toThrow(
      "config.incomplete",
    );
  });

  it("rejects invalid timeline sort orders", () => {
    const config = {
      ...createMicroblogConfig(defaultMicroblog),
      data: { ...defaultMicroblog, sortOrder: "manual" },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(
      "config.incomplete",
    );
  });

  it("rejects microblog text beyond the hard domain limit", () => {
    const config = createMicroblogConfig({
      ...defaultMicroblog,
      posts: [
        {
          ...defaultMicroblog.posts[0],
          text: "x".repeat(fieldLimits.microblog.text + 1),
        },
      ],
    });
    expect(() => parseConfig(JSON.stringify(config))).toThrow(
      "config.incomplete",
    );
  });

  it("rejects invalid locale values", () => {
    const config = {
      ...createMicroblogConfig(defaultMicroblog),
      locale: "fr",
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(
      "config.incomplete",
    );
  });

  it("rejects invalid sender references", () => {
    const config = createMessengerConfig({
      ...defaultMessenger,
      messages: [
        { ...defaultMessenger.messages[0], senderId: "unknown-profile" },
      ],
    });
    expect(() => parseConfig(JSON.stringify(config))).toThrow(
      "config.incomplete",
    );
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
    expect(() => parseConfig(JSON.stringify(config))).toThrow(
      "config.incomplete",
    );
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
    ).toThrow("config.incomplete");

    const invalid = {
      ...createPhotoPostConfig(defaultPhotoPost),
      data: { ...defaultPhotoPost, profileImageUrl: "blob:private" },
    };
    expect(() => parseConfig(JSON.stringify(invalid))).toThrow(
      "config.incomplete",
    );
  });
});
