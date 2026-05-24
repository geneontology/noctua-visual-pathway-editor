# Task: EntityRow menu rules driven by relation predicate + ancestor context

**Status:** ACTIVE
**Issue:** — (from `downloads/notes`)
**Branch:** issue-220-update-codebase

## Goal

Three menu-item changes in `EntityRow` that all need the same infrastructure (parent category + relation predicate threaded into the row):

1. **Hide "Fill with root term"** on nested BPs (BP child of BP) and on `happens during` targets.
2. **Move "Add ISS Evidence"** out of its standalone position and into the existing "Evidence" submenu, alongside Add / Remove / Clone Evidence.
3. **Ensure "Add ISS Evidence" appears on nested BPs**, but not on `happens during` targets. Make the exclusion explicit (today it's hidden only by accident of aspect=null on BIOLOGICAL_PHASE).

One PR, one set of changes to `EntityRow`, three correct menus.

## Context

- **Related files:**
  - `src/features/gocam/components/forms/EntityRow.tsx` — primary file. Today: line 311-326 "Evidence" submenu, line 329 "Fill with root term", line 332 "Add ISS Evidence".
  - `src/features/gocam/components/forms/ActivityForm.tsx` — `GroupCard` is where parent-context needs to be threaded down.
  - `src/features/gocam/services/formUtils.ts` — `buildGroupedRows` already produces `GroupedRow`; extend with `parentCategory`.
  - `src/features/gocam/models/formModels.ts` — `GroupedRow` type definition.
  - `src/features/gocam/data/nodeCategories.ts` — confirm BP `aspect: BIOLOGICAL_PROCESS`, BIOLOGICAL_PHASE `aspect: null`.
  - `src/@noctua.core/models/relations.ts` — `Relations.HAPPENS_DURING`, `Relations.PART_OF`.
- **Triggered by:** Three bullets in `downloads/notes`:
  > Nested BPs and 'happens during': remove 'Fill with Root' menu
  > move 'Add ISS evidence' under 'Add Evidence': this needs to be done for: MF, BP, CC and both under Add and Edit menus
  > Add the menu to 'Add ISS evidence' for nested BPs (not 'happens during' because there should be no direct annotations available)

## Current State

- "Fill with root term" (line 329) shows whenever `node.aspect && relation`. Nested BPs satisfy that and shouldn't.
- "Add ISS Evidence" (line 332) sits as a sibling Menu.Item at top level; should live under the Evidence submenu.
- The `happens during` exclusion happens only by accident — BIOLOGICAL_PHASE has `aspect: null`, so the `node.aspect &&` gate hides it. Make the rule intent-explicit.

## Steps

### Phase 1: Thread parent category + activityType to EntityRow

Today `EntityRow` gets `node`, `relation`, `parentTermUid` but not the parent's category.

- [ ] Extend `GroupedRow` (in `formModels.ts`) with `parentCategory: string | null`.
- [ ] Populate it in `buildGroupedRows` (`formUtils.ts`) — walk the tree and record each child's parent category.
- [ ] Add `parentCategory` to `EntityRowProps` and pass through `GroupCard` in `ActivityForm.tsx`.
- [ ] (Optional, for downstream plans) Also pass `activityType` — or read it via `useAppSelector(selectFormType)` inside `EntityRow`. Recommend the selector to avoid prop drilling for a global form attribute.

### Phase 2: Compute shared predicates

In `EntityRow.tsx`, near the top of the component:

```ts
const isNestedBp =
  node.category === RootTypes.BIOLOGICAL_PROCESS &&
  parentCategory === RootTypes.BIOLOGICAL_PROCESS
const isHappensDuring = relation?.predicate.id === Relations.HAPPENS_DURING
```

- [ ] Both predicates are reused across Phases 3-5; keep them named and adjacent.

### Phase 3: Hide "Fill with root term" appropriately

- [ ] Change line 329's gate from `{node.aspect && relation && ...}` to also exclude `isNestedBp` and `isHappensDuring`.
- [ ] Grep for any other call site that renders "Fill with root term" — none expected, confirm.

### Phase 4: Move "Add ISS Evidence" under the Evidence submenu

- [ ] Inside the Evidence `<Menu.Sub>` (lines 311-326), add `<Menu.Item onClick={handleAddISSEvidence}>Add ISS Evidence</Menu.Item>` after "Add Evidence" so the order reads Add / Add ISS / Remove / Clone.
- [ ] Delete the standalone Menu.Item at line 332.
- [ ] The Evidence submenu is currently gated by `relation &&` (line 311). That's the right scope — keep it. Add `node.aspect &&` if you want to mirror today's behavior of hiding the whole submenu on aspect-less rows; but in practice, the submenu shows up on those rows already (clone, etc. work on any evidence-bearing relation), so leave the existing gate alone.

### Phase 5: Exclude `happens during` from Add ISS Evidence

- [ ] Wrap the new "Add ISS Evidence" Menu.Item in `!isHappensDuring && ...`.
- [ ] This makes the rule explicit instead of relying on aspect-null. The other Evidence-submenu items (Add Evidence, Remove, Clone) stay available on `happens during` rows — they bear evidence on the relation itself, which is a separate concept from ISS-evidence-for-a-term-annotation.

### Phase 6: Verify nested BPs still see Add ISS Evidence

- [ ] Manually exercise: open an MF activity → `part_of → BP` → another `part_of → BP` under that BP. Confirm the nested BP's ellipsis → Evidence submenu shows "Add ISS Evidence".
- [ ] If it doesn't, the hidden gate is somewhere else (likely in `addRelationForm` not preserving `target.aspect`). Trace via `activityFormSlice.ts` and fix in this PR.

### Phase 7: Verify

- [ ] `npm run type-check` clean.
- [ ] `npm run lint` clean.
- [ ] Manual checklist:
  - Top-level MF row: Evidence submenu has Add / Add ISS / Remove / Clone. "Fill with root term" available.
  - Nested BP row (BP under BP): Evidence submenu has Add ISS. No "Fill with root term".
  - `happens during` target (BIOLOGICAL_PHASE under MF): Evidence submenu either absent (no aspect) or has no Add ISS. No "Fill with root term".
  - CC row (top-level): no change from before.
  - Edit-mode form: same menus as Create-mode (per notes: "both under Add and Edit menus").

## Recovery Checkpoint

- **Last completed action:** Phases 1-5 implemented. `npm run type-check` clean. `formUtils.test.ts` 18/18 pass.
  - `formModels.ts`: `GroupedRow.parentCategory: string | null` added.
  - `formUtils.ts`: `buildGroupedRows` populates `parentCategory` from the parent node during the walk.
  - `ActivityForm.tsx`: `GroupCard` threads `parentCategory={row.parentCategory}` into `EntityRow`.
  - `EntityRow.tsx`:
    - New prop `parentCategory?: string | null`.
    - Computes `isNestedBp = node.category === BIOLOGICAL_PROCESS && parentCategory === BIOLOGICAL_PROCESS`.
    - Computes `isHappensDuring = relation?.predicate.id === HAPPENS_DURING`.
    - "Add ISS Evidence" moved inside the Evidence submenu, gated by `node.aspect && !isHappensDuring && !isMoleculeForm`.
    - Standalone "Add ISS Evidence" Menu.Item deleted.
    - "Fill with root term" gate now also excludes `isNestedBp` and `isHappensDuring`.
- **Next immediate action:** Phase 6 — manual verification in dev server (nested BP shows Add ISS in Evidence submenu; happens-during target doesn't).
- **Recent commands run:** `npm run type-check`, `npx vitest run tests/features/gocam/services/formUtils.test.ts`.
- **Uncommitted changes:** four files above.
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| src/features/gocam/components/forms/EntityRow.tsx | edit | pending |
| src/features/gocam/components/forms/ActivityForm.tsx | edit | pending |
| src/features/gocam/services/formUtils.ts | edit | pending |
| src/features/gocam/models/formModels.ts | edit | pending |

## Blockers

- None.

## Notes

- Land this before [[chemical-form-restrictions]] so the parent-context plumbing is in place; the Chemical plan adds an `activityType === MOLECULE` gate on top of these same Menu.Items.
- Land this before [[protein-complex-form]] for the same reason — the recursive-menu suppression needs ancestor context.
