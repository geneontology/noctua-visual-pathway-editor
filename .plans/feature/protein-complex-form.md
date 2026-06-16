# Task: Protein Complex form — surface MF + suppress recursive menus

**Status:** COMPLETE (pending manual verification)
**Issue:** — (from `downloads/notes`)
**Branch:** issue-220-update-codebase

## Goal

Two changes to the Protein Complex activity form, matching the old Angular site behavior:

1. **Surface the MF root.** Today `proteinComplexActivity.visible = false` hides the MF row; the user has no way to view/edit the MF in this form. Old Angular form config (`xje` in the bundled JS) has MF as a visible node with `displaySection: fd`. Flip visibility back on.
2. **Stop recursive insertion menus.** Both:
   - In the protein complex form: GP children of the ProteinComplex (reached via `has_part`) currently re-offer `part of → Protein Complex` insertion. Suppress.
   - In the normal form: a ProteinComplex inserted via `part_of` from a GP currently re-offers `has_part → Gene Product` insertion. Suppress.

## Approach

Old Angular code's signal for "is recursion safe here" was effectively `activityType + entity.type`. The equivalent in the React tree — without threading ancestor context through props — is `relation.predicate.id`: the predicate that brought us to this node already encodes whether we're inside a complex or not.

Two suppression rules, both colocated with `getInsertMenuItems` in `insertMenuConfig.ts`:

- Reached via `has_part` → drop `part_of → ProteinComplex` insertion.
- Reached via `part_of` → drop `has_part → GP` insertion.

Both signals are already props on `EntityRow` (`relation.predicate.id`) and on `ActivityTableNode` (`edge?.id`). No new threading.

## Steps

### Phase 1: Surface the MF root ✅

- [x] `activityTemplates.ts`: removed `visible: false` from `proteinComplexActivity`. Default in `hydrateTemplate` is `true`, so MF now renders as the first row (FD section).
- [x] Section title untouched — old Angular bundle uses "Gene Product" generically across forms; no PROTEIN_COMPLEX-specific case added.

### Phase 2: Recursion-suppression rules in getInsertMenuItems ✅

- [x] `insertMenuConfig.ts`: `getInsertMenuItems` accepts a new optional third arg `reachedViaPredicateId?: string`. A helper `isRecursiveInsertion` returns true for the two cases above.
- [x] `EntityRow.tsx`: passes `relation?.predicate.id` as the third arg.
- [x] `ActivityTableNode.tsx`: passes `edge?.id` as the third arg.

### Phase 3: Tests ✅

- [x] `tests/features/gocam/data/insertMenuConfig.test.ts`: five new tests covering the two suppressions, two negative-case "still offered" checks, and a BP→BP legitimate-recursion check. 5/5 pass.
- [x] `tests/features/gocam/slices/activityFormSlice.test.ts`: updated the `proteinComplex template` assertion from `root.visible === false` to `root.visible === true`.

### Phase 4: Verify

- [x] `npm run type-check` clean.
- [x] All touched tests pass (formUtils 18/18, AnnotationForm 21/21, insertMenuConfig 5/5, activityFormSlice — pre-existing fillRootTerm failure unchanged).
- [ ] Manual:
  - New Protein Complex activity → MF row visible and editable; ProteinComplex children (GPs) have no `part of → Protein Complex` insertion.
  - Normal activity → `part of → Protein Complex` from a GP → resulting ProteinComplex's GP children have no `part of → Protein Complex` either (and the ProteinComplex itself has no `has part → GP` insertion).
  - Nested BPs (BP `part_of` BP) still work normally — the filter doesn't fire here.
  - CC nesting still works (CC `part_of` Anatomical Entity, etc.).
  - Table-edit surface (ActivityTableNode menus) shows the same suppression — relevant when a user opens an existing protein complex activity from the table.

## Recovery Checkpoint

- **Last completed action:** code complete; type-check + tests green.
- **Next immediate action:** manual verification — open a Protein Complex activity in dev server and confirm menu behavior matches the bullets above.
- **Recent commands run:** `npm run type-check`, `npx vitest run tests/features/gocam/data/insertMenuConfig.test.ts tests/features/gocam/slices/activityFormSlice.test.ts`.
- **Uncommitted changes:** five files (see Files Modified).
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Thread `ancestorTypes: Set<string>` through `GroupedRow` → `EntityRow` and filter on `ancestorTypes.has(item.targetType)`. | Reintroduces the kind of plumbing the user rejected on [[row-menu-rules-by-relation]]. The old Angular code didn't track ancestors either — it used `activityType + entity.type`, and the equivalent React signal is `relation.predicate.id`. | 2026-05-24 |
| Add a `suppressOnAncestor?: boolean` flag to `InsertMenuItem` and combine with ancestor thread. | Same plumbing cost. The `relation.predicate.id` signal is enough without any new data field. | 2026-05-24 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| src/features/gocam/data/activityTemplates.ts | edit (remove `visible: false`) | done |
| src/features/gocam/data/insertMenuConfig.ts | edit (`reachedViaPredicateId` arg + `isRecursiveInsertion` helper) | done |
| src/features/gocam/components/forms/EntityRow.tsx | edit (pass `relation?.predicate.id`) | done |
| src/features/gocam/components/ActivityTableNode.tsx | edit (pass `edge?.id`) | done |
| tests/features/gocam/data/insertMenuConfig.test.ts | create (5 tests) | done |
| tests/features/gocam/slices/activityFormSlice.test.ts | edit (flip protein-complex visibility assertion) | done |

## Blockers

- None.

## Notes

- The "match the old Angular site" direction was decisive: the old code's behavior was clear from the bundled JS (`xje` config has MF visible; `displayAddButton` only goes true for ProteinComplex in protein-complex form). The implementation tracks that behavior without porting the old `displayAddButton` mechanism literally — instead it uses `relation.predicate.id` as a structurally simpler equivalent.
- The recursion-suppression rule lives in `insertMenuConfig.ts` next to the `canInsertEntity` data, which makes it easy to find and easy to test independently. Two-rule helper is intentional (not a generic ancestor-based rule) so legitimate recursions like BP→BP aren't accidentally caught.

## Lessons Learned

- "Match the old site" beats "design the right abstraction" when the old behavior is correct and well-defined — saves an iteration of guessing at the rule shape.
- `relation.predicate.id` is a load-bearing signal in this codebase; many rules that look like they need ancestor context actually only need "what brought me here."
