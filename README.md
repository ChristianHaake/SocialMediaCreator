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

The application currently provides three simulation modules:

- **Photo Post** creates chronological feeds with profiles, captions,
  reactions, comments, replies, image carousels, and simulated video
  thumbnails.
- **Messenger Chat** creates two-sided conversations with two fictional
  profiles, custom timestamps, online states, and seen indicators.
- **Microblog** creates independent feeds or connected threads with profiles,
  reactions, comments, and replies.

Shared capabilities include:

- Light, Dim, and Dark themes
- German and English interfaces
- responsive live previews
- chronological timelines with newest-first or oldest-first ordering
- dedicated comment views
- PNG, JPG, and A4 PDF export
- mandatory visible simulation labels on every exported result
- local project configuration import and export
- accessible keyboard navigation and mobile editor/preview switching

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

Images are represented by local object URLs and are deliberately excluded from
configuration files. They must be selected again after loading a saved project.
The selected language and export acknowledgement are stored in `localStorage`.

The production site is served through Cloudflare Workers and uses Cloudflare
Web Analytics. Cloudflare therefore processes technical connection and
statistical data as described in the
[privacy policy](https://smc.haak3.de/datenschutz).

## Project files

The current configuration format is **Config V6**:

- stores the selected module, locale, theme, timeline data, comments, and
  simulation settings
- rejects unknown or invalid values before replacing editor state
- excludes all uploaded images
- imports Config V5 projects and migrates them to German Config V6 projects
- does not import Config V1 through V4 after the intentional structured-date
  format break

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
- [Software stack audit](docs/STACK-AUDIT.md)
- [Educational and transparency concept](docs/planning/BILDUNGS-UND-TRANSPARENZKONZEPT.md)

## License

SocialMediaCreator is licensed under the
[GNU General Public License v3.0 only](LICENSE).
