# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei
dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).
Das Projekt verwendet [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

Neue Änderungen werden zuerst in diesem Abschnitt eingetragen und bei einer
Veröffentlichung in eine versionierte Sektion verschoben.

### Hinzugefügt

- Sortierbare Foto- und Mikroblog-Feeds mit Drag-and-Drop, Touch-Steuerung und
  barrierearmen Pfeiltasten.
- Umschaltbare Mikroblog-Darstellung als getrennter Feed oder verbundener
  Thread.
- Konfigurationsformat Version 4 mit Migration aus Version 3.
- Light-, Dim- und Dark-Mode pro Simulationsmodul.
- Zwei explizite Messenger-Profile mit Profilbildern, Status,
  Nachrichtenzuweisung, freien Zeitstempeln und Gesehen-Status.
- Zweistufige Kommentare mit individuellen Profilbildern und Zeitstempeln.
- Dedizierte Kommentaransichten für Foto-Post und Mikroblog.
- Foto-Karussells mit bis zu zehn sortierbaren Medien.
- Video-Simulation mit Thumbnail, Play-Overlay, Dauer und Aufrufzahl.
- PDF-Export im A4-Hochformat.
- Lokaler Herkunftsmarker für PNG und JPG sowie Verifikationsseite.
- Konfigurationsformat Version 3 mit Migration aus Version 1 und 2.
- Foto-Post und Mikroblog unterstützen mehrere Beiträge in einem Projekt.
- Kommentare lassen sich direkt an einzelne Foto- und Mikroblog-Beiträge
  anhängen, bearbeiten und löschen.
- Bildzuordnungen werden je Beitrag getrennt verwaltet.
- Konfigurationsformat Version 2 speichert Beitragslisten und Kommentare.
- Bestehende Konfigurationen der Version 1 werden beim Import automatisch
  migriert.
- Vollständiges Mikroblog-Modul mit Anzeigename, Handle und Profilbild.
- Beitragstext mit informierendem Zeichenzähler ohne erzwungene Begrenzung.
- Optional einblendbare Datums- und Zeitangaben.
- Fiktive Kennzahlen für Antworten, Reposts und Likes.
- Mikroblog-Konfigurationen als versionierte JSON-Dateien importieren und
  exportieren.
- PNG- und JPG-Export mit modulspezifischem Dateinamen.
- Automatisierte UI- und Konfigurationstests für das Mikroblog-Modul.
- Browser-E2E-Suite für Chromium, Firefox und WebKit.
- Browserprüfungen für Bild- und Konfigurationsdownloads aller Module.
- Automatisierte Prüfung der Netzwerkfreiheit nach dem initialen Laden.
- Responsive Browserprüfung bei 320 CSS-Pixeln.
- Dokumentiertes Software-Stack- und Stabilitätsaudit.
- Gebündelter Prüfablauf über `npm run verify`.

### Geändert

- Neue Beiträge werden direkt hinter dem aktuell ausgewählten Beitrag
  eingefügt.
- PDF-Exporte beginnen jeden Hauptbeitrag auf einer neuen Seite und übernehmen
  die festgelegte Feed-Reihenfolge.
- Mikroblog-Datum und -Uhrzeit wurden durch einen freien Zeitstempel ersetzt.
- PNG- und JPG-Exporte werden Blob-basiert erzeugt und mit einem prüfbaren
  lokalen Marker versehen.
- Produktname und Exportdateinamen wurden auf `SocialMediaCreator` umgestellt.
- PNG- und JPG-Exporte enthalten den vollständigen Feed aller Beiträge.
- Alle drei im Produktplan vorgesehenen Mockup-Module sind auswählbar.
- Die Modulnavigation verwendet semantische Tabs und unterstützt
  Pfeiltasten sowie Home und Ende.
- Der Lehrkräfte-Dialog hält den Tastaturfokus und gibt ihn nach dem Schließen
  an den auslösenden Button zurück.
- Editorgrenzen und Validierung importierter Konfigurationen verwenden
  gemeinsame Feldgrenzen.
- TypeScript prüft auch die Playwright-Konfiguration und E2E-Tests.
- Die Projektseite beschreibt alle drei vorhandenen Module.

### Behoben

- Fokus-Rückgabe des Lehrkräfte-Dialogs für Safari/WebKit vereinheitlicht.
- Überlange oder nicht darstellbare Werte in Konfigurationsdateien werden vor
  der Übernahme abgelehnt.
- Ungültige Datums- und Uhrzeitwerte können nicht mehr zu Abweichungen zwischen
  Editor und Vorschau führen.
- Dateien mit gefälschtem Bildtyp oder beschädigten Bilddaten werden vor der
  Vorschau abgelehnt.

### Sicherheit

- Abhängigkeitsprüfung ohne bekannte Paket-Schwachstellen.
- Bilddateien werden anhand von Dateisignatur und tatsächlicher
  Browser-Dekodierbarkeit geprüft.

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
