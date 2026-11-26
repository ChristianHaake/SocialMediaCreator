# Redesign verification

Stand: 26. November 2026. Ausgangspunkt: `origin/stage` bei `6f7c93b`. Der Entwurfs-PR #57 lag 21 Commits zurück; seine Funktionen wurden auf den aktuellen Stage-Stand übertragen und mit dem PWA-Fix aus PR #60 verbunden. Diese Datei dokumentiert den Arbeitsbranch, keine Produktionsfreigabe.

## Umsetzung

- Die bestehende React/Vite-Anwendung nutzt eine gemeinsame App-Shell, direkte Bearbeitung, eine mobile Editor-/Vorschau-Umschaltung und interne Inhaltsseiten mit History-Navigation. Eingaben bleiben beim Seiten- und Sprachwechsel erhalten.
- Deutsch, Englisch, Französisch, Spanisch und Niederländisch haben vollständige Wörterbücher, Beispielprojekte, Inhaltsseiten und Exportbeschriftungen. Die veröffentlichten URLs, der Locale-Schlüssel, Config V5/V6 und `.smc` Version 1 bleiben erhalten; Config V6 akzeptiert die drei zusätzlichen Sprachwerte.
- Die Sitzungswiederherstellung schützt Eingaben, die vor dem Laden eines gespeicherten Projekts entstehen. Ein fehlgeschlagener lokaler Speichervorgang meldet den Fehler und bietet einen echten `.smc`-Download. Der PWA-Neustart wartet weiterhin auf das Speichern ausstehender Änderungen.
- Die Unterstützen-Seite zeigt die Kaffee-Aktion bei 320 × 720 CSS-Pixeln im sichtbaren Bereich. Rechtliche Seiten in den neuen Sprachen sind Übersetzungsentwürfe und benötigen Betreiberprüfung.

## Reproduzierbare Prüfung

Node 22 und npm 10 gemäß `package.json`:

```sh
npm ci
npm test
npm run lint -- --max-warnings=0
npm run build
npm run test:e2e -- --project=chromium --project=webkit
```

Bei dieser Prüfung war der konfigurierte Testport 4173 durch eine andere Anwendung belegt. Für lokale Browserläufe wurde nur in einer temporären Playwright-Konfiguration Port 51973 verwendet; die Repository-Konfiguration wurde nicht verändert.

- `npm test`: 131/131 bestanden.
- Lint und Produktions-Build: bestanden.
- Chromium: 45/45 Tests im abschließenden Gesamtlauf bestanden.
- WebKit: 42 bestanden, drei dokumentiert übersprungen. Die Übersprünge betreffen IndexedDB-Blob-Schreibverhalten und synthetische Offline-Navigation in der installierten Playwright-Laufzeit; daraus folgt kein Urteil über echtes Safari auf Geräten.
- Firefox: Der einzelne 320-Pixel-Kernablauf kam in dieser macOS-Umgebung nicht über den Browserstart hinaus und wurde abgebrochen. Kein App-Ergebnis.
- Automatisiert geprüft wurden 320, 390, 768 und 1440 CSS-Pixel, Tastatur/Fokus, ausgewählte Kontraste, reduzierte Bewegung, fünf Sprachwechsel, Editor/Preview, Inhaltsseiten, Import/Export, lokale Sicherung und PWA-Update-Zyklus. Browser-Viewporttests ersetzen keinen echten 200-%-Zoom.

## Offene Freigabeschritte

1. Nach dem letzten Commit CI und Stage-Smoke-Test prüfen; Firefox in einer funktionierenden Umgebung ausführen. Testumgebungsfehler getrennt protokollieren.
2. Die neue Version auf Stage bereitstellen. Eine bereits installierte alte Stage-PWA auf iPhone aktualisieren, ohne Browserdaten zu löschen; Projekt und Offline-Neuladen prüfen. Erst dann Issue #56 schließen.
3. Auf echtem Smartphone und Tablet Touchbedienung, Upload, `.smc`-Roundtrip mit Bild, PNG/JPG/PDF-Downloads und PWA-Offlineverhalten prüfen. Exportdateien visuell auf Inhalt, Skalierung und Beschnitt kontrollieren.
4. Den aktuellen Stand bei 200 % Browserzoom und mit Screenreader prüfen. Die früheren VoiceOver- und Zoom-Prüfungen vom 13. November beziehen sich nicht auf diesen Integrationsstand.
5. Betreiberprüfung der Rechtstexte, Übersetzungsentwürfe und bestehenden Cloudflare-Web-Analytics-Ausnahme einholen. Vor Produktion das vorherige Deployment-Artefakt sichern und die Rückkehr zu ihm mit unveränderten lokalen Daten prüfen.

Erst nach PR-Review, CI, Stage-Smoke-Test und diesen Geräte- und Betreiberprüfungen nach `main` übernehmen und Produktion freigeben.
