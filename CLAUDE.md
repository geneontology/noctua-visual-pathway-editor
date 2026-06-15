# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Noctua Visual Pathway Editor — a React 19 + TypeScript SPA for visually editing Gene Ontology (GO) biological annotations and Causal Activity Models (CAMs). Built with Vite, Tailwind CSS v4, Redux Toolkit, and Mantine v9.

## Commands

- `npm run dev` — Start dev server on port **4208** (port set in `vite.config.ts`)
- `npm run start` — Start dev server on port **4202**, host `0.0.0.0`, `development` mode (variants: `start:development`, `start:staging`, `start:production`)
- `npm run build` — Clean `workbenches/noctua-visual-pathway-editor/public`, run `tsc`, then `vite build --mode production`
- `npm run build:beta-test` — Same flow against the `noctua-visual-pathway-editor-beta` workbench in `staging` mode
- `npm run test` — Vitest run (looks for `tests/**/*.test.{ts,tsx}` only — files outside `tests/` are ignored)
- Run a single test file: `npx vitest run tests/features/gocam/slices/camSlice.test.ts`
- Watch a single test: `npx vitest tests/features/gocam/slices/camSlice.test.ts`
- `npm run test:e2e` — Playwright e2e (`test:e2e:ui`, `test:e2e:headed` variants)
- `npm run lint` / `lint:fix` — ESLint
- `npm run format` — Prettier
- `npm run type-check` — `tsc --noEmit`

Environment modes: `development`, `staging`, `production` (via `--mode`). Env files: `.env.development`, `.env.staging`, `.env.production`. All runtime vars must be prefixed with `VITE_`. `VITE_OUTPUT_PATH` controls the build output directory; the build plugin renames the emitted `index.html` to `inject.tmpl` so the workbench host can inline it.

## Architecture

### Source Layout

- `src/@noctua.core/` — Shared library: reusable components (Dialog, Drawer, Toast, LoadingOverlay, Popover, Menu), theme, constants, utility functions. Several of these own their own Redux slices (e.g. `drawerSlice`, `dialogSlice`, `toastSlice`, `loadingOverlaySlice`) and live alongside their components.
- `src/app/` — App shell: store setup (`src/app/store/store.ts`), typed hooks (`src/app/hooks.ts`), layout (Layout, Toolbar, Drawers, Footer), `PathwayViewer` (top-level editor surface that wires dialogs to feature forms).
- `src/features/` — Self-contained feature modules (models, components, services, hooks, slices):
  - `gocam/` — Core: CAM graph model, activity editing, activity/annotation forms, graph services
  - `pathway/` — Pathway-level graph rendering (e.g. `GraphToolbar`)
  - `relations/` — Decision-tree UI for activity-to-activity relations (connector type → relationship → effect → directness → RO ID)
  - `search/` — GOlr-based term search and autocomplete
  - `auth/` — Barista token authentication
  - `users/` — User metadata, contributors, groups, splash screen
- `tests/` — Vitest specs mirroring `src/` paths; fixtures + builders in `tests/fixtures/`; shared `renderWithProviders` in `tests/test-utils.tsx`; jsdom setup (incl. `matchMedia` stub for Mantine) in `tests/setup.ts`.

### State Management

Redux Toolkit with `combineSlices`. RTK Query API caching via `src/app/store/apiService.ts`.

Active reducers (see `store.ts`): `auth`, `metadata`, `activityForm`, `cam`, `relation`, `drawer`, `dialog`, `toast`, `loadingOverlay`, plus the RTK Query reducer.

Notable store config: `dialog/openDialog` actions and the `dialog.customProps` path are excluded from the serializable-state check, because entry-point dialogs pass callbacks (e.g. `AnnotationForm.onSubmit`) through `customProps`. Don't try to "fix" this by stringifying callbacks — read the comment in `store.ts` first.

Custom middleware: `loadingOverlayMiddleware` ties RTK Query lifecycle to the global overlay slice.

### API Layer

- **Barista/Minerva** — m3Batch endpoints for reading/updating CAM graph models. Requires a Barista token sourced from the `?barista_token=` query param.
- **GOlr** — Solr-based search for GO terms, evidence codes, references.
- RTK Query slices: `camApiSlice`, `lookupApiSlice`, `authApiSlice`, `metadataApiSlice`.

### Core Domain Model

`GraphModel` contains `Activity[]` (biological activities with nodes/edges), `GraphNode[]`, `Edge[]`, and `activityConnections` (activity-to-activity relations). Activities have a `rootNode`, optional `molecularFunction`, `enabledBy` (protein), and typed edges with evidence.

### Build / Bundling

`vite.config.ts` defines a `manualChunks` strategy that splits heavy vendors (`@mantine`, `framer-motion`, `jointjs`, `reactflow`, `@apollo`, `graphql`, redux, react-router, dagre/graphlib, socket.io, react-hook-form) into named chunks. Assets are emitted under `assets/<extType>/[name]-[hash][extname]`. After build, `rollup-plugin-visualizer` writes `stats-treemap.html`, `stats-sunburst.html`, and `stats-network.html` into the output dir. The `workbenchInjectTmpl` plugin renames `index.html` to `inject.tmpl` for workbench embedding and injects a `<base href>` when `VITE_BASE_URL` is set.

## Enforced Patterns

- **Typed Redux hooks only** — import `useAppDispatch`/`useAppSelector` from `src/app/hooks.ts`. Direct `useSelector`/`useDispatch`/`useStore` from `react-redux` are lint errors.
- **`import type`** for type-only imports (`@typescript-eslint/consistent-type-imports`).
- **Path alias** — use `@/*` for `src/*` (and `@tests/*` for `tests/*`). Configured in `tsconfig` and `vite.config.ts`.
- **UI library** — Mantine v9 for complex components (Modals, Buttons, Inputs); Tailwind for utility/layout styling. The shared dialog wrappers in `src/@noctua.core/components/dialog/` (e.g. `SimpleDialog`, `DialogHeader`, `ConfirmDialog`) are the preferred entry points — prefer them over raw `<Modal>` so sizing/scrolling behavior stays consistent.
- **Unused parameters** — prefix with `_` to satisfy ESLint.

## Conventions

- Prettier: no semicolons, single quotes, 2-space indent, trailing comma `es5`, 100-char width, `arrowParens: avoid`. Tailwind classes are auto-sorted by `prettier-plugin-tailwindcss`.
- Naming: PascalCase for components, camelCase for hooks and utilities.

## Testing

Vitest + React Testing Library + jsdom. Use `renderWithProviders` from `tests/test-utils.tsx` to render with an isolated Redux store (accepts optional `preloadedState` and `store`). Fixture builders live in `tests/fixtures/builders.ts` and `tests/fixtures/models.ts` — prefer these over hand-rolled graph models in tests.

## Task Management

Create and maintain plan files in `.plans/<category>/<task-name>.md` for non-trivial work. See [.plans/template.md](.plans/template.md) for the full template, recovery-checkpoint convention, and category folders (`bugfix`, `feature`, `refactor`, `config`, `docs`, `testing`, `misc`).

## Git Commits

- **Never** add `Co-Authored-By: Claude ...` trailers (or any Claude attribution) to commit messages.
- Keep messages short: a one-line subject plus a few brief bullets, not paragraphs.
