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

describe("configuration version 4", () => {
  it("roundtrips photo posts, media, themes and reply chains", () => {
    const parsed = parsePhotoPostConfig(
      JSON.stringify(createPhotoPostConfig(defaultPhotoPost)),
    );
    expect(parsed.format).toBe("social-media-creator-config");
    expect(parsed.version).toBe(4);
    expect(parsed.data).toEqual(defaultPhotoPost);
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

  it("roundtrips microblog layout, themes, timestamps and replies", () => {
    const parsed = parseConfig(
      JSON.stringify(createMicroblogConfig(defaultMicroblog)),
    );
    expect(parsed.module).toBe("microblog");
    if (parsed.module === "microblog") {
      expect(parsed.data).toEqual(defaultMicroblog);
      expect(parsed.data.layoutMode).toBe("feed");
    }
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

  it("rejects invalid active media references and more than ten media", () => {
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

    expect(() =>
      parseConfig(
        JSON.stringify(
          createPhotoPostConfig({
            ...defaultPhotoPost,
            posts: [
              {
                ...post,
                media: Array.from({ length: 11 }, (_, index) => ({
                  ...post.media[0],
                  id: `media-${index}`,
                })),
              },
            ],
          }),
        ),
      ),
    ).toThrow("unvollständig");
  });

  it("rejects image references and unsupported versions", () => {
    const invalid = {
      ...createPhotoPostConfig(defaultPhotoPost),
      data: { ...defaultPhotoPost, profileImageUrl: "blob:private" },
    };
    expect(() => parseConfig(JSON.stringify(invalid))).toThrow("unvollständig");
    expect(() =>
      parseConfig(
        JSON.stringify({
          ...createPhotoPostConfig(defaultPhotoPost),
          version: 99,
        }),
      ),
    ).toThrow("nicht unterstützt");
  });
});

describe("legacy configuration migration", () => {
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
          imageAlt: "Archivbild",
          likes: 4,
          comments: 2,
          showLocation: true,
          showComments: true,
        },
      }),
    );
    expect(parsed.version).toBe(4);
    expect(parsed.data.theme).toBe("light");
    expect(parsed.data.posts[0]).toMatchObject({
      username: "alt",
      commentCount: 2,
      timestamp: "vor einem Moment",
      viewMode: "post",
    });
    expect(parsed.data.posts[0].media[0].imageAlt).toBe("Archivbild");
  });

  it("migrates version two photo comments and media metadata", () => {
    const parsed = parseConfig(
      JSON.stringify({
        format: "mockup-studio-config",
        version: 2,
        module: "photoPost",
        data: {
          activePostId: "post-1",
          posts: [
            {
              id: "post-1",
              username: "projekt",
              location: "",
              caption: "V2",
              imageAlt: "",
              likes: 1,
              commentCount: 1,
              showLocation: false,
              showComments: true,
              comments: [{ id: "comment-1", author: "a", text: "b" }],
            },
          ],
        },
      }),
    );
    expect(parsed.module).toBe("photoPost");
    if (parsed.module === "photoPost") {
      expect(parsed.data.posts[0].comments[0]).toMatchObject({
        timestamp: "",
        replies: [],
      });
      expect(parsed.data.posts[0].media).toHaveLength(1);
    }
  });

  it("migrates legacy messenger directions to profile references", () => {
    const parsed = parseConfig(
      JSON.stringify({
        format: "mockup-studio-config",
        version: 2,
        module: "messenger",
        data: {
          contactName: "Archivkontakt",
          status: "offline",
          messages: [
            {
              id: "m1",
              type: "sent",
              text: "Gesendet",
              time: "10:00",
            },
            {
              id: "m2",
              type: "received",
              text: "Empfangen",
              time: "10:01",
            },
          ],
        },
      }),
    );
    expect(parsed.module).toBe("messenger");
    if (parsed.module === "messenger") {
      expect(parsed.data.profiles).toHaveLength(2);
      expect(parsed.data.messages[0].senderId).toBe(
        "messenger-profile-right",
      );
      expect(parsed.data.messages[1].senderId).toBe("messenger-profile-left");
    }
  });

  it("converts legacy microblog date and time into free text", () => {
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
      expect(parsed.data.posts[0].timestamp).toBe("12:00 · 11.06.2026");
      expect(parsed.data.layoutMode).toBe("feed");
    }
  });

  it("migrates version three microblog configs to feed mode", () => {
    const versionThreeData = {
      theme: defaultMicroblog.theme,
      activePostId: defaultMicroblog.activePostId,
      posts: defaultMicroblog.posts,
    };
    const parsed = parseConfig(
      JSON.stringify({
        format: "social-media-creator-config",
        version: 3,
        module: "microblog",
        data: versionThreeData,
      }),
    );

    expect(parsed.version).toBe(4);
    expect(parsed.module).toBe("microblog");
    if (parsed.module === "microblog") {
      expect(parsed.data.layoutMode).toBe("feed");
    }
  });

  it("re-emits version three photo and messenger configs as version four", () => {
    for (const config of [
      {
        format: "social-media-creator-config",
        version: 3,
        module: "photoPost",
        data: defaultPhotoPost,
      },
      {
        format: "social-media-creator-config",
        version: 3,
        module: "messenger",
        data: defaultMessenger,
      },
    ]) {
      expect(parseConfig(JSON.stringify(config)).version).toBe(4);
    }
  });
});
