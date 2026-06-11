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

describe("photo-post configuration files", () => {
  it("roundtrips posts and comments in their current order", () => {
    const config = createPhotoPostConfig(defaultPhotoPost);
    const parsed = parsePhotoPostConfig(JSON.stringify(config));

    expect(parsed.data).toEqual(defaultPhotoPost);
    expect(parsed.version).toBe(2);
  });

  it("migrates version one photo posts", () => {
    const parsed = parsePhotoPostConfig(
      JSON.stringify({
        format: "mockup-studio-config",
        version: 1,
        module: "photoPost",
        data: {
          username: "alt",
          location: "Archiv",
          caption: "Alter Beitrag",
          imageAlt: "",
          likes: 4,
          comments: 2,
          showLocation: true,
          showComments: true,
        },
      }),
    );

    expect(parsed.version).toBe(2);
    expect(parsed.data.posts[0]).toMatchObject({
      username: "alt",
      commentCount: 2,
      comments: [],
    });
  });

  it("rejects unsupported versions", () => {
    const config = { ...createPhotoPostConfig(defaultPhotoPost), version: 99 };

    expect(() => parsePhotoPostConfig(JSON.stringify(config))).toThrow(
      "nicht unterstützt",
    );
  });

  it("rejects image fields and incomplete data structures", () => {
    const config = createPhotoPostConfig(defaultPhotoPost);
    const invalid = {
      ...config,
      data: { username: "test", profileImageUrl: "blob:private" },
    };

    expect(() => parsePhotoPostConfig(JSON.stringify(invalid))).toThrow(
      "unvollständig",
    );
  });

  it("rejects duplicate post and comment ids", () => {
    const firstPost = defaultPhotoPost.posts[0];
    const duplicatePostConfig = createPhotoPostConfig({
      activePostId: firstPost.id,
      posts: [firstPost, { ...firstPost }],
    });
    expect(() => parseConfig(JSON.stringify(duplicatePostConfig))).toThrow(
      "unvollständig",
    );

    const duplicateComment = firstPost.comments[0];
    const duplicateCommentConfig = createPhotoPostConfig({
      ...defaultPhotoPost,
      posts: [
        {
          ...firstPost,
          comments: [duplicateComment, { ...duplicateComment }],
        },
      ],
    });
    expect(() => parseConfig(JSON.stringify(duplicateCommentConfig))).toThrow(
      "unvollständig",
    );
  });

  it("rejects values longer than the editor can represent", () => {
    const config = createPhotoPostConfig({
      ...defaultPhotoPost,
      posts: [
        {
          ...defaultPhotoPost.posts[0],
          username: "a".repeat(31),
        },
      ],
    });

    expect(() => parseConfig(JSON.stringify(config))).toThrow("unvollständig");
  });
});

describe("messenger configuration files", () => {
  it("roundtrips messages in their current order", () => {
    const config = createMessengerConfig(defaultMessenger);
    const parsed = parseConfig(JSON.stringify(config));

    expect(parsed.module).toBe("messenger");
    if (parsed.module === "messenger") {
      expect(parsed.data).toEqual(defaultMessenger);
      expect(parsed.data.messages.map((message) => message.id)).toEqual([
        "message-1",
        "message-2",
        "message-3",
      ]);
    }
  });

  it("rejects duplicate message ids", () => {
    const duplicateMessage = defaultMessenger.messages[0];
    const config = createMessengerConfig({
      ...defaultMessenger,
      messages: [duplicateMessage, { ...duplicateMessage }],
    });

    expect(() => parseConfig(JSON.stringify(config))).toThrow("unvollständig");
  });

  it("rejects image references in messenger data", () => {
    const config = createMessengerConfig(defaultMessenger);
    const invalid = {
      ...config,
      data: { ...config.data, profileImageUrl: "blob:private" },
    };

    expect(() => parseConfig(JSON.stringify(invalid))).toThrow("unvollständig");
  });

  it("rejects invalid message times", () => {
    const config = createMessengerConfig({
      ...defaultMessenger,
      messages: [
        {
          ...defaultMessenger.messages[0],
          time: "25:99",
        },
      ],
    });

    expect(() => parseConfig(JSON.stringify(config))).toThrow("unvollständig");
  });
});

describe("microblog configuration files", () => {
  it("roundtrips posts and comments in their current order", () => {
    const config = createMicroblogConfig(defaultMicroblog);
    const parsed = parseConfig(JSON.stringify(config));

    expect(parsed.module).toBe("microblog");
    if (parsed.module === "microblog") {
      expect(parsed.data).toEqual(defaultMicroblog);
    }
  });

  it("migrates version one microblog posts", () => {
    const parsed = parseConfig(
      JSON.stringify({
        format: "mockup-studio-config",
        version: 1,
        module: "microblog",
        data: {
          displayName: "Altbestand",
          handle: "alt",
          text: "Archivierter Beitrag",
          date: "2026-06-11",
          time: "12:00",
          showDate: true,
          showTime: true,
          replies: 1,
          reposts: 2,
          likes: 3,
        },
      }),
    );

    expect(parsed.module).toBe("microblog");
    if (parsed.module === "microblog") {
      expect(parsed.version).toBe(2);
      expect(parsed.data.posts[0]).toMatchObject({
        displayName: "Altbestand",
        comments: [],
      });
    }
  });

  it("rejects image references in microblog data", () => {
    const config = createMicroblogConfig(defaultMicroblog);
    const invalid = {
      ...config,
      data: { ...config.data, profileImageUrl: "blob:private" },
    };

    expect(() => parseConfig(JSON.stringify(invalid))).toThrow("unvollständig");
  });

  it("rejects negative reaction values", () => {
    const config = createMicroblogConfig({
      ...defaultMicroblog,
      posts: [
        {
          ...defaultMicroblog.posts[0],
          likes: -1,
        },
      ],
    });

    expect(() => parseConfig(JSON.stringify(config))).toThrow("unvollständig");
  });

  it("rejects dates that cannot be displayed by the editor", () => {
    const config = createMicroblogConfig({
      ...defaultMicroblog,
      posts: [
        {
          ...defaultMicroblog.posts[0],
          date: "2026-02-31",
        },
      ],
    });

    expect(() => parseConfig(JSON.stringify(config))).toThrow("unvollständig");
  });
});
