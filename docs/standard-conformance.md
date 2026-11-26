# haak3-Standard: Redesign-Abgleich

Stand: 26. November 2026. Referenz: [haak3-Webapp-Standard](https://github.com/ChristianHaake/haak3-webapp-standard). Automatisierte Nachweise und Freigabegrenzen stehen in [Redesign verification](UI-OVERHAUL.md). Vollständige Konformität und Produktionsfreigabe sind noch nicht festgestellt.

## Umgesetzt

- Gemeinsame App-Shell mit Logo, Aufgabenbereich, Hilfe, Kontakt, Unterstützung und sichtbaren Rechtslinks; öffentlicher GitHub-Link ohne eingebettete Drittanbieter-Skripte.
- Direkter Editor mit Live-Vorschau auf Desktop und explizitem Editor-/Vorschau-Wechsel auf schmalen Bildschirmen. Bestehende Simulationsthemen bleiben erhalten.
- Interne Inhaltsseiten mit direktem URL-Aufruf, Rückweg, Seitentitel und Fokusführung. Kritische Aktionen und Status sind zugänglich beschriftet; zentrale Touchziele sind mindestens 44 CSS-Pixel hoch.
- Fünf Sprachen mit Eigennamen im Sprachmenü. Dokumentensprache, Inhaltsseiten, Beispielprojekte, Fehler und Exportbeschriftungen folgen der Auswahl, ohne Eingaben zu löschen.
- Bestehendes Projektformat, Persistenzschlüssel und Exportverhalten bleiben erhalten. Die neue Oberfläche nutzt keine zusätzliche UI-Bibliothek und keinen Frameworkwechsel.

## Ausnahmen und Freigabegrenzen

- Cloudflare Web Analytics ist bereits Teil des Hostings und der Datenschutzhinweise. Die Betreiberprüfung dieser bestehenden Ausnahme steht vor Produktion aus.
- Die Anwendungschrome bietet noch keine eigene Hell-/Dunkel-Präferenz. Die Light-/Dim-/Dark-Modi gelten nur für Simulationen. Dies bleibt eine dokumentierte Abweichung vom empfohlenen Erscheinungsbild-Schalter.
- Die neuen rechtlichen Sprachfassungen sind Entwürfe. Betreiberprüfung ist erforderlich.
- Echte iPhone-/iPad-Bedienung, installierte PWA-Aktualisierung, Safari-Offlineverhalten, 200-%-Zoom, Screenreader sowie Firefox in funktionierender Umgebung sind für diesen Integrationsstand offen.

Ein Rollback darf weder Browserdaten löschen noch das Lesen vorhandener `.smc`-Archive verlieren. Das vorherige Produktionsartefakt und die Rückwärtsprüfung sind vor der Freigabe festzuhalten.
