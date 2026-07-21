# Sprint-Planung — haak3-Standard-Konformität

Ziel dieses Plans: SocialMediaCreator (SMC) durchgängig an den
[haak3 Web App Standard](https://github.com/ChristianHaake/haak3-webapp-standard)
und die verfeinerte Referenz-App **StoryboardCreator** angleichen. Der Plan
schließt die zuvor in StoryboardCreator umgesetzten Verbesserungen („alte Tasks“,
P1–P13) als **Referenz-Baseline** ein und leitet daraus die offenen SMC-Sprints
ab.

Aktueller Ist-Zustand: [architecture.md](../../README.md) · Design:
[UI-Design-Entwurf.md](UI-Design-Entwurf.md).

## Ausgangsbefund (Analyse)

- **Design-Tokens:** Die SMC-Werte (`--accent #245dcc`, `#1949a4`, `#eaf0ff`,
  `--radius-md 12px`, `--radius-lg 20px`, `--shadow-soft`) sind **bereits der
  Standard**. SMC ist die Token-Referenz; StoryboardCreator wich leicht ab
  (`#2563eb`). → Palette ist konform.
- **Divergenz lag im Header-Chrome:** gerahmtes Wide-Banner-Logo statt Icon +
  Text-Wortmarke. → In Sprint 1 behoben.
- **Verbleibende Lücken:** kein globales App-Theme (Hell/Dim/Dunkel) und keine
  Schriftgrößen-Steuerung für die gesamte App (nur pro Vorschau-Modul);
  Token-*Namen* weichen vom Standard ab (`--accent` vs. `--primary`); einige
  Standard-Tokens fehlen (`--success`, `--warning`, `--focus`, `--radius-sm`).

## Entwicklungsvorgaben

- **Commits:** manuell, Conventional Commits (`feat:`, `fix:`, `style:`,
  `docs:`, `refactor:`).
- **Qualität:** `npm run lint` und `npm run test` müssen vor jedem Push grün
  sein; `npm run build` fehlerfrei.
- **Changelog:** `CHANGELOG.md` am Ende jedes Sprints pflegen.
- **Deployment:** manueller Push; Cloudflare-Build (Workers-Flow, SPA-Fallback
  über `wrangler.jsonc`).
- **Verifikation:** jede sichtbare Änderung im Browser (Desktop + Mobile),
  Rechtstexte/Barrierefreiheit nicht regressiv.

## Referenz-Baseline — „alte Tasks“ (StoryboardCreator, abgeschlossen)

Diese Verbesserungen härten die Referenz-App und definieren das Zielbild. Status
dort: **erledigt**. Spalte „SMC-Bezug“ zeigt, ob das Muster nach SMC portiert
wird.

| # | Task | SMC-Bezug |
| --- | --- | --- |
| P1.1 | Dokument-Kopf mit Projekt-Metadaten | n. z. (SMC nutzt Live-Vorschau) |
| P1.2 | Lehrkräfte-Seite von Schüler-Hilfe getrennt | vorhanden (Teacher-Dialog) |
| P1.3 | Theme + Schriftgröße in der Leiste | **portieren → Sprint 2** |
| P2.4 | Beispiele/Vorlagen für alle Formate | prüfen (Sprint 5) |
| P2.5 | Aktions-Buttons dauerhaft sichtbar (Desktop) | **prüfen → Sprint 4** |
| P2.6 | Presets unter Komplexität kennzeichnen | n. z. |
| P2.7 | Durchgängiger Schritt-Indikator | vorhanden („So funktioniert’s“) |
| P2.8 | Export-Guards bei leerem Zustand | **portieren → Sprint 4** |
| P3.9 | Klarere Benennung Kommentar-/Feedback-Modus | n. z. |
| P3.10 | Präsentation: Timing pro Slide | n. z. |
| P3.11 | Dark-Mode-Kontrast (Inhaltsseiten) | **abhängig von Sprint 2** |
| P3.12 | Doku Mehrsprachigkeit + Fallback | prüfen (Sprint 5) |
| P3.13 | Placeholder-Feinschliff | prüfen (Sprint 5) |

## Sprints

### Sprint 1 — Header-/Brand-Angleichung ✅ abgeschlossen

- **Ziel:** Header liest sich wie die Standard-Shell (Icon-Tile + Wortmarke +
  Tagline) statt gerahmtem Banner-Logo.
- **Aufgaben:**
  - `AppHeader`: Wide-Banner-PNG ersetzt durch `favicon.svg`-Icon (40 px,
    rounded) + Text-Wortmarke „SocialMediaCreator“ + `app.tagline`.
  - Icon dekorativ (`alt="" aria-hidden`), Name als Text (a11y).
  - CSS `.brand__logo` quadratisch (40/38/34 px responsiv), `.brand__text`
    ab < 480 px ausgeblendet.
- **DoD:** Desktop + Mobile verifiziert, keine Konsolenfehler, Lint grün.

### Sprint 2 — Globales App-Theme + Schriftgröße (Barrierefreiheit)

- **Ziel:** App-weites Erscheinungsbild (Hell/Dim/Dunkel) und drei
  Schriftgrößen, persistiert und flimmerfrei beim Boot — analog Standard
  (P1.3/P3.11).
- **Aufgaben:**
  - Theme- und Font-Scale-Modul (`data-theme`/`data-font` auf `<html>`,
    `localStorage`, Boot-Script gegen Flash) einführen.
  - Dim-/Dark-Neutralrampe und `prose`/Inhaltsseiten-Kontrast definieren.
  - Umschalter für Theme + Schriftgröße in der Fußzeile (Standard-Position),
    das bestehende **Vorschau-Modul-Theme** davon entkoppelt lassen.
  - Druckpfad bleibt hell (theme-unabhängig).
- **DoD:** alle drei Themes + drei Schriftgrößen ohne Layoutbruch, WCAG-Kontrast
  auf Inhaltsseiten, Persistenz über Reload.

### Sprint 3 — Token-Rekonziliation + Fußzeilen-/Shell-Parität

- **Ziel:** Token-Namen und -Umfang dem Standard angleichen, Fußzeile an
  Standard-Struktur annähern.
- **Aufgaben:**
  - Standard-Tokens ergänzen/aliasen: `--surface-subtle`, `--success(-soft)`,
    `--warning(-soft)`, `--focus`, `--radius-sm`; Namens-Aliase (`--primary` →
    `--accent` etc.) ohne Wertänderung.
  - Fokusring einheitlich über `--focus`.
  - Fußzeile: Legal-Navigation + Anzeige-Einstellungen (aus Sprint 2) +
    Sprache konsistent zur Referenz gruppieren; „Buy me a coffee“/GitHub
    beibehalten.
  - Optional: zweizeilige Shell-Struktur (Marke/Status oben, globale Aktionen
    unten) prüfen — nur wenn ohne Regress möglich.
- **DoD:** Tokens vollständig, Fokus sichtbar, Fußzeile konsistent, keine
  visuelle Regression.

### Sprint 4 — Leerzustände, Export-Guards, a11y-Feinschliff

- **Ziel:** Robuste Leer-/Randzustände und durchgehende Touch-Ziele (P2.8/P2.5).
- **Aufgaben:**
  - Export (PNG/JPG/PDF) bei leerem Modul deaktivieren/absichern mit Hinweis.
  - Editor-Aktionen (Verschieben/Löschen/Duplizieren) auf Desktop dauerhaft
    dezent sichtbar statt nur bei Hover.
  - Interaktive Ziele ≥ 40 px (bevorzugt 44 px) prüfen und angleichen.
- **DoD:** kein leerer Export möglich, Aktionen entdeckbar, Zielgrößen erfüllt.

### Sprint 5 — Tests, Doku, Release

- **Ziel:** Konformität absichern und dokumentieren.
- **Aufgaben:**
  - E2E/Smoke für Header, Theme-Umschaltung, Export-Guards.
  - Prüfen: Beispiel-/Vorlagen-Abdeckung je Modul (P2.4), Placeholder-Feinschliff
    (P3.13), Mehrsprachigkeit/Fallback (P3.12).
  - `docs/standard-conformance.md` anlegen (Konformität + dokumentierte
    Ausnahmen), `CHANGELOG.md` und README aktualisieren.
- **DoD:** Tests grün, Konformitätsdoku vorhanden, Release-Notiz geschrieben.

## Reihenfolge & Abhängigkeiten

Sprint 1 (fertig) → Sprint 2 (Theme/Font, Basis für P3.11-Kontrast) → Sprint 3
(Tokens/Fußzeile nutzt Sprint 2) → Sprint 4 (unabhängig, parallelisierbar) →
Sprint 5 (Abschluss).
