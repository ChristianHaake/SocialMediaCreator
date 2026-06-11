# Software-Stack-Audit

Stand: 11. Juni 2026

## Validierter Stack

- Node.js 22
- npm 10
- React 19
- TypeScript 5.7
- Vite 8
- Vitest 4
- Playwright 1.60
- ESLint 9
- Wrangler 4
- Cloudflare Workers Static Assets

## Durchgeführte Prüfungen

- reproduzierbare Installation mit `npm ci`
- Abhängigkeitsprüfung mit `npm audit`
- TypeScript- und Produktions-Build
- ESLint ohne erlaubte Warnungen
- Unit- und Komponententests
- E2E-Tests in Chromium, Firefox und WebKit
- Bild- und Konfigurationsexporte aller Module
- Konfigurationsimport mit Positiv- und Negativfällen
- Bildvalidierung mit beschädigten und gültigen Dateien
- Prüfung der Netzwerkfreiheit nach dem initialen Laden
- responsive Bedienung bei 320 CSS-Pixeln
- Produktions-Smoke-Test gegen den Cloudflare-Stage-Build

## Ergebnis

Der Audit meldet keine bekannten Paket-Schwachstellen. Alle automatisierten
Prüfungen bestehen.

Folgende Fehler wurden während des Audits behoben:

- Konfigurationsdateien konnten Werte enthalten, die von den Editorfeldern
  nicht korrekt dargestellt werden konnten.
- Ungültige Datums- und Zeitwerte wurden beim Import akzeptiert.
- Dateien mit gefälschtem Bild-MIME-Typ oder beschädigten Bilddaten konnten bis
  zur Vorschau gelangen.
- Die Projektseite beschrieb das Mikroblog-Modul noch als nicht umgesetzt.
- Playwright-Konfiguration und E2E-Tests wurden vom TypeScript-Build nicht
  geprüft.

## Bewusst nicht aktualisiert

Mehrere Werkzeuge bieten neue Major-Versionen an. Diese wurden nicht pauschal
aktualisiert, da Major-Upgrades eigene Migrations- und Regressionstests
benötigen. Der aktuell installierte Stack ist sicher und vollständig geprüft.
