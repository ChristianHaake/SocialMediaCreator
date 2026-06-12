# Bildungs-, Transparenz- und Export-Schutzkonzept

## Ziel

SocialMediaCreator ist eine schulische Simulationsumgebung. Bildungszweck,
verantwortungsvoller Einsatz und Grenzen müssen in Oberfläche, Dokumentation
und Exporten eindeutig erkennbar bleiben.

## Oberfläche und Inhalte

- Generatorseiten zeigen ohne Scrollen den Hinweis:
  „Diese Simulation dient ausschließlich dem Bildungszweck.“
- Der Hinweis verlinkt auf `/verantwortungsvoll`.
- Der Lehrkräfte-Kurzdialog verlinkt auf `/lehrkraefte`.
- `/lehrkraefte` bündelt Risiken, Rechte, fünf Unterrichtsszenarien und FAQ.
- `/verantwortungsvoll` enthält Empfehlungen, Reflexionsfragen und gute Praxis.
- `/nutzungsbedingungen` definiert Bildungszweck, Verantwortung und verbotene
  Nutzung.
- Über das Projekt, Datenschutz und Impressum sind vollständig aktualisiert.
- Alle Inhalte stehen auf Deutsch und Englisch bereit. Bei Rechtstexten ist die
  deutsche Fassung maßgeblich.

## Export-Schutz

- PNG, JPG und jede PDF-Seite tragen sichtbar:
  `SocialMediaCreator · Simulation`.
- Die Kennzeichnung ist nicht deaktivierbar.
- Vor jedem Bild- oder PDF-Export erscheint ein Hinweisdialog.
- Beim ersten Export ist eine aktive Zustimmung zu den Nutzungsbedingungen
  erforderlich.
- Zustimmung wird versioniert lokal gespeichert.
- Konfigurationsdownloads sind vom Exportdialog ausgenommen.
- Der unsichtbare PNG/JPG-Herkunftsmarker bleibt zusätzlich erhalten.

## Datenschutz und Rechtstexte

- Nutzinhalte bleiben lokal im Browser.
- Sprache und Exportzustimmung werden in `localStorage` gespeichert.
- Cloudflare Workers, DNS, Sicherheit, Performance und Web Analytics werden
  transparent beschrieben.
- Betreiber: Christian Haake, Alte Ziegelei 7, 26197 Großenkneten,
  `christianhaake@gmail.com`.
- Inhalte unterstützen einen rechtlich und didaktisch informierten Einsatz,
  ersetzen aber keine Rechtsberatung.

## Prüfung

- Disclaimer auf Desktop und bei 320 Pixeln sichtbar.
- Neue Routen und Dialoge vollständig zweisprachig und tastaturbedienbar.
- Erstexport ohne Zustimmung blockiert; spätere Exporte zeigen weiter den
  Hinweisdialog.
- PNG/JPG enthalten sichtbares Badge und gültigen Herkunftsmarker.
- Jede PDF-Seite enthält die Kennzeichnung.
- Unit-Tests, Lint, Build und E2E in Chromium, Firefox und WebKit bestehen.
