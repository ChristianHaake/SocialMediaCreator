# SocialMediaCreator

SocialMediaCreator is a browser-based educational workshop for creating
fictional social-media posts, conversations, and timelines. It is designed for
media literacy lessons, source criticism, communication analysis, and classroom
discussion about manipulated digital content.

[Open the live application](https://smc.haak3.de)

> SocialMediaCreator is a simulation for educational use. It does not reproduce
> or connect to a real social-media platform.

## Product overview

![SocialMediaCreator desktop workspace](docs/assets/social-media-creator-desktop.png)

![SocialMediaCreator mobile editor](docs/assets/social-media-creator-mobile.png)

SocialMediaCreator ships three editable simulation modules:

| Module | Release features |
| --- | --- |
| **Photo Post** | Chronological feeds with multiple posts, profile images, captions, reactions, comment threads, replies, image carousels, simulated video thumbnails, alt text, and comment-focused views. |
| **Messenger Chat** | Two-sided fictional conversations with editable profiles, profile images, free timestamps, online states, seen indicators, message assignment, and keyboard-friendly message ordering. |
| **Microblog** | Independent feeds or connected threads with display names, handles, timestamps, reactions, reposts, likes, comment threads, replies, and long-text indicators. |

Release-level capabilities:

- **Local-first workflow:** no account, no upload endpoint, no server-side
  content storage.
- **German and English UI:** localized editor, previews, dialogs, verification,
  and content pages.
- **Responsive editing:** desktop split workspace plus mobile editor/preview
  switching.
- **Live preview:** the same preview components are used for editing and export
  rendering.
- **Themes:** Light, Dim, and Dark appearance per simulation module.
- **Timeline control:** automatic chronological sorting with newest-first or
  oldest-first ordering where timelines apply.
- **Exports:** PNG, JPG, and A4 PDF export for every module.
- **Visible simulation labels:** every exported image and PDF page carries a
  non-removable educational simulation label.
- **Image provenance marker:** PNG and JPG exports include a locally
  verifiable SocialMediaCreator origin marker.
- **Project archives:** `.smc` import and export stores the active module,
  configuration, and optimized images together.
- **Auto-save:** the active working session is saved locally in IndexedDB and
  can be cleared from the app.
- **PWA support:** installable app shell, offline support, and update prompts
  via service worker.
- **Image handling:** oversized uploads are validated by file content and
  reduced automatically before project storage where possible.
- **Accessibility:** semantic tabs, keyboard navigation, focus handling in
  dialogs, and mobile-safe controls.

## Current release focus

The current release line turns SocialMediaCreator from separate mockup modules
into a complete classroom workshop:

- project files now preserve images, not only text configuration
- sessions recover automatically after reloads or accidental tab closure
- large classroom images are reduced instead of being rejected immediately
- image/PDF exports are labeled, consent-gated, and include the product mark
- exported PNG/JPG files can be checked on the local verification page
- installation and offline use are supported through the PWA build
- import paths are bounded by archive, manifest, media, size, and schema
  validation before existing work is replaced

## Educational and safety model

The application uses fictional default profiles and clearly labels the
generator and every exported result as a simulation. Before image or PDF
export, users must acknowledge the educational purpose and terms of use.

PNG and JPG exports also contain a locally verifiable origin marker. The
verification page can identify an intact marker or detect subsequent byte-level
changes. This marker is an educational provenance hint, not cryptographic proof
that an image is authentic or unmodified in every possible sense.

Guidance for educators, responsible-use recommendations, terms of use, privacy
information, and the legal notice are available from the application footer.

## Privacy and local processing

Post content, uploaded images, and project configurations are processed in the
browser. The application has no user accounts, content database, or server-side
storage for created simulations.

The active session is continuously auto-saved to the local browser database (IndexedDB)
and can be cleared by the user at any time.

Images are represented by local object URLs. Saved `.smc` project archives
include WebP-optimized copies of the active module's images. Archive creation
and loading happen locally. The selected language and export acknowledgement
are stored in `localStorage`.

The production site is served through Cloudflare Workers and uses Cloudflare
Web Analytics. Cloudflare therefore processes technical connection and
statistical data as described in the
[privacy policy](https://smc.haak3.de/datenschutz).

## Project files

The primary project format is a ZIP-compatible **SMC archive version 1**:

- stores the active module's Config V6 data and optimized images
- limits source images to 5 MB and 4096 pixels per edge
- stores images at a maximum edge of 2048 pixels, normally as WebP with PNG
  fallback where browser WebP encoding is unavailable
- limits total uncompressed project data to 25 MB
- rejects unknown, unsafe, oversized, or invalid entries before replacing state
- imports Config V5 projects and migrates them to German Config V6 projects
- continues to import image-free Config V6 JSON files

The complete format and validation contract is documented in
[Project archive format](docs/PROJECT-ARCHIVE.md).

## Local development

### Requirements

- Node.js `>=22.12.0 <23`
- npm `>=10 <11`

### Setup

```bash
npm ci
npm run dev
```

Vite prints the local development URL after startup.

Playwright browsers are required before running the E2E suite for the first
time:

```bash
npx playwright install chromium firefox webkit
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create the production bundle |
| `npm run preview` | Serve the production bundle locally |
| `npm test` | Run unit and component tests with Vitest |
| `npm run lint` | Run ESLint |
| `npm run test:e2e:chromium` | Run the fast Chromium-only Playwright suite used by CI |
| `npm run test:e2e` | Run Playwright tests in Chromium, Firefox, and WebKit |
| `npm run verify` | Run tests, lint, build, and the complete E2E suite |
| `npm run deploy` | Deploy the static application with Wrangler |
| `npm run smoke:production` | Validate the production deployment |

To smoke-test another deployment:

```bash
npm run smoke:production -- https://example.workers.dev
```

## Architecture and stack

SocialMediaCreator is a static single-page React application. Module state and
uploaded image references remain in browser memory. Markdown content pages are
bundled at build time, and exports are rendered from the same preview
components used by the editor.

The source tree is organized by responsibility:

```text
src/
  app/          application shell, routing, dialogs, project image lifecycle
  features/     Photo Post, Messenger, Microblog, and verification modules
  shared/       reusable editor components and browser-side utilities
  domain/       serialized state types, defaults, and field constraints
  i18n/         typed German and English dictionaries and locale provider
  content/      bundled Markdown pages
  styles/       ordered base, preview, content, and responsive layers
```

Core technologies:

- React 19 and TypeScript
- Vite
- Vitest and Testing Library
- Playwright
- `html-to-image` and jsPDF
- React Markdown
- Cloudflare Workers Static Assets

The production deployment uses a single-page-application fallback and hardened
security and caching headers from `public/_headers`.

## Documentation

- [Changelog](CHANGELOG.md)
- [Coding plan](docs/planning/Codingplan.md)
- [UI and UX plan](docs/planning/UI-Design-Entwurf.md)
- [Cloudflare deployment](docs/CLOUDFLARE.md)
- [Project archive format](docs/PROJECT-ARCHIVE.md)
- [Software stack audit](docs/STACK-AUDIT.md)
- [Educational and transparency concept](docs/planning/BILDUNGS-UND-TRANSPARENZKONZEPT.md)

## License

SocialMediaCreator is licensed under the
[GNU General Public License v3.0 only](LICENSE).
