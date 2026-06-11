# Mockup Studio

Browserbasierte Werkstatt zum Erstellen fiktiver digitaler
Kommunikationsformate. Alle Eingaben, Bilder, Konfigurationen und Bildexporte
werden lokal verarbeitet.

## Entwicklung

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

## Stand

Der aktuelle Stand enthält:

- Foto-Post, Messenger-Chat und Mikroblog mit responsiver Live-Vorschau
- bearbeitbare und sortierbare Messenger-Nachrichten
- Mikroblog-Beiträge mit optionalen Zeitangaben und weichem Zeichenzähler
- lokale Profil- und Beitragsbilder
- validierte JSON-Konfigurationen ohne Bilder
- PNG- und JPG-Export
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
