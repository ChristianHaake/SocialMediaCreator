# UI/UX-Plan

## 1. Produktpositionierung

Die Anwendung ist eine Mockup-Werkstatt für fiktive digitale
Kommunikationsformate, kein Kopierwerkzeug für bestehende soziale Netzwerke.

Produktname: **SocialMediaCreator**

Untertitel:

> Erstelle fiktive Foto-Posts, Messenger-Dialoge und Mikroblog-Beiträge direkt
> im Browser. Keine Anmeldung. Kein Upload.

Die App soll wie ein eigenständiges Lern- und Kreativwerkzeug wirken. Die
Mockups greifen vertraute Kommunikationsmuster auf, verwenden aber keine
Plattformnamen, Logos, proprietären Icons oder pixelgenauen Plattformdesigns.

## 2. Informationsarchitektur

```text
Header
  App-Titel
  Datenschutzhinweis
  Informationen für Lehrkräfte

Modulnavigation
  Foto-Post
  Messenger-Chat
  Mikroblog

Arbeitsbereich
  Editor
  Live-Vorschau

Aktionsleiste
  Zurücksetzen
  Konfiguration laden
  Konfiguration speichern
  PNG speichern
  JPG speichern
  PDF speichern

Footer
  Hilfe
  Über das Projekt
  Impressum
  Datenschutz
  GitHub
```

Exportaktionen werden nach Zweck gruppiert:

- **Projekt:** Konfiguration laden, Konfiguration speichern
- **Bild:** PNG speichern, JPG speichern

Dadurch wird klar, dass die JSON-Konfiguration der späteren Bearbeitung dient,
während PNG und JPG fertige Ergebnisse sind.

## 3. Hauptlayout

### Desktop

- Editor links, 420 bis 480 px breit
- flexible, zentrierte Vorschau rechts
- Vorschau bleibt beim Scrollen des Editors sichtbar
- Aktionen stehen in der Nähe des Editors und nicht doppelt in Header und
  Formular

### Mobil

Eine Tab- oder Segmentsteuerung schaltet zwischen **Bearbeiten** und
**Vorschau** um. Die vollständige Vorschau wird nicht erst unter einem langen
Formular angezeigt.

Die Bildexport-Aktion bleibt gut erreichbar. Weitere Aktionen können in einer
klar beschrifteten Aktionsleiste stehen; sie werden nicht hinter einem
unbeschrifteten Menü versteckt.

## 4. Modulnavigation

Die drei Module erscheinen als tastaturbedienbare Tabs:

- **Foto-Post:** Bildbeitrag mit Profil, Beschreibung und Reaktionen
- **Messenger-Chat:** Fiktiver Dialog mit gesendeten und empfangenen Nachrichten
- **Mikroblog:** Kurzer Textbeitrag mit Handle und Reaktionen

Beim Modulwechsel bleibt der flüchtige Zustand jedes Moduls während der
aktuellen Sitzung erhalten.

## 5. Editorstruktur

### Foto-Post

1. Profil: Profilbild, Benutzername, Ort
2. Beitrag: Beitragsbild, Beschreibung, Alternativtext
3. Reaktionen: Likes, Kommentare
4. Anzeigeoptionen: Ort und Kommentarzeile

### Messenger-Chat

1. Kontakt: Profilbild, Kontaktname, Status
2. Neue Nachricht: Text, Typ und Uhrzeit
3. Nachrichtenliste: bearbeiten, Typ ändern, umsortieren und löschen

Die Nachrichtenliste muss ohne Drag-and-drop bedienbar sein. Schaltflächen zum
Verschieben nach oben und unten sind erforderlich; Drag-and-drop kann ergänzend
angeboten werden.

Über dem Editor steht:

> Verwende fiktive Namen und keine echten privaten Chats.

### Mikroblog

1. Profil: Profilbild, Anzeigename, Handle
2. Beitrag: Text, optional Datum und Uhrzeit
3. Reaktionen: Antworten, Reposts, Likes

Ein Zeichenzähler informiert, blockiert die Eingabe in Version 0.1 aber nicht.

## 6. Projektkonfiguration

### Konfiguration speichern

Die Aktion **Konfiguration speichern** lädt eine JSON-Datei herunter.

Wenn Bilder ausgewählt sind, erscheint ein Dialog:

**Konfiguration ohne Bilder speichern?**

> Bilder sind nicht Teil der Konfigurationsdatei und müssen nach dem Laden
> erneut ausgewählt werden.

Aktionen:

- Abbrechen
- Trotzdem speichern

Ohne ausgewählte Bilder beginnt der Download direkt.

### Konfiguration laden

Die Aktion **Konfiguration laden** öffnet den lokalen Dateidialog für
JSON-Dateien. Vor dem Ersetzen eines veränderten Zustands erscheint:

**Aktuelle Eingaben ersetzen?**

> Beim Laden werden die aktuellen Eingaben ersetzt. Ausgewählte Bilder werden
> entfernt, da Konfigurationsdateien keine Bilder enthalten.

Aktionen:

- Abbrechen
- Konfiguration laden

Die Bestätigung erscheint erst nach erfolgreicher Validierung. Eine ungültige
Datei darf den aktuellen Zustand nicht verändern.

Nach erfolgreichem Laden erscheint eine kurze Statusmeldung:

> Konfiguration geladen. Bilder müssen erneut ausgewählt werden.

Fehlermeldungen benennen das Problem, beispielsweise ungültiges Dateiformat
oder nicht unterstützte Version.

## 7. Bildexport

PNG und JPG sind eigenständige, sichtbar beschriftete Aktionen. Ein
Format-Dropdown ist auf Mobilgeräten zulässig, wenn sein aktueller Wert und die
Download-Aktion eindeutig bleiben.

Vor dem Download ist keine Bestätigung erforderlich. Während der Generierung
zeigt die Schaltfläche einen Beschäftigungszustand und verhindert doppelte
Exporte.

Erfolg benötigt keine modale Meldung. Fehler werden direkt bei der
Aktionsleiste angezeigt und von Screenreadern angekündigt.

Nur die Mockup-Fläche wird exportiert. Editor, Platzhalterhinweise,
Fokusmarkierungen und Bedienelemente innerhalb der Arbeitsoberfläche gehören
nicht ins Bild.

## 8. Beispieldaten und Leerzustände

Jedes Modul startet mit harmlosen, klar als Beispiel erkennbaren Inhalten. Eine
vollständig leere Vorschau erschwert das Verständnis.

Bildplatzhalter:

- Profilbild: Initialen auf neutralem Hintergrund
- Inhaltsbild: neutrale Bildfläche mit generischem Bildsymbol

Beispieldaten dürfen keine realen Personen, Handles oder Organisationen
imitieren.

## 9. Informationen für Lehrkräfte

Ein beschrifteter Button **Für Lehrkräfte** öffnet ein Dialogfenster mit:

- Alle Daten bleiben lokal im Browser.
- Bilder werden nicht hochgeladen.
- Es gibt keine Anmeldung, Datenbank oder Analyse.
- Das Werkzeug eignet sich für fiktive Beiträge, Rollenarbeit, Medienanalyse
  und Quellenkritik.
- Es sollen keine echten personenbezogenen Daten verwendet werden.

Ein eigenes Lehrkräfte-Dashboard ist nicht vorgesehen.

## 10. Visuelles System

```css
:root {
  --app-bg: #f6f7f9;
  --panel-bg: #ffffff;
  --text-main: #111827;
  --text-muted: #5b6472;
  --border-soft: #dfe3e8;
  --accent: #245dcc;
  --accent-soft: #e7efff;
  --danger: #b42318;
  --radius-lg: 18px;
  --radius-md: 12px;
  --shadow-soft: 0 12px 30px rgb(15 23 42 / 8%);
}
```

Schrift:

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
  sans-serif;
```

Die drei Mockup-Module erhalten unterscheidbare, eigene Farbvarianten. Farben
bekannter Plattformen werden nicht exakt übernommen.

## 11. Rückmeldungen und Schutz vor Datenverlust

- Zurücksetzen verlangt nur bei tatsächlichen Änderungen eine Bestätigung.
- Modulwechsel verlangt keine Bestätigung, da Zustände sitzungsintern erhalten
  bleiben.
- Ein gültiger Konfigurationsimport verlangt bei bestehenden Änderungen eine
  Bestätigung.
- Ein ungültiger Import verändert nichts.
- Warnungen erklären konkrete Folgen und vermeiden allgemeine Alarmtexte.
- Erfolgsmeldungen sind kurz und nicht modal.

## 12. Barrierefreiheit

- sichtbare Labels und Hilfetexte
- semantische Tabs mit korrekter Tastatursteuerung
- sichtbare Fokuszustände
- Statusmeldungen über geeignete Live Regions
- ausreichende Farbkontraste
- keine Bedeutung ausschließlich über Farbe oder Icons
- große Klickflächen auf Touch-Geräten
- Dialoge halten Fokus und geben ihn nach dem Schließen sinnvoll zurück
- Upload-Felder funktionieren per Tastatur und zeigen Dateiname sowie Fehler
- Bewegungen respektieren `prefers-reduced-motion`

## 13. Inhaltsseiten

Footerlinks führen zu gemeinsamen Markdown-Seiten für Hilfe, Über das Projekt,
Impressum und Datenschutz. Jede Seite enthält:

- Seitentitel
- gut sichtbaren Link zurück zur App
- lesbare Inhaltsbreite
- denselben Footer

Die Seiten werden über normale SPA-Routen ausgeliefert. Cloudflare Workers erhält
eine passende Fallback-Regel für direkte Aufrufe.

## 14. Version 0.1

Enthalten:

- Desktop-Split-View und mobile Editor/Vorschau-Umschaltung
- drei vollständige Module
- lokale Bildauswahl
- Konfiguration laden und speichern, ausdrücklich ohne Bilder
- PNG- und JPG-Export
- Zurücksetzen mit bedingter Bestätigung
- Lehrkräfte-Information
- Footer und statische Inhaltsseiten

Nicht enthalten:

- Accounts oder Cloud-Speicherung
- mehrere gleichzeitig geöffnete Projekte
- Vorlagenbibliothek
- automatische Wiederherstellung nach Neuladen
- Originaldesigns oder Logos bestehender Plattformen

## 15. Sprint-7-Erweiterungen

- Jedes Modul erhält eine klar beschriftete Auswahl für Light, Dim und Dark.
- Foto-Post und Mikroblog bieten einen Darstellungsmodus für den vollständigen
  Beitrag oder eine fokussierte Kommentarspalte.
- Kommentare zeigen Profilbild, Autor, Zeitstempel und maximal eine
  eingerückte Antwortebene.
- Foto-Karussells verwenden eine auswählbare Medienliste, Punkte und
  Bildzähler. Der Bildexport zeigt alle Slides als Kontaktbogen.
- Video-Simulationen verwenden ein Bild-Thumbnail mit Play-Overlay,
  Videolänge und Aufrufzahl.
- Messenger-Profile werden als feste linke und rechte Seite bearbeitet.
- Die Verifikationsseite erklärt deutlich, dass der lokale Herkunftsmarker
  kein fälschungssicherer Echtheitsbeweis ist.

## 16. Timeline-Erweiterungen

- Die Beitragsauswahl zeigt die automatisch berechnete Position und den
  formatierten Veröffentlichungszeitpunkt.
- Die Timeline-Reihenfolge wird global als „Neueste zuerst“ oder „Älteste
  zuerst“ gewählt. Manuelle Sortiergriffe entfallen.
- Datum und optionale Uhrzeit werden mit nativen Eingabefeldern erfasst.
- Foto-Feeds verwenden klar getrennte Karten und Trennflächen.
- Mikroblog bietet einen Feed-Modus mit Trennlinien und einen kompakten
  Thread-Modus mit vertikaler Verbindungslinie zwischen den Hauptbeiträgen.
- Selten benötigte Editorbereiche sind einklappbar; zentrale Beitragsfelder
  bleiben standardmäßig sichtbar.

## 17. Sprachumschaltung

- Im Header steht ein kompakter Umschalter für Deutsch und Englisch.
- Die aktive Sprache ist visuell und über `aria-pressed` erkennbar.
- Auf kleinen Bildschirmen bleibt der Umschalter sichtbar; die Wortmarke wird
  zugunsten der Bedienbarkeit reduziert.
- Sprachwechsel verändern nur Systemtexte, nicht die eingegebenen Inhalte.
