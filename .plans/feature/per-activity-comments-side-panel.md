# Task: Per-edge comments + all-comments side panel

**Status:** COMPLETE (pending manual smoke in dev server)

> **Note:** After initial impl, the user redirected us to **per-edge** comments (not per-activity / not replicated across all edges of an activity). This file's earlier "design decisions" block (replicate-on-every-edge) is superseded — see "Pivot to per-edge" below.
**Issue:** (none — new feature requested in-session)
**Branch:** issue-220-update-codebase

## Goal

Add per-activity comments (replicated on every edge of the activity, mirroring the Angular `AnnotationActivity.comments` reference impl). Surface all comments — model-level + per-activity — in a new right-drawer tab. Clicking a per-activity comment selects that activity (highlights it on the graph + opens the ActivityTable tab).

## Context

- **Reference (Angular):** `C:\work\go\noctua-standard-annotations\src\@noctua.form\models\standard-annotation\annotation-activity.ts`
  - `comments: string[] = []` lives on `AnnotationActivity` (line 52)
  - `predicate.comments = this.comments` is assigned to every triple on save (lines 182, 317)
  - On load, comments are aggregated + deduplicated across all of the activity's predicates (`noctua-form-config.service.ts:367-370`)
  - There is a global "Comments" sidenav (`src/app/main/apps/noctua-annotations/comments/comments.component.ts`) that lists per-activity comments
  - **No** model-level comment concept exists in the reference — it's per-fact only

- **Key files in this repo:**
  - Model: `src/features/gocam/models/cam.ts` (Activity, Edge, GraphModel)
  - API parse: `src/features/gocam/services/graphServices.ts` (`transformGraphData`)
  - Operation builders: `src/features/gocam/services/activityOperations.ts` (`buildSaveModelAnnotationsOperations`)
  - API enums: `src/features/gocam/models/operations.ts` (`AnnotationKey.COMMENT`)
  - Existing model-level form: `src/features/gocam/components/CamCommentsForm.tsx`
  - Existing model-level entry: `src/features/gocam/components/CamToolbar.tsx:142-157` (FaComment icon)
  - Right drawer router: `src/app/layout/RightDrawer.tsx`
  - Right drawer slice: `src/@noctua.core/components/drawer/drawerSlice.ts` (`RightPanelTab` enum)
  - Selection slice: `src/features/gocam/slices/camSlice.ts` (`setSelectedActivity`)
  - Canvas: `src/features/pathway/graph/camCanvas.ts` (no programmatic selectActivity API today)
  - Canvas wrapper hook: `src/app/hooks/usePathwayCanvas.ts`
  - Dialog system: `src/@noctua.core/components/dialog/dialogSlice.ts` (`DialogComponent` enum)
  - Dialog registration: `src/App.tsx` (`DIALOG_COMPONENTS` map)
  - Test fixtures: `tests/fixtures/builders.ts`
  - Test utilities: `tests/test-utils.tsx`

- **Triggered by:** User request — port the Angular per-annotation comment feature into the React editor and add a side panel that lists all comments (model + per-activity) with click-to-select.

## Current State

- **Works now:**
  - Model-level (CAM-wide) `comments: string[]` is fully implemented: parsed in `transformGraphData` (line 379-380), edited via `CamCommentsForm` opened from the comment icon in `CamToolbar`, saved via `buildSaveModelAnnotationsOperations`.
  - Activity selection: clicking a node fires `handleSelectActivity` → `setSelectedActivity` → opens right drawer with ActivityTable.
  - Right drawer has two tabs: `ACTIVITY_TABLE` and `CAM_ERRORS`.
  - Dialog infrastructure (`openDialog` + `DIALOG_COMPONENTS` map) is ready for new forms.

- **Broken/missing:**
  - `Activity` and `Edge` have no `comments` field.
  - `transformGraphData` does not parse `AnnotationKey.COMMENT` from fact annotations — only from model-level annotations.
  - No operation builder for saving per-activity comments.
  - No side panel that lists comments across the model.
  - Canvas has no public API for "select/focus this activity from outside" — only mouse-driven selection exists.

## Design Decisions (confirmed with user)

| Decision | Choice | Rationale |
| --- | --- | --- |
| Backend storage of per-activity comments | **Replicate on every edge** | Faithful port of Angular `AnnotationActivity` behavior; lets us round-trip legacy data that may already have per-fact comments. |
| Where to edit per-activity comments | **Inline read-only in ActivityTable + dialog for edit** | Comments stay visible alongside GP/FD trees; editing happens in a dedicated dialog that mirrors `CamCommentsForm`. |
| All-comments panel location | **New tab in existing right drawer** (`RightPanelTab.COMMENTS`) | Reuses drawer infra; clicking a comment can switch tabs to ACTIVITY_TABLE without leaving the drawer. |
| Entry point for the panel | **Existing FaComment icon in `CamToolbar`** | Repurpose the current icon: it already shows a count badge and is the natural "comments" affordance. The old direct-to-dialog behavior moves into the panel via a per-section "Edit" button. |

## Steps

### Phase 1 — Data model (parse path)

- [ ] Add `comments: string[]` to the `Edge` interface in `src/features/gocam/models/cam.ts`.
- [ ] Add `comments: string[]` to the `Activity` interface in `src/features/gocam/models/cam.ts`.
- [ ] In `transformGraphData` (`graphServices.ts`), inside the `data.facts` loop (around line 323), parse `AnnotationKey.COMMENT` annotations into `edgeData.comments`.
- [ ] In `extractActivities` (`graphServices.ts`), after collecting `activityEdges`, compute `comments` for the activity by gathering `edge.comments` from every edge and deduplicating preserving order. Set on the new Activity literal.
- [ ] Update `extractMolecules` the same way so molecule-type activities also surface comments.
- [ ] Update the empty-fallback `graphModel` returned by `transformGraphData` when `data` is null (line 263) — no change needed since model itself doesn't change, but verify Activity literals get an empty `comments: []`.

### Phase 2 — Operation builder (save path)

- [ ] In `src/features/gocam/services/activityOperations.ts`, add `buildSaveActivityCommentsOperations(activity, modelId, newComments)`:
  - For each edge in `activity.edges`:
    - For each existing comment in `edge.comments`, emit `EDGE` + `REMOVE_ANNOTATION` with `{ subject, object, predicate, values: [{ key: COMMENT, value }] }`.
    - For each comment in `newComments`, emit `EDGE` + `ADD_ANNOTATION` with the same subject/object/predicate.
  - Append the final `MODEL` + `STORE` op.
- [ ] Keep it minimal: do not de-duplicate against current — just remove-all-then-add-all per edge (mirrors how `buildSaveModelAnnotationsOperations` works).

### Phase 3 — Per-activity edit dialog

- [ ] Add `DialogComponent.ACTIVITY_COMMENTS_FORM = 'ActivityCommentsForm'` to `dialogSlice.ts`.
- [ ] Create `src/features/gocam/components/ActivityCommentsForm.tsx`:
  - Read `selectSelectedActivity` from `camSlice`.
  - State: local `comments: string[]`, seeded from `activity.comments`.
  - UI: clone the layout of `CamCommentsForm` (Add/Remove rows, `ConfirmDialog` for removing populated rows, Cancel/Save footer).
  - On Save: filter whitespace-only comments, call `buildSaveActivityCommentsOperations(activity, cam.id, filtered)`, `updateGraphModel(ops)`, then `dispatch(closeDialog())`.
  - Render `null` if no selected activity.
- [ ] Register the form in `src/App.tsx` `DIALOG_COMPONENTS` map.
- [ ] No new selectors needed — the form just reads `selectSelectedActivity`.

### Phase 4 — Inline read-only comments in `ActivityTable`

- [ ] In `src/features/gocam/components/ActivityTable.tsx`, after the header (between line 201 and the GP section), add a `<CommentsSection>` block:
  - Header row: "Comments" label, count chip, edit icon (`FaPen`) — clicking opens `ACTIVITY_COMMENTS_FORM` dialog via `openDialog`.
  - Body: if `activity.comments.length === 0`, show subtle "No comments yet" text. Otherwise list comments as plain text rows (no edit-in-place — must go through the dialog).
  - Keep it visually consistent with how `CamErrors`/`CamToolbar` show similar lightweight lists.

### Phase 5 — All-comments side panel

- [ ] Add `RightPanelTab.COMMENTS = 'comments'` to `drawerSlice.ts`.
- [ ] Create `src/features/gocam/components/CommentsPanel.tsx`:
  - **Header**: title "Comments", optional total count chip, close button (`setRightDrawerOpen(false)`), same chrome as `ActivityTable`/`CamErrors` headers.
  - **Section A — Model comments**:
    - Title "Model" + count.
    - Each comment as a row.
    - "Edit" button → `openDialog({ component: CAM_COMMENTS_FORM, ... })`.
    - If model has no comments: show "No model comments" + an "Add" button that opens the model dialog.
  - **Section B — Activity comments**:
    - Iterate `model.activities.filter(a => a.comments.length > 0)`.
    - For each activity: heading shows `activity.enabledBy?.label ?? activity.molecularFunction?.label ?? activity.rootNode.label` + count.
    - Each comment row is clickable:
      - `dispatch(setSelectedActivity(activity.uid))`
      - `dispatch(setRightPanelTab(RightPanelTab.ACTIVITY_TABLE))`
      - (Optional) call `canvas.current.focusActivity(activity.uid)` once that exists (see Phase 6).
    - If no activities have comments: show "No activity comments yet" hint with a note about how to add them.
- [ ] Route the new tab in `src/app/layout/RightDrawer.tsx`:
  - If `activeTab === RightPanelTab.COMMENTS && model`, render `<CommentsPanel model={model} />`.
  - Order the checks so COMMENTS wins over the default "activity?" branch.
- [ ] Update `CamToolbar.tsx`:
  - Replace `openCommentsForm` handler on the FaComment icon with: `dispatch(setRightPanelTab(RightPanelTab.COMMENTS)); dispatch(setRightDrawerOpen(true))`.
  - Update the badge count from `cam.comments.length` to `cam.comments.length + sum(activities.map(a => a.comments.length))`.
  - Update the tooltip text accordingly (or keep current — confirm during impl).

### Phase 6 — Canvas focus on selection (gap to close)

Today, `setSelectedActivity` from redux does **not** drive the canvas (clicks flow only canvas → redux, not the reverse). When a user clicks a comment in the panel, the ActivityTable opens but the canvas does not scroll to / highlight the activity.

- [ ] Add a public `selectActivity(uid: string)` method on `CamCanvas` (in `src/features/pathway/graph/camCanvas.ts`) that:
  - Finds the jointjs element for the activity.
  - Pans/zooms so it's centered (or at least in view).
  - Triggers the existing highlight pathway (`_highlightSuccessorNodes` or a new public equivalent).
- [ ] In `PathwayViewer.tsx`, add a `useEffect` that fires `canvas.canvasRef.current?.selectActivity(selectedActivityId)` whenever `selectedActivityId` changes and the canvas ref is non-null.
- [ ] Verify clicking comments in the panel pans the canvas as expected.

(If pan/zoom is too invasive on the first pass, ship Phase 6 with just the highlight call — leave centering as a follow-up.)

### Phase 7 — Tests

Vitest + RTL, mirroring existing conventions in `tests/features/gocam/`.

- [ ] **Fixtures** (`tests/fixtures/builders.ts`):
  - Add `comments?: string[]` overrides to `buildEdgeWithEvidence` and `buildActivity`.
- [ ] **`graphServices.test.ts`** (or new spec):
  - `transformGraphData` parses COMMENT annotations from facts into `edge.comments`.
  - `extractActivities` aggregates + deduplicates comments from all edges into `activity.comments`.
- [ ] **`activityOperations.test.ts`** (or new spec):
  - `buildSaveActivityCommentsOperations` emits one REMOVE_ANNOTATION per existing comment per edge, then one ADD_ANNOTATION per new comment per edge, finishing with a MODEL/STORE op.
  - Activity with no edges → only STORE op (don't crash).
- [ ] **`ActivityCommentsForm.test.tsx`**:
  - Clone `CamCommentsForm.test.tsx` structure: empty state, render existing, add row, remove empty/non-empty (with confirm), filter whitespace on save, close on cancel/save.
  - Use a preloaded state with both `cam.model` and `selectedActivityId` set.
- [ ] **`CommentsPanel.test.tsx`**:
  - Renders model comments under "Model" section.
  - Renders only activities that have comments, grouped by activity label.
  - Clicking an activity comment dispatches both `setSelectedActivity(activity.uid)` and `setRightPanelTab(ACTIVITY_TABLE)`.
  - Clicking "Edit" on the model section opens `CAM_COMMENTS_FORM` (verify via store state).
- [ ] **`ActivityTable.test.tsx`** (extend if exists, or new):
  - Comments section renders read-only rows from `activity.comments`.
  - Clicking the section's edit icon opens `ACTIVITY_COMMENTS_FORM` dialog.
- [ ] **`CamToolbar.test.tsx`** (extend if exists, or new):
  - FaComment icon click sets tab to COMMENTS and opens drawer (does **not** open dialog directly).
  - Count badge sums model + per-activity comments.

### Phase 8 — Manual smoke

- [ ] `npm run dev` (port 4208), load a model that has model-level comments and at least one activity. Verify:
  - Clicking the FaComment icon opens the new panel.
  - Model comments show + "Edit" opens the existing CamCommentsForm.
  - Per-activity comments (after adding via the new dialog) show under their activity heading.
  - Clicking a per-activity comment selects the activity, opens ActivityTable, and (Phase 6) focuses the canvas.
  - Adding a comment in the ActivityCommentsForm round-trips: save, refetch, comment shows again.
  - Removing a comment with content prompts the confirm dialog.
  - `npm run test` passes.
  - `npm run type-check` passes.
  - `npm run lint` is clean.

## Pivot to per-edge

After the activity-level impl was complete, the user redirected: "now it should be in each edge — add to the current menu on each [row]." So comments now live and are edited per-edge, not aggregated to the activity.

What changed:

- Dropped `Activity.comments`; the aggregation helper in `graphServices.ts` is gone.
- `buildSaveActivityCommentsOperations` → `buildSaveEdgeCommentsOperations(edge, modelId, newComments)` — single edge only.
- `DialogComponent.ACTIVITY_COMMENTS_FORM` → `DialogComponent.EDGE_COMMENTS_FORM`.
- `ActivityCommentsForm.tsx` deleted; `EdgeCommentsForm.tsx` added — takes `edgeUid` via `customProps`, looks up the edge from the model, and writes back to that edge.
- Inline activity-level Comments section in `ActivityTable.tsx` removed.
- The per-row "Comment" menu item in `ActivityTableNode.tsx` dispatches `openDialog({ ..., customProps: { edgeUid: edge.uid } })`. Item label shows `Comment` or `Comments (N)` based on `edge.comments.length`.
- `CommentsPanel.tsx` now lists edges per activity. Each edge has its own block (with the `subject → predicate → object` label and an inline Edit pen). Clicking a comment still selects the activity and switches to the ACTIVITY_TABLE tab.
- `CamToolbar` badge sums model + all edges' comments.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Pivoted the whole feature to per-edge comments. Tests, types, and lint all green.
- **Next immediate action:** ✅ TASK COMPLETE — pending only the user's manual smoke in `npm run dev` against a live model.
- **Recent commands run:**
  - `npm run type-check` (clean)
  - `npm run test` (573 passed, 0 failed)
  - `npx eslint <changed-source-and-test-files>` (clean)
- **Uncommitted changes:**
  - Modified: `src/features/gocam/models/cam.ts`, `src/features/gocam/services/graphServices.ts`, `src/features/gocam/services/activityOperations.ts`, `src/features/gocam/components/ActivityTable.tsx`, `src/features/gocam/components/ActivityTableNode.tsx`, `src/features/gocam/components/CamToolbar.tsx`, `src/features/gocam/slices/camSlice.ts`, `src/app/PathwayViewer.tsx`, `src/app/layout/RightDrawer.tsx`, `src/features/pathway/graph/camCanvas.ts`, `src/@noctua.core/components/dialog/dialogSlice.ts`, `src/@noctua.core/components/drawer/drawerSlice.ts`, `src/App.tsx`, `tests/fixtures/builders.ts`, `tests/features/gocam/services/activityOperations.test.ts`.
  - Added: `src/features/gocam/components/ActivityCommentsForm.tsx`, `src/features/gocam/components/CommentsPanel.tsx`, `tests/features/gocam/services/graphServices.test.ts`, `tests/features/gocam/components/ActivityCommentsForm.test.tsx`, `tests/features/gocam/components/CommentsPanel.test.tsx`, `.plans/feature/per-activity-comments-side-panel.md`.
- **Environment state:** nothing running.

## Failed Approaches
<!-- Prevent repeating mistakes after context reset -->

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| (none yet)     |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `.plans/feature/per-activity-comments-side-panel.md` | created | done |

(Phases 1-7 file list — fill in as we go)

| File | Phase | Action |
| ---- | ----- | ------ |
| `src/features/gocam/models/cam.ts` | 1 | add `comments` to `Edge` and `Activity` |
| `src/features/gocam/services/graphServices.ts` | 1 | parse COMMENT on facts; aggregate into activity |
| `src/features/gocam/services/activityOperations.ts` | 2 | add `buildSaveActivityCommentsOperations` |
| `src/@noctua.core/components/dialog/dialogSlice.ts` | 3 | add `ACTIVITY_COMMENTS_FORM` enum value |
| `src/features/gocam/components/ActivityCommentsForm.tsx` | 3 | new file |
| `src/App.tsx` | 3 | register form in `DIALOG_COMPONENTS` |
| `src/features/gocam/components/ActivityTable.tsx` | 4 | add inline Comments section |
| `src/@noctua.core/components/drawer/drawerSlice.ts` | 5 | add `RightPanelTab.COMMENTS` |
| `src/features/gocam/components/CommentsPanel.tsx` | 5 | new file |
| `src/app/layout/RightDrawer.tsx` | 5 | route COMMENTS tab |
| `src/features/gocam/components/CamToolbar.tsx` | 5 | change FaComment handler + badge |
| `src/features/pathway/graph/camCanvas.ts` | 6 | add `selectActivity(uid)` public method |
| `src/app/PathwayViewer.tsx` | 6 | useEffect syncing selection → canvas |
| `tests/fixtures/builders.ts` | 7 | add comments overrides |
| `tests/features/gocam/services/graphServices.test.ts` | 7 | new/extend |
| `tests/features/gocam/services/activityOperations.test.ts` | 7 | new/extend |
| `tests/features/gocam/components/ActivityCommentsForm.test.tsx` | 7 | new |
| `tests/features/gocam/components/CommentsPanel.test.tsx` | 7 | new |
| `tests/features/gocam/components/ActivityTable.test.tsx` | 7 | extend if exists |
| `tests/features/gocam/components/CamToolbar.test.tsx` | 7 | extend if exists |

## Blockers
- None currently.

## Notes

- **Why replicate-on-every-edge:** the Angular reference does this, and so do most curators. If we anchor only to the `enabled_by` edge, we lose round-trip fidelity for any pre-existing model whose comments live on other facts (e.g. a `has_input` edge). The cost is some annotation bloat, but Minerva already does this for evidence-style annotations, so it's a familiar pattern.

- **Edit overwrites per-edge variance:** if a curator had different comments on different edges of the same activity (legacy data), saving from the new form will overwrite all of them with the unified bag. This matches Angular behavior; the dedupe-on-read in Phase 1 is what makes the UI consistent. Document this in the form if it's surprising.

- **Comment ordering:** preserve insertion order across edges during aggregation. Use a `Set`-keyed-by-value with an array for ordering (or just `Array.from(new Set(...))`). Don't sort alphabetically.

- **Tooltip in CamToolbar (line 138-142):** currently shows `cam.comments.join(', ')`. After Phase 5, we may want to expand this to include per-activity comments — or simplify to just the count. Decide during impl.

- **Activity label fallback chain** for panel section headings: `enabledBy?.label || molecularFunction?.label || rootNode.label || 'Activity'`. Matches the chain used in `ActivityTable` header.

- **Performance:** if a model has many activities × many comments × many edges per activity, the save payload grows linearly. Realistically this stays small (<100 edges per activity, <10 comments per activity), so no batching needed.

- **State excluded from serializable check:** the dialog slice already excludes `dialog.customProps`. `ActivityCommentsForm` reads from redux selectors directly (no callbacks through `customProps`), so no new exclusions needed.

- **Tests use `MantineProvider`:** existing `CamCommentsForm.test.tsx` wraps with `MantineProvider`. New form tests need the same. `renderWithProviders` already supplies Redux; Mantine has to be added per-test (see line 33 of `CamCommentsForm.test.tsx`).

- **`tests/setup.ts`** stubs `matchMedia` for Mantine; nothing to do there.

## Lessons Learned
<!-- Fill during and after task -->
- (TBD)

## Additional Context (Claude)

**Risks spotted:**

1. **Aggregation hiding asymmetry:** if two edges of the same activity end up with different comment bags (curator edited only one via Angular tooling, or partial-save failure), the read-aggregate-then-write-replicate pattern silently normalizes them. This is correct behavior per the spec — but worth a UX hint somewhere (e.g. a help tooltip in the form: "Comments are shared across all facts in this activity").

2. **Activity selection from panel + delete:** if the user deletes an activity that's the source of the current panel-selected comment, the next selection will be stale. The `selectSelectedActivity` selector already returns `null` if the UID doesn't match — we just need to make sure CommentsPanel re-renders correctly when `model.activities` shrinks.

3. **Canvas pan UX:** auto-panning every time the user clicks a comment can be jarring. Consider only panning if the activity is currently off-screen; otherwise just highlight. This is a Phase 6 polish item — ship without it first.

4. **Molecule activities:** the data model treats `ActivityType.MOLECULE` and `PROTEIN_COMPLEX` as activities. Per-activity comments will work for them too, since they all have edges. Verify the activity label fallback works for molecules where `enabledBy` is null.

5. **`AnnotationKey` already has `COMMENT`** — no enum change needed, just usage in `transformGraphData` parse loop and the new operation builder.

**Alternatives considered (rejected):**

- *Store on rootNode/MF node only:* cleaner but loses round-trip fidelity with reference data. Rejected.
- *Single overlay modal instead of drawer tab:* less ergonomic for back-and-forth between comment and activity. Rejected.
- *Inline-editable comments in ActivityTable (no dialog):* would have to duplicate add/remove/confirm logic; dialog approach reuses the proven `CamCommentsForm` pattern. Going with read-only inline + dialog edit.

**Architectural observation:**

`CamToolbar` already houses model-level entry points for title, state, comments via `openDialog`. After this work it becomes a mix of "open dialog" (title/state) and "open drawer tab" (errors, comments) buttons. Reasonable as long as the affordances stay clear (icon for drawer-tab entries, pen icon for inline-edit dialog entries). If we later add more drawer panels (e.g. contributors), consider a dedicated `RightPanelTab` enum-driven button group instead of ad-hoc icons.
