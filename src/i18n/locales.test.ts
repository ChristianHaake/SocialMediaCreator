import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";
import { fr } from "./fr";
import { es } from "./es";
import { nl } from "./nl";

describe("locale dictionaries", () => {
  const expected = Object.keys(de).sort();
  it("provide exactly the same translation keys", () => {
    for (const dictionary of [en, fr, es, nl]) {
      expect(Object.keys(dictionary).sort()).toEqual(expected);
    }
  });

  it("keeps interpolation placeholders aligned and values present", () => {
    const dictionaries = { en, fr, es, nl };
    const placeholders = (value: string) => [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();
    for (const [locale, dictionary] of Object.entries(dictionaries)) {
      for (const key of expected) {
        expect(dictionary[key as keyof typeof dictionary], `${locale}.${key}`).not.toBe("");
        expect(placeholders(dictionary[key as keyof typeof dictionary]), `${locale}.${key}`).toEqual(placeholders(en[key as keyof typeof en]));
      }
    }
  });

  it("uses translated French strings for the main interface", () => {
    expect(fr["app.format"]).toBe("Choisir un format");
    expect(fr["config.loadFailed"]).toBe("Impossible de charger la configuration.");
    expect(fr["export.continue"]).toBe("Continuer l’export");
  });
});
