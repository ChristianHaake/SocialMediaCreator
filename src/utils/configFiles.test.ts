import { describe, expect, it } from "vitest";
import { defaultMessenger, defaultPhotoPost } from "../types";
import {
  createMessengerConfig,
  createPhotoPostConfig,
  parseConfig,
  parsePhotoPostConfig,
} from "./configFiles";

describe("photo-post configuration files", () => {
  it("roundtrips all serializable values", () => {
    const config = createPhotoPostConfig(defaultPhotoPost);
    const parsed = parsePhotoPostConfig(JSON.stringify(config));

    expect(parsed.data).toEqual(defaultPhotoPost);
  });

  it("rejects unsupported versions", () => {
    const config = { ...createPhotoPostConfig(defaultPhotoPost), version: 2 };

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
});
