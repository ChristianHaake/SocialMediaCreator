# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei
dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).
Das Projekt verwendet [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

Neue Änderungen werden zuerst in diesem Abschnitt eingetragen und bei einer
Veröffentlichung in eine versionierte Sektion verschoben.

### Hinzugefügt

- Klare Master-Detail-Eingabe für Foto-Post und Mikroblog mit getrennten
  Projekteinstellungen, Beitragsverwaltung und Feldern des aktiven Beitrags.
- Beitragskarten mit Autor, Datum, Textauszug, Timeline-Position und sichtbarem
  Aktivstatus; mobil als horizontal scrollbarere Liste.
- Auswahl und Bearbeitung eines Beitrags direkt aus der Live-Vorschau.
- Sichtbarer Bildungs-Disclaimer auf allen Generatoransichten.
- Zweisprachige Seiten für Lehrkräfte, verantwortungsvollen Einsatz und
  Nutzungsbedingungen mit fünf Unterrichtsszenarien und FAQ.
- Verpflichtender Exporthinweis mit erstmaliger, lokal gespeicherter
  Zustimmung.
- Nicht deaktivierbare sichtbare Simulationskennzeichnung in PNG, JPG und auf
  jeder PDF-Seite.
- Vollständige deutsche und englische Oberfläche inklusive Vorschauen,
  Dialogen, Verifikation und Inhaltsseiten.
- Sprachwahl über Browserpräferenz und Header-Umschalter mit lokaler
  Speicherung.
- Konfigurationsformat Version 6 speichert die Projektsprache.
- Echte Foto- und Mikroblog-Timelines mit Pflichtdatum, optionaler Uhrzeit und
  automatischer chronologischer Sortierung.
- Umschaltbare Timeline-Reihenfolge: neueste oder älteste Beiträge zuerst.
- Kompakte Editorbereiche, die selten benötigte Optionen einklappen.
- Konfigurationsformat Version 5 mit strukturierten Datumswerten.
- Umschaltbare Mikroblog-Darstellung als getrennter Feed oder verbundener
  Thread.
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

- GitHub-README vollständig auf Englisch neu strukturiert und um
  Produktübersicht, Datenschutzmodell, Config-Kompatibilität, Architektur,
  Entwicklung, Deployment und Lizenz ergänzt.
- Software-Stack-Audit auf den validierten Stand vom 12. Juni 2026 sowie eine
  priorisierte Wartbarkeits-Roadmap aktualisiert.
- Produktions-Smoke-Test auf alle öffentlichen Inhalts- und
  Verifikationsrouten erweitert.
- Paketmetadaten um Beschreibung, Lizenz, Repository, Homepage und
  Fehlertracker ergänzt.
- Neue Beiträge werden sofort aktiviert, in Sicht gescrollt und fokussieren
  das Autorenfeld.
- Löschdialoge nennen Autor und Datum; nach dem Löschen wird ein sinnvoller
  Nachbarbeitrag aktiviert.
- Die Auswahlmarkierung der Live-Vorschau wird in Bild- und PDF-Exporten
  ausgeblendet.
- Impressum, Datenschutz und Projektbeschreibung enthalten vollständige
  Betreiber-, Cloudflare-Workers- und Web-Analytics-Angaben.
- Der Lehrkräfte-Kurzdialog verlinkt auf die vollständige Informationsseite.
- Config V5 wird beim Import als deutsches Config-V6-Projekt übernommen.
- Datums- und Zahlenformatierung folgt der gewählten Sprache.
- Neue Elemente und Zurücksetzen verwenden lokalisierte Standardinhalte,
  bestehende Nutzereingaben bleiben beim Sprachwechsel unverändert.
- Die manuelle Beitragsreihenfolge per Drag-and-Drop und Pfeiltasten wurde
  durch die automatische Timeline-Sortierung ersetzt.
- Freie Beitragszeitstempel wurden durch ein Pflichtdatum und eine optionale
  Uhrzeit ersetzt.
- Config-Versionen 1 bis 4 werden nach dem bewussten Formatbruch nicht mehr
  importiert.
- PDF-Exporte beginnen jeden Hauptbeitrag auf einer neuen Seite und übernehmen
  die festgelegte Feed-Reihenfolge.
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
