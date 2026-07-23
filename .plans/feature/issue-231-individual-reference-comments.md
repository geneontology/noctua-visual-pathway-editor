# Task: Split per-statement comments into individual comments + reference comments (#231)

**Status:** IMPLEMENTED (pending review/manual QA)
**Issue:** #231
**Branch:** issue-231-comments

## Goal
**Add** two new comment targets *in addition* to the existing comment surfaces (model comments and per-statement/edge comments stay), per Pascale's spec:
- **(a) Comment on an individual** (GO term / input node) — categories: `General`, `GO term pending`
- **(b) Comment on a Reference** — comment stored on the evidence individual — categories: `General`, `Figure/Table`

"Done" = curators can add/edit categorized comments on any individual node and on any evidence/reference (from its evidence row); both persist as `comment` annotations on the respective individuals and round-trip on reload — **without removing the existing model or statement comment flows**.

## Context
- **Related files:**
  - Model: `src/features/gocam/models/cam.ts` (`GraphNode`, `Evidence`)
  - Parse: `src/features/gocam/services/graphServices.ts` (individual + evidence parsing)
  - Ops: `src/features/gocam/services/activityOperations.ts` (`buildSaveEdgeCommentsOperations` today)
  - Categories: `src/features/gocam/data/commentCategories.ts`
  - Editor: `src/features/gocam/components/StructuredCommentsEditor.tsx`
  - Forms: `src/features/gocam/components/EdgeCommentsForm.tsx`, `CamCommentsForm.tsx`
  - Rows/UI: `src/features/gocam/components/ActivityTableNode.tsx`, `EvidenceRow.tsx`
  - Panel: `src/features/gocam/components/CommentsPanel.tsx`
  - Dialogs: `src/@noctua.core/components/dialog/dialogSlice.ts`, `src/App.tsx`
- **Triggered by:** Issue #231 last comment (pgaudet, 2026-07-21).

## Current State
- **Model comments** — `model.comments`, MODEL annotations (key `comment`). Edited via `CamCommentsForm`. **Unchanged by this task.**
- **Per-statement comments** — `edge.comments`, EDGE annotations. Edited via `EdgeCommentsForm`, opened from the comment icon on each activity-table row (`ActivityTableNode`). **This is what changes.**
- Categories are a single flat list `COMMENT_CATEGORIES = ['General','Not suitable for annotation','Annotation dispute','Other']`, stored as a `"Category: text"` prefix (`formatComment`/`parseComment`).
- `StructuredCommentsEditor` hardcodes `COMMENT_CATEGORIES`.
- Evidence individuals are parsed as `GraphNode`s too (`extractEvidence` maps a node → `Evidence`), so a comment on the evidence individual is naturally a node comment.

## Design Decisions
- **Storage target:** individual comment → `add-annotation` on `OperationEntity.INDIVIDUAL` with `individual: node.uid`; reference comment → same op with `individual: evidence.uid`. One shared op builder handles both.
- **Reuse the editor:** `StructuredCommentsEditor` gains a `categories` prop so each form supplies its own list. Comment prefix `"Category: text"` format stays.
- **One reusable form** (`IndividualCommentsForm`) parameterized by `{ individualUid, categories, title, initialComments }` powers both the node-comment and reference-comment dialogs, alongside the existing `EdgeCommentsForm`.
- **Nothing is removed (additive):** model comments (`CamCommentsForm`), statement/edge comments (`EdgeCommentsForm`, `buildSaveEdgeCommentsOperations`, `EDGE_COMMENTS_FORM`, `edge.comments`) all stay. We only ADD the individual + reference comment paths.
- **Row UI:** since the row's existing comment icon already opens the statement (edge) comment form, the new "comment on the individual" is surfaced separately (recommend: a "Comment" item in the row's `…` action menu targeting `node.uid`) so both remain reachable. Reference comments live on the evidence row (no conflict).

## Steps

### Phase 1: Data model + parsing
- [ ] Add `comments: string[]` to `GraphNode` in `cam.ts` (default `[]`).
- [ ] Add `comments: string[]` to `Evidence` in `cam.ts`.
- [ ] In `graphServices.ts` individual-parsing loop, push `AnnotationKey.COMMENT` values into `nodeData.comments`; initialize `comments: []` in the `nodeData` literal.
- [ ] In `extractEvidence`, copy `evidenceNode.comments` onto the returned `Evidence`.
- [ ] Leave edge `comments` parsing as-is (statement comments stay).

### Phase 2: Categories
- [ ] In `commentCategories.ts` add:
  - `INDIVIDUAL_COMMENT_CATEGORIES = ['General', 'GO term pending']`
  - `REFERENCE_COMMENT_CATEGORIES = ['General', 'Figure/Table']`
- [ ] Extend `COMMENT_CATEGORY_BADGE_CLASSES` with `'GO term pending'` and `'Figure/Table'` colors.
- [ ] `parseComment` must recognize the new categories — generalize its known-category check to accept any of the category sets (or take an allowed-list arg).

### Phase 3: Editor + operations
- [ ] `StructuredCommentsEditor`: add `categories: readonly string[]` prop; use it for the `Select` data instead of `COMMENT_CATEGORIES`.
- [ ] `activityOperations.ts`: add `buildSaveIndividualCommentsOperations(individualUid, oldComments, newComments, modelId)` — remove-all + add-all `COMMENT` annotations on `OperationEntity.INDIVIDUAL`, trailing STORE. Keep `buildSaveEdgeCommentsOperations` untouched.

### Phase 4: Forms + dialogs
- [ ] New `IndividualCommentsForm` (based on `EdgeCommentsForm`): props `{ individualUid, categories, title }`; reads current comments from the node/evidence in `selectCamModel`; saves via `buildSaveIndividualCommentsOperations`.
- [ ] `dialogSlice.ts`: add `INDIVIDUAL_COMMENTS_FORM` (single component covers both node + reference via `customProps`); keep `EDGE_COMMENTS_FORM`.
- [ ] `App.tsx`: register the new dialog component alongside the existing ones.

### Phase 5: Wire up the UI (final layout — in-cell icons)
- [x] `EditableCell`: new `onComment` + `commentCount` props render a comment icon **just above the edit (pencil) icon** in the cell; green with a count when comments exist, gray-on-hover to add.
- [x] `ActivityTableNode`: **individual** comment icon lives in the term box (`EditableCell onComment`), count from `node.comments`. The **row-level** icon (before the `…` menu) is now an **all-comments rollup**: count = individual + statement(edge) + references; tooltip groups all three; click opens the statement (edge) comment editor.
- [x] `EvidenceRow`: **reference** comment icon lives in the Reference box (`EditableCell onComment`), count from `ev.comments`; opens `INDIVIDUAL_COMMENTS_FORM` with `REFERENCE_COMMENT_CATEGORIES`.
- [x] `CommentsPanel`: **Model** stays as its own top section; below it, **one section per activity**, and inside each activity the comments are split by type sub-groups (Statement / Individual / References). Grouped by activity first, then by type.

### Phase 6: Verify
- [ ] `npm run type-check`, `npm run lint`.
- [ ] Manual: add/edit/remove a comment on a GO-term node and on a reference; reload model; confirm round-trip and category badges.

## Open Questions (need confirmation before coding)
1. ~~Legacy edge comments~~ — **Resolved:** additive. Statement/edge comments stay fully functional; individual + reference comments are added on top. Nothing removed.
2. **Row UI placement** — new individual-comment goes in the row's `…` menu (statement comment keeps the existing icon), OR give the individual its own icon next to the statement icon? (Recommend: `…` menu item, to avoid two near-identical icons per row.)
3. **Model-level comments** — leave categories untouched (`General/Not suitable.../dispute/Other`)? (Recommend: leave untouched; out of scope.)
4. **"Internal vs External" labels** (earlier 2026-06-20 suggestion for export) — separate follow-up? (Recommend: yes, follow-up.)

## Recovery Checkpoint
- **Last completed action:** Implemented all phases; `npm run type-check`, targeted `eslint`, and full `npm run test` (800 passing) all green.
- **Next immediate action:** Manual QA in the running app (add/edit/remove individual + reference comments, reload, confirm round-trip). Then commit.
- **Uncommitted changes:** see Files Modified below.

## Known gap
- ~~GP row not reachable via `…` menu~~ **Resolved:** the individual comment icon now lives in the term `EditableCell`, which every row has — including the gene product row.

## Files Modified
| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/models/cam.ts` | add `comments?` to `GraphNode` + `Evidence` | done |
| `src/features/gocam/services/graphServices.ts` | parse `comment` on individuals; copy to `Evidence` | done |
| `src/features/gocam/data/commentCategories.ts` | new category lists + badges; generalize `parseComment` | done |
| `src/features/gocam/components/StructuredCommentsEditor.tsx` | `categories` prop | done |
| `src/features/gocam/services/activityOperations.ts` | `buildSaveIndividualCommentsOperations` | done |
| `src/features/gocam/components/IndividualCommentsForm.tsx` | new reusable form | done |
| `src/@noctua.core/components/dialog/dialogSlice.ts` | `INDIVIDUAL_COMMENTS_FORM` | done |
| `src/App.tsx` | register dialog | done |
| `src/@noctua.core/components/cell/EditableCell.tsx` | `onComment`/`commentCount` in-cell icon | done |
| `src/features/gocam/components/ActivityTableNode.tsx` | individual icon in term box; row icon = all-comments rollup | done |
| `src/features/gocam/components/EvidenceRow.tsx` | reference comment icon in Reference box | done |
| `src/features/gocam/components/CommentsPanel.tsx` | Individuals + References sections | done |

## Notes
- No new tests unless explicitly requested (per standing preference).
- Comment prefix format (`"Category: text"`) is reused unchanged so `parseComment`/`formatComment` keep working.
- Evidence individuals ARE nodes, so `GraphNode.comments` parsing covers references automatically; `Evidence.comments` is just a convenience copy for the evidence row/panel.
