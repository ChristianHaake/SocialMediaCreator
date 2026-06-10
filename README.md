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
npm run smoke:production
```

## Stand

Der aktuelle Stand enthält:

- Foto-Post und Messenger-Chat mit responsiver Live-Vorschau
- bearbeitbare und sortierbare Messenger-Nachrichten
- lokale Profil- und Beitragsbilder
- validierte JSON-Konfigurationen ohne Bilder
- PNG- und JPG-Export
- Zurücksetzen mit Schutz vor Datenverlust
- Hilfe, Projektinformationen, Datenschutz und Impressum
- gehärtete Cloudflare-Workers-Auslieferung mit SPA-Fallback

Das Mikroblog-Modul folgt in einer späteren Umsetzungsphase.

Die Cloudflare-Einstellungen sind unter
[`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md) dokumentiert.

Alle wesentlichen Änderungen werden fortlaufend im
[`CHANGELOG.md`](CHANGELOG.md) dokumentiert.
