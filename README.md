# SocialMediaCreator

Browserbasierte Werkstatt zum Erstellen fiktiver digitaler
Kommunikationsformate. Alle Eingaben, Bilder, Konfigurationen und Bildexporte
werden lokal verarbeitet.

## Entwicklung

Vorausgesetzt werden Node.js 22 und npm 10.

```bash
npm install
npm run dev
```

## Prüfungen

```bash
npm test
npm run lint
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
npm run smoke:production
```

Alle lokalen Prüfungen können gebündelt ausgeführt werden:

```bash
npm run verify
```

## Stand

Der aktuelle Stand enthält:

- Foto-Post, Messenger-Chat und Mikroblog mit responsiver Live-Vorschau
- zwei Messenger-Profile mit frei zuweisbaren Nachrichten und Gesehen-Status
- freie Zeitstempel, Themes und zweistufige Kommentare
- Foto-Karussells und Video-Simulationen
- lokale Profil- und Beitragsbilder
- validierte Config-V3-Dateien ohne Bilder mit V1/V2-Migration
- PNG-, JPG- und PDF-Export
- lokale Herkunftsmarker und Bildverifikation
- Zurücksetzen mit Schutz vor Datenverlust
- semantische Modul-Tabs mit vollständiger Pfeiltastensteuerung
- Fokusführung und Fokus-Rückgabe im Lehrkräfte-Dialog
- Browser-E2E-Tests in Chromium, Firefox und WebKit
- automatisierte Prüfung der Netzwerkfreiheit nach dem initialen Laden
- Hilfe, Projektinformationen, Datenschutz und Impressum
- gehärtete Cloudflare-Workers-Auslieferung mit SPA-Fallback

Die Cloudflare-Einstellungen sind unter
[`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md) dokumentiert.

Alle wesentlichen Änderungen werden fortlaufend im
[`CHANGELOG.md`](CHANGELOG.md) dokumentiert.

Der validierte Software-Stack und die Ergebnisse des Stabilitätsaudits stehen
unter [`docs/STACK-AUDIT.md`](docs/STACK-AUDIT.md).
