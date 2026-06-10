import { describe, expect, it } from "vitest";
import { defaultPhotoPost } from "../types";
import {
  createPhotoPostConfig,
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
