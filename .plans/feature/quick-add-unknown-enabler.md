# Task: Quick-add "unknown enabler" (PR:000000001) from the enabler row menu

**Status:** COMPLETE
**Issue:** #279
**Branch:** issue-279-unknown-enabler

## Goal
Add a "Fill with unknown enabler" option to the enabler row's "more actions"
(ellipsis) menu that autofills the enabler term with the generic protein
`PR:000000001` ("protein"). Aligns with GAF/GPI specs and makes Noctua rules
easier (an enabler is a protein, never a ChEBI chemical).

## Context
- **Related files:**
  - `src/features/gocam/data/camConstants.ts` — new `UNKNOWN_ENABLER` constant
  - `src/features/gocam/slices/activityFormSlice.ts` — new `fillUnknownEnabler` reducer
  - `src/features/gocam/components/forms/EntityRow.tsx` — new menu item + `enablerNodeUid` prop
  - `src/features/gocam/components/forms/ActivityForm.tsx` — resolves enabler uid, threads it down
- **Triggered by:** GitHub issue #279

## Current State
- What works now: the GP enabler row's ellipsis menu shows "Fill with unknown
  enabler" (placed **below** "Add Context"); clicking it sets the term to
  `PR:000000001` / "protein" and marks the form dirty.
- What's broken/missing: nothing outstanding for the issue scope.

## Design decisions
- **Scope: Gene Product enabler only.** The enabler is the `enabled_by` target.
  We gate on `category === RootTypes.MOLECULAR_ENTITY`, so it appears for the
  regular Activity form's enabler but not a protein-complex enabler (a complex
  isn't a PR protein, and that row renders an insert-only `+` menu anyway) nor
  the molecule form (no `enabled_by`).
- **Identification:** `ActivityForm` already resolves the `enabled_by` target
  (`gpNode`). We derive `enablerNodeUid` from it (gated on GP category) and pass
  it through `GroupCard` → `EntityRow`. `EntityRow` shows the item when
  `node.uid === enablerNodeUid`.
- **Term only, no evidence.** Unlike "Fill with root term", this only sets the
  term. The enabler's evidence lives on the MF row's `enabled_by` edge; the issue
  only asked to autofill the protein.
- **Menu placement:** below the "Add Context" submenu (per request), before the
  Evidence submenu.

## Steps

### Phase 1: Data + state — DONE
- [x] Add `UNKNOWN_ENABLER = { id: 'PR:000000001', label: 'protein' }` to `camConstants.ts`
- [x] Add `fillUnknownEnabler({ termUid })` reducer + export in `activityFormSlice.ts`

### Phase 2: UI wiring — DONE
- [x] `EntityRow`: `enablerNodeUid` prop, `isEnabler` flag, handler, menu item below "Add Context"
- [x] `ActivityForm`: derive `enablerNodeUid` (GP-gated), thread through `GroupCard` to both render sites

### Phase 3: Verify — DONE
- [x] `npm run type-check` clean
- [x] Existing `EntityRow` (36) + `activityFormSlice` (35) tests pass

### Phase 4: Tests — DONE
- [x] `activityFormSlice.test.ts`: `fillUnknownEnabler` sets PR:000000001 on the
      enabler + flips dirty; unknown uid is a no-op (35 → 37 tests)
- [x] `EntityRow.test.tsx`: "Fill with unknown enabler" present on the enabler
      row, absent without/with-mismatched `enablerNodeUid`, absent on complex
      rows, and click dispatches `fillUnknownEnabler` (36 → 41 tests)
- [x] Full suite: 800 tests pass

## Recovery Checkpoint

> ✅ TASK COMPLETE

- **Last completed action:** moved the "Fill with unknown enabler" item below
  "Add Context" in `EntityRow.tsx`.
- **Next immediate action:** none (pending optional tests + commit per user).
- **Uncommitted changes:** `camConstants.ts`, `activityFormSlice.ts`,
  `EntityRow.tsx`, `ActivityForm.tsx`, this plan file.

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/data/camConstants.ts` | Add `UNKNOWN_ENABLER` constant | Done |
| `src/features/gocam/slices/activityFormSlice.ts` | Add `fillUnknownEnabler` reducer + export | Done |
| `src/features/gocam/components/forms/EntityRow.tsx` | `enablerNodeUid` prop + menu item | Done |
| `src/features/gocam/components/forms/ActivityForm.tsx` | Resolve enabler uid, thread down | Done |

## Blockers
- None

## Notes
- `PR:000000001` is the root of the Protein Ontology ("protein"); it is the
  canonical "unknown/generic protein" enabler.
- Works in both create and edit mode: in edit mode `getPrimaryRootType` resolves
  a gene product's inferred type set (`[MOLECULAR_ENTITY, CHEMICAL_ENTITY]`) to
  `MOLECULAR_ENTITY`, so the gate still matches.

## Summary
Added a one-click "Fill with unknown enabler" to the Gene Product enabler row's
ellipsis menu (below "Add Context"), backed by a new `fillUnknownEnabler` reducer
and `UNKNOWN_ENABLER` constant. Scoped to the GP enabler; complex/molecule forms
excluded. Type-check and existing tests pass.

## Follow-up (optional, not done — user to confirm)
- Manual QA in the running app.
- Commit (branch `issue-279-unknown-enabler`).
