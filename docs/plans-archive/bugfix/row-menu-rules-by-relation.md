# Task: EntityRow menu rules — move Add ISS under Evidence; gate Fill-with-root

**Status:** COMPLETE (pending manual verification — see [[chemical-form-restrictions]] Phase 7)
**Issue:** — (from `downloads/notes`)
**Branch:** issue-220-update-codebase

## Goal (original)

Three menu-item changes in `EntityRow`:

1. **Hide "Fill with root term"** on nested BPs (BP child of BP) and on `happens during` targets.
2. **Move "Add ISS Evidence"** out of its standalone position and into the existing "Evidence" submenu, alongside Add / Remove / Clone Evidence.
3. **Ensure "Add ISS Evidence" appears on nested BPs**, but not on `happens during` targets.

## What actually shipped

The plan as drafted built a `parentCategory` thread + `isNestedBp` / `isHappensDuring` predicates. During implementation the stakeholder rejected that approach as overbuilt. The signals were collapsed into one shared predicate:

- `canAddISSEvidence(aspect, activityType) = !!aspect && activityType !== ActivityType.MOLECULE` — lives in `src/features/gocam/services/annotationRules.ts`.

This single check handles all three original requirements naturally:

- **Goal 1 (Fill-with-root on nested BPs and happens-during):** dropped the nested-BP carve-out per stakeholder — "we don't care if nested or not." `happens during` targets are `BIOLOGICAL_PHASE` which has `aspect: null`, so they fail the `!!aspect` check automatically. Fill-with-root is now gated on `canAddISSEvidence && relation`.
- **Goal 2 (Move Add ISS under Evidence submenu):** done in `EntityRow.tsx`. The standalone Menu.Item is gone; the new one sits inside the Evidence `<Menu.Sub>` after "Add Evidence", gated on `canAddISSEvidence`.
- **Goal 3 (Add ISS on nested BPs, not happens-during):** nested BPs have `aspect: BIOLOGICAL_PROCESS` → pass; happens-during targets have `aspect: null` → fail. No explicit predicate needed.

## Steps

### Phase 1: Move Add ISS Evidence into the Evidence submenu ✅

- [x] In `EntityRow.tsx`, the Evidence `<Menu.Sub>` now lists Add Evidence / Add ISS Evidence (gated) / Remove Evidence / Clone Evidence.
- [x] Standalone top-level "Add ISS Evidence" Menu.Item deleted.

### Phase 2: Gate Add ISS Evidence + Fill with root term ✅

- [x] Both gated on `canAddISSEvidence(node.aspect, selectFormType)`.
- [x] Fill-with-root additionally requires `relation` (no change from before).
- [x] Search Annotations is gated on `node.aspect` only (old-code rule, confirmed by stakeholder).

### Phase 3: Verify

- [x] `npm run type-check` clean.
- [x] `formUtils.test.ts` 18/18 pass; `AnnotationForm.test.tsx` 21/21 pass.
- [ ] Manual: nested BP row's Evidence submenu shows "Add ISS Evidence".
- [ ] Manual: happens-during target row (BIOLOGICAL_PHASE under MF) — Evidence submenu shows Add/Remove/Clone but no "Add ISS Evidence"; no "Fill with root term".
- [ ] Manual: top-level MF/BP/CC rows show all four Evidence items + "Fill with root term".

## Recovery Checkpoint

- **Last completed action:** code complete; type-check + touched tests green.
- **Next immediate action:** manual verification (rolled into [[chemical-form-restrictions]] Phase 7 — same set of manual checks covers both plans).
- **Recent commands run:** `npm run type-check`, `npx vitest run tests/features/gocam/components/AnnotationForm.test.tsx tests/features/gocam/services/formUtils.test.ts`.
- **Uncommitted changes:** rolled into [[chemical-form-restrictions]]'s file list.
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Thread `parentCategory: string \| null` through `GroupedRow` → `GroupCard` → `EntityRow`; compute `isNestedBp = node.category === BIOLOGICAL_PROCESS && parentCategory === BIOLOGICAL_PROCESS`. | Stakeholder rejected as overbuilt. "Why do we care if nested or not." Reverted the `parentCategory` thread entirely. | 2026-05-23 |
| Compute `isHappensDuring = relation?.predicate.id === Relations.HAPPENS_DURING` and use it as an explicit gate. | Stakeholder rejected enumerating specific relations. "There are many" relations whose targets aren't annotatable; the right signal is `!!node.aspect` which BIOLOGICAL_PHASE's `aspect: null` already handles. | 2026-05-23 |
| Initial predicate name `canAnnotateRow`. | Stakeholder asked for a name specific to the use case. Renamed to `canAddISSEvidence` and moved into a shared service file so AnnotationForm + ActivityTableNode can reuse. | 2026-05-23 |

## Files Modified

See [[chemical-form-restrictions]] — the menu-reorg edits to `EntityRow.tsx` and the new `services/annotationRules.ts` helper are shared between the two plans and listed there.

## Blockers

- None.

## Notes

- This plan's scope folded into [[chemical-form-restrictions]] during implementation because the same shared `canAddISSEvidence` helper drives both the chemical-form lockdown and the menu-reorg gates. The plans are listed separately for traceability against the original `downloads/notes` bullets, but the implementation is one cohesive change.
- The original plan's premise — that nested-BP and happens-during needed bespoke predicates — turned out to be wrong. The right rule is "does this row have an aspect?", which is a single bit that covers both cases.

## Lessons Learned

- When the notes name specific cases ("nested BPs", "happens during"), look for the deeper signal those cases have in common before reaching for ad-hoc predicates. Here, both cases collapsed into "does the node have a GO aspect."
- Don't thread tree context (parentCategory, ancestor lists) through props until a use case demands it. Most rules end up driven by node-local fields.
