export const creatorCopy = {
  de: { language: 'Sprache', moreApps: 'Weitere Apps', name: 'Deutsch' },
  en: { language: 'Language', moreApps: 'More apps', name: 'English' },
  fr: { language: 'Langue', moreApps: 'Autres applications', name: 'Français' },
  es: { language: 'Idioma', moreApps: 'Más aplicaciones', name: 'Español' },
  nl: { language: 'Taal', moreApps: 'Meer apps', name: 'Nederlands' },
} as const;

export type CreatorLocale = keyof typeof creatorCopy;

export function copyFor(locale: string) {
  const language = locale.toLowerCase().split('-')[0];
  return Object.prototype.hasOwnProperty.call(creatorCopy, language)
    ? creatorCopy[language as CreatorLocale]
    : creatorCopy.de;
}

export const appsDirectory = 'https://haak3.de/apps-fur-die-schule/';
