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

Der erste vollständige Foto-Post-Ablauf enthält:

- responsive Editor- und Vorschauansicht
- lokale Profil- und Beitragsbilder
- validierte JSON-Konfigurationen ohne Bilder
- PNG- und JPG-Export
- Zurücksetzen mit Schutz vor Datenverlust
- Hilfe, Projektinformationen, Datenschutz und Impressum
- gehärtete Cloudflare-Workers-Auslieferung mit SPA-Fallback

Messenger-Chat und Mikroblog folgen in späteren Umsetzungsphasen.

Die Cloudflare-Einstellungen sind unter
[`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md) dokumentiert.
