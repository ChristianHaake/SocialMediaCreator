import { describe, expect, it } from "vitest";
import { getDefaultMessenger, getDefaultMicroblog, getDefaultPhotoPost } from "./types";

describe("localized example projects", () => {
  it("provides examples in each supported interface language", () => {
    const samples = {
      fr: [getDefaultPhotoPost("fr").posts[0].caption, getDefaultMessenger("fr").messages[0].text, getDefaultMicroblog("fr").posts[0].text],
      es: [getDefaultPhotoPost("es").posts[0].caption, getDefaultMessenger("es").messages[0].text, getDefaultMicroblog("es").posts[0].text],
      nl: [getDefaultPhotoPost("nl").posts[0].caption, getDefaultMessenger("nl").messages[0].text, getDefaultMicroblog("nl").posts[0].text],
    };
    for (const [locale, content] of Object.entries(samples)) {
      expect(content.every(Boolean), locale).toBe(true);
      expect(content).not.toContain(getDefaultPhotoPost("en").posts[0].caption);
    }
    expect(getDefaultPhotoPost("es").posts[0].comments[0].timestamp).toBe("hace 5 minutos");
    expect(getDefaultMicroblog("nl").posts[0].comments[0].timestamp).toBe("8 minuten geleden");
  });

  it("returns independent data for each project instance", () => {
    const first = getDefaultMessenger("fr");
    first.messages[0].text = "changed";
    expect(getDefaultMessenger("fr").messages[0].text).not.toBe("changed");
  });
});
