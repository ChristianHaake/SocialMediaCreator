# Codingplan

## 1. Ziel

Die Anwendung ist eine modulare Single Page Application zum Erstellen fiktiver
Mockups digitaler Kommunikationsformate. Sie richtet sich an Lernende und
Lehrkräfte.

Alle Inhalte werden ausschließlich im Browser verarbeitet. Es gibt kein
Backend, keine Datenbank, keine Anmeldung, kein Tracking und keinen Upload.
Die Anwendung wird als statische Website über Cloudflare Workers ausgeliefert.

Die App-Oberfläche und die Mockups verwenden neutrale Bezeichnungen, eigene
Farbvarianten und generische Icons. Sie orientieren sich an bekannten
Kommunikationsmustern, bilden bestehende Plattformen aber nicht pixelgenau nach.

## 2. Technische Entscheidungen

- Vite
- React
- TypeScript
- React-interner State; keine zusätzliche State-Management-Bibliothek
- Normales CSS mit Custom Properties
- Lucide Icons
- `html-to-image` für PNG- und JPG-Export
- Statisches Deployment über Cloudflare Workers
- Keine dauerhafte Speicherung im Browser in Version 0.1

## 3. Module

### Foto-Post

- Profilbild
- Benutzername
- optionaler Ort
- Beitragsbild im quadratischen Format
- Beschreibung
- Anzahl der Likes und Kommentare
- optionale Anzeige von Ort und Kommentarzeile

### Messenger-Chat

- Profilbild
- Kontaktname und Status
- beliebig viele gesendete und empfangene Nachrichten
- Nachrichtentext und Zeitstempel
- Nachrichten hinzufügen, bearbeiten, löschen und umsortieren
- visuelle Unterscheidung zwischen gesendeten und empfangenen Nachrichten

### Mikroblog

- Profilbild
- Anzeigename und Handle
- Beitragstext
- optionales Datum und optionale Uhrzeit
- Anzahl der Antworten, Reposts und Likes
- weicher Zeichenzähler ohne erzwungene Begrenzung

## 4. Gemeinsame Funktionen

### Live-Vorschau

Änderungen an Formularfeldern erscheinen unmittelbar in der Vorschau. Die App
startet mit klar erkennbaren, editierbaren Beispieldaten und neutralen
Bildplatzhaltern.

### Lokale Bilder

- Bilder werden über die File API ausschließlich lokal geladen.
- Unterstützte Formate: PNG, JPG/JPEG und WebP.
- SVG-Dateien werden nicht als Upload akzeptiert.
- Maximale Dateigröße: 10 MB pro Bild.
- Nicht unterstützte oder zu große Dateien erzeugen eine verständliche
  Fehlermeldung.
- Nicht mehr verwendete Object URLs werden mit `URL.revokeObjectURL()` entfernt.
- Bilder werden weder dauerhaft gespeichert noch in Konfigurationsdateien
  aufgenommen.

### Konfiguration herunterladen

Der aktuelle Inhalt kann als versionierte JSON-Datei heruntergeladen werden.
Die Datei enthält:

- Konfigurationsformat und Versionsnummer
- aktives Modul
- alle Text-, Zahlen- und Anzeigeeinstellungen
- Nachrichten und deren Reihenfolge im Messenger-Modul

Die Datei enthält keine Bilder, Object URLs, Binärdaten oder Data URLs.

Sind beim Download Bilder ausgewählt, zeigt die App vor dem Export folgenden
Hinweis:

> Bilder sind nicht Teil der Konfigurationsdatei und müssen nach dem Laden
> erneut ausgewählt werden.

Der Download kann nach diesem Hinweis fortgesetzt oder abgebrochen werden.

### Konfiguration hochladen

Eine zuvor exportierte JSON-Konfiguration kann lokal ausgewählt und geladen
werden.

- Die Datei wird vor der Übernahme gegen das erwartete Schema geprüft.
- Unbekannte, beschädigte oder nicht unterstützte Versionen werden abgelehnt.
- Die App zeigt eine verständliche Fehlermeldung und verändert den aktuellen
  Zustand bei einem Fehler nicht.
- Ein erfolgreicher Import ersetzt die Inhalte und Einstellungen des
  enthaltenen Moduls.
- Bilder sind nach dem Import leer und müssen erneut ausgewählt werden.
- Sind aktuell Bilder ausgewählt oder ungespeicherte Eingaben vorhanden, muss
  der Nutzer das Ersetzen des aktuellen Zustands bestätigen.

Konfigurationsdateien dürfen keine externen Ressourcen nachladen und ihr Inhalt
wird ausschließlich als Daten behandelt.

### Bildexport

Die aktuelle Vorschau kann als PNG oder JPG heruntergeladen werden.

- PNG verwendet einen undurchsichtigen Hintergrund.
- JPG verwendet einen weißen Hintergrund und eine festgelegte hohe Qualität.
- Der Export enthält nur das Mockup, nicht Editor, Navigation oder Footer.
- Dateiname, Ausgabegröße und Skalierungsfaktor sind für jedes Modul
  deterministisch.
- Lange Messenger-Verläufe werden vollständig exportiert und nicht an der
  sichtbaren Scrollposition abgeschnitten.
- Exportfehler werden sichtbar gemeldet und lösen keinen leeren Download aus.
- Beim Export entstehen keine ausgehenden Netzwerkverbindungen.

### Zurücksetzen

Zurücksetzen stellt die Beispieldaten des aktiven Moduls wieder her und entfernt
dessen Bilder. Eine Bestätigung wird nur verlangt, wenn der Zustand gegenüber
den Beispieldaten verändert wurde.

## 5. Layout und Bedienung

- Desktop: Editor mit 420 bis 480 px Breite links, flexible Vorschau rechts.
- Mobil: umschaltbare Ansichten für Editor und Vorschau statt einer langen,
  gestapelten Seite.
- Exportaktionen bleiben auf kleinen Bildschirmen gut erreichbar.
- Die Modulnavigation ist als tastaturbedienbare Tab-Leiste umgesetzt.
- Statische Inhaltsseiten für Hilfe, Projektinformationen, Impressum und
  Datenschutz sind über einen Footer erreichbar.
- Die Inhaltsseiten werden aus Markdown-Dateien unter `src/content/` gebaut.
- Cloudflare Workers liefert für SPA-Routen den Einstiegspunkt aus; ein
  `HashRouter` ist nicht erforderlich.

## 6. Barrierefreiheit

- Sichtbare Labels für alle Eingabefelder
- Vollständige Tastaturbedienung
- Sichtbare Fokuszustände
- Keine ausschließlich farbliche Bedeutungsvermittlung
- Keine ausschließlich ikonischen Hauptaktionen
- Ausreichende Kontraste nach WCAG 2.2 AA
- Klickflächen von mindestens 44 x 44 CSS-Pixeln für zentrale mobile Aktionen
- Semantische Status- und Fehlermeldungen, die von Screenreadern angekündigt
  werden
- Dekorative Bilder erhalten leere Alternativtexte; für Inhaltsbilder kann ein
  Alternativtext eingegeben werden

## 7. Datenmodell

```ts
type ModuleType = "photoPost" | "messenger" | "microblog";

type ConfigFile = {
  format: "social-media-creator-config";
  version: 3;
  module: ModuleType;
  data: PhotoPostConfig | MessengerConfig | MicroblogConfig;
};
```

Bildzustände gehören ausschließlich in den flüchtigen UI-State und nicht in
die serialisierbaren Konfigurationstypen.

## 8. Akzeptanzkriterien

### Datenschutz

- Die App funktioniert nach dem initialen Laden ohne Netzwerkzugriff.
- Eingaben, Bilder, Konfigurationen und Exporte verlassen das Gerät nicht.
- Es existieren keine Tracking-, Analyse- oder Upload-Endpunkte.

### Konfigurationsdateien

- Ein Export mit anschließendem Import stellt alle serialisierbaren Werte und
  die Nachrichtenreihenfolge wieder her.
- Bilddaten und lokale Bildreferenzen kommen in der JSON-Datei nicht vor.
- Export mit ausgewählten Bildern zeigt den definierten Hinweis.
- Fehlerhafte Dateien verändern den bestehenden Zustand nicht.
- Der Import von Text als HTML oder Script führt keine Inhalte aus.

### Bildexport

- Jedes Modul kann als PNG und JPG exportiert werden.
- Der Export entspricht der vollständigen Vorschau in der festgelegten Größe.
- Ein langer Chat wird vollständig ausgegeben.
- Während des Exports entstehen keine Netzwerkrequests.

### Responsive Bedienung

- Editor und Vorschau sind bei 320 CSS-Pixeln Breite bedienbar.
- Desktop-Split-View funktioniert ab dem definierten Breakpoint ohne
  horizontales Scrollen.
- Alle Kernabläufe funktionieren per Tastatur.

## 9. Umsetzung

### Phase 1: Fundament und Foto-Post

- Vite/React/TypeScript einrichten
- AppShell, Navigation, Editor- und Preview-Bereich umsetzen
- gemeinsames Formular- und State-Muster definieren
- Foto-Post vollständig umsetzen
- lokale Bildauswahl inklusive Validierung und Cleanup umsetzen
- PNG- und JPG-Export zuverlässig umsetzen
- Unit- und Browser-Tests für den vollständigen Ablauf ergänzen

### Phase 2: Konfigurationsdateien

- serialisierbare, versionierte Config-Typen definieren
- Schema-Validierung implementieren
- JSON-Download mit Bildhinweis implementieren
- sicheren JSON-Import mit Bestätigung und Fehlerzuständen implementieren
- Roundtrip-, Versions- und Negativtests ergänzen

### Phase 3: Weitere Module

- Messenger mit editierbarer und sortierbarer Nachrichtenliste umsetzen
- Export langer Chatverläufe testen
- Mikroblog umsetzen
- gemeinsame Komponenten nur bei tatsächlicher Wiederverwendung extrahieren

### Phase 4: Inhalte und Veröffentlichung

- Markdown-Seiten und Footer umsetzen
- Responsive Layout und Barrierefreiheit prüfen
- Tests in Chromium, Firefox und WebKit durchführen
- Netzwerkfreiheit der Kernabläufe prüfen
- Cloudflare-Workers-Konfiguration und SPA-Fallback ergänzen

## 10. Umfang Version 0.1

Enthalten:

- drei Mockup-Module
- Live-Vorschau
- lokaler Bild-Upload
- Download und Upload versionierter Konfigurationen ohne Bilder
- PNG- und JPG-Export
- responsives Layout
- Hilfe, Projektinformationen, Impressum und Datenschutz
- keine ausgehenden Verbindungen nach dem Laden der App

Nicht enthalten:

- Accounts
- Backend oder Datenbank
- automatische dauerhafte Speicherung
- mehrere gleichzeitig verwaltete Projekte
- Vorlagenbibliothek
- Plattformlogos oder pixelgenaue Plattformkopien
- Analyse oder Tracking

## 11. Sprint 7

- Light-, Dim- und Dark-Theme pro Modul
- Zwei explizite Messenger-Profile mit frei zuweisbaren Nachrichten,
  Zeitstempeln und Gesehen-Status
- Freie Beitragszeitstempel für Foto-Post und Mikroblog
- Zweistufige Kommentarstrukturen mit Profilbildern und Zeitstempeln
- Kommentaransicht für lange Diskussionen
- Foto-Karussells mit bis zu zehn Medien und sortierbarer Reihenfolge
- Video-Simulation über Thumbnail, Play-Overlay, Dauer und Aufrufzahl
- PNG- und JPG-Exporte mit lokal prüfbarem Herkunftsmarker
- PDF-Export im A4-Hochformat
- Lokale Verifikationsseite unter `/verifizieren`
- Config V3 mit Importmigration aus V1 und V2

## 12. Sprint 8

- Config V4 ergänzt `layoutMode: "feed" | "thread"` für Mikroblog-Projekte und
  migriert V1 bis V3 auf den Feed-Modus.
- Die in Sprint 8 eingeführte manuelle Beitragssortierung wurde in der
  nachfolgenden Timeline-Stufe durch chronologische Sortierung ersetzt.
- Neue Beiträge werden hinter dem aktiven Beitrag eingefügt.
- Mikroblog-Vorschauen unterstützen getrennte Feed-Einträge und verbundene
  Thread-Beiträge.
- Bildexporte übernehmen die vollständige Reihenfolge; PDF beginnt jeden
  Hauptbeitrag auf einer neuen Seite.

## 13. Timeline und kompakter Editor

- Config V5 ersetzt freie Beitragszeitstempel durch `date` und `time`.
- `date` ist ein gültiges ISO-Datum und verpflichtend; `time` ist optional.
- Foto- und Mikroblog-Projekte speichern `sortOrder: "newest" | "oldest"`.
- Editor, Vorschau und Export verwenden dieselbe stabile chronologische
  Sortierung. Manuelle Beitragssortierung entfällt.
- Config-Versionen 1 bis 4 werden nicht migriert oder importiert.
- Editorbereiche verwenden native Disclosure-Elemente. Beiträge, Profil und
  Inhalt sind standardmäßig geöffnet; Darstellung, Medien, Reaktionen und
  Kommentare werden bei Bedarf aufgeklappt.
