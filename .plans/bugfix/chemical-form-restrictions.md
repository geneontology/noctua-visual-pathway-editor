# Task: Lock down the Chemical (Molecule) activity form + add closure exclusions

**Status:** COMPLETE (pending manual verification)
**Issue:** — (from `downloads/notes`, "Bugs or functionality that case annotation errors")
**Branch:** issue-220-update-codebase

## Goal

Two coupled changes:

1. **Chemical form menu cleanup.** When the user opens a Chemical (Molecule) activity, hide `Add ISS Evidence` and `Fill with root term`. (Note: per stakeholder direction during implementation, `Search Annotations` is left to follow the old-code rule of `!!node.aspect`, which already hides it on the chemical root since chemical entity has `aspect: null`.)
2. **Closure exclusions on GOlr term search and on local pre-lookups.** Chemical search was returning Gene Products (`CHEBI:33695` is a descendant of `CHEBI:24431`); CC search was returning Protein Complexes (`GO:0032991` is a descendant of `GO:0005575`). Both are fixed by an `excludeClosureIds` field on each node category that flows through to the GOlr query AND the local prelookup selector.

## Context

- **Triggered by:** "Chemical" sub-list in `downloads/notes`:
  > Remove 'Search Annotation', Remove 'Add ISS evidence', Remove fill with root, Only allow ChEBI terms and only use ChEBI for autofill.
- The shared `canAddISSEvidence(aspect, activityType)` predicate lives in `src/features/gocam/services/annotationRules.ts` and is consumed by `EntityRow`, `AnnotationForm`, and (transitively) `ActivityTableNode` via `useOpenAnnotationForm`.

## Steps

### Phase 1: Shared `canAddISSEvidence` predicate ✅

- [x] Create `src/features/gocam/services/annotationRules.ts` exporting `canAddISSEvidence(aspect, activityType) = !!aspect && activityType !== ActivityType.MOLECULE`.

### Phase 2: Gate Add ISS Evidence + Fill with root term ✅

- [x] `EntityRow.tsx`: reads `activityType` via `useAppSelector(selectFormType)`; gates the Add ISS Evidence and Fill-with-root-term menu items on `canAddISSEvidence(node.aspect, activityType)`.
- [x] `EntityRow.tsx`: Search Annotations stays gated on `node.aspect` only (old-code rule, per stakeholder direction). This means a chemical activity's `LOCATED_IN → CC` child still shows Search Annotations.
- [x] `AnnotationForm.tsx`: accepts new `activityType?: ActivityType | null` prop; gates the term-section `Fill with root term` and both `Add ISS` buttons (term + evidence section) on the same predicate.
- [x] `useOpenAnnotationForm.ts`: threads `activityType` through `customProps`.
- [x] `ActivityTableNode.tsx`: accepts `activityType: ActivityType` prop and passes it on every `openAnnotationForm` call and recursive child render.
- [x] `ActivityTable.tsx`: passes `activityType={activity.type}` to its `ActivityTableNode` children.

### Phase 3: Add `excludeClosureIds` to node categories ✅

- [x] `formModels.ts`: extend `NodeCategory` with `excludeClosureIds?: string[]`; extend `TermNode` with `excludeRootTypes?: string[]`.
- [x] `nodeCategories.ts`:
  - `chemicalEntity.excludeClosureIds = [RootTypes.MOLECULAR_ENTITY]` (CHEBI:24431 minus CHEBI:33695)
  - `cellularComponent.excludeClosureIds = [RootTypes.PROTEIN_CONTAINING_COMPLEX]` (GO:0005575 minus GO:0032991)
  - `getNodeCategory` return type widened to `(AnyCategory & NodeCategory) | undefined` so the new field is visible to consumers.
- [x] `activityTemplates.ts`: `hydrateTemplate` and `activityToFormTree` populate `excludeRootTypes` on every TermNode from the category's `excludeClosureIds`.

### Phase 4: Thread `excludeClosureIds` through the autocomplete ✅

- [x] `Autocomplete.tsx`: new `excludeRootTypeIds?: string[]` prop forwarded to `useSearchTermsQuery({ closureIds, excludeClosureIds })`.
- [x] `EntityRow.tsx`: passes `excludeRootTypeIds={node.excludeRootTypes}` to `TermAutocomplete`.

### Phase 5: Apply exclusion in the GOlr query ✅

- [x] `lookupApiSlice.ts`: `searchTerms` query now accepts `excludeClosureIds?`. The closure filter joins `isa_closure:"<id>"` clauses with `NOT isa_closure:"<excluded>"` clauses using a single ` OR ` separator — matching the literal `OR NOT` form from the old code (per stakeholder direction).

### Phase 6: Exclude prelookup terms locally ✅

This was discovered during testing — the GOlr exclusion only filtered remote results; the prelookup list (terms already in the model) still showed GPs in chemical autocomplete.

- [x] `camSlice.ts`: `makeSelectModelTerms()` now accepts a third arg `excludeRootTypeIds?: string[]` and drops nodes whose `rootTypes` overlap the exclusion set.
- [x] `EntityRow.tsx`: passes `node.excludeRootTypes` into the selector.

### Phase 7: Verify

- [x] `npm run type-check` clean.
- [x] `tests/features/gocam/services/formUtils.test.ts` and `tests/features/gocam/components/AnnotationForm.test.tsx` pass (39/39 across both).
- [ ] Manual + devtools network tab: chemical-root autocomplete request `fq` contains `isa_closure:"CHEBI:24431" OR NOT isa_closure:"CHEBI:33695"`; CC autocomplete contains the GO:0005575 / GO:0032991 pair.
- [ ] Manual: prelookup list on a chemical row contains no Gene Product entries from the model.
- [ ] Manual: in a Molecule activity, the CC child's ellipsis menu has no `Add ISS Evidence` and no `Fill with root term`. `Search Annotations` is present (intended).
- [ ] Manual: AnnotationForm opened from the activity table for a chemical activity hides `Fill with root term` and both `Add ISS` buttons.

## Recovery Checkpoint

- **Last completed action:** all code phases done; type-check + touched tests green.
- **Next immediate action:** manual verification in the dev server (Phase 7 unchecked items).
- **Recent commands run:** `npm run type-check`, `npx vitest run tests/features/gocam/components/AnnotationForm.test.tsx tests/features/gocam/services/formUtils.test.ts`.
- **Uncommitted changes:** ten files (see Files Modified).
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Hide Search Annotations in Molecule via `activityType !== MOLECULE` gate. | Stakeholder confirmed the old-code rule is just `node.aspect`. Reverted that part of the gate; left only Add ISS + Fill-with-root behind the Molecule check. | 2026-05-23 |
| Compute `parentCategory` / `isNestedBp` / `isHappensDuring` predicates in EntityRow to drive the Fill-with-root and Add ISS gates. | Stakeholder rejected the parent-category plumbing as overbuilt — happens-during is already filtered for free by `BIOLOGICAL_PHASE.aspect = null`, and nested-BP doesn't need a special case. | 2026-05-23 |
| AND-NOT idiom (`-isa_closure:"<id>"` in a separate `fq` clause) for the GOlr exclusion. | Stakeholder cited the old Angular `OR NOT` form. Switched to the literal `OR NOT` join. | 2026-05-23 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| src/features/gocam/services/annotationRules.ts | create | done |
| src/features/gocam/models/formModels.ts | edit (NodeCategory + TermNode fields) | done |
| src/features/gocam/data/nodeCategories.ts | edit (excludeClosureIds + return type) | done |
| src/features/gocam/data/activityTemplates.ts | edit (populate excludeRootTypes) | done |
| src/features/gocam/slices/camSlice.ts | edit (makeSelectModelTerms 3rd arg) | done |
| src/features/search/components/Autocomplete.tsx | edit (excludeRootTypeIds prop) | done |
| src/features/search/slices/lookupApiSlice.ts | edit (OR NOT filter) | done |
| src/features/gocam/components/forms/EntityRow.tsx | edit (canAddISSEvidence gates, excludeRootTypeIds wire-through) | done |
| src/features/gocam/components/forms/AnnotationForm.tsx | edit (activityType prop, button gates) | done |
| src/features/gocam/hooks/useOpenAnnotationForm.ts | edit (activityType param + customProps) | done |
| src/features/gocam/components/ActivityTableNode.tsx | edit (activityType prop, thread to openAnnotationForm + children) | done |
| src/features/gocam/components/ActivityTable.tsx | edit (pass activityType to ActivityTableNode) | done |
| tests/features/gocam/components/AnnotationForm.test.tsx | edit (pass aspect on the 4 tests that exercise ISS/Fill buttons) | done |

## Blockers

- None.

## Notes

- The exclusion belongs on the category, not on the form. Once `excludeClosureIds` was added to `nodeCategories.ts`, every consumer that resolves a category (autocomplete query, prelookup selector, form template hydration) picks it up automatically.
- The Chemical-form `Search Annotations` carve-out (kept on the CC child) is a deliberate divergence from the literal note text — the stakeholder confirmed it during implementation.
- The shared `canAddISSEvidence` helper also covers the menu-reorg work from [[row-menu-rules-by-relation]] (Add ISS moved into the Evidence submenu); that plan is now also COMPLETE.
