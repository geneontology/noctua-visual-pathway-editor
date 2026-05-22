# Task: Replace EditorDropdown's multi-section flows with an AnnotationForm dialog

**Status:** COMPLETE
**Issue:** —
**Branch:** issue-220-update-codebase

## Goal

Introduce a new dialog — `AnnotationForm` — modeled on `ActivityForm`'s look-and-feel but standalone (not a refactor of `ActivityForm`). It owns the multi-section editing cases that today are crammed into the inline `EditorDropdown` popover:

- **Insert child** (`EditorCategory.all`) — pick a term + N evidences for the new node.
- **Add evidence to existing edge** (`EditorCategory.evidenceAll`) — N evidence rows only.

The same component handles both modes via a `showTerm` flag — one clever form, not two. `EditorDropdown` shrinks back to its single-field role (`term` / `evidence` / `reference` / `with`). `SearchAnnotations` becomes a true picker that prefills `AnnotationForm`'s state with term + N evidence rows.

## Context

- **Related files:**
  - `src/features/gocam/components/forms/EditorDropdown.tsx` — will drop the `all`/`evidenceAll` branches and the overflow menu (Search Annotations / Fill with root term).
  - `src/features/gocam/components/ActivityTableNode.tsx` — orchestrator; routes the three "Add" / "Add Evidence" / single-field paths to the right surface.
  - `src/features/gocam/components/forms/SearchAnnotations.tsx` — already a pure picker; will now prefill `AnnotationForm`.
  - `src/features/gocam/components/forms/ActivityForm.tsx` — read-only reference for layout/idioms; **do not modify**.
  - `src/features/gocam/services/activityOperations.ts` — `buildAddNodeOperations`, `buildAddEvidenceToEdgeOperations`, `buildEditIndividualTypeOperations`.
  - `src/features/gocam/models/formModels.ts` — `EvidenceForm`, `createEvidenceForm`.
  - `src/@noctua.core/components/dialog/dialogSlice.ts` — register new dialog component.
  - `src/App.tsx` — wire into `DIALOG_COMPONENTS`.
  - Reference: old Angular `editor-dropdown.component.html` and `.component.ts` for behavior parity.
- **Triggered by:** the multi-evidence design question. Inline editor can't grow an evidence list cleanly; a dialog with a list section is the right shape.

## Current State

- **What works now:**
  - Single-field inline edits via `EditorDropdown` (term, evidence, reference, with) are correctly scoped and behave well.
  - Search Annotations is a pure picker; form-mode (`ActivityForm`) consumes it via `onApply`.
  - Table-mode insert prefill plumbing (popover `data.prefill`) works but is limited to one evidence row.
- **What's broken/missing:**
  - `EditorDropdown` in `all`/`evidenceAll` mode is horizontally laid out with one evidence slot — no room for N evidences.
  - Multi-evidence picks from Search Annotations silently drop everything past the first when targeting the table.
  - Overflow menu items ("Search Annotations" / "Fill with root term") live inside the popover, which is awkward UX for a multi-field action.

## Steps

### Phase 1: Build `AnnotationForm` (the clever form)

- [ ] Create `src/features/gocam/components/forms/AnnotationForm.tsx` (default export). Open via the existing global dialog system (`DialogComponent.ANNOTATION_FORM`, registered in `dialogSlice.ts` and `App.tsx`).
- [ ] Props (carried via `customProps`, all serializable):
  - `showTerm: boolean`
  - `title?: string`
  - `termLabel?: string`
  - `termRootTypes?: string[]`
  - `initialTerm?: Entity | null`
  - `initialEvidences?: EvidenceForm[]`
  - `gpId?: string` — needed so the form's own "Search Annotations" trigger can open the picker.
  - `aspect?: Aspect | null` — ditto.
  - A submit-result handoff via the same module-level singleton pattern we used for `SearchAnnotations` (`pendingOnSubmit`/`consume…`) so we don't put callbacks in Redux. Result shape: `{ term: Entity | null; evidences: EvidenceForm[] }`.
- [ ] Layout (header → body → footer, all Tailwind, MUI only if matching what `ActivityForm` already uses):
  - Header: title + close.
  - Body when `showTerm`: term row (`TermAutocomplete` + label) at the top.
  - Body always: an evidence list section
    - Header row "Evidence (N)" with an "+ Add evidence" button.
    - Each row: evidence-code autocomplete + reference + with + delete button. Mirror what `EntityRow` does for its `relation.evidence` list (look but **do not import**; this dialog must stand alone).
    - Empty state when N=0: a single placeholder row pre-rendered so the user always has somewhere to type.
  - Footer: Cancel / Save. Save is disabled when invalid (term required if `showTerm`; at least nothing actually required for evidence in the old code, so don't add validation we didn't have).
- [ ] Local state: `term`, `evidences` (array). Helpers `addEvidence`, `updateEvidenceAt(i, patch)`, `removeEvidenceAt(i)`.
- [ ] Same overflow-menu items as the old `EditorDropdown` but anchored in the dialog header:
  - "Search Annotations" — only shown when `showTerm && gpId && aspect`. Opens the picker with an `onApply` that sets local `term` and replaces `evidences` (mirrors the old `reinitializeForm(term, evidences)`).
  - "Fill with root term" — only shown when `showTerm`. Sets local `term` to `ROOT_NODES[matchingRoot]` and prepends an `nd` evidence row from `EVIDENCE_AUTO_POPULATE.nd`.

### Phase 2: Route the table flow through `AnnotationForm`

- [ ] `ActivityTableNode.tsx`:
  - **Insert path** (`handleInsertNode`): instead of `editor.open(…, { category: EditorCategory.all, insert })`, dispatch the new dialog with `{ showTerm: true, termLabel: insert.label, termRootTypes: [insert.targetType], gpId, aspect: getAspectFromRootTypes([insert.targetType]) }`. Register an `onSubmit` (via the singleton) that calls `buildAddNodeOperations` for the term and appends one `buildAddEvidenceToEdgeOperations` per evidence row.
  - **Add Evidence path** (existing menu item that opens `EditorCategory.evidenceAll`): dispatch with `{ showTerm: false, gpId, aspect }`. `onSubmit` runs N `buildAddEvidenceToEdgeOperations` against the existing edge.
  - **Term cell edit path** (existing `EditableCell.onEdit`): unchanged — keeps using `EditorDropdown` with `EditorCategory.term`.
- [ ] Stop passing `onSearchAnnotations` and the overflow flags into `EditorDropdown` from `ActivityTableNode` (now lives in `AnnotationForm`).

### Phase 3: Shrink `EditorDropdown` to single-field role

- [ ] Remove `EditorCategory.all` and `EditorCategory.evidenceAll` branches from `getDisplaySections`.
- [ ] Drop the overflow menu (`showActionMenu`, "Search Annotations", "Fill with root term"), `onSearchAnnotations` prop, `hasAspect` prop, the action-menu popover state, and the related imports (`ROOT_NODES`, `EVIDENCE_AUTO_POPULATE`, `makeSelectModelTerms`, `selectModelEvidence` if no longer needed by this file).
- [ ] Narrow `EditorDropdownValues` to just the fields a single-field edit actually returns (or keep current shape but document that only one will be populated at a time).
- [ ] Confirm `ActivityTableNode.handleEditorSave` still handles `EditorCategory.term` correctly (other single-field categories aren't currently used from this caller; leave their branches intact if other callers exist).

### Phase 4: Wire `SearchAnnotations` to `AnnotationForm`'s prefill

- [ ] In `AnnotationForm`'s "Search Annotations" handler, pass an `onApply` that builds N `EvidenceForm`s from the picker's `evidences` and replaces local state — matches the old `reinitializeForm(term, evidences)` semantics exactly.
- [ ] Decision: when the dialog has existing evidence rows the user has already started typing into, does Search Annotations **replace** or **append**? Old Angular replaced (`reinitializeForm`). Start with replace; revisit only if it surprises users.

### Phase 5: Verify

- [ ] `npm run type-check` clean.
- [ ] `npm run lint` on touched files clean.
- [ ] Manual: table "Add → <relation>" → AnnotationForm opens → pick term + evidences (via autocomplete or Search Annotations) → Save → row + evidences appear.
- [ ] Manual: table existing row → "..." menu → Add Evidence → AnnotationForm (no term section) opens → add N rows → Save → edge gains N evidences.
- [ ] Manual: table existing row → click term cell → EditorDropdown (single-field) still works exactly as today.
- [ ] Manual: form-mode (ActivityForm) Search Annotations still pre-fills as before — `ActivityForm` is untouched.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** ✅ TASK COMPLETE. All five phases implemented; type-check + lint clean on touched files.
- **Next immediate action:** Manual browser verification (insert child, add evidence, single-field term edit, form-mode regression).
- **Recent commands run:** `npm run type-check`, `npx eslint <touched>`.
- **Uncommitted changes:** see Files Modified.
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Cramming N evidences into the popover's prefill (option 2 from the prior discussion) | Hides data from the user; required a "+N more" badge and op stitching. User wanted a real form with a list UI instead. | 2026-05-21 |

## Files Modified

| File                                                          | Action | Status |
| ------------------------------------------------------------- | ------ | ------ |
| src/features/gocam/components/forms/AnnotationForm.tsx        | create | done   |
| src/features/gocam/hooks/useOpenAnnotationForm.ts             | create | done   |
| src/@noctua.core/components/dialog/dialogSlice.ts             | edit   | done   |
| src/App.tsx                                                   | edit   | done   |
| src/features/gocam/components/ActivityTableNode.tsx           | edit   | done   |
| src/features/gocam/components/forms/EditorDropdown.tsx        | edit   | done   |
| src/features/gocam/services/activityOperations.ts             | edit   | done   |

## Summary

`AnnotationForm` is a new modal dialog that owns multi-section editing for the table:

- **Insert child** (`Add → <relation>`): opens with `showTerm: true`, prefilled term root + label; `onSubmit` runs `buildAddNodeOperations` with the full evidences list (now plural via the widened `details.evidences`).
- **Add Evidence**: opens with `showTerm: false`; `onSubmit` runs one `buildAddEvidenceToEdgeOperations` per row, flat-mapped into a single `updateGraphModel` call.

The form has its own "Search Annotations" and "Fill with root term" overflow menu — `EditorDropdown`'s overflow menu is gone. The picker, when launched from inside the form, replaces local state (term + evidences), matching the old Angular `reinitializeForm` semantics.

`EditorDropdown` shrunk back to its single-field role (`term` / `evidence` / `reference` / `with`) — no more `all`/`evidenceAll` branches, no overflow menu, no `onSearchAnnotations`/`hasAspect` props. The popover-prefill plumbing in `ActivityTableNode` was deleted; the dialog now handles its own state.

Callback handoff for the new dialog uses the same module-level singleton pattern (`pendingOnSubmit` + `consumeAnnotationFormOnSubmit`) so `customProps` stays serializable.

## Blockers

- None.

## Notes

- **Why not extend `ActivityForm`?** User decision: keep `ActivityForm` untouched. `AnnotationForm` is its own component.
- **Single clever form vs two:** chose one with a `showTerm` flag. The evidence-list UI/logic is the bulk of the dialog and is identical across both modes; a single component avoids duplication. The term section is the only conditional and it's one block.
- **Callback handoff:** same module-level singleton pattern as `useOpenSearchAnnotations` (`pendingOnSubmit`/`consume…`) so `customProps` stays serializable and Redux's warning stays quiet.
- **Layout reuse:** look at `EntityRow` and `ActivityForm` for visual idioms — don't import from them. `AnnotationForm` should stand on its own.
- **Don't touch the form-mode path:** `ActivityForm` → `SearchAnnotations` still dispatches `updateTerm`/`setNodeEvidences`. This plan does not change that.
- **Search Annotations entry point inside `AnnotationForm`:** keep the same `gpId` + `aspect` parameters; reuse `useOpenSearchAnnotations`.

## Lessons Learned

<!-- fill in as we go -->

## Additional Context (Claude)

### Op-list ordering for the insert case (worth verifying before Phase 2)

`buildAddNodeOperations` mints the new individual + edge; evidence ops attach to that edge by `edgeId`. Need to confirm the call lets us either:

- (a) **synchronously** know the new edge's id before queuing evidence ops, so we can call `buildAddEvidenceToEdgeOperations(sourceId, newTargetId, newEdgeId, ev, …)` and append to the same op array — single batch round-trip, atomic from the user's perspective;
- (b) or accept that we need **two passes**: one `updateGraphModel` for the create, then a second for the evidence batch.

(a) is much better UX. A 60-second look at `buildAddNodeOperations`'s signature will tell us which it is.

### Naming

`AnnotationForm` is the cleanest name. Avoid `TermEvidenceForm` (awkward), `EditorDialog` (collides mentally with `EditorDropdown`), or `AnnotationDialog` (the *form* is what matters, the dialog is the container).

### Out of scope for this plan

- Validation beyond what the old code did (intentional — feature parity first).
- Reference/with allowed-DB pickers (already exist as `AllowedDatabasesPopover`; can be added later if needed).
- Replacing form-mode (`ActivityForm`) with `AnnotationForm`. Different beast, different scope.
