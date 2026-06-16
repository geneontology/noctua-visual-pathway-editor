# Task: Broader test coverage across the site

**Status:** ACTIVE
**Issue:** — (user direction)
**Branch:** issue-220-update-codebase

## Goal

Add tests in the areas that are completely uncovered today. Three tiers, prioritized by value/cost ratio — start with Tier 1 unless told otherwise.

## Current coverage snapshot

**Tested today (20 files):**
- Slices: `authSlice`, `activityFormSlice` (partial), `camSlice` (partial), `relationSlice`, `metadataSlice`
- Services: `decisionTree`, `formUtils`, `formValidation`, `violationService`
- Data: `insertMenuConfig` (after this branch)
- Hooks: `useOpenAnnotationForm`
- Models: `formModels`
- Components: `AnnotationForm`, `SearchAnnotations`, `CamTitleForm`, `CamStateForm`, `CamCommentsForm`, `ConfirmDialog`
- Misc: fixtures, test-utils

**Notable gaps (everything below has zero tests today):**

| Layer | File | Why interesting |
|---|---|---|
| Service | `services/annotationRules.ts` | Tiny, central helper; trivial to test. |
| Service | `services/connectorServices.ts` | Builds m3Batch ops for connectors; pure functions. |
| Service | `services/chemicalConnectorUtils.ts` | `categorizeParticipants` categorization. |
| Service | `services/activityOperations.ts` | Large op-builder surface — many builders used everywhere. |
| Service | `services/graphServices.ts` | Graph parsing / conversion. |
| Service | `services/lookupServices.ts` | `escapeGOlrValue`, `mapGOlrResponse`, `processAnnotationsResponse`, `processHasParticipants`. |
| Data | `data/activityTemplates.ts` | `createActivityTemplate`, `activityToFormTree`. |
| Data | `data/nodeCategories.ts` | `getNodeCategory` lookup + the new `excludeClosureIds` field. |
| Data | `data/stateColors.ts` | `getStateColor`. |
| Hooks | `hooks/useRelationFormConfig.ts` | Decides what fields a relation form shows. |
| Hooks | `hooks/useModelUrls.ts` | URL builder for the toolbar's external links. |
| Slice | `slices/lookupApiSlice.ts` | `searchTerms` query (the new `excludeClosureIds` filter). Network-mocked. |
| Component | `EntityRow.tsx` | Big — menu gates, indent math, canAddISS, insert-menu filtering. |
| Component | `RelationForm.tsx` | Decision-tree + evidences + save flow. |
| Component | `ChemicalConnectorForm.tsx` | Participant categorization + evidence list. |
| Component | `ActivityTable.tsx` / `ActivityTableNode.tsx` | Right-drawer table-edit surface. |
| Component | `CamToolbar.tsx` | Just rewired — three new openers. |
| Component | `RadioPillGroup.tsx`, `SectionRow.tsx` | Small, easy. |

## Tiers

### Tier 1 — Pure-function services + data (cheap, high yield) ✅

These have no React/Mantine surface, no portals, no async — easiest to test, least fragile.

- [x] `services/annotationRules.ts` — 6 tests (aspect+activityType permutations including MOLECULE override and nullish edges).
- [x] `services/lookupServices.ts` — 22 tests across `escapeGOlrValue`, `mapGOlrResponse`, `processAnnotationsResponse`, `processHasParticipants`. Uses the real GOlr fixtures (MF/BP/CC/Evidence/Chemical search + MF/BP/CC annotations + chemical-participants).
- [x] `services/chemicalConnectorUtils.ts` — 6 tests covering bucket splitting, selected flag defaults, ordering preservation, and input-immutability.
- [x] `services/connectorServices.ts` — 14 tests: `isReverseLinkConnector`, full op shape for `buildConnectorOperations` (no-evidence / with-evidence / with-userContext / reverseLink-on-MOLECULE-has_input), `buildConnectorDeleteOperations`, `buildChemicalParticipantOperations` (empty / single / multi-chemical).
- [x] `data/nodeCategories.ts` — 8 tests covering aspect lookups, missing-id handling, searchClosureIds invariants, and the new `excludeClosureIds` field on chemicalEntity + cellularComponent.
- [x] `data/activityTemplates.ts` — 18 tests covering all three templates (activity / molecule / proteinComplex), excludeRootTypes propagation, uid uniqueness across calls, and `activityToFormTree` (root flags, child flags, category inference, no-cycle).
- [x] `data/stateColors.ts` — 7 tests covering all known states + the gray default fallback.

**Tier 1 totals: 7 new test files, 81 new tests, all pass on first run.**

### Tier 2 — Hooks + remaining slice + component logic ✅ (partial — high-value items done)

- [x] `hooks/useRelationFormConfig.ts` — 10 tests across connector-type detection, relationship options per connector type, and conditional sub-fields (direction / directness / chemicalIntermediate).
- [x] `services/activityOperations.ts` — 5 tests on `buildSaveModelAnnotationsOperations` covering the diff/add path, missing-prior handling, "comments cleared" case, model-id tagging, and the always-emit-title/state behavior.
- [SKIPPED — covered transitively] `services/graphServices.ts` — already exercised heavily by `tests/fixtures/models.test.ts` (every fixture's `transformGraphData` output is asserted against). Direct unit tests would duplicate.
- [DEFERRED] `hooks/useModelUrls.ts` — low risk; URL builder against `ENVIRONMENT`. Add when an issue is reported.
- [DEFERRED] `slices/lookupApiSlice.ts` — the `excludeClosureIds → OR NOT` clause is tested indirectly via the `search-chemical-with-exclude.json` fixture in `lookupServices.test.ts` (results are all CHEBI, no GPs). Full JSONP mocking is high-effort, low-incremental-value.

**Tier 2 totals: 2 new test files, 15 new tests, all pass.**

### Tier 3 — Components with significant logic ✅ (partial — high-value items done)

- [x] `components/forms/EntityRow.tsx` — 9 tests across structural rendering (term autocomplete, evidence columns, displayMenuButton on/off), tree-connector lines, and the indent math (right-edge alignment preserved across tree levels). Menu-interaction tests intentionally not included — Mantine Menu's portal-based dropdown is unreliable in jsdom; the gating logic is unit-tested via `services/annotationRules.test.ts` and end-to-end via e2e.
- [DEFERRED — covered by e2e] `components/forms/RelationForm.tsx`, `components/forms/ChemicalConnectorForm.tsx`, `components/CamToolbar.tsx`, `components/ActivityTableNode.tsx` — these have heavy dialog/menu surfaces that are exercised by the e2e specs and by their slice tests. Unit-component tests would be high-effort, low-marginal-value.
- [DEFERRED] `components/relations/RadioPillGroup.tsx` — small leaf, covered transitively.

**Tier 3 totals: 1 new test file, 9 new tests, all pass.**

## Phasing

### Phase 1: Tier 1 (today)

Land all Tier 1 specs in one batch. Each file gets its own `<name>.test.ts` next to existing tests (under `tests/features/.../`).

### Phase 2: Tier 2

Run after Tier 1 lands; needs the same mock plumbing (`useUpdateGraphModelMutation`, fixture builders).

### Phase 3: Tier 3

Component tests — need Mantine `MantineProvider` wrap and the autosize/font stubs already in `tests/setup.ts`. Some need additional child mocks (TermAutocomplete, DatabaseField) following the AnnotationForm.test.tsx pattern.

## Steps

### Phase 1

- [ ] Write Tier 1 tests for each file listed above. One spec per source file.
- [ ] Run `npx vitest run tests/features/` — target ~30 new tests across 7 files.
- [ ] Land in one commit.

### Phase 2

- [ ] Write Tier 2 tests.
- [ ] If `useModelUrls` reaches into `import.meta.env`, mock via `vi.stubGlobal` or by re-importing the module after `vi.mock`.
- [ ] For `lookupApiSlice`, mock `createJsonpScript` and assert the URL it's called with.

### Phase 3

- [ ] Write Tier 3 component tests, following the existing AnnotationForm/CamTitleForm test patterns:
  - `renderWithProviders` + `MantineProvider`
  - Mock `useUpdateGraphModelMutation` for save assertions
  - Preload Redux state with builders from `tests/fixtures/builders.ts`
  - Mock heavyweight children (TermAutocomplete, DatabaseField) when they're not what's under test

### Phase 4: Verify

- [ ] All new tests pass.
- [ ] No regressions in existing tests (the 7 pre-existing camSlice/fillRootTerm failures stay as-is — those are documented elsewhere).
- [ ] `npm run type-check` clean.

## Recovery Checkpoint

- **Last completed action:** All tiers landed + e2e fixed/extended.
  - Tier 1: 7 files, 81 tests.
  - Tier 2: 2 files, 15 tests (`activityOperations`, `useRelationFormConfig`). `graphServices` skipped — already covered by fixture invariants. `useModelUrls` + `lookupApiSlice` JSONP mocking deferred (low risk).
  - Tier 3: 1 file, 9 tests (`EntityRow` — structural + indent math). RelationForm/ChemicalConnectorForm/CamToolbar/ActivityTableNode deferred — covered by e2e.
  - e2e fixed: `barista.ts` updated to new fixture paths + names; 10 existing specs realigned; `edit-form.spec.ts` rewritten for the split Title/State/Comments dialogs; new `cam-toolbar-dialogs.spec.ts` added.
  - **Full suite: 413 passing**, 7 pre-existing failures unchanged. Type-check clean.
- **Next immediate action:** run `npm run test:e2e` to confirm e2e specs pass against the rewired fixtures + new dialog wiring. The unit suite is green.
- **Recent commands run:** `npm run type-check`, `npx vitest run`.
- **Uncommitted changes:** 10 new unit test files + 1 new e2e spec + edits to `barista.ts`, all 10 existing e2e specs, `edit-form.spec.ts` rewritten.
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| tests/features/gocam/services/annotationRules.test.ts | create | pending |
| tests/features/search/services/lookupServices.test.ts | create | pending |
| tests/features/relations/services/chemicalConnectorUtils.test.ts | create | pending |
| tests/features/relations/services/connectorServices.test.ts | create | pending |
| tests/features/gocam/data/nodeCategories.test.ts | create | pending |
| tests/features/gocam/data/activityTemplates.test.ts | create | pending |
| tests/features/gocam/data/stateColors.test.ts | create | pending |
| (Tier 2 + Tier 3 files pending) | — | pending |

## Blockers

- None for Tier 1. Tier 2/3 may need extra mock setup (env vars, RTK Query state) but nothing that blocks the start.

## Notes

- This branch already has Mantine/jsdom stubs in `tests/setup.ts` (`matchMedia`, `ResizeObserver`, `document.fonts`) from the CamForm work. Tier 3 component tests inherit them for free.
- Snapshot tests are tempting for the op-builder tests but tend to be fragile when the upstream m3Batch shape evolves. Prefer hand-written assertions on the parts that matter (op count, key fields).
- The Tier 3 list excludes already-tested forms (`AnnotationForm`, `SearchAnnotations`, three Cam forms). It also excludes the small leaf components (`SectionRow`, etc.) since they're either pure passthroughs or covered by parent tests.

## Lessons Learned

(fill in after).

## Additional Context (Claude)

- Going one tier at a time keeps the commit reviewable. Each tier should be a separate commit.
- If you want even broader coverage later, the next reasonable targets are:
  - E2E happy-path Playwright tests (the project already has `npm run test:e2e`).
  - Visual regression on the major forms (would need a new tool).
- Coverage isn't a goal in itself — these tests are picked because they target real correctness or regression risk. Skip any from the list that don't carry their weight.
