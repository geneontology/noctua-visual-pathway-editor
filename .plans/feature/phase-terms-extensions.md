# Task: Allow biological phase/stage terms in the "happens during" extension

**Status:** COMPLETE
**Issue:** #259
**Branch:** issue-259-phase-term

## Goal
Let biological phase/stage terms (descendants of GO:0044848 / UBERON:0000105 / PO:0009012, which carry `gocheck_do_not_annotate`) be selectable in the **happens during** extension field, while staying blocked in primary GO term fields. Mirrors the Angular `lookup.service.ts` change from noctua-standard-annotations, reimplemented the React way.

## Context
- **Related files:**
  - `src/features/search/services/lookupServices.ts` — `mapGOlrResponse` (= Angular `_lookupMap`); GOLr response mapping + `notAnnotatable` flag
  - `src/features/search/slices/lookupApiSlice.ts` — `searchTerms.queryFn` (= Angular `termLookup`/`search`); calls `mapGOlrResponse`
  - `src/features/gocam/slices/camSlice.ts` — `makeSelectModelTerms` + `nodeToOption` (= Angular `termPreLookup`); on-focus prelookup options
  - `src/features/gocam/models/cam.ts` — `RootTypes` enum (already has `BIOLOGICAL_PHASE`, `UBERON_STAGE`, `PLANT_STAGE`); home for the new `PHASE_CATEGORIES` set
  - `src/features/gocam/data/nodeCategories.ts` — `happensDuring` range + `biologicalPhase.searchClosureIds` (drive the field's `closureIds`)
  - `src/features/gocam/data/insertMenuConfig.ts` — `happens during` insert-menu item (targetType `BIOLOGICAL_PHASE`)
  - `src/features/search/components/Autocomplete.tsx` — renders `notAnnotatable === false` as red/disabled
- **Triggered by:** Port of noctua-standard-annotations issue (geneontology/noctua#1040) into the React VPE.

## Current State
- **What works now:** Searching/prelookup in a `happens during` field already passes the field's `closureIds`/`rootTypeIds` (= `['GO:0044848']`) into both the search query and `makeSelectModelTerms`. The wiring is in place.
- **What's broken/missing:** Phase terms carry `gocheck_do_not_annotate`, so `mapGOlrResponse` marks them `notAnnotatable: false` and the Autocomplete renders them red + unclickable. The prelookup path hardcodes `notAnnotatable: true` and never distinguishes phase terms. Neither path acts on the phase category context, so phase terms cannot be picked for `happens during`.

## Decisions
- **Phase category set = all 3** stage types: `GO:0044848` (biological phase), `UBERON:0000105` (uberon/life stage), `PO:0009012` (plant stage) — matches this repo's `happensDuring` range in `nodeCategories.ts` (Angular only had the first two). Confirmed with user.

## Why it stays correct
The bypass keys on the **field's** `closureIds`, not on the term. A phase term `is_a` biological_process, so it can surface in a BP field (`closureIds: ['GO:0008150']`); there `allowNotAnnotatable` is false → it's correctly left do-not-annotate. Only a field whose closureIds include a phase category unlocks it.

## Steps

### Phase 1: Shared constant
- [x] In `cam.ts`, add `export const PHASE_CATEGORIES = new Set<string>([RootTypes.BIOLOGICAL_PHASE, RootTypes.UBERON_STAGE, RootTypes.PLANT_STAGE])`

### Phase 2: Type-ahead search path (= `_lookupMap` + `termLookup`)
- [x] `mapGOlrResponse(response, closureIds?: string[])` — `const allowNotAnnotatable = closureIds?.some(id => PHASE_CATEGORIES.has(id))`; set `notAnnotatable: allowNotAnnotatable || !item.subset?.includes('gocheck_do_not_annotate')`
- [x] In `lookupApiSlice.ts` `searchTerms.queryFn`, pass closure context: `mapGOlrResponse(response, closureIds)`
- [x] Confirm `getChemicalParticipants` caller (no arg) is unaffected — left untouched, optional param defaults to undefined

### Phase 3: Prelookup path (= `termPreLookup`)
- [x] In `makeSelectModelTerms`, compute `const allowNotAnnotatable = rootTypeIds.some(id => PHASE_CATEGORIES.has(id))` once
- [x] Per node: `const isPhase = node.rootTypes.some(rt => PHASE_CATEGORIES.has(rt))`; pass `notAnnotatable: allowNotAnnotatable || !isPhase` into `nodeToOption`
- [x] Add a `notAnnotatable` parameter to `nodeToOption` (replace hardcoded `true`)
- [x] **Did NOT touch the rootTypes-overlap filter** (see Failed Approaches)

### Phase 4: Verify
- [x] `npm run type-check` — passes
- [x] `npx eslint` on the 4 changed files — passes clean
- [ ] Phase terms appear + are selectable in `happens during` type-ahead (manual / runtime)
- [ ] Phase terms appear + selectable in `happens during` prelookup (on focus) (manual / runtime)
- [ ] Phase terms remain blocked (red) in the primary BP term field (manual / runtime)
- [ ] Non-phase relations (e.g. `has input`) still block do-not-annotate terms (manual / runtime)

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** ✅ TASK COMPLETE — all 4 edits made; type-check + eslint pass
- **Next immediate action:** Runtime verification in the app (the 4 unchecked manual checks)
- **Recent commands run:**
  - `npm run type-check` (pass)
  - `npx eslint <4 changed files>` (pass)
- **Uncommitted changes:** cam.ts, lookupServices.ts, lookupApiSlice.ts, camSlice.ts, this plan file
- **Environment state:** On branch issue-259-phase-term

## Failed Approaches
<!-- Carried over from the Angular task to avoid repeating -->

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Replace the rootTypes filter with node.category matching in the prelookup | User corrected: don't touch the filter, only fix `notAnnotatable` | 2026-03-17 (Angular) |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/models/cam.ts` | Add `PHASE_CATEGORIES` set | Done |
| `src/features/search/services/lookupServices.ts` | `mapGOlrResponse` closureIds + allowNotAnnotatable | Done |
| `src/features/search/slices/lookupApiSlice.ts` | Pass `closureIds` to `mapGOlrResponse` | Done |
| `src/features/gocam/slices/camSlice.ts` | `makeSelectModelTerms`/`nodeToOption` notAnnotatable logic | Done |

## Blockers
- None currently

## Notes
- `notAnnotatable` has inverted-sounding logic: `true` = annotatable, `false` = do-not-annotate. Autocomplete: `doNotAnnotate = option.notAnnotatable === false`.
- The `happens during` insert-menu item only targets `BIOLOGICAL_PHASE`, so an inserted node's `searchClosureIds` = `['GO:0044848']`. The other two stage types matter mainly for the prelookup `isPhase` check on model nodes loaded from the backend.
- Angular's `existence_overlaps` / `existence_starts_and_ends_during` relations **do not exist** in this repo (only `happens_during`), so there's nothing to port for them.
- No tests added unless requested.

## Additional Context (Claude)
- The two consumers share the same category context (`closureIds`/`rootTypeIds`) that's already threaded from `EntityRow` → `TermAutocomplete`; the entire change is making those two functions read the phase category. No new props or plumbing.
