# Task: Split the CAM toolbar's single edit dialog into per-field entries

**Status:** COMPLETE (pending manual verification)
**Issue:** — (user direction)
**Branch:** issue-220-update-codebase

## Goal

Today every editable affordance on the CAM toolbar — the title pen icon, the comments icon, the state chip, even the date chip — opens the same `CamMetadataForm` dialog containing Title + State + Comments + Model Details. The user wants each entry point to do exactly one thing:

- **Edit** (title pen icon) → edit just the title.
- **Comments** (comment icon) → manage just comments.
- **State** (state chip) → change just the state.

The combined `CamMetadataForm` either becomes three smaller surfaces, or two smaller surfaces + an inline state control. Open question below.

## Context

- **Related files:**
  - `src/features/gocam/components/CamToolbar.tsx` — the four entry points (lines 94-103 Pen icon, 117-150 Comment + Copy icons, 152-162 State chip, 164-173 Date chip).
  - `src/features/gocam/components/CamMetadataForm.tsx` — single dialog that handles all four fields today.
  - `src/features/gocam/services/activityOperations.ts` — `buildSaveModelAnnotationsOperations(modelId, prev, next)` accepts a `{ title, state, comments }` triple. Each new form will call it with only the changed field.
  - `src/@noctua.core/components/dialog/dialogSlice.ts` — needs new `DialogComponent` entries for the per-field dialogs.
  - `src/App.tsx` — registry that maps `DialogComponent` → component.
- **Triggered by:** user direction to separate concerns: "the edit should just be edit and the comments just comments and the state should be by itself."

## Current State

- One pen icon, one comment icon, one state chip, one date chip — all four call `openCamForm()` which opens `CamMetadataForm` at `size: 'sm'`.
- The dialog body has four sections (Model Information [title + state], Comments, Model Details readonly, footer Save/Cancel).
- Save dispatches a single m3Batch built from `buildSaveModelAnnotationsOperations` that diffs the three editable fields and emits ops only for the ones that changed.

## Open question

"State should be by itself" admits two readings — confirm before Phase 2:

- **(A) State as a small dialog.** Same shape as the title/comments dialogs, just one Select inside. Click state chip → opens the State dialog. Consistent UX with the other two dialogs.
- **(B) State as an inline dropdown.** Replace the state chip with a Mantine `Select` directly on the toolbar, no dialog. Faster interaction (one click vs. open-dialog-then-pick-then-save), but visually heavier on the toolbar.

Recommendation: **(A)** — keeps the toolbar visually consistent and uses the same save flow as the other two. Switch to (B) only if the toolbar real-estate or the click-cost makes (A) annoying.

## Steps

### Phase 1: Extract three small dialog components

Replace `CamMetadataForm` with three focused components. Keep all three in the same folder for discoverability.

- [ ] `src/features/gocam/components/CamTitleForm.tsx` — single Textarea + Save/Cancel. Body mirrors today's "Model Information" block minus the state Select.
- [ ] `src/features/gocam/components/CamCommentsForm.tsx` — comments list with add/remove + `ConfirmDialog` for non-empty removal (copied from current `CamMetadataForm`).
- [ ] `src/features/gocam/components/CamStateForm.tsx` — single Select + Save/Cancel. Only if Open Question resolves to (A).
- [ ] All three call `buildSaveModelAnnotationsOperations` with `prev` = current cam state and `next` = changed field. Unchanged fields pass through untouched so the op-builder only emits the relevant ops.

If Open Question resolves to (B), skip `CamStateForm` and add the inline Select in Phase 4 instead.

### Phase 2: Register new dialog components

- [ ] `dialogSlice.ts`: add `CAM_TITLE_FORM`, `CAM_COMMENTS_FORM`, `CAM_STATE_FORM` to the `DialogComponent` enum.
- [ ] `App.tsx`: register the three new components in the dialog registry. Drop the `CAM_METADATA_FORM` entry once the toolbar no longer references it.

### Phase 3: Move "Model Details" (readonly contributors/groups)

The current dialog also surfaces a readonly Contributors + Groups block. Decide where it lives once the parent dialog goes away:

- [ ] Option: fold it into the Edit (title) dialog — readers expect "Edit Model" to show all metadata, editable bits included.
- [ ] Option: drop it from the toolbar entirely. `ContributorChips` already renders contributors on the toolbar at line 175. Groups aren't currently surfaced anywhere else — losing them is a minor info regression.
- [ ] Pick one; document the decision in Notes.

### Phase 4: Re-wire the toolbar entries

`CamToolbar.tsx`:

- [ ] Pen icon button (line 94-101) → `openDialog({ component: CAM_TITLE_FORM, title: 'Edit Title', size: 'sm' })`.
- [ ] Comment icon (line 122-137) → `openDialog({ component: CAM_COMMENTS_FORM, title: 'Comments', size: 'sm' })`.
- [ ] State chip (line 152-162):
  - If (A): `openDialog({ component: CAM_STATE_FORM, title: 'Change State', size: 'xs' })`.
  - If (B): replace the `Chip` with a Mantine `Select` styled to look like the current chip; persist on change via `buildSaveModelAnnotationsOperations`.
- [ ] Date chip (line 164-173): no current edit path exists for date — leave click handler off, or remove `onClick`.

### Phase 5: Retire `CamMetadataForm`

- [ ] Delete `src/features/gocam/components/CamMetadataForm.tsx` once all callers are migrated. Grep for any remaining import; remove the `CAM_METADATA_FORM` enum + registry entry.

### Phase 6: Verify

- [ ] `npm run type-check` clean.
- [ ] `npm run lint` clean on touched files.
- [ ] Manual: pen icon opens Title-only dialog; save updates only the title.
- [ ] Manual: comment icon opens Comments-only dialog; add/remove/edit persist; the same ConfirmDialog-on-remove guard as today.
- [ ] Manual: state chip opens State-only dialog (or inline Select per (B)); change persists.
- [ ] Manual: date chip doesn't open the dropped dialog (no broken handler).
- [ ] Grep: `CamMetadataForm`, `CAM_METADATA_FORM`, `openCamForm` return zero hits in `src/`.

## Recovery Checkpoint

- **Last completed action:** Phases 1-5 implemented. `npm run type-check` clean. The 7 pre-existing camSlice + fillRootTerm test failures are unchanged.
  - Chose (A): state opens its own small dialog (`size: 'xs'`).
  - Chose: drop "Model Details" — contributors already render on the toolbar via `ContributorChips`; groups not surfaced (minor info regression, accept).
  - Date chip's `onClick={openCamForm}` removed (the chip is informational; nothing to edit).
- **Next immediate action:** manual verification — Title pen → title-only dialog; Comment icon → comments-only dialog; State chip → state-only dialog; Date chip no longer opens anything.
- **Recent commands run:** `npm run type-check`, `npx vitest run`.
- **Uncommitted changes:** seven files (see Files Modified).
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| src/features/gocam/components/CamTitleForm.tsx | create | done |
| src/features/gocam/components/CamCommentsForm.tsx | create | done |
| src/features/gocam/components/CamStateForm.tsx | create | done |
| src/features/gocam/components/CamMetadataForm.tsx | delete | done |
| src/features/gocam/components/CamToolbar.tsx | edit (split openCamForm into openTitleForm/openStateForm/openCommentsForm; remove date-chip onClick) | done |
| src/@noctua.core/components/dialog/dialogSlice.ts | edit (CAM_METADATA_FORM → CAM_TITLE_FORM + CAM_STATE_FORM + CAM_COMMENTS_FORM) | done |
| src/App.tsx | edit (drop CamMetadataForm, register the three new forms) | done |

## Blockers

- Open Question A vs B — needs your call before Phase 1 (affects whether `CamStateForm` is created or replaced by inline `Select`).
- "Model Details" placement — Phase 3 decision before Phase 4 wiring.

## Notes

- Each new form will be small (one Textarea, one Select, or a comments list). `size: 'xs'` or `'sm'` is appropriate; don't bump.
- `buildSaveModelAnnotationsOperations` already does field-level diffing — three separate Save callers all calling it with `prev = current cam` and `next = { ...current, <changedField>: newValue }` will each emit only the right ops. No new op-builder needed.
- If we eventually want bulk-edit again, the path back is straightforward: a `CamMetadataForm` that internally renders the three sub-forms. The current refactor doesn't preclude that.

## Lessons Learned

(fill in after).

## Additional Context (Claude)

- After this lands, the "Model Information" / "Model Details" naming convention disappears from the codebase. That's fine — those headers existed to distinguish sub-sections inside the giant dialog, which is gone.
- The pen icon's `data-testid="edit-model-title"` already says it edits the title — the current generic dialog is the inconsistency, not the icon. So no testid renames needed.
- Date chip currently has an `onClick={openCamForm}` that opens the same big dialog. Treating that as "dead code" makes sense: date isn't editable, so the chip becomes informational only.
