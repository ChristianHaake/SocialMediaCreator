# UI overhaul verification

Date: 2026-11-13. Scope: real SocialMediaCreator, all three simulation modules.
The isolated workshop supplies direction; its example data and JSON exports
are not copied into this application.

## Baseline

Clean source commit: `2750519d8409df8b588b58bab7ee0b54afcddf8b`.
Before UI edits: 110 unit/component tests, lint and build passed. The existing
29 Chromium E2E tests passed against the preserved baseline build under Node 22.
They exercise actual archives, restored media pixels, PNG/JPG/PDF, consent,
marker verification, invalid imports and the 320-pixel workflow.

## Implementation

The migration uses the existing React/Vite runtime, dictionaries, disclosures,
preview components, codecs and dependencies. It introduces no UI library,
shared package, accounts or data migration.

Header identity uses the unchanged rectangular logo. Footer attribution,
support prominence, public GitHub icon, complete language names and required
mobile links follow the family shell. Internal content routes use History API
navigation and keep editor state mounted, including when entered from dialogs.
External and modified-click links retain native navigation.

Main content is edited directly. Photo/microblog content fields precede profile
settings. Rare project options remain collapsed; tablet portrait and smaller
screens provide one editor/preview view at a time. Export rendering and media
themes continue to use the existing components.

The startup autosave guard was corrected when new browser tests exposed the
existing asynchronous restore hazard: early edits must be queued after
hydration and must not be replaced by delayed stored data. Dedicated hook
tests cover delayed loading/decoding, unchanged restoration, mixed modules,
language changes, tab choice, cancellation and unmount cleanup. Formats and
storage identifiers remain unchanged.

## Automated checks

Run with the repository's declared Node 22 runtime:

```sh
npm test
npm run lint
npm run build
npm run test:e2e -- --project=chromium --project=webkit
```

Final: **124 unit/component tests passed**, lint and build/typecheck passed.
**76 browser tests passed** (39 Chromium, 37 WebKit); two WebKit checks are
explicitly skipped for the runtime limits below. The existing
suite remains; `tests/e2e/ui-family.spec.ts` extends it with 320/390/768/1440
workflows, actual computed contrast for sampled controls, keyboard focus,
language/storage failure, route/history/dialog navigation, session restore
and Chromium cached offline reload. Screenshots are test output, not
production assets.

Actual browser-storage failure also has a tested recovery path: the visible
warning offers a real .smc download whose archive/schema/content are checked.
Failed deletion leaves the current work intact and reports failure. The
expanded emoji chooser stays inline so moving content earlier cannot clip it
behind another panel; Escape returns focus to its trigger.

WebKit full-keyboard link navigation uses Option+Tab, matching Safari's default
keyboard behavior. A viewport reduction is not recorded as actual 200% zoom.
Cloudflare's existing analytics script is replaced with an empty JavaScript
response in the new local UI tests, isolating storage/UI behavior from the
unrelated analytics network.

## Required manual release checks

User acceptance on 2026-11-13: VoiceOver was tested successfully in both
SocialMediaCreator and StoryboardCreator. This is user-performed evidence,
not an automated or exhaustive WCAG audit. The earlier automated launch
failure does not contradict it. The user explicitly deferred physical
smartphone/tablet checks until a deployed preview is available.

Additional check in actual desktop Safari on 2026-11-13: a synthetic caption
was saved into the existing IndexedDB snapshot and restored after reload,
with the preview matching and no storage warning. With the local app server
stopped (a separate HTTP client confirmed connection failure), Safari also
reloaded the cached app and opened Support, retaining the caption.
This is an origin-unavailability test on desktop Safari, not airplane mode or
a managed-iPad test. It does not cover physical-iPad image-blob roundtrips.

- [x] Actual Chrome 200% page zoom: caption edit, invalid-date feedback and correction,
  real .smc download, Support navigation and preserved return to the editor.
  Native browser toolbar/menu confirmed 200%; this was not a viewport proxy.
- [ ] Deferred by user until after deployment: real iPad/iPhone touch, edit,
  upload, import/export and share downloads.
- [x] User-performed VoiceOver test in this app confirmed on 2026-11-13.
  Individual scenarios/device versions were not separately recorded.
- [ ] Physical iPad/iPhone offline/PWA reload, image recovery and update without clearing projects.
- [ ] Operator review of legal/privacy/support content and analytics exception.
- [ ] Identify the previous production artifact and rehearse compatible rollback.

Installed headless WebKit rejects IndexedDB Blob writes with
`UnknownError: Error preparing Blob/File data to be stored in object store`;
this was reproduced on the untouched baseline as well. Its automatic session
roundtrip is explicitly skipped, not reported as passing. The storage-failure
and manual project-backup path passes in both engines. Physical-iPad image recovery
must still be checked before release; the stored representation is not changed to
work around a test-runtime failure.

Automated WebKit offline emulation also errors before loading the app's
cached navigation, so that check is explicitly skipped. See the
[upstream reproduction](https://github.com/microsoft/playwright/issues/42775).
This emulation failure alone does not prove Safari offline works or fails. Firefox launch times out
with a macOS sandbox/graphics error before app tests can run.

Full family conformance remains unclaimed until these gates and the
[documented exceptions](standard-conformance.md) are reviewed.
