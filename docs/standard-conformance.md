# haak3 standard conformance

Standard version: **1.1.0-draft**. Review: 2026-11-13.
Source: [haak3 Web App Standard](https://github.com/ChristianHaake/DEV-Memory/tree/main/standards/haak3-webapps).

Status: UI migration candidate in the existing application. This is not a
deployment approval or a declaration of complete conformance. Evidence and
manual release gates: [UI overhaul](UI-OVERHAUL.md).

## Adopted contracts

- Semantic warm-neutral/action-orange tokens with separate brand orange.
  Existing preview themes, serialized theme IDs and original logos remain.
- Rectangular original app logo links to the workspace. The footer attributes
  haak3 and keeps required links visible down to 320 px.
- A labeled native Deutsch/English menu uses the existing locale key and
  preserves content. Blocked preference storage does not prevent switching.
- Support is a labeled orange coffee action opening an internal bilingual
  page; the provider link is plain, explicit and safely opens in a new tab.
- The GitHub icon uses the existing public SocialMediaCreator repository,
  confirmed during the family review on 2026-11-13. It has a localized
  app-specific name, keyboard/hover tooltip and 44-pixel target.
- Content routes, history and return navigation keep the actual editor state
  mounted and restore meaningful focus. Document titles follow the route.
- Photo and microblog editing put core content before profile details;
  project settings and optional sections remain disclosures. Desktop uses a
  split view; widths below 1024 px use explicit editing/preview switching.
- Existing .smc/Config V5/V6 validation, media/export rendering, safety labels,
  consent, IndexedDB schema/keys and PWA runtime are retained. Startup
  restoration now protects edits made while asynchronous snapshots load.

## Exceptions and outstanding gates

### Existing hosting analytics

- Rule: no external runtime/tracking services by default.
- Reason: production already uses Cloudflare Web Analytics and describes it in
  the existing privacy page; the UI migration does not introduce or expand it.
- Scope: existing beacon in index.html and production hosting behavior.
- Duration: existing production exception; operator must review its continued
  use and privacy description before release.
- Review: before deployment of this migration.

### Application appearance and stylesheet migration

- Rule: extended editing workflows SHOULD offer an appearance preference.
- Reason: the chrome currently remains light. The simulation's Light/Dim/Dark
  themes are preserved as content themes; they are not an application setting.
- Scope: application chrome. Existing global CSS is retained and mapped to
  semantic tokens; no wholesale component/CSS-framework rewrite is included.
- Duration: staged adoption, to be reviewed with the operator before release.
- Review: release review; do not claim preview themes satisfy this SHOULD.

### Manual and environment-dependent verification

- Actual Chrome 200% page zoom passed editing, error correction, project download
  and Support return on 2026-11-13. The user confirmed successful VoiceOver
  tests in both apps and explicitly deferred physical smartphone/tablet
  checks until after deployment. Individual screenreader scenarios were not
  separately recorded. Safari native-input permission was unavailable; Chrome
  provided the actual zoom check instead.
- Installed Firefox cannot launch headlessly in this environment; its engine
  is not reported as passing.
- Installed headless WebKit rejects IndexedDB Blob writes on the original and
  candidate builds. Its automatic recovery roundtrip is not reported as
  passing; the visible failure warning and real file backup are verified.
- Automated WebKit offline emulation fails service-worker navigations in the
  installed Playwright version. Chromium checks cached reload. Actual desktop
  Safari restored a synthetic caption from IndexedDB and reloaded/opened Support
  with the origin server unavailable. Physical-iPad offline, image/PDF, update
  and sharing paths remain manual release gates.
- Existing legal text requires operator review; new support/privacy wording
  is factual implementation documentation, not legal approval.

## Rollback

Source baseline: `2750519d8409df8b588b58bab7ee0b54afcddf8b`.
No storage schema, key or archive format is migrated. Retain the prior
deployment artifact before release and verify it reads a project saved by the
candidate. Reverting source locally is not a production rollback by itself.
Do not clear user storage as part of rollback or PWA update.
