# Cloudflare-Bereitstellung

## Build-Konfiguration

- Build-Befehl: `npm run build`
- Bereitstellungsbefehl: `npm run deploy`
- Stammverzeichnis: `/` beziehungsweise leer
- Produktions-Branch: `main`
- Node.js: Version 22 (`.nvmrc`, auch von Cloudflare Builds gelesen)

Für **Previews Base** ist der Preview-Befehl im Cloudflare-Dashboard
`npx wrangler preview`. Das neue Worker-Preview-Modell benötigt Wrangler
mindestens 4.135.0. `wrangler deploy` aktiviert die Produktionsversion;
`wrangler versions upload` erstellt lediglich eine Version mit
Produktionsressourcen und ist kein isoliertes Branch-Preview. Die
Preview-Build-Einstellung wird im Dashboard verwaltet.

Die Einstellung **Previews Base** gilt nur für künftig angelegte Previews.
Bereits vorhandene Branch-Previews wie `stage` behalten ihren alten
Build-Befehl. Der Preview-Befehl wird in der jeweiligen Preview unter
**Settings → Builds → Build configuration** auf `npx wrangler preview`
gestellt. Ein Retry übernimmt sonst wieder den alten Befehl. Die bestehende
`stage`-Preview und die Preview des Korrektur-PR wurden am 25. November 2026
entsprechend aktualisiert und erfolgreich gebaut.

Die Datei `wrangler.jsonc` definiert Worker-Name, Compatibility Date,
Ausgabeordner und SPA-Fallback. Parameter im Bereitstellungsbefehl sind deshalb
nicht erforderlich.

Der HTTP-Smoke-Test sendet für Seitenaufrufe die Navigationsheader eines
Browsers. Cloudflare-Preview-URLs liefern den SPA-Fallback für Navigationen;
ein reiner API-Request ohne `Sec-Fetch-Mode: navigate` kann dort 404 liefern.

## Stage

`wrangler.stage.jsonc` definiert den separaten Worker
`socialmediacreator-stage` mit der Domain `stage.smc.haak3.de`. Nach einem
lokalen Build wird Stage mit `npm run deploy:stage` bereitgestellt. Die
Cloudflare-Builds des Produktions-Workers verwenden weiter `wrangler.jsonc`;
ein Push auf `stage` löst deshalb keinen Stage-Deploy aus.

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
