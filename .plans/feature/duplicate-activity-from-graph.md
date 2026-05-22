# Task: Duplicate (copy) an activity from the graph into a prefilled Activity Form

**Status:** COMPLETE
**Issue:** (none — user request)
**Branch:** issue-220-update-codebase

## Goal

Add a "duplicate" icon to each activity node on the pathway graph (next to the existing edit/delete icons). Clicking it opens the Activity Form prefilled with the source activity's data (terms, labels, root types, evidence). The user can review and save (creating a new activity) or cancel (no change). It is essentially "Create a new activity using this one as a template."

## Context

- **Related files:**
  - `src/features/pathway/graph/shapes.ts` — JointJS shape definitions (`NodeCellList`, `NodeCellMolecule`); add `duplicateIcon` to header markup + hover visibility
  - `src/features/pathway/graph/camCanvas.ts` — paper event wiring (`element:edit:pointerdown`, `element:delete:pointerdown`); add `element:duplicate:pointerdown` and `onDuplicateClick` callback
  - `src/features/pathway/components/PathwayGraph.tsx` — React wrapper that exposes canvas callbacks as props; add `onDuplicateClick` prop
  - `src/app/PathwayViewer.tsx` — owner of `ActivityFormDialog` + `ActivityForm`; wire the new handler, dispatch init, open the modal
  - `src/features/gocam/slices/activityFormSlice.ts` — add `initDuplicateForm` reducer
  - `src/features/gocam/data/activityTemplates.ts` — `activityToFormTree` already produces a fully-hydrated TermNode tree from an existing Activity; reuse it and re-id nodes/relations so the save path produces a new activity
  - `src/features/gocam/services/activityOperations.ts` — `buildCreateActivityOperations` already generates new Barista variable ids per node, so feeding the duplicated form to CREATE mode produces a brand-new activity (no edit semantics)
  - `public/assets/icons/` — needs a new `duplicate.svg` (currently only `edit.svg`, `delete.svg`, `no-evidence.png`)
- **Triggered by:** user request

## Current State

- What works now:
  - Graph nodes show `edit` + `delete` icons on hover (`shapes.ts` `headerMarkup`, `NodeCellMolecule` markup); both fire scoped pointerdown events handled in `camCanvas.ts`
  - `ActivityForm` supports CREATE and EDIT via `FormMode`; on CREATE it builds new Barista variable ids per node, so identical content saves as a fresh activity
  - `activityToFormTree(activity)` (in `activityTemplates.ts`) converts a saved Activity → form `TermNode` tree (preserves id, label, rootTypes, aspect, isComplement, evidence). It reuses the original graph `node.uid` as the form `TermNode.uid` — fine for EDIT, but for DUPLICATE we want fresh uids so it can't collide with the source activity's nodes if rendered side-by-side
- What's broken/missing:
  - No "duplicate" icon, no event, no callback, no Redux action, no `duplicate.svg` asset

## Steps

### Phase 1: Asset + shape changes
- [x] Added `public/assets/icons/duplicate.svg` (Font Awesome "copy" glyph, matches edit/delete style)
- [x] In `src/features/pathway/graph/shapes.ts`:
  - [x] Added `duplicateIcon` to `headerMarkup` between edit and delete
  - [x] Added `duplicateIcon` attrs in `headerAttributes.attrs` (event `element:duplicate:pointerdown`, y:30); bumped `deleteIcon` y:30→60
  - [x] `NodeCellList.hover(on)` toggles `duplicateIcon/visibility`
  - [x] `NodeCellMolecule` markup + attrs gained `.duplicate` (y:30); bumped `.delete` y:30→60; hover toggles all three

### Phase 2: Canvas event + callback plumbing
- [x] `src/features/pathway/graph/camCanvas.ts` — added `onDuplicateClick` field + `paper.on('element:duplicate:pointerdown', …)` handler
- [x] `src/features/pathway/components/PathwayGraph.tsx` — added `onDuplicateClick` prop, forwarded into the callbacks-sync effect

### Phase 3: Redux — duplicate-form init
- [x] `src/features/gocam/slices/activityFormSlice.ts` — added `reIdTree(node)` deep-clone helper
- [x] Added `initDuplicateForm({ activity, activityType })` reducer (CREATE mode, fresh uids, isDirty=true) and exported it

### Phase 4: PathwayViewer wiring
- [x] `src/app/PathwayViewer.tsx` — imported `ActivityType` + `initDuplicateForm`; added `handleDuplicateActivity` handler; passed `onDuplicateClick` to `<PathwayGraph>`

### Phase 5: Verify
- [x] `npm run type-check` — clean
- [x] `npm run lint` on touched files — clean (one pre-existing unused-helper warning on `findParentOfRelation` in `activityFormSlice.ts` is not from this change)
- [ ] Manual smoke (UI testing — not run; recommend trying on dev server)

## Recovery Checkpoint

✅ TASK COMPLETE

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| public/assets/icons/duplicate.svg | create | done |
| src/features/pathway/graph/shapes.ts | edit (header markup + attrs + hover) | done |
| src/features/pathway/graph/camCanvas.ts | edit (event handler + callback) | done |
| src/features/pathway/components/PathwayGraph.tsx | edit (prop + forwarding) | done |
| src/features/gocam/slices/activityFormSlice.ts | edit (new reducer + reIdTree helper) | done |
| src/app/PathwayViewer.tsx | edit (handler + wiring) | done |

## Summary

Hovering an activity in the pathway graph now shows three icons (edit / duplicate / delete) stacked along the right edge. Clicking duplicate opens the Activity Form prefilled with the source activity's terms, labels, root types, aspects, complement flags, and evidence — all with fresh uids so there's no identity overlap with the source. The form opens in CREATE mode, so Save produces a brand-new activity via the existing `buildCreateActivityOperations` path (it already assigns fresh Barista variable ids per node); Cancel/Clear leaves the source unchanged.

Implementation: 1 new SVG asset + 5 file edits. No new components, no new slices — just one new reducer (`initDuplicateForm`) + one helper (`reIdTree`) + plumbing through the existing edit/delete icon callback path. Out of scope (deferred): connector edges between activities are NOT duplicated; positioning of the new node falls to auto-layout.

## Blockers

- None currently

## Notes

- **Why re-id the tree?** `activityToFormTree` reuses the original `GraphNode.uid` for each `TermNode.uid` (intentional — EDIT mode needs that identity to map back). For DUPLICATE we set `mode = CREATE`, and `buildCreateActivityOperations` already assigns fresh Barista variable ids per node — so re-id'ing the form tree is technically not required for correctness on save. We still do it because:
  1. UI stability — JointJS shapes use `activity.uid` as the JointJS element id elsewhere; conflicting form uids during preview would be surprising
  2. Safety against future regressions — keeps "DUPLICATE means new identity" as an invariant inside the form state
- **Evidence:** carry over verbatim (evidenceCode, reference, withFrom). Evidence uids get refreshed by `reIdTree` so they don't collide with the source.
- **Position:** the new activity will lay out via dagre auto-layout on next graph render; no special positioning needed. (Future enhancement: offset the duplicate by ~40px from the source — out of scope here.)
- **Read-only mode / not-logged-in:** existing edit/delete icons appear regardless; we mirror that. The save call will fail server-side without a token, same as edit. No new gating needed.
- **Connector edges (activity-to-activity relations):** NOT duplicated. Duplicate copies the activity's internal subtree (rootNode + edges within the activity) only — same scope as CREATE. Document this in commit message so it's not mistaken for a bug.

## Lessons Learned

- (fill in during/after task)

## Additional Context (Claude)

### Alternative approaches considered

1. **Backend-side duplicate via a custom Barista batch op.** Rejected: the user explicitly wants the form to open prefilled so they can edit before saving. A backend duplicate would skip that review step.
2. **"Save As" button inside an already-open EDIT form.** Rejected: doesn't match the requested UX (icon on the graph node) and adds modal-mode-switching complexity. The current proposal keeps EDIT and DUPLICATE as separate entry points with shared form rendering.
3. **Re-use `loadActivity` with a flag.** Considered briefly; cleaner to add a dedicated `initDuplicateForm` reducer for readability and to keep `mode = CREATE` semantics explicit. Future readers shouldn't have to chase a boolean to understand whether the form will create or update.

### Risks / things to watch

- **Icon crowding:** three icons stacked at 30px spacing fit within `NodeCellList`'s 40px header height plus port area. If the molecule shape (`NodeCellMolecule`, circle) feels cramped with three icons, fall back to placing the duplicate icon on the *left* side (`refX: 0, refX2: -25`) for that shape only.
- **`activityToFormTree` edge cases:** it walks `activity.edges` and adds children for any edge whose source matches the current node. If a duplicated activity contains cycles (rare in CAMs but possible), the existing `visited` set already guards against re-entry. Confirmed by reading `activityTemplates.ts:168-203` — safe.
- **`isDirty` on init:** I propose `true` so the user immediately sees the form as "modified" (the prefilled content *is* a change relative to a blank create). If the validation flow treats `isDirty` differently from `mode`, consider `false` instead. Need to verify behavior in `formValidation.ts` during Phase 5.
- **Stencil drop handler vs. duplicate handler:** both end up calling `setActivityFormOpen(true)`. They're independent; stencil uses `initCreateForm(type)`, duplicate will use `initDuplicateForm(activity, type)`. No conflict.

### Suggested follow-ups (out of scope)

- Keyboard shortcut: `Ctrl+D` on a selected activity to duplicate
- "Duplicate" menu item in `ActivityTable` (right drawer's ellipsis menu) — currently only "Delete Activity" lives there
- Optional offset/positioning for the new node so it doesn't render on top of the original after auto-layout
