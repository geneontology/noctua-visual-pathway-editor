# Task: Protein Complex form — surface MF + suppress recursive menus

**Status:** ACTIVE
**Issue:** — (from `downloads/notes`)
**Branch:** issue-220-update-codebase

## Goal

Two changes to the Protein Complex activity form:

1. **Add a molecular function menu.** Today the MF root in `proteinComplexActivity` is `visible: false`, so the user has no way to view/edit it. Surface it so the MF can be annotated normally.
2. **Stop recursive insertion menus.** Inside the Protein Complex form, the GP children currently re-offer `part of → Protein Complex` (creating a UI loop). Same in the normal form once the user adds `part of → Protein Complex` from a GP. Cut both off.

## Context

- **Related files:**
  - `src/features/gocam/data/activityTemplates.ts` (lines 59-84 — `proteinComplexActivity`: MF root with `visible: false`)
  - `src/features/gocam/data/insertMenuConfig.ts` (lines 49-60: `canInsertEntity[MOLECULAR_ENTITY]` has `part of → Protein Complex`; lines 62-73: `canInsertEntity[PROTEIN_CONTAINING_COMPLEX]` has `has part → Gene Product`)
  - `src/features/gocam/components/forms/EntityRow.tsx` — Add submenu construction
  - `src/features/gocam/components/forms/ActivityForm.tsx` (line 360-365 — the amber callout that hints `ActivityType.PROTEIN_COMPLEX` exists; lines 178-185 — section title switch)
  - `src/features/gocam/services/formUtils.ts` — ancestor info threading
- **Triggered by:** `downloads/notes`:
  > Protein complex form: Add molecular function menu
  > Protein-containing complexes: remove iterative menus
  >   i) in the protein complex form
  >   ii) in the normal form, when using enabler 'part of complex', no further menu should be available

## Open Question (Part 1 only)

"Add molecular function menu" is one line in the notes and admits two readings:

1. **Surface the existing MF root** by flipping `visible: false → true` so the MF row renders and gets its existing ellipsis menu (Search Annotations, Add Evidence, Fill with root, etc.). Lightest touch; matches the existing form architecture.
2. **Add a new insertion option** somewhere (e.g. extend `canInsertEntity[PROTEIN_CONTAINING_COMPLEX]` with an MF entry, or add a form-level "Add MF" button).

Recommendation: **(1).** Confirm before Phase 2 — if (2) is intended, the plan shape changes.

## Steps

### Phase 1: Surface the MF root (Part 1)

- [ ] In `activityTemplates.ts`, change `proteinComplexActivity.visible` from `false` to `true` (or remove it — `hydrateTemplate` defaults to `true`).
- [ ] Verify the MF row now renders as the first row of the Protein Complex form, above the ProteinComplex (enabled by) row.
- [ ] Confirm the section title (`sectionTitles.gp = 'Gene Product'`) still makes sense — for Protein Complex the GP row is actually the ProteinComplex. Consider adding a switch case for `ActivityType.PROTEIN_COMPLEX` in `ActivityForm.tsx:178-185`. Decide title; one-line edit if changing.

### Phase 2: Identify ancestor recursion path

`getInsertMenuItems(parentType, used)` looks at the parent's category only. So a GP child of a ProteinComplex (in either form) gets back the `part of → Protein Complex` entry — even though the GP is *already* under a ProteinComplex. The recursion is contextual: depends on whether any *ancestor* is PROTEIN_CONTAINING_COMPLEX.

### Phase 3: Thread ancestor context through GroupedRow

- [ ] Extend `GroupedRow` (in `formModels.ts`) with `ancestorTypes: Set<string>` (or `string[]` if a Set isn't serializable through Redux — but `GroupedRow` is computed in-component so a Set is fine).
- [ ] Populate `ancestorTypes` in `buildGroupedRows` (`formUtils.ts`) by accumulating during the tree walk.
- [ ] If [[row-menu-rules-by-relation]] also threads `parentCategory`, share the walk — don't rebuild twice.

### Phase 4: Suppress recursive insertion items in EntityRow

In `EntityRow.tsx`, the Add submenu (lines 290-309):

- [ ] Filter `insertMenuItems` to drop entries that would re-introduce an ancestor type:
  ```ts
  const filteredInserts = insertMenuItems.filter(item => !ancestorTypes.has(item.targetType))
  ```
- [ ] This single rule covers both cases:
  - GP inside a ProteinComplex: drops `part of → Protein Complex` because PROTEIN_CONTAINING_COMPLEX is an ancestor.
  - ProteinComplex inserted via `part of` from a GP in the normal form: its GP children would also have PROTEIN_CONTAINING_COMPLEX as an ancestor → same filter applies.

### Phase 5: Verify the rule doesn't over-fire

The "no recursion" rule could accidentally hide legitimate insertions in other parts of the tree (e.g. BP `part_of` BP is intentional nesting and shouldn't be filtered).

- [ ] Audit: list every `canInsertEntity` entry where `targetType` equals the parent type (i.e. self-recursive). Currently: `BIOLOGICAL_PROCESS.part_of → BIOLOGICAL_PROCESS`, `ANATOMICAL_ENTITY.part_of → ANATOMICAL_ENTITY`, `CELL_TYPE.part_of → ANATOMICAL_ENTITY` (not self), `CELLULAR_COMPONENT.part_of → ANATOMICAL_ENTITY` (not self).
- [ ] BP→BP nesting is legitimate. Don't filter on self-recursion alone — filter only on PROTEIN_CONTAINING_COMPLEX as the example.
- [ ] Safer: introduce an opt-in flag on `InsertMenuItem`, e.g. `suppressOnAncestor?: boolean`, and set it only on entries where recursion is meaningless (`part_of → PROTEIN_CONTAINING_COMPLEX` and `has_part → MOLECULAR_ENTITY`). Then the filter becomes:
  ```ts
  const filteredInserts = insertMenuItems.filter(item =>
    !(item.suppressOnAncestor && ancestorTypes.has(item.targetType))
  )
  ```

### Phase 6: Verify

- [ ] `npm run type-check` clean.
- [ ] `npm run lint` clean.
- [ ] Manual:
  - New Protein Complex activity → MF row visible and editable; ProteinComplex children (GPs) have no `part of → Protein Complex` insertion.
  - Normal activity → `part of → Protein Complex` from a GP → resulting ProteinComplex's GP children have no `part of → Protein Complex` either.
  - Nested BPs (BP `part_of` BP) still work normally — the filter doesn't fire here.
  - CC nesting still works (CC `part_of` Anatomical Entity, etc.).

## Recovery Checkpoint

- **Last completed action:** plan drafted from two `downloads/notes` bullets about the Protein Complex form.
- **Next immediate action:** Resolve Open Question (1) vs (2), then Phase 1 — flip MF visibility.
- **Recent commands run:** none.
- **Uncommitted changes:** none.
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| src/features/gocam/data/activityTemplates.ts | edit (Phase 1) | pending |
| src/features/gocam/components/forms/ActivityForm.tsx | edit (Phase 1 title + Phase 3 prop pass) | pending |
| src/features/gocam/data/insertMenuConfig.ts | edit (Phase 5 — add `suppressOnAncestor` flag) | pending |
| src/features/gocam/components/forms/EntityRow.tsx | edit (Phase 4) | pending |
| src/features/gocam/services/formUtils.ts | edit (Phase 3) | pending |
| src/features/gocam/models/formModels.ts | edit (Phase 3) | pending |

## Blockers

- Open Question (1) vs (2) for Part 1. Phase 1 assumes (1).

## Notes

- Land [[row-menu-rules-by-relation]] first so the `GroupedRow` / `EntityRow` plumbing is already extended; this plan only needs to add `ancestorTypes` on top.
- The `suppressOnAncestor` flag (Phase 5) is the more conservative implementation. The bare ancestor-filter (Phase 4) is one line but risks regressions on future tree shapes.
