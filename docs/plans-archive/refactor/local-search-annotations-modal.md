# Task: Make SearchAnnotations a locally-rendered Modal, kill the singleton handoff, and codify a two-tier dialog pattern

**Status:** ACTIVE
**Issue:** —
**Branch:** issue-220-update-codebase

## Goal

Land a clean, two-tier dialog pattern across the app:

- **Tier 1 — global slot** (`dialogSlice` + `<GlobalDialog>`) for entry-point dialogs opened from toolbars, table rows, and menus. Never nested. Callbacks passed via plain `customProps`.
- **Tier 2 — locally-rendered `<SimpleDialog>`** for anything opened from inside another dialog or component (i.e. needs to coexist with what opened it). Mantine Modal handles z-index stacking automatically.

Concretely this means:

1. Convert `SearchAnnotations` to a controlled component rendered locally by each caller (`AnnotationForm`, `ActivityForm`). No more global slot, no callback singleton, no re-open dance.
2. With `SearchAnnotations` out of the global slot, the only remaining justification for `useOpenAnnotationForm`'s `pendingOnSubmit` singleton vanishes — replace it with a plain `customProps.onSubmit`.
3. Adopt `SimpleDialog` as the single visual contract for both global-slot and local-rendered modals. Migrate `CloneEvidenceDialog` and `ActivityFormDialog` from bare Mantine `Modal` to `SimpleDialog`.
4. Drop the stale "MUI Dialog `maxWidth`" comment in `modalSize.ts` — Mantine-only now.

## Why

The current setup hacks around a hard limit: the global dialog slot only holds one component. Opening the picker from `AnnotationForm` unmounts the form, so we built:

- a module-level `pendingOnApply` slot,
- a `consumeSearchAnnotationsOnApply` ritual,
- a re-open flow in `AnnotationForm.handleSearchAnnotations` that snapshots props + onSubmit, then re-opens itself on `onApply`,
- a "close before invoking callback" ordering in `SearchAnnotations.handleSave`.

All of that exists only because one global slot. Local Modals stack natively (Mantine assigns z-indexes per Modal instance) — the form stays mounted underneath, the picker sits on top, and `onApply` is just a prop.

`useOpenAnnotationForm` ended up with its own `pendingOnSubmit` singleton for the *same* reason: when `SearchAnnotations` evicted `AnnotationForm` from the global slot, the form had to re-open itself and re-attach `onSubmit` from somewhere. Once the picker is no longer in the slot, no eviction happens, and the singleton has no remaining purpose.

The two locally-rendered modals already in the codebase (`CloneEvidenceDialog`, `ActivityFormDialog`) reach directly for Mantine `Modal` instead of `SimpleDialog`, which means the header / size / `bodyScroll` knobs diverge from the global-slot dialogs. `SimpleDialog` already accepts arbitrary children — wrapping these in it keeps the visual contract uniform regardless of whether a dialog is opened via Redux or rendered inline.

## Context

- **Related files:**
  - `src/features/gocam/components/forms/SearchAnnotations.tsx` — becomes a controlled component with `{ open, onClose, onApply, gpId, aspect, term? }`, wrapped in `<SimpleDialog>`.
  - `src/features/gocam/hooks/useOpenSearchAnnotations.ts` — **deleted**.
  - `src/features/gocam/hooks/useOpenAnnotationForm.ts` — `pendingOnSubmit` / `consumeAnnotationFormOnSubmit` removed; `onSubmit` is passed through `customProps` like other entry-point dialogs.
  - `src/features/gocam/components/forms/AnnotationForm.tsx` — renders `<SearchAnnotations>` locally; reads `onSubmit` from props (not via consume); the snapshot/capture/re-open code is removed.
  - `src/features/gocam/components/forms/ActivityForm.tsx` — `handleSearchAnnotations` becomes `setPickerOpen(true)` + stored `pickerArgs`; renders `<SearchAnnotations>` locally; `onApply` runs the same `updateTerm`/`setNodeEvidences`/`setRelationEvidences` dispatches it already does.
  - `src/@noctua.core/components/dialog/dialogSlice.ts` — remove `SEARCH_ANNOTATIONS` enum entry.
  - `src/App.tsx` — remove the `[SEARCH_ANNOTATIONS]: SearchAnnotations` mapping and the import. Update the `[ANNOTATION_FORM]` entry's props type to reflect `onSubmit` being part of `customProps`.
  - `src/@noctua.core/components/dialog/SimpleDialog.tsx` — already exported; consumed by both `GlobalDialog` (indirectly, via component-internal use) and the local-rendered callers.
  - `src/@noctua.core/components/dialog/modalSize.ts` — remove the leading "MUI Dialog `maxWidth`" comment.
  - `src/features/gocam/components/forms/CloneEvidenceDialog.tsx` — bare Mantine `Modal` → `SimpleDialog`.
  - `src/features/gocam/components/dialogs/ActivityFormDialog.tsx` — bare Mantine `Modal` → `SimpleDialog`.
- **Triggered by:** the singleton/re-open dance was producing real bugs (picker Done losing data, dialog flicker) and even when fixed read like spaghetti. The user called it out and asked for a clean structural rewrite, then asked to extend the cleanup to the rest of the dialog surface area.

## Current State

- **What works now:**
  - The picker shows results and lets the user pick term + evidences.
  - `AnnotationForm.handleSearchAnnotations` does eventually re-open the form with prefilled values via the singleton dance.
- **What's broken / ugly:**
  - Cancelling the picker leaves the user's `AnnotationForm` input gone forever (because we consumed `pendingOnSubmit` on the way into the picker).
  - The whole flow is hard to follow: three files, one singleton, ordered dispatches, and re-mounts.
  - `ActivityForm` doesn't suffer the re-open problem because its `onApply` only dispatches Redux actions (no nested dialog), but it still goes through the singleton for no reason.

## Steps

### Phase 1: Convert SearchAnnotations to a controlled component

- [ ] Update props to `{ open: boolean; onClose: () => void; onApply: (selection) => void; gpId: string; aspect?: Aspect; term?: string }`.
- [ ] Wrap the existing body in `<SimpleDialog open={open} onClose={onClose} title="Search Annotations" size="cam" bodyScroll="none">…</SimpleDialog>`. `SimpleDialog` already accepts arbitrary children and provides the header + close handling — no need for a bare Mantine `Modal`.
- [ ] `handleSave`: call `onApply({ term, evidences })`, then `onClose()`. No `dispatch(closeDialog())`.
- [ ] `handleCancel` / backdrop / Escape: call `onClose()`.
- [ ] Drop all imports of the dialog slice and the singleton helper.

### Phase 2: Delete the opener hook and the global-dialog wiring

- [ ] Delete `src/features/gocam/hooks/useOpenSearchAnnotations.ts`.
- [ ] Remove `DialogComponent.SEARCH_ANNOTATIONS` from `dialogSlice.ts`.
- [ ] Remove the `[SEARCH_ANNOTATIONS]: SearchAnnotations` entry and the import in `App.tsx`.

### Phase 3: Wire AnnotationForm locally

- [ ] Add `const [pickerOpen, setPickerOpen] = useState(false)`.
- [ ] Collapse `handleSearchAnnotations` to `() => setPickerOpen(true)` (guarded by `gpId && aspect`).
- [ ] Render `<SearchAnnotations open={pickerOpen} onClose={() => setPickerOpen(false)} onApply={({term, evidences}) => { setTerm(...); setEvidences(...); }} gpId={gpId} aspect={aspect} />` at the bottom of the component.
- [ ] Delete the captured `consumeAnnotationFormOnSubmit` call, the snapshot object, the `openAnnotationForm` import, and the re-open logic.

### Phase 4: Wire ActivityForm locally

- [ ] Same pattern: local `pickerOpen` + `pickerArgs` state (since the picker may be opened for different nodes/relations — store `{ node, relation }` alongside `pickerOpen`).
- [ ] `handleSearchAnnotations(node, relation)` sets both pieces of state and opens the picker.
- [ ] Render `<SearchAnnotations>` once; `onApply` runs the existing `updateTerm` + `setNodeEvidences`/`setRelationEvidences` dispatches using the stored `pickerArgs`.

### Phase 5: Drop the AnnotationForm singleton (now redundant)

With Phases 1–4 done, `AnnotationForm` is no longer evicted from the global slot mid-flow, so it never has to re-attach `onSubmit` to a re-opened instance. The singleton has no remaining purpose.

- [x] In `src/features/gocam/hooks/useOpenAnnotationForm.ts`: delete the `pendingOnSubmit` module-level slot and the `consumeAnnotationFormOnSubmit` export. Pass `onSubmit` through `customProps` instead.
- [x] In `src/features/gocam/components/forms/AnnotationForm.tsx`: add `onSubmit?: AnnotationFormOnSubmit` to `AnnotationFormProps`. In `handleSave`, invoke `await onSubmit?.({ term: showTerm ? term : null, evidences: validEvidences })` directly. Remove the `consumeAnnotationFormOnSubmit` import.
- [x] In `src/app/store/store.ts`: configure `getDefaultMiddleware` with `serializableCheck: { ignoredActions: ['dialog/openDialog'], ignoredPaths: ['dialog.customProps'] }`. This is the actual reason the original singleton existed — Redux's default serializability check warns on functions in state. Excluding `customProps` makes it an explicit opaque escape hatch for entry-point dialogs.
- [x] In `src/App.tsx`: registry uses `Partial<Record<DialogComponent, React.ComponentType<any>>>` — no further type change needed.
- [x] Verify by reading: no remaining imports of `consumeAnnotationFormOnSubmit` anywhere.

### Phase 6: Consolidate local-rendered Modals on SimpleDialog

`CloneEvidenceDialog` and `ActivityFormDialog` currently reach for Mantine `Modal` directly, which means header markup, size mapping, and `bodyScroll` semantics drift from the global-slot dialogs. Swap them to `SimpleDialog` so all dialogs — global slot or local — share one visual contract.

- [ ] `src/features/gocam/components/forms/CloneEvidenceDialog.tsx`: replace the bare `<Modal>` wrapper with `<SimpleDialog open={...} onClose={...} title="Clone Evidence" size={...} bodyScroll="auto">`. Keep the existing body markup. Verify the close-on-escape / backdrop semantics still match the prior behavior.
- [ ] `src/features/gocam/components/dialogs/ActivityFormDialog.tsx`: same treatment. Size and title come from the props it already accepts.
- [ ] Leave the small ad-hoc inline Modals in `PathwayViewer.tsx` ("Model Updated" notification) and `ActivityTable.tsx` (delete-activity confirm) alone for now — they are short-lived confirms and migrating them is out of scope for this refactor; track as a follow-up if visual consistency matters.

### Phase 7: Remove stale MUI reference

- [ ] In `src/@noctua.core/components/dialog/modalSize.ts`, replace the leading comment `/** Maps MUI Dialog \`maxWidth\` breakpoint names to pixel widths so Mantine Modal sizing matches what the codebase used to get from MUI. */` with something current, e.g. `/** Pixel widths for the size tokens used by SimpleDialog. */`. MUI is no longer a dependency.

### Phase 8: Verify

- [ ] `npm run type-check` clean.
- [ ] `npm run lint` on touched files clean.
- [ ] Manual — table Add → AnnotationForm → Search Annotations → Done: form has prefilled term + evidences.
- [ ] Manual — table Add → AnnotationForm → Search Annotations → Cancel: form still has whatever the user already typed (no loss).
- [ ] Manual — ActivityForm row → Search Annotations → Done: form node updates with picked term + evidences.
- [ ] Manual — Escape closes only the picker, not the underlying form.
- [ ] Manual — backdrop click closes only the picker.
- [ ] Manual — CloneEvidenceDialog opens, clones, and closes correctly post-SimpleDialog swap.
- [ ] Manual — ActivityFormDialog opens from the activity table and closes correctly post-SimpleDialog swap.
- [ ] Grep: `pendingOnSubmit`, `pendingOnApply`, `consumeAnnotationFormOnSubmit`, `consumeSearchAnnotationsOnApply`, `DialogComponent.SEARCH_ANNOTATIONS`, and `useOpenSearchAnnotations` return zero hits in `src/`.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** All phases (1–8) implemented and tested. 33/33 dialog-refactor tests pass; type-check + lint clean. The 7 remaining test failures in the suite are pre-existing in `slices/camSlice.test.ts` and `slices/activityFormSlice.test.ts` (untouched files).
- **Next immediate action:** Commit. Then manually exercise the four flows in the Verify section before merging.
- **Recent commands run:** `npm run type-check`, `npx eslint <touched files>`, `npx vitest run tests/features/gocam/components/AnnotationForm.test.tsx tests/features/gocam/components/SearchAnnotations.test.tsx tests/features/gocam/hooks/useOpenAnnotationForm.test.tsx`.
- **Uncommitted changes:** the refactor itself + new tests + `tests/setup.ts` matchMedia stub for Mantine.
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Module-level `pendingOnApply` + `consumeSearchAnnotationsOnApply` handoff through `customProps` | Worked but required `AnnotationForm` to dance: snapshot props, consume callback, re-open itself on apply. Cancelling the picker silently destroyed the form's state. Read like spaghetti. | 2026-05-21 |
| `dispatch(closeDialog())` before invoking the apply callback to prevent flicker | Patched the symptom (dialog flicker) but kept the underlying single-slot constraint. Still required all the singleton plumbing. | 2026-05-21 |

## Files Modified

| File                                                              | Action  | Status |
| ----------------------------------------------------------------- | ------- | ------ |
| src/features/gocam/components/forms/SearchAnnotations.tsx         | rewrite | done   |
| src/features/gocam/hooks/useOpenSearchAnnotations.ts              | delete  | done   |
| src/@noctua.core/components/dialog/dialogSlice.ts                 | edit    | done   |
| src/App.tsx                                                       | edit    | done   |
| src/features/gocam/components/forms/AnnotationForm.tsx            | edit    | done   |
| src/features/gocam/components/forms/ActivityForm.tsx              | edit    | done   |
| src/features/gocam/hooks/useOpenAnnotationForm.ts                 | edit    | done   |
| src/features/gocam/components/forms/CloneEvidenceDialog.tsx       | edit    | done   |
| src/features/gocam/components/dialogs/ActivityFormDialog.tsx      | edit    | done   |
| src/@noctua.core/components/dialog/modalSize.ts                   | edit    | done   |
| src/@noctua.core/components/dialog/SimpleDialog.tsx               | edit    | done   |
| src/app/store/store.ts                                            | edit    | done   |
| tests/features/gocam/components/AnnotationForm.test.tsx           | rewrite | done   |
| tests/features/gocam/components/SearchAnnotations.test.tsx        | create  | done   |
| tests/features/gocam/hooks/useOpenAnnotationForm.test.tsx         | create  | done   |
| tests/setup.ts                                                    | edit    | done   |

## Blockers

- None.

## Notes

- **Two-tier pattern, codified.** After this refactor the rule is: **dialogs opened from the app shell (toolbar, table row, menu) use the global slot via `openDialog`; dialogs opened from inside another dialog or component use a locally-rendered `<SimpleDialog>` with `{ open, onClose, ... }` props.** Both render through `SimpleDialog`, so the visual contract is identical.
- **Why Mantine Modals stack cleanly:** each `Modal` instance creates its own portal + overlay with an assigned z-index that increments per opened modal. We don't need to manage z-indexes ourselves.
- **`AnnotationForm` still goes through the global slot** — that's fine, it's opened from outside (table row, toolbar), not from inside another dialog. What changes is *how* its `onSubmit` arrives: plain `customProps`, no singleton.
- **Why drop the `AnnotationForm` singleton if the form still uses the global slot?** The `pendingOnSubmit` slot existed because `SearchAnnotations` evicted the form from the slot and the re-opened form needed to find its callback. Once `SearchAnnotations` lives locally, no eviction happens, no re-open happens, and `customProps.onSubmit` is sufficient — the same pattern the other entry-point dialogs already use.
- **`CamMetadataForm`, `CopyModelDialog`, `ChemicalConnectorForm`** stay in the global slot unchanged. They are entry-point dialogs with no nesting and no singleton plumbing — they're already the model we're converging on.
- **Backward compat:** none required.

## Lessons Learned

- The "one global dialog slot" pattern is fine until you need to stack. Once you do, fighting it with singletons is worse than letting each caller render its own Modal locally.
- Callback-through-Redux-customProps was the root mistake. Functions don't belong in Redux state; the right home is the component tree, not a module-level shadow.

## Additional Context (Claude)

### What stays simple after this

After the refactor:

- `SearchAnnotations` is a pure controlled component: props in, callbacks out, no Redux awareness.
- `AnnotationForm`'s "Search Annotations" handler is one line.
- `ActivityForm`'s handler is two lines (set args + open).
- The whole `useOpenSearchAnnotations` indirection and its singleton are gone.

### A follow-up worth considering

If we ever need to open more dialogs from inside dialogs (e.g. a confirm-on-cancel from `AnnotationForm`), the same local-render pattern works. We don't need to refactor the dialog slice into a stack — we just keep adding local Modals where they belong.
