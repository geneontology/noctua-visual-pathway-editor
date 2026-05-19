# Testing Guide

_Last updated: 2026-05-17_

How tests are organized, how to run them, and how to add new ones. Companion to [code-review.md](./code-review.md) finding #3.

---

## TL;DR

| Need | Command |
|------|---------|
| Run all unit tests | `npm run test` |
| Run all e2e tests | `npm run test:e2e` |
| E2E interactive UI | `npm run test:e2e:ui` |
| E2E headed (see browser) | `npm run test:e2e:headed` |
| Type-check | `npm run type-check` |
| Lint | `npm run lint` |

First-time setup for e2e: `npx playwright install chromium` (one-time ~150 MB).

---

## Stack

- **Unit / integration**: [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com/docs/react-testing-library/intro) + [jsdom](https://github.com/jsdom/jsdom)
- **End-to-end**: [Playwright](https://playwright.dev) (Chromium only, see `playwright.config.ts`)
- **Assertions**: `@testing-library/jest-dom` matchers (loaded by `tests/setup.ts`)

---

## Layout

```
tests/
├── setup.ts                          # imports jest-dom matchers
├── test-utils.tsx                    # renderWithProviders + isolated store
├── test-utils.test.tsx               # tests for the helper itself
├── fixtures/
│   ├── builders.ts                   # buildNode/buildEdge/buildActivity/buildModel
│   ├── models.ts                     # real Barista snapshots → transformed GraphModels
│   ├── models.test.ts                # invariants on the fixtures
│   └── raw/
│       ├── swiss-1.json              # 10 relation types
│       ├── another-model.json        # 14 relation types (most diverse)
│       └── large-val.json            # 376 individuals (largest)
└── features/
    ├── auth/slices/authSlice.test.ts
    ├── gocam/
    │   ├── services/
    │   │   ├── formUtils.test.ts
    │   │   ├── formValidation.test.ts
    │   │   └── violationService.test.ts
    │   └── slices/
    │       ├── activityFormSlice.test.ts
    │       └── camSlice.test.ts
    ├── relations/
    │   ├── services/decisionTree.test.ts
    │   └── slices/relationSlice.test.ts
    └── users/slices/metadataSlice.test.ts

e2e/
├── fixtures/test-urls.ts             # buildModelUrl
├── mocks/barista.ts                  # mockBaristaMetadata, mockBaristaModel, mockUserInfoByToken
├── model-loading.spec.ts             # initial load, splash, banner, edit dialog
├── edit-dialog.spec.ts               # Cancel / Escape / preservation
├── edit-form.spec.ts                 # title input, comments add/edit, state dropdown
├── auth.spec.ts                      # logged-in vs read-only paths
├── validation.spec.ts                # error chip + drawer behavior
├── stencil-palette.spec.ts           # 3 stencil tiles + drag-source attributes
├── graph-toolbar.spec.ts             # Auto Layout, Detail / Spacing pills, zoom controls
├── toolbar-menus.spec.ts             # VIEW IN, EXPORT AS, Help dropdowns + link targets
├── copy-dialog.spec.ts               # Copy-model dialog (title, checkbox, Cancel)
└── fixture-smoke.spec.ts             # all 3 raw fixtures load + populate toolbar/canvas
```

**Vitest discovers** files matching `tests/**/*.test.{ts,tsx}` (configured in `vite.config.ts` → `test.include`).
**Playwright discovers** files matching `e2e/**/*.spec.ts`.

---

## Conventions

- File naming: `<subjectUnderTest>.test.ts(x)` for unit; `<feature>.spec.ts` for e2e.
- Mirror the source path: `src/features/gocam/services/foo.ts` → `tests/features/gocam/services/foo.test.ts`.
- Use the `@/` alias for source imports and `@tests/` for fixtures/helpers (both configured in `vite.config.ts`).
- Group tests with `describe` per public function or concern; one assertion idea per `it`.
- Prefer testing **behavior** (what the slice does given an action) over implementation details (which `Map` it uses internally).
- For Redux slices, test the **reducer directly** with synthesized state — no `Provider` needed (see existing slice tests for the pattern).

---

## Unit tests — patterns

### Reducers / selectors

Drive the reducer directly; assert on returned state and selector outputs against a hand-rolled state object.

```ts
import camReducer, { setModel } from '@/features/gocam/slices/camSlice'
import { buildModel } from '@tests/fixtures/builders'

const initial = camReducer(undefined, { type: '@@INIT' })

it('setModel stores the model', () => {
  const m = buildModel([])
  expect(camReducer(initial, setModel(m)).model).toBe(m)
})
```

### Pure services

Build minimal inputs with the type-shape factories in `tests/fixtures/builders.ts`. Don't over-mock — the more real data flows through, the more the test catches.

```ts
import { validateActivityForm } from '@/features/gocam/services/formValidation'
import { FormMode } from '@/features/gocam/models/formModels'

const wrap = (root) => ({
  activityType: 'activity', mode: FormMode.CREATE,
  existingActivityUid: null, root, isDirty: false, errors: [],
})
```

### Components

Use `renderWithProviders` to mount components against an isolated store. It returns `{ store, user, ...renderResult }` — `user` is a configured `@testing-library/user-event` instance.

```tsx
import { renderWithProviders } from '@tests/test-utils'
import { swissOneModel } from '@tests/fixtures/models'

const { getByTestId, user } = renderWithProviders(<CamToolbar />, {
  preloadedState: {
    cam: { model: swissOneModel, loading: false, error: null, selectedActivityId: null },
  },
})
```

Each call to `renderWithProviders` creates a **fresh store** unless you pass one in. See `tests/test-utils.test.tsx` for full examples.

### Fixtures

Real Barista snapshots live in `tests/fixtures/raw/`. The `tests/fixtures/models.ts` module pipes them through `transformGraphData` to produce ready-to-use `GraphModel` objects:

```ts
import { swissOneModel, anotherModel, largeValModel } from '@tests/fixtures/models'
```

Relation coverage by fixture:

| Fixture | Relations | Best for |
|---------|-----------|----------|
| `swissOneModel` | 10 (BFO part_of, RO regulates, located_in, …) | typical small CAM |
| `anotherModel` | 14 (adds causally_upstream variants, small_molecule_inhibitor) | broadest coverage |
| `largeValModel` | 9 + 376 individuals | scale, activity-rich scenarios |

`swissOneModel` and `anotherModel` also produce natural orphan nodes (gene products referenced by edges but not packed into activities) — useful for validation-error tests.

---

## E2E tests — patterns

Playwright tests start the dev server automatically (`webServer` in `playwright.config.ts`, port `4208`). All Barista network traffic must be mocked — the suite never hits the live API.

### Mocking Barista

`e2e/mocks/barista.ts` exports the helpers you'll need:

```ts
import {
  mockBaristaMetadata,     // /users, /groups
  mockBaristaModel,        // /m3Batch* (model GET)
  mockUserInfoByToken,     // /user_info_by_token/* (auth)
  loadRaw,                 // load a raw fixture JSON
  getModelIdFromRaw,
  getTitleFromRaw,
} from './mocks/barista'
```

Typical test skeleton:

```ts
import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import { loadRaw, getModelIdFromRaw, mockBaristaMetadata, mockBaristaModel } from './mocks/barista'

test('loads and shows the title', async ({ page }) => {
  const raw = loadRaw('another-model')
  await mockBaristaMetadata(page)
  await mockBaristaModel(page, raw)

  await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
  await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
})
```

### Logged-in path

Pass a token to `buildModelUrl` _and_ call `mockUserInfoByToken(page, { loggedIn: true })`. The auth flow is:

1. `useAuthSetup` reads `?barista_token=` from the URL and dispatches `setBaristaToken`
2. `useGetUserInfoQuery(token)` fires once the token is set
3. The user-info response with a non-empty `token` field triggers `setUser(...)` → `isLoggedIn = true`
4. The "Not Logged In" banner disappears

Passing `{ loggedIn: false }` returns an empty body, which makes `useAuthSetup` clear the token. Useful for simulating an expired token.

### Selectors

Prefer in this order:

1. `getByTestId('model-title')` — explicit and stable. Add a `data-testid` to a new component if you need to interact with it.
2. `getByRole('dialog')`, `getByRole('button', { name: 'Cancel' })` — semantic.
3. `getByText(...)` — last resort; brittle if copy changes.

### Visibility quirks

The right drawer slides off-screen via `translate-x-full`, so its content stays in the DOM after closing. `toBeHidden()` doesn't catch that — use `not.toBeInViewport()` instead (see `e2e/validation.spec.ts`).

### Snapshots

`e2e/model-loading.spec.ts` uses one full-page screenshot for the "no model ID" empty state. To re-baseline:

```sh
npx playwright test -u
```

Only baseline static, stable states. Anything with the canvas or animation isn't a good snapshot target.

---

## Coverage at a glance _(2026-05-17)_

### Unit / integration — 213 tests across 11 files

| Module | Tests |
|---|---|
| `features/gocam/slices/camSlice` | 30 |
| `features/gocam/slices/activityFormSlice` | 30 |
| `features/gocam/services/formUtils` | 18 |
| `features/gocam/services/formValidation` | 21 |
| `features/gocam/services/violationService` | 17 |
| `features/relations/services/decisionTree` | 36 |
| `features/relations/slices/relationSlice` | 22 |
| `features/auth/slices/authSlice` | 8 |
| `features/users/slices/metadataSlice` | 6 |
| `fixtures/models` (invariants) | 21 |
| `test-utils` | 4 |

### E2E — 47 tests across 10 files

| Spec | Tests | Covers |
|---|---|---|
| `model-loading` | 3 | initial load, edit dialog open, no-model-id state |
| `edit-dialog` | 4 | Cancel button, Escape, title preservation, pre-filled input |
| `edit-form` | 5 | title editing, comment add/edit, Save-disabled, state dropdown |
| `copy-dialog` | 5 | open from clone icon, default title, checkbox, Copy disabled, Cancel |
| `auth` | 3 | banner on/off based on token + user-info |
| `validation` | 3 | error chip, drawer open/close, chip text format |
| `stencil-palette` | 5 | toolbox header, 3 tiles, draggable + tooltips, icons |
| `graph-toolbar` | 9 | Auto Layout, Detail/Spacing pills + selections, zoom controls, a11y |
| `toolbar-menus` | 5 | VIEW IN, EXPORT AS, Help; link target/rel; menu dismiss |
| `fixture-smoke` | 6 | all 3 raw fixtures load + populate toolbar/canvas |

### Test-IDs in use

Stable `data-testid` selectors added by the test suite (avoid renaming without updating the specs):

- `model-title`, `edit-model-title` — `CamToolbar`
- `toolbar-comment`, `toolbar-copy` — `CamToolbar` action icons
- `stencil-palette`, `stencil-default`, `stencil-proteinComplex`, `stencil-molecule` — `StencilPalette`
- `graph-toolbar`, `graph-auto-layout`, `graph-zoom-in`, `graph-zoom-out`, `graph-zoom-reset`, `graph-detail-menu`, `graph-spacing-menu` — `GraphToolbar`

### Notable gaps

- **No component-level tests** for `CamToolbar`, `RightDrawer`, `ActivityForm`, `PathwayGraph`.
- **No tests for `activityOperations.ts`** (814 LOC of mutation operation builders — highest-value target per code review).
- **No tests for RTK Query slices** (`camApiSlice`, `lookupApiSlice`, `authApiSlice`, `metadataApiSlice`).
- **No tests for `baristaSocketService`** (connection pooling + dedup logic).
- **No drag-drop / canvas e2e** — JointJS canvas interactions aren't covered.

---

## Adding a new test — checklist

1. Locate the source file: `src/features/<area>/<kind>/<name>.ts`.
2. Mirror the path under `tests/`: `tests/features/<area>/<kind>/<name>.test.ts`.
3. Pull from `@tests/fixtures/builders` or `@tests/fixtures/models` when you need realistic data.
4. For components, use `renderWithProviders` and seed only the slices you need via `preloadedState`.
5. Run only the new file while iterating: `npx vitest run tests/features/.../foo.test.ts`.
6. Run the full suite before opening a PR: `npm run test && npm run test:e2e`.

For e2e, drop the spec under `e2e/` and stub _every_ network call. The suite must run with no internet.

---

## Common pitfalls

- **`mockReset: true` is on** in the Vitest config — `vi.fn()` mocks reset between tests. Don't share mock instances across files expecting state to persist.
- **Don't import from `react-redux` directly** — ESLint enforces typed hooks from `@/app/hooks`. Same goes inside tests.
- **`renderWithProviders` does not unmount between calls within the same test** — RTL cleanup happens at end-of-test. If you call it twice, assert on `store.getState()` instead of the DOM.
- **Real fixtures are immutable for downstream tests** — `violationService.buildValidationErrors` mutates the input model's `activities[].violations`. If a test depends on a clean fixture, rebuild it (or accept the side effect, which is what we did for `swissOneModel`).
- **Playwright `toBeHidden()` does not check viewport position** — for CSS-transformed-off-screen elements use `not.toBeInViewport()`.
