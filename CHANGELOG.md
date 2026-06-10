# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei
dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).
Das Projekt verwendet [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

Neue Änderungen werden zuerst in diesem Abschnitt eingetragen und bei einer
Veröffentlichung in eine versionierte Sektion verschoben.

### Hinzugefügt

- Vollständiges Mikroblog-Modul mit Anzeigename, Handle und Profilbild.
- Beitragstext mit informierendem Zeichenzähler ohne erzwungene Begrenzung.
- Optional einblendbare Datums- und Zeitangaben.
- Fiktive Kennzahlen für Antworten, Reposts und Likes.
- Mikroblog-Konfigurationen als versionierte JSON-Dateien importieren und
  exportieren.
- PNG- und JPG-Export mit modulspezifischem Dateinamen.
- Automatisierte UI- und Konfigurationstests für das Mikroblog-Modul.

### Geändert

- Alle drei im Produktplan vorgesehenen Mockup-Module sind auswählbar.

### Behoben

### Sicherheit

## [0.2.0] - 2026-06-11

### Hinzugefügt

- Vollständiges Messenger-Chat-Modul.
- Kontaktbild, Kontaktname und Status.
- Gesendete und empfangene Nachrichten mit Zeitstempeln.
- Nachrichten hinzufügen, bearbeiten, löschen und per Tastatursteuerung
  umsortieren.
- PNG- und JPG-Export vollständiger Chatverläufe.
- Messenger-Konfigurationen als versionierte JSON-Dateien importieren und
  exportieren.
- Modulnavigation zwischen Foto-Post und Messenger-Chat.
- Lehrkräfte-Hinweisdialog.
- Inhaltsseiten für Hilfe, Projektinformationen, Datenschutz und Impressum.
- Persistenter Footer mit Inhalts- und GitHub-Links.
- Produktions-Smoke-Test für Cloudflare Workers.

### Geändert

- Gemeinsame Konfigurationsarchitektur für mehrere Module.
- Modulspezifische Dateinamen für Bild- und Konfigurationsexporte.
- Zustände bleiben beim Wechsel zwischen Modulen während der Sitzung erhalten.
- Datenschutzaussagen unterscheiden lokale Nutzdaten von technischen
  Hosting-Verbindungsdaten.
- Cloudflare-Bereitstellung verwendet eine feste Wrangler-Konfiguration.

### Sicherheit

- Content Security Policy und weitere Browser-Sicherheitsheader ergänzt.
- SPA-Fallback für direkte Routenaufrufe konfiguriert.
- Langfristiges Caching für versionierte Assets aktiviert.
- Cloudflare-JavaScript-Injektion für HTML durch `Cache-Control: no-transform`
  unterbunden.
- Stage-Bereitstellung mit automatisiertem Smoke-Test validiert.

## [0.1.0] - 2026-06-10

### Hinzugefügt

- Vite-, React- und TypeScript-Projektgrundlage.
- Vollständiges Foto-Post-Modul mit Live-Vorschau.
- Lokale Profil- und Beitragsbilder.
- Validierung für PNG-, JPG- und WebP-Dateien bis 10 MB.
- Eingaben für Benutzername, Ort, Beschreibung und Reaktionszahlen.
- Optionale Anzeige von Ort und Kommentarzeile.
- PNG- und JPG-Export der Vorschau.
- Versionierte Foto-Post-Konfigurationen als JSON-Dateien.
- Konfigurationsimport und -export ohne Bilddaten.
- Warnungen beim Speichern oder Laden von Konfigurationen mit Bildern.
- Responsive Desktop- und Mobilansicht.
- Schutz vor unbeabsichtigtem Zurücksetzen geänderter Inhalte.
- Automatisierte Unit- und UI-Tests.

### Sicherheit

- Ausschließlich lokale Verarbeitung von Nutzinhalten.
- Keine Anmeldung, Datenbank, Analyse oder Upload-Endpunkte.
- Ablehnung unbekannter und fehlerhafter Konfigurationsdateien.

[Unveröffentlicht]: https://github.com/ChristianHaake/SocialMediaCreator/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ChristianHaake/SocialMediaCreator/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ChristianHaake/SocialMediaCreator/releases/tag/v0.1.0
