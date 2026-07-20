# Task: Enable Search Annotations when editing an existing activity's MF (and aspect nodes)

**Status:** ACTIVE
**Issue:** #255
**Branch:** issue-255-edit-mf-search-annotions

## Goal
On an **existing** activity, editing the Molecular Function (and other aspect rows: BP/CC)
should open the Search‑Annotations‑capable form so a curator can pick an annotation
(term + evidences) and apply it in place — the same way it already works when creating an
activity. "Enable edit on MF and everything else already works."

## Context
- **Edit surface for existing activities:** right drawer → `ActivityTable` → `ActivityTableNode`
  (opened by the edit/pencil icon via `PathwayViewer.handleSelectActivity`).
- **The form that already works ("the other one"):** `AnnotationForm`, opened via
  `useOpenAnnotationForm`. Its **Search Annotations** button shows whenever `gpId && aspect`
  are passed (`AnnotationForm.tsx:188`). `ActivityTableNode.handleInsertNode` (Add Context)
  already passes both, so search works there.
- **Related files:**
  - `src/features/gocam/components/ActivityTableNode.tsx` — the row menu / term-cell edit for existing activities (primary change)
  - `src/features/gocam/components/forms/AnnotationForm.tsx` — target form (no change expected)
  - `src/features/gocam/hooks/useOpenAnnotationForm.ts` — opener (no change expected)
  - `src/features/gocam/services/activityOperations.ts` — save ops builders
  - `src/features/gocam/models/formModels.ts` — `evidenceToForm` (already used here)

## Current State
- **What works now:**
  - Creating an activity: `ActivityForm`/`EntityRow` row menu has **Search Annotations** for aspect nodes.
  - Existing activity: term edit via `EditorDropdown` (term only), evidence via `Add Evidence`
    (`AnnotationForm` `showTerm:false` — ISS/ISO/IC already available there).
  - In-place term swap is already supported: `buildEditIndividualTypeOperations` (REMOVE_TYPE + ADD_TYPE on the same individual).
  - Evidence reconcile already supported: `buildReconcileEdgeEvidenceOperations`.
- **What's missing:**
  - No **Search Annotations** affordance anywhere on an existing activity's rows. The MF row
    never opens `AnnotationForm` with `showTerm:true` + `gpId` + `aspect`.

## Approach (targeted — no rewire of the edit icon)
Add a **Search Annotations** entry to `ActivityTableNode`'s row menu for aspect‑bearing nodes
(MF/BP/CC), mirroring `EntityRow`'s create-form menu. It opens the existing `AnnotationForm`
pre-filled with the row's current term + evidence, and saves in place.

Gating (reuse existing rules):
- Show only when `aspect` is set AND `gpNodeId` is available (search needs the gene product) AND
  `isSearchAnnotationsEnabledFor(activityType)` (excludes Molecule / Protein-Complex),
  matching the create form.

On submit `{ term, evidences }`:
- If `term.id !== node.id` → term changed → REMOVE_TYPE/ADD_TYPE via `buildEditIndividualTypeOperations`.
- Reconcile the row's edge evidence via `buildReconcileEdgeEvidenceOperations(edge, edge.evidence, evidences, ...)`.
- Combine into a **single** `updateGraphModel` batch ending in one STORE.

## Steps

### Phase 1: Save path
- [x] Added `buildEditNodeAnnotationOperations(node, edge, newTerm, originalEvidence, submittedEvidence, modelId, userContext)`
      in `activityOperations.ts` — type swap (only if changed) + STORE-free evidence reconcile + one trailing STORE.

### Phase 2: UI wiring in ActivityTableNode
- [x] Added `handleSearchAnnotations` → `openAnnotationForm({ showTerm:true, gpId, aspect, initialTerm, initialEvidences, termRootTypes, activityType, onSubmit })`; onSubmit calls the new combined builder.
- [x] Added a **Search Annotations** `Menu.Item` (first item) gated by `searchAnnotationsEnabled` = `edge && aspect && gpNodeId && isSearchAnnotationsEnabledFor(activityType)`.
- [x] Left the term-cell `EditorDropdown` and `Add Evidence` untouched.

### Phase 3: Verify
- [x] `npm run type-check` — clean.
- [x] `npx eslint` on both files — clean.
- [x] `npx vitest run` services + ActivityTable — 151 passed.
- [ ] Manual: edit an existing activity's MF via Search Annotations → term + evidence update and persist.
- [ ] Confirm Molecule/Protein-Complex rows do NOT show it (rule parity with create form).

## Recovery Checkpoint
- **Last completed action:** Implemented Phase 1 + 2; type-check/lint/tests green. `activityOperations.ts` (new builder) and `ActivityTableNode.tsx` (handler + menu item) changed.
- **Next immediate action:** Manual verification in-app, then commit.
- **Uncommitted changes:** `src/features/gocam/services/activityOperations.ts`, `src/features/gocam/components/ActivityTableNode.tsx`, plan file.

## Failed Approaches
| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Rewire `onEditClick` → open full `ActivityForm` in `FormMode.EDIT` (dispatch `initEditForm`) | User wants a targeted "enable edit on MF" in the existing right‑drawer surface, not a switch to the modal full-form edit UX | 2026-07-20 |

## Follow-up: preselect edited term in the picker
When opening Search Annotations on a row that already has a term, highlight that term
by default in the "Select Term" list if it is among the results.
- `SearchAnnotations.tsx`: added `preselectTermId?` prop + effect that fills an empty
  `selectedTerm` with the matching annotation once results load (manual pick still wins).
- `AnnotationForm.tsx`: passes `preselectTermId={term?.id}`.
- `ActivityForm.tsx`: threads the node's current term id via `pickerState.termId`.

## Files Modified
| File | Action | Status |
| ---- | ------ | ------ |
| src/features/gocam/services/activityOperations.ts | add combined edit builder | done |
| src/features/gocam/components/ActivityTableNode.tsx | add Search Annotations menu item + handler | done |
| src/features/gocam/components/forms/SearchAnnotations.tsx | preselect current term (highlight by default) | done |
| src/features/gocam/components/forms/AnnotationForm.tsx | pass preselectTermId | done |
| src/features/gocam/components/forms/ActivityForm.tsx | thread node term id to picker | done |
| tests/features/gocam/services/activityOperations.test.ts | add 10 tests for buildEditNodeAnnotationOperations | done |

## Notes — pre-existing test failures (NOT from this work)
`npm run test` shows 27 failing tests across ActivityForm/AnnotationForm/CamCommentsForm/
CamStateForm/CamTitleForm/CommentsPanel/EdgeCommentsForm — all footer Save/Cancel buttons
gated behind login by #278, with tests that never log a user in. Five of these files were
untouched by this task. Out of scope here; flag separately.

## Notes
- ISS/ISO/IC for existing activities already works via `Add Evidence` (AnnotationForm passes `aspect`/`activityType`).
- The full `ActivityForm` `FormMode.EDIT` path (`initEditForm`, `buildEditActivityOperations`) exists but is unused in the UI; intentionally left untouched for this issue.
- PR: tag reporter (@rozaru) and @pgaudet; reference (#255), do not close unless told.
