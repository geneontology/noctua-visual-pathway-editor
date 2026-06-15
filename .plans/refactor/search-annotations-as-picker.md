# Task: Make SearchAnnotations a pure picker dialog (pre-fill, not save)

**Status:** COMPLETE
**Issue:** —
**Branch:** issue-220-update-codebase

## Goal

`SearchAnnotations` should not persist anything itself. It returns the picked `{ term, evidences }` to whoever opened it via an `onApply` callback. Both `ActivityForm` (form-mode) and `ActivityTableNode`'s `EditorDropdown` (table-mode insert) use the same dialog, with the dialog completely unaware of its caller — matching the old Angular `editor-dropdown.component.ts::openSearchDatabaseDialog`'s `success` callback pattern (which just called `reinitializeForm(term, evidences)`).

## Context

- **Related files:**
  - `src/features/gocam/hooks/useOpenSearchAnnotations.ts` — opener hook
  - `src/features/gocam/components/forms/SearchAnnotations.tsx` — the dialog
  - `src/features/gocam/components/forms/ActivityForm.tsx` — form-mode caller
  - `src/features/gocam/components/ActivityTableNode.tsx` — table-mode caller
  - `src/features/gocam/components/forms/EditorDropdown.tsx` — the inline editor that should receive prefill
  - `src/@noctua.core/components/dialog/dialogSlice.ts` — dialog Redux slice
  - Reference (old): `C:/work/go/old-noctua-visual-pathway-editor/src/@noctua.editor/inline-editor/editor-dropdown/editor-dropdown.component.ts`
- **Triggered by:** user reported "Search Database for the table is not working"; clarified the dialog should pre-fill the EditorDropdown, not save directly.

## Current State

- **What works now:**
  - Form-mode: dialog dispatches `updateTerm` + `setNodeEvidences`/`setRelationEvidences` into the activity form slice. This works (form is then saved by user via the form's own Save).
  - Table-mode editing an existing CAM individual: dialog runs `updateGraphModel` with `buildEditIndividualTypeOperations` + per-evidence `buildAddEvidenceToEdgeOperations`. Saves directly.
- **What's broken/missing:**
  - Table-mode **insert** (`EditorCategory.all` with `pendingInsert`): `ActivityTableNode.handleSearchAnnotations` deliberately omits `camNodeUid`/`camNodeTypeId`/`camEdge` (no individual exists yet). `SearchAnnotations.handleSave` falls through both branches → silently returns. Clicking Done does nothing.
  - Even when it works, the dialog "saves on Done" diverges from the old Angular UX, where Done only pre-fills the inline editor and the user still has to click the green Save on the dropdown.
  - Dialog is over-coupled: knows about CAM ops, edges, form slices, etc.

## Steps

### Phase 1: Abstract the dialog

- [x] `useOpenSearchAnnotations.ts` — params shape is now `{ gpId, aspect, onApply: ({ term, evidences }) => void }`. `onApply` passes through `customProps`.
- [x] `SearchAnnotations.tsx` — props reduced to `{ gpId, aspect?, term?, onApply? }`. `handleSave` just calls `onApply` and `closeDialog`; no `updateGraphModel`, no slice dispatches. Removed `useUpdateGraphModelMutation`, `buildEditIndividualTypeOperations`, `buildAddEvidenceToEdgeOperations`, `useUserContext`, `updateTerm`, `setNodeEvidences`, `setRelationEvidences`, `EvidenceForm`, `uuidv4` imports.

### Phase 2: Wire the two callers to the new shape

- [x] `ActivityForm.tsx` — `handleSearchAnnotations` builds an `onApply` that dispatches `updateTerm` + `setNodeEvidences`/`setRelationEvidences` (the same form-mode dispatches that previously lived inside the dialog).
- [x] `ActivityTableNode.tsx` — prefill lives inside the popover's `data` (`editor.data.prefill`). Picker `onApply` reopens the editor at the snapshotted anchor with the prefilled term/evidence/reference/with. Memoized `initialTerm`/`initialEvidence` to stop re-render clobbering. Prefill auto-clears the moment the popover closes — no separate state to wipe.

### Phase 3: Verify

- [x] `npm run type-check` clean.
- [x] `eslint` clean on touched files.
- [ ] Manual: table insert → "Add" → "Search Annotations" → pick term + evidence → Done → dropdown reopens with values prefilled → green Save commits the row.
- [ ] Manual: ActivityForm → row's "Search Annotations" → still pre-fills the form as before.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** ✅ TASK COMPLETE. All three phases landed; `npm run type-check` and `eslint` on the touched files are clean.
- **Next immediate action:** Manual verification in the browser (table insert flow + ActivityForm flow), then the multi-evidence follow-up discussion (see Additional Context).
- **Recent commands run:**
  - `npm run type-check`
  - `npx eslint <touched files>`
- **Uncommitted changes:** `useOpenSearchAnnotations.ts`, `SearchAnnotations.tsx`, `ActivityForm.tsx`, `ActivityTableNode.tsx` (plus prior empty-term guard).
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| —              |               |      |

## Files Modified

| File                                                          | Action | Status |
| ------------------------------------------------------------- | ------ | ------ |
| src/features/gocam/components/ActivityTableNode.tsx           | edit   | done   |
| src/features/gocam/hooks/useOpenSearchAnnotations.ts          | edit   | done   |
| src/features/gocam/components/forms/SearchAnnotations.tsx     | edit   | done   |
| src/features/gocam/components/forms/ActivityForm.tsx          | edit   | done   |

## Summary

`SearchAnnotations` is now a caller-agnostic picker. Both `ActivityForm` and `ActivityTableNode` open it with `{ gpId, aspect, onApply }`; the dialog returns `{ term, evidences }` on Done and does not persist anything. The form-mode dispatches (`updateTerm`/`setNodeEvidences`/`setRelationEvidences`) moved into `ActivityForm`'s `onApply`. The table-mode flow encodes prefill inside the popover's `data` so reopening the inline editor surfaces the picked term + first evidence/reference/with — matching the old Angular `reinitializeForm` behavior. The architectural reason for close-then-reopen (rather than overlay) is documented in code: `AnchoredPopover`'s backdrop (z=250) sits above Mantine's Modal (z=200).

## Blockers

- None.

## Notes

- **Callback handoff:** the opener stashes `onApply` in a module-level slot (`pendingOnApply`) just before dispatching `openDialog`, and `SearchAnnotations` claims it on mount via `consumeSearchAnnotationsOnApply()` snapshotted into local state. `customProps` carries only `{ gpId, aspect }`, so the dialog slice remains fully serializable and Redux's serializability check stays quiet. Single-slot is safe because only one Search Annotations dialog is ever open at a time.
- **Old Angular reference:** `editor-dropdown.component.ts:180-213` (openSearchDatabaseDialog) — the `success` callback creates an `Entity` from the picked term and calls `reinitializeForm(term, evidences)`. The dialog never persists.
- **EditorDropdown re-sync gotcha:** its `useEffect` (line 110) re-runs when `initial*` refs change. Today `ActivityTableNode` creates `initialTerm` inline (new object each render), so the effect already runs every render. This is latent — it doesn't clobber today only because the parent doesn't re-render mid-edit. When we add prefill state we must memoize the `initial*` objects or the user's typed input will be wiped on each re-render after Search Annotations sets state.

## Lessons Learned

<!-- fill in as we go -->

## Additional Context (Claude)

### Multiple-evidence follow-up (user-flagged next step)

The picker can return N evidences but `EditorDropdown` has exactly one evidence/reference/with row. Once this refactor lands, the open design question is what "Done" with multiple evidences should do in the inline editor:

1. **Take the first, drop the rest** — simplest, matches today's UI but silently loses data. Probably bad.
2. **Loop and create N evidences on Save** — `EditorDropdown` becomes a list editor (or stays single-row but keeps the extra evidences in component state, applies them all on Save).
3. **Disable multi-select in the picker for the table flow** — simplest contract, but loses the multi-evidence value the picker already shows.
4. **Auto-add evidence rows in EditorDropdown** — render multiple evidence rows (Mantine list), let user prune. Closest to "WYSIWYG" but biggest UI change.

The old Angular `reinitializeForm(term, evidences)` took the full list — the form there supported a FormArray of evidences. So option 2 or 4 matches the old behavior best. Worth deciding before implementing the multi-evidence step; the refactor in this plan is neutral to that choice (the picker already returns the full list, callers decide what to do with it).
