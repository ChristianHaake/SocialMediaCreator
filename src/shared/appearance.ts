// Globale App-Darstellung: Theme (Hell/Dim/Dunkel) + Schriftgröße.
// Getrennt vom projektbezogenen Vorschau-Modul-Theme (.simulation-theme).
// Als data-Attribute auf <html> gespiegelt; CSS greift darüber. Der Initialwert
// wird im Boot-Script (index.html) gesetzt, damit kein Flash entsteht.

export const APP_THEMES = ["light", "dim", "dark"] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export const FONT_SCALES = ["normal", "large", "xlarge"] as const;
export type FontScale = (typeof FONT_SCALES)[number];

export const APP_THEME_KEY = "smc:appTheme";
export const FONT_SCALE_KEY = "smc:fontScale";

function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === "string" && (APP_THEMES as readonly string[]).includes(value);
}

function isFontScale(value: unknown): value is FontScale {
  return typeof value === "string" && (FONT_SCALES as readonly string[]).includes(value);
}

export function readAppTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(APP_THEME_KEY);
    if (isAppTheme(stored)) return stored;
  } catch {
    // localStorage kann blockiert sein (Privatmodus) — Default genügt.
  }
  return "light";
}

export function readFontScale(): FontScale {
  try {
    const stored = localStorage.getItem(FONT_SCALE_KEY);
    if (isFontScale(stored)) return stored;
  } catch {
    // s. o.
  }
  return "normal";
}

export function applyAppTheme(theme: AppTheme): void {
  const root = document.documentElement;
  if (theme === "light") root.removeAttribute("data-app-theme");
  else root.setAttribute("data-app-theme", theme);
  try {
    localStorage.setItem(APP_THEME_KEY, theme);
  } catch {
    // ignorieren
  }
}

export function applyFontScale(scale: FontScale): void {
  const root = document.documentElement;
  if (scale === "normal") root.removeAttribute("data-font");
  else root.setAttribute("data-font", scale);
  try {
    localStorage.setItem(FONT_SCALE_KEY, scale);
  } catch {
    // ignorieren
  }
}

export function nextIn<T>(list: readonly T[], current: T): T {
  return list[(list.indexOf(current) + 1) % list.length];
}
