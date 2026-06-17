/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "../domain/types";

import { de, type TranslationKey } from "./de";
import { en } from "./en";

type Params = Record<string, string | number>;

const dictionaries = { de, en };
const storageKey = "social-media-creator-locale";

function detectLocale(): Locale {
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "de" || stored === "en") return stored;
  return window.navigator.language.toLowerCase().startsWith("en") ? "en" : "de";
}

function translate(locale: Locale, key: TranslationKey, params?: Params) {
  let value = dictionaries[locale][key];
  if (params) {
    Object.entries(params).forEach(([name, replacement]) => {
      value = value.replaceAll(`{${name}}`, String(replacement));
    });
  }
  return value;
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Params) => string;
  numberLocale: "de-DE" | "en-US";
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  useEffect(() => {
    window.localStorage.setItem(storageKey, locale);
    document.documentElement.lang = locale;
    document.title = "SocialMediaCreator";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", translate(locale, "app.metaDescription"));
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      numberLocale: locale === "de" ? "de-DE" : "en-US",
      t: (key, params) => translate(locale, key, params),
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleProvider is missing.");
  return context;
}

export function translateError(
  locale: Locale,
  code: ImageErrorCode | ConfigErrorCode,
) {
  return translate(locale, code);
}

export function getTranslation(
  locale: Locale,
  key: TranslationKey,
  params?: Params,
) {
  return translate(locale, key, params);
}

export type ImageErrorCode =
  | "image.invalidType"
  | "image.tooLarge"
  | "image.tooManyPixels"
  | "image.tooLargeToProcess"
  | "image.invalidData"
  | "image.decodeFailed";

export type ConfigErrorCode =
  | "config.invalidJson"
  | "config.invalidFormat"
  | "config.unsupportedVersion"
  | "config.incomplete"
  | "config.wrongModule"
  | "config.tooLarge";
