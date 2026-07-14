# Task: Per-statement (per-line) structured comments + all-comments side panel

**Status:** COMPLETE (pending manual smoke + decision on test updates)
**Issue:** #231
**Branch:** issue-231-comments

## Goal

Let curators attach comments to an **individual statement** — i.e. a single fact / edge /
line in the Activity table (subject → predicate → object). This is **not** an activity-level
comment: each comment lives on one specific line, stored on `Edge.comments`. Reuse the
structured **Category + text** format already built for model comments
(`General` / `Not suitable for annotation` / `Annotation dispute` / `Other`, stored as
`"Category: text"`). Add a "Comments" side panel that lists every comment in the model
(model-level + each statement's), where clicking a statement's comment selects and centers
its activity on the canvas.

> **Per-line, not per-activity.** A statement = one `Edge` (fact/triple). The panel groups
> a statement's comments under its parent activity heading only for readability; the comment
> is attached to the edge, edited from that row's kebab menu, and saved to that edge alone.

## Context

- **Builds on:** the structured model comments added earlier this session —
  `src/features/gocam/data/commentCategories.ts` (`COMMENT_CATEGORIES`, `parseComment`,
  `formatComment`, `StructuredComment`) and the card UI in `CamCommentsForm.tsx`.
- **Reference implementation:** branch **`comments-tryouts`** already implements the full
  per-edge feature (but with plain-text comments, pre-dating the structured format). Diff it
  against its merge-base `5adcbda` to see every change. We port it to `issue-231-comments`
  and swap plain textareas for the structured card UI.
  - Angular origin of the "all comments" list concept:
    `noctua-standard-annotations/src/app/main/apps/noctua-annotations/comments/`.

- **Files to touch (all confirmed present on this branch):**
  - `src/features/gocam/models/cam.ts` — add `comments` to `Edge` (line ~99)
  - `src/features/gocam/services/graphServices.ts` — parse `COMMENT` on facts (~line 318/334)
  - `src/features/gocam/services/activityOperations.ts` — add `buildSaveEdgeCommentsOperations`
  - `src/@noctua.core/components/dialog/dialogSlice.ts` — add `EDGE_COMMENTS_FORM`
  - `src/features/gocam/components/EdgeCommentsForm.tsx` — NEW (structured card UI)
  - `src/App.tsx` — register `EDGE_COMMENTS_FORM` in `DIALOG_COMPONENTS`
  - `src/features/gocam/components/ActivityTableNode.tsx` — "Comment" item in row kebab (after `Add Evidence`, line 325)
  - `src/@noctua.core/components/drawer/drawerSlice.ts` — add `RightPanelTab.COMMENTS`
  - `src/features/gocam/components/CommentsPanel.tsx` — NEW (side panel)
  - `src/app/layout/RightDrawer.tsx` — route the COMMENTS tab
  - `src/features/gocam/components/CamToolbar.tsx` — comment icon opens panel; badge counts model + all edges
  - `src/features/gocam/slices/camSlice.ts` — export `selectSelectedActivityId`
  - `src/features/pathway/graph/camCanvas.ts` — add public `selectActivity(uid)` + `_centerOn`
  - `src/app/PathwayViewer.tsx` — `useEffect` syncing selected activity → `canvas.selectActivity`

## Current State

- Model comments (CAM-wide) already use the structured Category+text format and open from the
  toolbar comment icon via `CAM_COMMENTS_FORM`.
- `Edge` has **no** `comments` field; facts' `COMMENT` annotations are not parsed.
- No per-statement editing, no side panel, no canvas "select from outside" API.
- `ActivityTableNode` kebab menu currently ends: `Add Evidence` → `Delete`.
- `RightPanelTab` has only `ACTIVITY_TABLE` and `CAM_ERRORS`.

## Design Decisions (confirmed)

| Decision | Choice |
| --- | --- |
| Granularity | **Per statement / per edge** (`Edge.comments`), never aggregated to the activity. |
| Storage | `string[]` on the edge; each entry is `"Category: text"` (blank category → text as-is), same as model comments. |
| Backend | Remove-all-then-add-all `COMMENT` annotations on that one edge (subject/object/predicate), then `STORE`. Mirrors `buildSaveModelAnnotationsOperations`. |
| Edit entry point | A **"Comment" / "Comments (N)"** item in each statement row's kebab menu → `EdgeCommentsForm` dialog (passed `edgeUid` via `customProps`). |
| Form UI | Reuse the structured **card UI** (category `Select` + `Textarea`, add/remove, confirm-on-remove) from `CamCommentsForm`; header shows the statement's subject → predicate → object for context. |
| Side panel | New `RightPanelTab.COMMENTS`. Section A = model comments (Edit → existing `CAM_COMMENTS_FORM`). Section B = statements with comments, grouped by parent activity; each comment row is clickable → selects + centers the activity. |
| Toolbar icon | Comment icon now **opens the panel** (not the model dialog); badge = model comments + all edge comments. |
| Canvas | Clicking a panel comment drives `canvas.selectActivity(uid)` to highlight + center. |
| Tests | **Not** included unless you ask. `comments-tryouts` has test files (`EdgeCommentsForm.test.tsx`, `CommentsPanel.test.tsx`) that can be ported + adapted to structured format on request. |

## Steps

### Phase 1 — Data model + parse
- [ ] `cam.ts`: add `comments: string[]` to the `Edge` interface.
- [ ] `graphServices.ts` `transformGraphData`: init `comments: []` on the `edgeData` literal;
      in the fact-annotations loop, `else if (annotation.key === AnnotationKey.COMMENT) edgeData.comments.push(annotation.value)`.

### Phase 2 — Save operation
- [ ] `activityOperations.ts`: add `buildSaveEdgeCommentsOperations(edge, modelId, newComments)`:
      for each old comment on the edge → `EDGE` `REMOVE_ANNOTATION` `{subject: sourceId, object: targetId, predicate: id, values:[{key: COMMENT, value}], 'model-id'}`;
      for each new comment → `EDGE` `ADD_ANNOTATION` (same shape); finish with `MODEL` `STORE`.

### Phase 3 — EdgeCommentsForm (structured)
- [ ] `dialogSlice.ts`: add `EDGE_COMMENTS_FORM = 'EdgeCommentsForm'`.
- [ ] NEW `EdgeCommentsForm.tsx` (props `{ edgeUid: string }`):
      look up the edge from `selectCamModel` (scan `activities[].edges`); local state
      `StructuredComment[]` seeded from `edge.comments.map(parseComment)`; card UI identical to
      `CamCommentsForm` (category `Select` + `Textarea`, Add Another, `ConfirmDialog` on removing
      a populated row); header line shows `subject → predicate → object`; on save
      `comments.filter(c => c.text.trim()).map(formatComment)` → `buildSaveEdgeCommentsOperations(edge, cam.id, …)`
      → `updateGraphModel` → `closeDialog`. Render `null` if edge not found.
- [ ] `App.tsx`: register `[DialogComponent.EDGE_COMMENTS_FORM]: EdgeCommentsForm`.

### Phase 4 — Row menu entry
- [ ] `ActivityTableNode.tsx`: add `handleAddComment` (dispatch `openDialog({component: EDGE_COMMENTS_FORM, title:'Comments', size:'sm', customProps:{edgeUid: edge.uid}})`);
      insert after the `Add Evidence` item: `{edge && <Menu.Item onClick={handleAddComment}>{edge.comments?.length ? \`Comments (${edge.comments.length})\` : 'Comment'}</Menu.Item>}`.

### Phase 5 — Comments side panel
- [ ] `drawerSlice.ts`: add `RightPanelTab.COMMENTS = 'comments'`.
- [ ] NEW `CommentsPanel.tsx` (`{ model }`): header with total count + Close.
      - Section A "Model": list `model.comments`; Edit/Add icon → `openDialog(CAM_COMMENTS_FORM)`.
      - Section B "Activities": `model.activities.map(a => ({activity, edges: a.edges.filter(e => e.comments?.length)})).filter(x => x.edges.length)`;
        per activity heading (`enabledBy?.label ?? molecularFunction?.label ?? rootNode.label`); per edge show `subject predicate object` + an Edit pen (→ select activity, open `EDGE_COMMENTS_FORM` with `edgeUid`); each comment is a clickable button → `setSelectedActivity(activity.uid)` + `setRightPanelTab(ACTIVITY_TABLE)`.
      - Display note: comments are `"Category: text"` strings — render as-is; optional polish: split on first `": "` to show the category as a small badge.
- [ ] `RightDrawer.tsx`: `if (activeTab === RightPanelTab.COMMENTS && model) return <CommentsPanel model={model} />` (before the CAM_ERRORS / activity branches).

### Phase 6 — Toolbar
- [ ] `CamToolbar.tsx`: replace `openCommentsForm` with `openCommentsPanel` (`setRightPanelTab(COMMENTS)` + `setRightDrawerOpen(true)`);
      `commentCount = (cam.comments?.length ?? 0) + Σ activities Σ edges (e.comments?.length ?? 0)`; update tooltip to a count/"view all" string.

### Phase 7 — Canvas focus on selection
- [ ] `camSlice.ts`: export `selectSelectedActivityId`.
- [ ] `camCanvas.ts`: add public `selectActivity(uid: string | null)` — null → `_unselectAll`; else
      find the joint element whose `prop('activity').uid === uid`, `_selectNode` it (if `NodeCellList`),
      then `_centerOn(element)` (translate paper so element center is viewport center). **Verify these
      internals (`_unselectAll`, `_selectNode`, `NodeCellList`) exist on this branch before wiring.**
- [ ] `PathwayViewer.tsx`: `useEffect(() => { canvas.canvasRef.current?.selectActivity(selectedActivityId) }, [selectedActivityId, canvas.canvasRef])`.

### Phase 8 — Verify
- [ ] `npm run type-check` + `npx eslint` on all touched files clean.
- [ ] Manual smoke (`npm run dev`, port 4208): add a comment on a statement row via its menu;
      confirm the category+text card UI; save; reopen — round-trips; menu label shows `Comments (N)`;
      toolbar icon opens the panel; panel lists model + per-statement comments; clicking a
      statement comment selects + centers the activity and switches to the Activity table.

## Recovery Checkpoint
- **Last completed action:** Phases 1-7 implemented; `npm run type-check` + `eslint` clean on all touched files; full suite 745 pass / 5 fail.
- **Next immediate action:** ✅ per-statement work COMPLETE. Awaiting user decision: (a) manual smoke in dev; (b) whether to update the 5 failing `CamCommentsForm.test.tsx` tests + add tests for `EdgeCommentsForm`/`CommentsPanel`.
- **Known test failures (pre-existing, from the earlier model-comments structured-format change — NOT this work):**
  `tests/features/gocam/components/CamCommentsForm.test.tsx` — 5 tests assert the old plain-textarea behavior (placeholder `"Comment"`, textarea appears immediately on "Add Comment"). The form now uses category `Select` + a textarea (placeholder `"Write your comment..."`) that renders only after a category is chosen. Tests need updating to the structured UI.
- **Uncommitted changes:** all Phase 1-7 files + `commentCategories.ts`, model `CamCommentsForm.tsx` (earlier), both plan files.

## Files Modified
| File | Phase | Action |
| ---- | ----- | ------ |
| `src/features/gocam/models/cam.ts` | 1 | add `Edge.comments` |
| `src/features/gocam/services/graphServices.ts` | 1 | parse COMMENT on facts |
| `src/features/gocam/services/activityOperations.ts` | 2 | `buildSaveEdgeCommentsOperations` |
| `src/@noctua.core/components/dialog/dialogSlice.ts` | 3 | `EDGE_COMMENTS_FORM` |
| `src/features/gocam/components/EdgeCommentsForm.tsx` | 3 | NEW (structured) |
| `src/App.tsx` | 3 | register dialog |
| `src/features/gocam/components/ActivityTableNode.tsx` | 4 | row menu item |
| `src/@noctua.core/components/drawer/drawerSlice.ts` | 5 | `RightPanelTab.COMMENTS` |
| `src/features/gocam/components/CommentsPanel.tsx` | 5 | NEW panel |
| `src/app/layout/RightDrawer.tsx` | 5 | route tab |
| `src/features/gocam/components/CamToolbar.tsx` | 6 | icon → panel + badge |
| `src/features/gocam/slices/camSlice.ts` | 7 | export selector |
| `src/features/pathway/graph/camCanvas.ts` | 7 | `selectActivity` + `_centerOn` |
| `src/app/PathwayViewer.tsx` | 7 | selection → canvas effect |

## Notes
- **UI polish (done):**
  - Row comment icon is **green** (with a green count `Indicator` badge) when a statement has
    comments, gray otherwise; badge no longer clipped (Mantine `Indicator`, `w-10` cell).
  - Empty (no-comment) icon is **hidden until row hover** (`group` + `group-hover`/`focus-within`)
    to declutter the table; icon stays visible when comments exist.
  - Row icon **tooltip previews the actual comment text** (one per line), not just a count.
  - **Category color-coding** (`getCommentCategoryBadgeClass` in `commentCategories.ts`): General=blue,
    Not-suitable=amber, Annotation-dispute=red, Other=gray — used on the panel badges.
  - **Shared `StructuredCommentsEditor`** component now backs both `CamCommentsForm` and
    `EdgeCommentsForm` (removed the duplicated card UI).
- **Comment affordance (updated):** per the Angular reference
  (`noctua-standard-annotations/.../table/annotation-node`), each statement row now shows a
  **comment icon in its own cell just before the `…` menu** (count badge when comments exist,
  clicking opens `EdgeCommentsForm`). The earlier kebab "Comment" menu item was removed as
  redundant.
- **Structured vs plain:** the `comments-tryouts` reference uses plain textareas; we deviate by
  reusing `commentCategories.ts` + the card UI so per-statement and model comments look/behave the
  same. Storage stays `string[]` either way, so the parse/save layers are identical to the reference.
- **No `AnnotationKey` change** — `COMMENT` already exists; only new usages in the fact parse loop
  and the edge save builder.
- **Ordering:** preserve insertion order of comments on an edge; do not sort.
- **customProps serializable check:** `EdgeCommentsForm` receives only `edgeUid` (a string) via
  `customProps` — no callbacks — so no new store exclusions needed.
- **Canvas centering REMOVED (bugfix):** the original `_centerOn` (`paper.translate`) re-centered
  the viewport on the selected node on *every* selection change (panel edit pen, comment click, and
  normal canvas node clicks). Because the graph is fit-to-view, centering one node pushed the rest
  off-screen — the graph appeared to "disappear." `selectActivity` now highlights only (orange border
  via `_selectNode`), no viewport move. Follow-up option: scroll-into-view only when the node is
  actually off-screen, preserving the current fit.
