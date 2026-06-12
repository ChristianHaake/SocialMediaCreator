# Software Stack Audit

Status: June 12, 2026

## Validated stack

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

## Validation results

The current codebase passes:

- reproducible dependency installation with `npm ci`
- full dependency audit with no known vulnerabilities
- TypeScript and Vite production build
- ESLint with zero permitted warnings
- 60 unit and component tests
- 48 E2E tests across Chromium, Firefox, and WebKit
- responsive browser coverage at 320 CSS pixels
- module image and configuration exports
- valid and invalid configuration imports
- valid, damaged, and incorrectly typed image uploads
- verification that core workflows make no network requests after initial load
- production smoke testing against `https://smc.haak3.de`
- public route, SPA fallback, security header, and immutable asset checks

Config V6, exports, imports, runtime behavior, and deployment configuration were
not changed by this audit.

## Current strengths

- Broad automated coverage across three browser engines
- Strict TypeScript configuration
- Local processing of simulation content and images
- Defensive configuration and image validation
- Accessible module navigation, dialogs, and responsive views
- Hardened Cloudflare delivery with explicit security and caching headers
- Visible export labeling and local image-origin verification

## Improvement backlog

These changes should be handled as separate maintenance work:

1. Continue splitting the application shell by extracting configuration and
   export controllers from `src/app/App.tsx`. Image lifecycle management is
   already isolated in `useProjectImages`.
2. Extract timeline-editor behavior shared by Photo Post and Microblog.
3. Divide the main component and browser test suites into feature-focused
   files.
4. Add GitHub Actions for clean installation, lint, unit tests, build, and
   browser tests.
5. Evaluate route and content code splitting. The current main production
   JavaScript bundle is approximately 497 KB before compression.
6. Handle major ESLint, TypeScript, Lucide, and related upgrades in a dedicated
   dependency sprint with migration and regression testing.

Completed during repository cleanup:

- application, feature, shared, domain, content, i18n, and style boundaries
  introduced
- image and Object URL lifecycle extracted from the application shell
- single stylesheet split into four ordered layers
- German and English dictionaries split from the locale provider
- planning documents consolidated under `docs/planning`

## Dependency policy

Available major-version upgrades were intentionally not applied. The installed
stack is currently secure and fully validated; major upgrades require their own
migration and browser-regression pass.
