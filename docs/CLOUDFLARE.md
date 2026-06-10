# Cloudflare-Bereitstellung

## Build-Konfiguration

- Build-Befehl: `npm run build`
- Bereitstellungsbefehl: `npm run deploy`
- Stammverzeichnis: `/` beziehungsweise leer
- Produktions-Branch: `main`
- Node.js: Version 22

Die Datei `wrangler.jsonc` definiert Worker-Name, Compatibility Date,
Ausgabeordner und SPA-Fallback. Parameter im Bereitstellungsbefehl sind deshalb
nicht erforderlich.

## Bot-Schutz

Die Anwendung verspricht, dass Nutzinhalte lokal verarbeitet werden. Die
Headerdatei setzt für HTML `Cache-Control: no-transform`. Cloudflare
JavaScript Detections darf dadurch kein Challenge-Script in die Seite
injizieren.

Zusätzlich sollte im Cloudflare-Dashboard geprüft werden:

1. Domain `haak3.de` auswählen.
2. **Security > Settings** öffnen.
3. Nach **Bot traffic** filtern.
4. **Bot Fight Mode** deaktivieren, sofern aktiviert.

Cloudflare kann unabhängig davon bei konkret auffälligem Traffic
Sicherheitsmaßnahmen anwenden. Die Datenschutzerklärung weist auf technisch
notwendige Verbindungsdaten beim Hosting hin.

## Prüfung nach einer Bereitstellung

```bash
npm run smoke:production
```

Für eine andere URL:

```bash
npm run smoke:production -- https://example.workers.dev
```

Der Test prüft:

- Startseite und Inhaltsrouten
- SPA-Fallback
- Security-Header
- Unterbindung der JavaScript-Detection-Injektion
- Favicon
- langfristiges Caching gehashter Assets
