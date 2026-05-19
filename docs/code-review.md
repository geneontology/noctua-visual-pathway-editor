# Code Review — Noctua Visual Pathway Editor

_Date: 2026-05-13_

A focused audit of the codebase covering architecture, state management, type safety, testing, tooling, and code smells. Findings are grouped by priority with effort estimates (S/M/L).

---

## Summary

**Overall grade: B+** — production-ready React + TypeScript SPA with solid architectural decisions, strict typing, and enforced patterns. Biggest opportunities are extracting a large data blob, adding meaningful test coverage, and enriching API error handling.

---

## Architecture — Solid

- Feature modules (`gocam`, `relations`, `search`, `auth`, `users`) are properly scoped with minimal cross-boundary leakage.
- `src/@noctua.core/` is a cohesive shared lib (Dialog, Drawer, Popover, hooks, theme, colors).
- `src/app/` is clean: Redux store setup (combineSlices + RTK Query), typed hooks, ~65 LOC `Layout.tsx`.
- Cross-feature imports are intentional and narrow (e.g. `gocam` imports `search` Autocomplete / lookups; `relations` imports `ActivityType` from `gocam`).

## State Management — Mostly Sound

- 10 Redux Toolkit slices, reasonable for the domain.
- `camSlice` (127 LOC) compact; `activityFormSlice` (386 LOC) is larger but justified by tree traversal + validation.
- RTK Query slices (`camApiSlice`, `lookupApiSlice`, `authApiSlice`, `metadataApiSlice`) use correct tag invalidation and pull auth token from state.

## Type Safety — Excellent

- `tsconfig.app.json`: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noUncheckedSideEffectImports: true`.
- **No `@ts-ignore` or `@ts-expect-error` anywhere.**
- `as any` appears in only 9 files, mostly justified (JointJS typing gaps, JSONP polyfill, decision-tree traversal).
- `@typescript-eslint/consistent-type-imports` enforced.

---

## Findings by Priority

### 🔴 Must Fix

#### 1. `src/@noctua.core/data/relations.ts` is a 3758-line data blob — M

A static `globalKnownRelations` literal that should be a `.json` import.

- **Why it matters:** unreadable diffs, blocks tree-shaking, bloats bundle, hard to maintain.
- **Fix:** Move data to `relations.json`, import via `import relations from './relations.json'`. Reduces file to ~50 LOC of types + import.

#### 2. RTK Query error paths lose context — M

`src/features/gocam/services/camApiSlice.ts:95, 145` — mutations return bare `error` objects.

- **Why it matters:** UI cannot distinguish auth failure vs network failure vs server 500. Users get generic errors.
- **Fix:** Wrap errors in a discriminated `ApiError` type with `{ kind, message, status }`, set in `transformErrorResponse`.

### 🟡 Should Fix

#### 3. Test coverage is essentially zero — L

Only `tests/features/gocam/slices/camSlice.test.ts` (60 LOC, 8 reducer cases) exists.

- **Why it matters:** `activityOperations.ts` (814 LOC of core mutation logic), all RTK Query slices, and all components are untested. Infrastructure (`renderWithProviders` in `tests/test-utils.tsx`, 959 LOC) is fully in place — only coverage is missing.
- **Fix priority order:**
  1. `buildCreateActivityOperations`, `buildEditActivityOperations` in `activityOperations.ts`
  2. RTK Query mutation flows (mock fetch)
  3. `ActivityForm` interactions
  4. `decisionTree.ts` branch traversal

#### 4. ESLint disable in `ActivityForm.tsx` ~line 198 — S

`react-hooks/exhaustive-deps` is suppressed without explanation.

- **Why it matters:** silent rule disables decay into bugs.
- **Fix:** either fix the dependency array, or add a one-line comment explaining the intentional omission.

#### 5. `socket.io-client@2.5.0` is 6+ years old — S

Released 2018; `@types/socket.io-client@1.4.36` is also stale.

- **Why it matters:** missing modern API, slower reconnect logic, gaps in type defs. No known CVEs in current use case.
- **Fix:** upgrade to `socket.io-client@4.x`. Verify `baristaSocketService.ts` (112 LOC) still works — connection pooling + dedup logic should port cleanly.

#### 6. Missing npm scripts — S

No `test:watch`, no `test:coverage`.

- **Why it matters:** discourages running tests during development.
- **Fix:**
  ```json
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
  ```

### 🟢 Nice to Have

#### 7. JSONP for GOlr search — S

`src/features/search/services/lookupApiSlice.ts:12–35` uses JSONP to work around CORS.

- **Why it matters:** brittle, no proper error semantics, exposes a `window[callbackName]` global temporarily.
- **Fix:** if the backend can enable CORS for GOlr endpoints, drop the JSONP shim. Otherwise leave as-is.

#### 8. `decisionTree.ts:20–30` uses `as any` for branch traversal — S

- **Why it matters:** loses type safety in the relation-selection decision tree.
- **Fix:** model branches as a discriminated union keyed by node kind; switch on the discriminant instead of casting.

#### 9. Large files to watch — informational

| File | LOC | Notes |
|------|-----|-------|
| `relations.ts` | 3758 | See finding #1 |
| `activityOperations.ts` | 814 | Consider splitting create/edit/delete builders into separate files |
| `tests/test-utils.tsx` | 959 | Likely contains many fixtures — fine for a test helper |
| `camCanvas.ts` | 549 | JointJS wrapper, acceptable |
| `ActivityForm.tsx` | 501 | At limit; revisit if it grows |
| `activityFormSlice.ts` | 386 | Reasonable for tree traversal + validation |

---

## What's Already Good

- Strict TypeScript with no escape hatches in use
- Custom ESLint rule enforcing typed Redux hooks (`useAppDispatch`/`useAppSelector` only)
- No `TODO`/`FIXME` pollution
- Comments use section dividers (`// ── Tree traversal ──`) — good signal-to-noise
- Vite config has proper manual chunk splitting (mantine, redux, apollo, socket.io) + bundle analyzer
- Modern dependencies: React 19, TS 5.7, Vite 6.2, Mantine 9
- Socket service has connection pooling + 500ms packet-ID deduplication
- CLAUDE.md is accurate and useful for onboarding

---

## Suggested Order of Work

1. **Extract `relations.ts` → `relations.json`** (mechanical, biggest maintainability win)
2. **Add `test:watch` + `test:coverage` scripts** (~5 min)
3. **Write tests for `activityOperations.ts` builders** (highest-value coverage)
4. **Enrich RTK Query error context** (small change, visible UX impact)
5. **Resolve the `ActivityForm` ESLint disable** (5 min audit)
6. **Plan `socket.io-client` 4.x upgrade** when there's time for regression testing
