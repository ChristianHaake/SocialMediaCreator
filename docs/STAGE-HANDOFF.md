# Übergabe: SocialMediaCreator auf Stage fertigstellen

Diese Übergabe beschreibt den Stand vor dem Redesign. Den aktuellen Integrationsstand und die verbleibenden Freigabeschritte hält [Redesign verification](UI-OVERHAUL.md) fest.

Stand: 26. November 2026. Ausgangspunkt ist `origin/stage` (bei Erstellung dieses Dokuments `4bf572c`), nicht ein älterer lokaler Checkout. Diese Übergabe hält bekannte Befunde fest; sie ist kein Nachweis einer aktuellen Produktionsabnahme.

## Ziel und Grenzen

Die überarbeitete Unterstützen-Seite und die zugehörige App-Shell auf Stage abschließen, die PWA-Aktualisierung zuverlässig machen und danach eine Freigabe für Produktion anhand der untenstehenden Kriterien treffen. Projektformat, lokale Daten, Exporte und Offline-Funktion dürfen dabei nicht beschädigt werden. Die Anwendung ist eine Simulation und verbindet sich nicht mit sozialen Netzwerken.

- Stage-Vorschau: https://stage-socialmediacreator.notionsworker.workers.dev/unterstuetzung
- Produktion: https://smc.haak3.de
- Die Support-Änderung wurde über [PR #54](https://github.com/ChristianHaake/SocialMediaCreator/pull/54) und die Klarstellung des kostenlosen Zugangs über [PR #55](https://github.com/ChristianHaake/SocialMediaCreator/pull/55) nach `stage` übernommen. Eine Produktionsfreigabe dieser Änderungen ist hier nicht dokumentiert.
- Deployment und Preview-Konfiguration: [Cloudflare-Bereitstellung](CLOUDFLARE.md). Ein Push auf `stage` ist laut dieser Dokumentation allein kein Stage-Deploy.

## Gesicherte und noch nicht gesicherte Prüfung

Die folgenden Ergebnisse stammen aus der vorangegangenen Prüfung der Support-Änderungen. Für den nächsten Release ist der dann aktuelle Commit erneut zu prüfen.

| Bereich | Bisheriger Befund | Grenze |
| --- | --- | --- |
| Unit-Tests, Lint, Build | 110 Unit-Tests sowie Lint und Build bestanden vor der letzten Support-Klarstellung. | Kein vollständiger aktueller Lauf für den künftigen Release-Commit belegt. |
| E2E | 32/32 Chromium und 32/32 WebKit bestanden im vorherigen Gesamtlauf. Gezielte Support-Seiten-Tests bestanden danach in beiden Engines. | Firefox startete in der Testumgebung wegen eines macOS-Sandbox-Fehlers nicht zuverlässig; daraus folgt kein Firefox-App-Ergebnis. |
| Schmale Ansicht | Für die Support-Seite waren bei 320 CSS-Pixeln die Hauptaktion sichtbar und kein horizontaler Seitenüberlauf erkennbar. | Echte Touchbedienung des aktuellen Stands ist noch offen. |
| Stage | Build und HTTP-Smoke-Test bestanden für den veröffentlichten Stage-Stand. | Ein HTTP-Test entdeckt kein Problem mit einem bereits installierten Service Worker. |
| Bedienungshilfen | VoiceOver wurde vom Betreiber zuvor in beiden Pilot-Apps geprüft. | Diese Rückmeldung belegt nicht die vollständige Abnahme des aktuellen SMC-Commits. |

## Offenes Problem zuerst

[Issue #56: Stage-PWA zeigt nach Deploy weiter alte Unterstützen-Seite](https://github.com/ChristianHaake/SocialMediaCreator/issues/56) ist offen. Ein Browser mit bereits registrierter Stage-PWA zeigte nach dem Deploy und normalem Neuladen noch den alten Inhalt; beim Umgehen des Service Workers erschien sofort die neue Seite. Reproduktion und Abnahme stehen im Issue. Die Ursache darf nicht durch pauschales Löschen lokaler Projektdaten umgangen werden. Nach der Korrektur den Aktualisierungshinweis auch auf Inhaltsseiten prüfen.

## Abnahme vor Produktionsfreigabe

1. Mit einem Browser, der bereits die alte Stage-PWA registriert hat, einen neuen Stage-Deploy durchspielen. Die neue Inhaltsseite muss ohne manuelles Löschen der Browserdaten spätestens nach dem vorgesehenen, erkennbaren Aktualisierungsschritt erscheinen. Direkter Aufruf und Offline-Nutzung bleiben funktionsfähig.
2. Den aktuellen Stage-Commit auf einem iPhone prüfen: Start, Editor/Vorschau-Wechsel, Unterstützen-Seite, externe Kaffee-Verlinkung und Rückweg. Auf horizontalen Überlauf, verdeckte Aktionen und Touchbedienung achten. Frühere iPhone-Beobachtungen beziehen sich nicht automatisch auf diesen Stand.
3. Bei 200 % Browserzoom und 320 CSS-Pixeln Hauptaktionen, Fokus, Navigation und Inhaltsseiten prüfen. VoiceOver für den aktuellen Stand bei Bedarf wiederholen.
4. Regression der Kernfunktionen: Bild hinzufügen, neu laden, `.smc` exportieren/importieren und Bild erhalten; PNG/JPG/PDF exportieren; bestehende Projektdateien öffnen; Offline-Verhalten testen. Die Exportfunktionen und das Archivformat sind in [README](../README.md) und [Projektarchiv](PROJECT-ARCHIVE.md) beschrieben.
5. Auf dem finalen Commit `npm ci`, `npm test`, `npm run lint -- --max-warnings=0`, `npm run build` und `npm run test:e2e` ausführen. Einen Umgebungsfehler von einem App-Fehler trennen und verbleibende Einschränkungen protokollieren.
6. Stage über die dokumentierten Deploy-/Smoke-Schritte prüfen und erst danach den Merge nach `main` sowie die Produktionsbereitstellung freigeben. Für die Ziel-URL `npm run smoke:production -- <URL>` verwenden.

## Einstieg für den nächsten Agenten

Zuerst den aktuellen Remote-Stand holen und `stage` mit `origin/stage` vergleichen. Der zuvor benutzte lokale Checkout lag 19 Commits hinter `origin/stage`; dort nicht blind weiterarbeiten. Danach Issue #56 reproduzieren, Ursache und Abnahme mit einem vorhandenen Service Worker prüfen, die Regression laufen lassen und die verbleibenden Gerätebefunde dokumentieren. Bei technischen Änderungen gezielte Tests ergänzen. Änderungen für Produktion erst nach bestandener Abnahme übernehmen.
