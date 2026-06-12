/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "./types";

const de = {
  "app.tagline": "Werkstatt für digitale Formate",
  "app.local": "Inhalte bleiben lokal",
  "app.teacher": "Für Lehrkräfte",
  "app.language": "Sprache",
  "app.metaDescription":
    "Erstelle fiktive digitale Kommunikationsformate lokal im Browser.",
  "app.format": "Format auswählen",
  "app.view": "Ansicht auswählen",
  "app.edit": "Bearbeiten",
  "app.preview": "Vorschau",
  "app.editor": "Editor",
  "app.livePreview": "Live-Vorschau",
  "app.localRender": "Wird lokal in deinem Browser gerendert",
  "app.live": "Live",
  "app.project": "Projekt",
  "app.image": "Bild",
  "app.load": "Laden",
  "app.save": "Speichern",
  "app.creating": "Erstelle...",
  "app.reset": "Zurücksetzen",
  "app.resetConfirm": "Aktuelle Eingaben wirklich zurücksetzen?",
  "app.saveImagesConfirm":
    "Bilder sind nicht Teil der Konfigurationsdatei und müssen nach dem Laden erneut ausgewählt werden. Trotzdem speichern?",
  "app.saved": "Konfiguration ohne Bilder gespeichert.",
  "app.loadConfirm":
    "Beim Laden werden die Eingaben dieses Moduls ersetzt. Ausgewählte Bilder werden entfernt. Konfiguration laden?",
  "app.loaded":
    "Konfiguration geladen. Bilder müssen erneut ausgewählt werden.",
  "app.imageExportError":
    "Das Bild konnte nicht erstellt werden. Bitte versuche es erneut.",
  "app.pdfExportError":
    "Das PDF konnte nicht erstellt werden. Bitte versuche es erneut.",
  "app.notFound": "Seite nicht gefunden",
  "app.notFoundText":
    "Die angeforderte Seite existiert nicht. Kehre zur App zurück oder verwende einen Link aus der Fußnavigation.",
  "module.photo": "Foto-Post",
  "module.messenger": "Messenger-Chat",
  "module.microblog": "Mikroblog",
  "photo.eyebrow": "Fiktiv. Lokal. Exportierbar.",
  "photo.title": "Erstelle deine Foto-Posts.",
  "photo.description":
    "Gestalte fiktive Beiträge und beobachte jede Änderung direkt in der Vorschau. Ohne Anmeldung und ohne Upload.",
  "photo.editorTitle": "Foto-Posts bearbeiten",
  "messenger.eyebrow": "Dialoge nachvollziehbar gestalten.",
  "messenger.title": "Baue deinen Messenger-Chat.",
  "messenger.description":
    "Erstelle einen fiktiven Dialog, ordne Nachrichten und exportiere den vollständigen Verlauf direkt im Browser.",
  "messenger.editorTitle": "Messenger-Chat bearbeiten",
  "microblog.eyebrow": "Kurz. Klar. Kontextbezogen.",
  "microblog.title": "Formuliere deine Mikroblog-Beiträge.",
  "microblog.description":
    "Gestalte kurze fiktive Beiträge mit Profil, Zeitangaben und Reaktionen. Der Zeichenzähler informiert, ohne dich zu begrenzen.",
  "microblog.editorTitle": "Mikroblog-Beiträge bearbeiten",
  "common.appearance": "Darstellung",
  "common.theme": "Farbschema",
  "common.light": "Light",
  "common.dim": "Dim",
  "common.dark": "Dark",
  "common.profileImage": "Profilbild",
  "common.author": "Autor",
  "common.timestamp": "Zeitstempel",
  "common.date": "Datum",
  "common.timeOptional": "Uhrzeit (optional)",
  "common.post": "Beitrag",
  "common.posts": "Beiträge",
  "common.comment": "Kommentar",
  "common.comments": "Kommentare",
  "common.reply": "Antwort",
  "common.replies": "Antworten",
  "common.delete": "löschen",
  "common.moveUp": "nach oben verschieben",
  "common.moveDown": "nach unten verschieben",
  "common.select": "auswählen",
  "common.add": "Hinzufügen",
  "common.noText": "Ohne Text",
  "common.fullPost": "Vollständiger Beitrag",
  "common.commentView": "Kommentaransicht",
  "common.viewMode": "Darstellungsmodus",
  "common.newest": "Neueste zuerst",
  "common.oldest": "Älteste zuerst",
  "common.timelineOrder": "Timeline-Reihenfolge",
  "common.autoSorted": "automatisch chronologisch sortiert",
  "image.choose": "Bild auswählen",
  "image.replace": "Bild ersetzen",
  "image.remove": "{label} entfernen",
  "image.hint": "PNG, JPG oder WebP, maximal 10 MB",
  "image.invalidType": "Bitte wähle eine PNG-, JPG- oder WebP-Datei aus.",
  "image.tooLarge": "Das Bild darf höchstens 10 MB groß sein.",
  "image.invalidData":
    "Die Datei enthält kein gültiges PNG-, JPG- oder WebP-Bild.",
  "image.decodeFailed": "Das Bild ist beschädigt oder kann nicht gelesen werden.",
  "comment.count.one": "{count} Kommentar",
  "comment.count.other": "{count} Kommentare",
  "comment.empty": "Noch keine Kommentare angehängt.",
  "comment.text": "Kommentartext",
  "comment.replyText": "Antworttext",
  "comment.new": "Neuer Kommentar",
  "comment.newReply": "Neue Antwort",
  "comment.justNow": "gerade eben",
  "comment.discussion": "Zweistufige Diskussion zum ausgewählten Beitrag",
  "photo.appearanceDescription": "Farbschema und Reihenfolge der Timeline",
  "photo.postsDescription.one": "{count} Beitrag, automatisch chronologisch sortiert",
  "photo.postsDescription.other":
    "{count} Beiträge, automatisch chronologisch sortiert",
  "photo.profileTitle": "Profil und Ansicht",
  "photo.profileDescription":
    "Absender, Veröffentlichungszeitpunkt und Fokus",
  "photo.username": "Benutzername",
  "photo.location": "Ort",
  "photo.showLocation": "Ort in der Vorschau anzeigen",
  "photo.carousel": "Karussell",
  "photo.carouselDescription": "Bis zu zehn Bilder oder Video-Thumbnails",
  "photo.medium": "Medium",
  "photo.image": "Bild",
  "photo.video": "Video",
  "photo.mediumFile": "Datei für Medium {index}",
  "photo.mediaType": "Medientyp",
  "photo.videoSimulation": "Video-Simulation",
  "photo.altText": "Alternativtext",
  "photo.altPlaceholder": "Was ist auf dem Bild zu sehen?",
  "photo.duration": "Videolänge",
  "photo.durationPlaceholder": "z. B. 0:42",
  "photo.views": "Aufrufe",
  "photo.viewsPlaceholder": "z. B. 1.240",
  "photo.viewsLabel": "{count} Aufrufe",
  "photo.contentTitle": "Inhalt und Reaktionen",
  "photo.contentDescription": "Beschreibung und fiktive Kennzahlen",
  "photo.caption": "Beschreibung",
  "photo.commentCount": "Kommentaranzahl",
  "photo.showComments": "Kommentare anzeigen",
  "photo.noDescription": "Ohne Beschreibung",
  "photo.newAccount": "neuer_account",
  "photo.newPost": "Neuer Beitrag",
  "photo.placeholder": "Dein Bild erscheint hier",
  "photo.carouselSelect": "Karussellbild auswählen",
  "photo.showImage": "Bild {index} anzeigen",
  "photo.likes": "{count} Likes",
  "photo.viewComments": "{count} Kommentare ansehen",
  "microblog.appearanceDescription": "Farbschema, Layout und Reihenfolge",
  "microblog.timelineLayout": "Timeline-Darstellung",
  "microblog.feed": "Feed mit getrennten Beiträgen",
  "microblog.thread": "Verbundener Thread",
  "microblog.profile": "Profil",
  "microblog.profileDescription": "Absender des ausgewählten Beitrags",
  "microblog.displayName": "Anzeigename",
  "microblog.contentTitle": "Inhalt und Ansicht",
  "microblog.contentDescription": "Text, Veröffentlichungszeitpunkt und Ansicht",
  "microblog.postText": "Beitragstext",
  "microblog.characters": "{count} Zeichen",
  "microblog.long": " · länger als 280 Zeichen",
  "microblog.reactions": "Reaktionen",
  "microblog.reactionsDescription":
    "Fiktive Kennzahlen des ausgewählten Beitrags",
  "microblog.reposts": "Reposts",
  "microblog.likes": "Likes",
  "microblog.newProfile": "Neues Profil",
  "microblog.newHandle": "neues_profil",
  "microblog.newPost": "Neuer Beitrag",
  "microblog.placeholder": "Dein Beitrag erscheint hier.",
  "microblog.share": "Teilen",
  "messenger.themeDescription": "Farbschema des Messenger-Chats",
  "messenger.profiles": "Chat-Profile",
  "messenger.profilesDescription":
    "Zwei feste Seiten mit frei editierbaren Profilen",
  "messenger.notice":
    "Verwende fiktive Namen und keine echten privaten Chats.",
  "messenger.leftProfile": "Profil links",
  "messenger.rightProfile": "Profil rechts",
  "messenger.name": "Name",
  "messenger.status": "Online-Status",
  "messenger.newMessage": "Neue Nachricht",
  "messenger.newMessageDescription":
    "Nachricht einem der beiden Profile zuweisen",
  "messenger.sender": "Absender",
  "messenger.messageText": "Nachrichtentext",
  "messenger.placeholder": "Was soll in der Nachricht stehen?",
  "messenger.markSeen": "Als gelesen oder gesehen markieren",
  "messenger.messages": "Nachrichten",
  "messenger.messagesDescription":
    "{count} Nachrichten bearbeiten und sortieren",
  "messenger.empty": "Noch keine Nachrichten.",
  "messenger.message": "Nachricht",
  "messenger.text": "Text",
  "messenger.seen": "Gelesen oder gesehen",
  "messenger.contact": "Kontakt",
  "messenger.lastOnline": "zuletzt online",
  "messenger.profile": "Profil",
  "messenger.emptyMessage": "Leere Nachricht",
  "messenger.today": "HEUTE",
  "messenger.previewEmpty": "Nachrichten erscheinen hier.",
  "footer.local": "SocialMediaCreator · Inhalte bleiben auf deinem Gerät",
  "footer.navigation": "Fußnavigation",
  "footer.help": "Hilfe",
  "footer.about": "Über das Projekt",
  "footer.verify": "Bild verifizieren",
  "footer.privacy": "Datenschutz",
  "footer.legal": "Impressum",
  "content.back": "Zurück zur App",
  "content.help": "Hilfe",
  "content.about": "Über das Projekt",
  "content.privacy": "Datenschutz",
  "content.legal": "Impressum",
  "teacher.kicker": "Für den Unterricht",
  "teacher.title": "Hinweise für Lehrkräfte",
  "teacher.close": "Dialog schließen",
  "teacher.item1": "Texte und ausgewählte Bilder werden nicht hochgeladen.",
  "teacher.item2": "Es gibt keine Anmeldung, Datenbank oder Nutzungsanalyse.",
  "teacher.item3":
    "Konfigurationen und Bilder werden ausschließlich lokal erzeugt.",
  "teacher.item4":
    "Das Werkzeug eignet sich für fiktive Beiträge, Rollenarbeit, Medienanalyse und Quellenkritik.",
  "teacher.note":
    "Verwende keine echten personenbezogenen Daten oder privaten Chatverläufe. Technische Verbindungsdaten entstehen beim Abruf der Website über den Hosting-Anbieter.",
  "verify.title": "Bild verifizieren",
  "verify.description":
    "Prüfe lokal, ob eine PNG- oder JPG-Datei einen intakten SocialMediaCreator-Herkunftsmarker enthält. Die Datei wird nicht hochgeladen.",
  "verify.checking": "Prüfe Datei...",
  "verify.choose": "Bild auswählen",
  "verify.valid": "Gültiger Herkunftsmarker",
  "verify.validText": "Modul: {module}. Exportiert am {date}.",
  "verify.modified": "Datei nachträglich verändert",
  "verify.modifiedText":
    "Der Marker ist vorhanden, die Prüfsumme stimmt aber nicht mit den Bilddaten überein.",
  "verify.none": "Kein unterstützter Marker",
  "verify.noneText":
    "Die Datei wurde nicht mit einem erkennbaren SocialMediaCreator-Marker exportiert oder der Marker wurde entfernt.",
  "verify.disclaimer":
    "Der Marker ist ein pädagogischer Herkunftshinweis. Er ist kein fälschungssicherer Echtheitsbeweis und kann durch erneutes Speichern, Plattformverarbeitung oder Bildbearbeitung entfernt werden.",
  "config.invalidJson": "Die Datei enthält kein gültiges JSON.",
  "config.invalidFormat":
    "Die Datei ist keine SocialMediaCreator-Konfiguration.",
  "config.unsupportedVersion":
    "Diese Konfigurationsversion wird nicht unterstützt.",
  "config.incomplete": "Die Modulkonfiguration ist unvollständig.",
  "config.wrongModule": "Die Datei enthält keine Foto-Post-Konfiguration.",
  "config.tooLarge": "Die Konfigurationsdatei darf höchstens 1 MB groß sein.",
  "config.loadFailed": "Die Konfiguration konnte nicht geladen werden.",
} as const;

export type TranslationKey = keyof typeof de;
type Params = Record<string, string | number>;

const en: Record<TranslationKey, string> = {
  ...de,
  "app.tagline": "Workshop for digital formats",
  "app.local": "Content stays local",
  "app.teacher": "For educators",
  "app.language": "Language",
  "app.metaDescription":
    "Create fictional digital communication formats locally in your browser.",
  "app.format": "Choose a format",
  "app.view": "Choose a view",
  "app.edit": "Edit",
  "app.preview": "Preview",
  "app.livePreview": "Live preview",
  "app.localRender": "Rendered locally in your browser",
  "app.project": "Project",
  "app.image": "Image",
  "app.load": "Load",
  "app.save": "Save",
  "app.creating": "Creating...",
  "app.reset": "Reset",
  "app.resetConfirm": "Reset the current input?",
  "app.saveImagesConfirm":
    "Images are not included in the configuration file and must be selected again after loading. Save anyway?",
  "app.saved": "Configuration saved without images.",
  "app.loadConfirm":
    "Loading will replace this module's input and remove selected images. Load configuration?",
  "app.loaded": "Configuration loaded. Images must be selected again.",
  "app.imageExportError": "The image could not be created. Please try again.",
  "app.pdfExportError": "The PDF could not be created. Please try again.",
  "app.notFound": "Page not found",
  "app.notFoundText":
    "The requested page does not exist. Return to the app or use a footer link.",
  "module.photo": "Photo post",
  "module.messenger": "Messenger chat",
  "module.microblog": "Microblog",
  "photo.eyebrow": "Fictional. Local. Exportable.",
  "photo.title": "Create your photo posts.",
  "photo.description":
    "Design fictional posts and see every change immediately. No account and no upload required.",
  "photo.editorTitle": "Edit photo posts",
  "messenger.eyebrow": "Make conversations understandable.",
  "messenger.title": "Build your messenger chat.",
  "messenger.description":
    "Create a fictional conversation, arrange messages, and export the full chat in your browser.",
  "messenger.editorTitle": "Edit messenger chat",
  "microblog.eyebrow": "Brief. Clear. Contextual.",
  "microblog.title": "Write your microblog posts.",
  "microblog.description":
    "Create short fictional posts with profiles, dates, and reactions. The counter informs without limiting you.",
  "microblog.editorTitle": "Edit microblog posts",
  "common.appearance": "Appearance",
  "common.theme": "Color scheme",
  "common.profileImage": "Profile image",
  "common.author": "Author",
  "common.timestamp": "Timestamp",
  "common.date": "Date",
  "common.timeOptional": "Time (optional)",
  "common.post": "Post",
  "common.posts": "Posts",
  "common.comment": "Comment",
  "common.comments": "Comments",
  "common.reply": "Reply",
  "common.replies": "Replies",
  "common.delete": "delete",
  "common.moveUp": "move up",
  "common.moveDown": "move down",
  "common.select": "select",
  "common.add": "Add",
  "common.noText": "No text",
  "common.fullPost": "Full post",
  "common.commentView": "Comments view",
  "common.viewMode": "Display mode",
  "common.newest": "Newest first",
  "common.oldest": "Oldest first",
  "common.timelineOrder": "Timeline order",
  "common.autoSorted": "automatically sorted chronologically",
  "image.choose": "Choose image",
  "image.replace": "Replace image",
  "image.remove": "Remove {label}",
  "image.hint": "PNG, JPG, or WebP, maximum 10 MB",
  "image.invalidType": "Choose a PNG, JPG, or WebP file.",
  "image.tooLarge": "The image must not exceed 10 MB.",
  "image.invalidData": "The file does not contain a valid PNG, JPG, or WebP image.",
  "image.decodeFailed": "The image is damaged or cannot be read.",
  "comment.count.one": "{count} comment",
  "comment.count.other": "{count} comments",
  "comment.empty": "No comments attached yet.",
  "comment.text": "Comment text",
  "comment.replyText": "Reply text",
  "comment.new": "New comment",
  "comment.newReply": "New reply",
  "comment.justNow": "just now",
  "comment.discussion": "Two-level discussion for the selected post",
  "photo.appearanceDescription": "Color scheme and timeline order",
  "photo.postsDescription.one": "{count} post, automatically sorted chronologically",
  "photo.postsDescription.other":
    "{count} posts, automatically sorted chronologically",
  "photo.profileTitle": "Profile and view",
  "photo.profileDescription": "Author, publication time, and focus",
  "photo.username": "Username",
  "photo.location": "Location",
  "photo.showLocation": "Show location in preview",
  "photo.carousel": "Carousel",
  "photo.carouselDescription": "Up to ten images or video thumbnails",
  "photo.medium": "Media item",
  "photo.image": "Image",
  "photo.mediumFile": "File for media item {index}",
  "photo.mediaType": "Media type",
  "photo.videoSimulation": "Video simulation",
  "photo.altText": "Alternative text",
  "photo.altPlaceholder": "What can be seen in the image?",
  "photo.duration": "Video duration",
  "photo.durationPlaceholder": "e.g. 0:42",
  "photo.views": "Views",
  "photo.viewsPlaceholder": "e.g. 1,240",
  "photo.viewsLabel": "{count} views",
  "photo.contentTitle": "Content and reactions",
  "photo.contentDescription": "Caption and fictional metrics",
  "photo.caption": "Caption",
  "photo.commentCount": "Comment count",
  "photo.showComments": "Show comments",
  "photo.noDescription": "No caption",
  "photo.newAccount": "new_account",
  "photo.newPost": "New post",
  "photo.placeholder": "Your image appears here",
  "photo.carouselSelect": "Choose carousel image",
  "photo.showImage": "Show image {index}",
  "photo.likes": "{count} likes",
  "photo.viewComments": "View {count} comments",
  "microblog.appearanceDescription": "Color scheme, layout, and order",
  "microblog.timelineLayout": "Timeline layout",
  "microblog.feed": "Feed with separate posts",
  "microblog.thread": "Connected thread",
  "microblog.profile": "Profile",
  "microblog.profileDescription": "Author of the selected post",
  "microblog.displayName": "Display name",
  "microblog.contentTitle": "Content and view",
  "microblog.contentDescription": "Text, publication time, and display mode",
  "microblog.postText": "Post text",
  "microblog.characters": "{count} characters",
  "microblog.long": " · longer than 280 characters",
  "microblog.reactions": "Reactions",
  "microblog.reactionsDescription": "Fictional metrics for the selected post",
  "microblog.newProfile": "New profile",
  "microblog.newHandle": "new_profile",
  "microblog.newPost": "New post",
  "microblog.placeholder": "Your post appears here.",
  "microblog.share": "Share",
  "messenger.themeDescription": "Messenger chat color scheme",
  "messenger.profiles": "Chat profiles",
  "messenger.profilesDescription": "Two fixed sides with editable profiles",
  "messenger.notice": "Use fictional names and no real private chats.",
  "messenger.leftProfile": "Left profile",
  "messenger.rightProfile": "Right profile",
  "messenger.name": "Name",
  "messenger.status": "Online status",
  "messenger.newMessage": "New message",
  "messenger.newMessageDescription": "Assign the message to either profile",
  "messenger.sender": "Sender",
  "messenger.messageText": "Message text",
  "messenger.placeholder": "What should the message say?",
  "messenger.markSeen": "Mark as read or seen",
  "messenger.messages": "Messages",
  "messenger.messagesDescription": "Edit and arrange {count} messages",
  "messenger.empty": "No messages yet.",
  "messenger.message": "Message",
  "messenger.text": "Text",
  "messenger.seen": "Read or seen",
  "messenger.contact": "Contact",
  "messenger.lastOnline": "last online",
  "messenger.profile": "Profile",
  "messenger.emptyMessage": "Empty message",
  "messenger.today": "TODAY",
  "messenger.previewEmpty": "Messages appear here.",
  "footer.local": "SocialMediaCreator · Content stays on your device",
  "footer.navigation": "Footer navigation",
  "footer.help": "Help",
  "footer.about": "About the project",
  "footer.verify": "Verify image",
  "footer.privacy": "Privacy",
  "footer.legal": "Legal notice",
  "content.back": "Back to the app",
  "content.help": "Help",
  "content.about": "About the project",
  "content.privacy": "Privacy",
  "content.legal": "Legal notice",
  "teacher.kicker": "For the classroom",
  "teacher.title": "Information for educators",
  "teacher.close": "Close dialog",
  "teacher.item1": "Text and selected images are not uploaded.",
  "teacher.item2": "There is no account, database, or usage analytics.",
  "teacher.item3": "Configurations and images are created locally.",
  "teacher.item4":
    "The tool supports fictional posts, role play, media analysis, and source criticism.",
  "teacher.note":
    "Do not use real personal data or private conversations. Technical connection data is generated when the hosting provider serves the website.",
  "verify.title": "Verify image",
  "verify.description":
    "Check locally whether a PNG or JPG file contains an intact SocialMediaCreator origin marker. The file is not uploaded.",
  "verify.checking": "Checking file...",
  "verify.choose": "Choose image",
  "verify.valid": "Valid origin marker",
  "verify.validText": "Module: {module}. Exported on {date}.",
  "verify.modified": "File was modified",
  "verify.modifiedText":
    "The marker exists, but the checksum does not match the image data.",
  "verify.none": "No supported marker",
  "verify.noneText":
    "The file was not exported with a recognized SocialMediaCreator marker, or the marker was removed.",
  "verify.disclaimer":
    "The marker is an educational origin indicator. It is not tamper-proof proof of authenticity and can be removed by saving again, platform processing, or image editing.",
  "config.invalidJson": "The file does not contain valid JSON.",
  "config.invalidFormat": "The file is not a SocialMediaCreator configuration.",
  "config.unsupportedVersion": "This configuration version is not supported.",
  "config.incomplete": "The module configuration is incomplete.",
  "config.wrongModule": "The file does not contain a photo-post configuration.",
  "config.tooLarge": "The configuration file must not exceed 1 MB.",
  "config.loadFailed": "The configuration could not be loaded.",
};

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
  | "image.invalidData"
  | "image.decodeFailed";

export type ConfigErrorCode =
  | "config.invalidJson"
  | "config.invalidFormat"
  | "config.unsupportedVersion"
  | "config.incomplete"
  | "config.wrongModule"
  | "config.tooLarge";
