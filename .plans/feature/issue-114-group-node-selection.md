# Task: Group node selection and movement (PowerPoint-style)

**Status:** ACTIVE
**Issue:** [#114](https://github.com/geneontology/noctua-visual-pathway-editor/issues/114) — currently labelled `wontfix`
**Branch:** `issue-114-group-selection`

## Goal

Let a curator select several nodes at once — by dragging a marquee box on blank canvas or
shift-clicking — see them highlighted, and drag the whole set as a unit with relative positions
preserved. Arrow-key nudge and a selection bounding box are the optional extras from the issue.

## Context

- **Related files:**
  - `src/features/pathway/graph/camCanvas.ts` — JointJS paper/graph wiring, all event handlers,
    position persistence, the existing single-selection API (727 lines)
  - `src/features/pathway/graph/shapes.ts` — `NodeCellList`, `NodeCellMolecule`, `NodeLink`
    markup + `setBorder`/`unsetBorder`
  - `src/features/pathway/graph/dropPlacement.ts` — precedent for a pure, unit-tested canvas helper
  - `src/features/pathway/components/PathwayGraph.tsx` — React ↔ canvas callback bridge
  - `src/app/PathwayViewer.tsx` — orchestration; owns `handleUpdateLocations`
  - `src/features/gocam/slices/camSlice.ts` — `selectedActivityId: string | null`
- **Triggered by:** issue #114, raised at a GO Meeting.

## Reassessing the `wontfix`

The issue was closed off with _"Cannot do with the current codebase"_ (pgaudet, Nov 2025). That no
longer holds. Three things, all verified against the current tree and the installed
`jointjs@3.7.7`:

1. **Group movement never touches the server.** `_persistPositions()` (`camCanvas.ts:540`) hands
   positions to `PathwayViewer.handleUpdateLocations`, which writes
   `localStorage['activityLocations-<modelId>']` (`PathwayViewer.tsx:287`). Positions are not in
   `GraphModel`, not in any `Operation[]` builder, and never reach m3Batch. So dragging a group is
   pure client-side rendering — no Minerva round-trip, no batching cost, no multi-curator conflict,
   no semantic risk to the GO-CAM. `_persistPositions` already writes **every** element's position
   on each call, so the criterion _"positions of all nodes update in sync"_ needs no change at all.
2. **The primitives are in the free MPL-2.0 core**, not the paid tier. `graph.findModelsInArea()`
   (`joint.d.ts:235`), `graph.getCellsBBox()` (:241), `highlighters.stroke`/`mask` (:1967, :2001)
   with static `add`/`remove`/`removeAll` (:1911–1927), `paper.getLayerNode(Layers.FRONT)` (:1577),
   `element.translate(tx, ty, opt)` (:499). What JointJS+ sells is the packaging (`ui.Selection`),
   not the capability — confirmed absent from both `jointjs@3.7.7` and `@joint/core@4.3.2`, so
   upgrading would not hand us this for free either.
3. **Manual layout already coexists with dagre.** `addCanvasGraph` applies saved positions and sets
   `hasManualLayout`, which short-circuits `autoLayout()` (`camCanvas.ts:308–320`). A group move is
   just more manual positioning, and links re-route themselves because they track their endpoints —
   which covers the issue's _"integrate well with the dagre tree"_ note and _"should not break edge
   rendering or layout"_.

## Current State

**What works now**

- Single selection: `_selectNode()` (`camCanvas.ts:679`) calls `_unselectAll()` then
  `setBorder('orange', 500)`. Public `selectActivity(uid | null)` (:697) drives it from React
  (`PathwayViewer.tsx:130–132`); `camSlice.selectedActivityId` is `string | null`.
- Elements are freely draggable — `interactive` is only `{ labelMove: false }` (:103).
  `change:position` sets `_layoutChanged` (:268) and `element:pointerup` persists (:271).
- Panning is **native container scroll** (`PathwayGraph.tsx:113` `overflow-auto` over a
  30000×30000 paper), not `paper.translate`. So a blank-canvas drag gesture is unclaimed.

**What's missing / in the way**

- No multi-selection concept anywhere — canvas, React, or Redux.
- Blank drag is free: the only blank bindings are `blank:pointerdblclick` (:122) and
  `blank:contextmenu` (:195). No `blank:pointerdown`/`pointermove`/`pointerup`.
- **No single-click handler on elements at all.** Only `element:pointerdblclick` (:127), which
  selects _and_ opens the right drawer. Click-vs-dblclick-vs-drag semantics are a real design
  decision, not just typing.
- `NodeCellMolecule` (`shapes.ts:490`) has **no `highlighter` node and no `setBorder`/`unsetBorder`** —
  chemicals literally cannot render as selected today. `NodeLink` (:524) likewise. `_unselectAll`
  (:684) and `selectActivity` (:706) both gate on `instanceof NodeCellList`. The issue explicitly
  asks for activities **+ small molecules + relations**.
- `addCanvasGraph` calls `graph.resetCells(cells)` (:305) on every RTK Query refetch, and
  `updateGraphModel` has `invalidatesTags: ['graph']` — so **every save destroys every cell** and
  any state held on it. (This is also a latent bug today: the effect at `PathwayViewer.tsx:130–132`
  has deps `[selectedActivityId, canvas.canvasRef]`, not the model, so the existing orange border is
  silently lost after each save.)
- `_highlightSuccessorNodes` (:496) repaints `body/fill` on **every** element on every mouseover,
  restoring from `cell.prop('colorKey')`. So `body/fill` is unusable as a selection channel, and
  `highlighter/stroke` is already taken by single-selection.

## Design decisions

1. **Selection lives off the cells** — a `Set<string>` of activity uids, re-applied after each
   rebuild. _Refined during implementation:_ it is owned by the `CamCanvas` **instance** (which is
   created once and survives `resetCells`) rather than by React, because the canvas is what
   originates a marquee. React learns about it through an `onSelectionChange` callback, matching how
   `onUpdateLocations` already works. Redux was not touched.
2. **One border channel with precedence, not two.** _Changed from the original plan._ Multi-select
   paints `blue/600`, drawer focus paints `orange/500`, and multi-select wins where a node is both.
   The original two-channel idea (`highlighters.stroke` alongside `setBorder`) was dropped: view-level
   highlighters need `requireView`/`render:done` sequencing because the paper is `async: true`,
   whereas `setBorder` writes a model attribute that survives a rebuild for free. Simpler, and it
   reuses the code path already proven for single selection. The cost is that a focused node inside a
   multi-selection reads as selected rather than focused — unambiguous in practice.
3. **`graph.findModelsInArea()`, not `paper.findViewsInArea()`.** The paper is `async: true` (:102),
   so view-level lookups can miss cells that have not rendered yet. The graph-level call is
   synchronous and complete.
4. **Draw the marquee as an SVG rect in the FRONT layer**, not an HTML overlay div. Blank pointer
   events already arrive in paper-local coordinates, and a rect in the paper pans and zooms for
   free — an HTML overlay would drift against the scrolled 30000px paper.
5. **Scope:** #114 only. Align/distribute, snap guides, undo/redo, bulk delete are deliberately out —
   see _Additional Context_.

## Steps

### Phase 1: Selection state (pure, testable)

- [x] `src/features/pathway/graph/selectionModel.ts` — no JointJS import, following the
      `dropPlacement.ts` precedent so it is unit-testable under jsdom: holds a `Set<string>` of
      uids, with `replace(uids)`, `toggle(uid)`, `add(uids)`, `clear()`, `prune(currentUids)`,
      `has(uid)`, `list()`, `size`.
- [x] `prune` is what makes selection survive a rebuild — drop uids that no longer exist.

### Phase 2: Make all three cell types selectable

- [x] `shapes.ts` — add a `highlighter` circle to `NodeCellMolecule` markup + attrs, and
      `setBorder`/`unsetBorder` mirroring `NodeCellList` (:336–345).
- [x] Extract a shared `Selectable` interface (or union type) so `_unselectAll` (:684) and
      `selectActivity` (:706) stop gating on `instanceof NodeCellList`.
- [x] Relation selection: `NodeLink.setSelected()`. Both it and `hover()` now write to `selected` /
      `hovered` props and share one `_applyEmphasis()`, so un-hovering a selected relation no longer
      resets it to unselected. A relation reads as selected when **both** its activities are —
      derived, never stored, which is also why `findModelsInArea` returning elements only is fine.

### Phase 3: Marquee gesture

- [x] `src/features/pathway/graph/marqueeSelection.ts` — a module taking `(paper, graph)` rather
      than growing the already-727-line `CamCanvas`.
- [x] `blank:pointerdown` → record local origin, append `<rect>` to
      `paper.getLayerNode(joint.dia.Paper.Layers.FRONT)`.
- [x] `blank:pointermove` → resize the rect from the supplied local x/y.
- [x] `blank:pointerup` → normalize to a `g.Rect`, `graph.findModelsInArea(rect)`, map each element
      through `el.prop('activity')` (the established cell→domain mapping, :129/:543/:704) to uids,
      then `replace` or union depending on `evt.shiftKey`; remove the rect.
- [x] Verify the existing `blank:pointerdblclick` deselect (:122) still fires — a dblclick is
      preceded by pointerdown/up pairs, so the marquee must no-op on a zero-area drag.

### Phase 4: Click selection

- [x] `element:pointerdown` handler: shift/ctrl/cmd-click toggles membership. A plain pointerdown is
      left alone so it still starts a drag and the double-click still opens the drawer; dragging a
      node *outside* the selection drops the selection, dragging one *inside* keeps the group.
- [x] Suppress element translation on a modifier-click — via `cellView.preventDefaultInteraction(evt)`,
      **not** `stopPropagation`. See Failed Approaches.
- [x] `Escape` and blank click clear the selection.

### Phase 5: Group drag

- [x] Listen `change:position`; if the moved element is the drag anchor, translate every other member
      by the same delta.
- [x] Guard recursion with a `_groupDragging` flag (simpler than threading a custom flag through
      `TranslateOptions`, and it also covers the `nudgeSelection` path).
- [x] **Superseded — `restrictTranslate: true` kept.** Rather than compute a group-aware restricted
      area, the delta is measured from the dragged node's *actual* position change since the last
      event, not from the pointer. A node clamped at the paper edge therefore reports a smaller
      delta and the group stays in formation on its own. Less code, and it cannot break single-node
      dragging the way a bad callback would.
- [x] Confirmed `_persistPositions()` on `element:pointerup` needs no change — it already iterates
      every element.

### Phase 6: Survive the rebuild

- [x] In `addCanvasGraph`, after `resetCells` (:305) and the saved-position pass, call
      `selectionModel.prune(activityUids)` — reusing the uid list already collected at :331–335 for
      `DropPlacement` — then re-apply highlighters.
- [x] **Not needed.** `setBorder` writes a model attribute, not a view operation, so it is picked up
      whenever the view renders — no `requireView` / `render:done` dance required. Only a
      *view*-level approach (`highlighters`) would have needed it.
- [x] Fixed the pre-existing single-selection loss at the same time (re-apply the orange border here
      rather than relying on the model-independent effect in `PathwayViewer.tsx:130`).

### Phase 7: Optional extras from the issue

- [x] Arrow-key nudge, in the new `src/app/hooks/useCanvasKeyboard.ts` (also Escape and Ctrl/Cmd+A).
      **Note:** there was no global keyboard layer in the app today — the only
      `keydown` handlers are Escape in `AnchoredMenu` and arrow-keys in `Autocomplete`. This means
      introducing one, scoped to the canvas and ignoring editable targets the way
      `useActivityPaste.isEditableTarget` already does.
- [ ] Selection bounding box via `graph.getCellsBBox()`, drawn in the FRONT layer. **Not built** —
      a toolbar pill showing "N selected" with a Clear button was done instead, which satisfies the
      issue's "visual cue" more cheaply. Revisit only if curators ask for the drawn box.
- [x] Deselect-one-from-group — falls out of Phase 4 shift-click for free.

### Phase 8: Verify

- [x] `npm run type-check` — clean
- [x] `npx eslint src` — only the 2 pre-existing errors (`findParentOfRelation`, `Autocomplete`
      `variant`), both untouched by this work
- [x] `npm run test` — 950 passed / 66 files
- [x] `npm run build` — succeeds
- [ ] Manual: marquee over mixed activities/chemicals/relations; group drag; save mid-selection and
      confirm selection survives; read-only (logged out) must not select or drag.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Phases 1–7 implemented on branch `issue-114-group-selection`;
  type-check, lint, test suite (950 passed) and production build all green.
- **Next immediate action:** **manual smoke test in the browser** (`npm run dev`, port 4208) — none
  of this has been exercised against a real model yet. Check in order: marquee over a mix of
  activities + chemicals + relations; shift-click add/remove; group drag keeps relative positions;
  arrow-key nudge; save while a selection is live and confirm it survives the rebuild; logged-out
  read-only. Then commit.
- **Recent commands run:**
  - `git checkout -b issue-114-group-selection`
  - `npx tsc --noEmit` / `npx eslint src` / `npm run test` / `npm run build`
- **Uncommitted changes:** see Files Modified — nothing committed yet
- **Environment state:** nothing running; `npm run build` wrote to
  `workbenches/noctua-visual-pathway-editor/public`

## Failed Approaches

<!-- Prevent repeating mistakes after context reset -->

| What was tried                                                          | Why it failed                                                                                                                                                                                                    | Date       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| (Considered) `paper.findViewsInArea` for hit-testing                    | Paper is `async: true` (`camCanvas.ts:102`), so views may not exist yet for off-screen or newly-added cells; returns incomplete results. Use `graph.findModelsInArea` instead.                                     | 2026-08-30 |
| (Considered) HTML overlay div for the marquee rect                      | The paper is 30000×30000 inside an `overflow-auto` container with native-scroll panning; an HTML overlay drifts against the scrolled/zoomed paper. Use an SVG rect in the FRONT layer.                             | 2026-08-30 |
| (Considered) buying JointJS+ / upgrading to `@joint/core` to get this   | `ui.Selection`, `CommandManager`, `Snaplines`, `FreeTransform` are absent from both `jointjs@3.7.7` and `@joint/core@4.3.2` dist bundles — paid-tier only. Upgrading does not deliver this feature.                 | 2026-08-30 |
| (Considered) `body/fill` as the selection channel                       | `_highlightSuccessorNodes` (`camCanvas.ts:496`) repaints `body/fill` on every element on every mouseover.                                                                                                          | 2026-08-30 |
| `evt.stopPropagation()` to stop a modifier-click starting a drag        | **Written, then found wrong before testing.** `ElementView.pointerdown` (`node_modules/jointjs/src/dia/ElementView.mjs:612`) calls `notifyPointerdown()` and then `dragStart()` as a plain function call — not via event propagation — so stopping propagation does nothing. `cellView.preventDefaultInteraction(evt)` (`CellView.mjs:1116`) is the hook `dragStart` actually checks. | 2026-08-30 |
| (Planned) group-aware `restrictTranslate` callback                      | Unnecessary and riskier than the alternative. Measuring the drag delta from the dragged node's real position change keeps the group in formation even when that node is clamped, with no chance of breaking single-node dragging.                                                                                                | 2026-08-30 |

## Files Modified

| File                                                | Action       | Status  |
| --------------------------------------------------- | ------------ | ------- |
| `.plans/feature/issue-114-group-node-selection.md`  | create       | done    |
| `src/features/pathway/graph/selectionModel.ts`      | create       | done, untested in browser |
| `src/features/pathway/graph/marqueeSelection.ts`    | create       | done, untested in browser |
| `src/app/hooks/useCanvasKeyboard.ts`                | create       | done, untested in browser |
| `src/features/pathway/graph/shapes.ts`              | edit         | done    |
| `src/features/pathway/graph/camCanvas.ts`           | edit         | done    |
| `src/features/pathway/components/PathwayGraph.tsx`  | edit         | done    |
| `src/features/pathway/components/GraphToolbar.tsx`  | edit         | done    |
| `src/app/PathwayViewer.tsx`                         | edit         | done    |
| `src/features/gocam/slices/camSlice.ts`             | not touched  | —       |

## Blockers

- None technical. The issue carries a `wontfix` label — that should be revisited with the reporters
  (`@thomaspd @vanaukenk @kltm @rozaru @hattrill`, plus `@pgaudet` who recorded the original verdict)
  before implementation starts.

## Notes

- **Read-only mode:** `CamCanvas.readOnly` gates `validateConnection`/`validateMagnet` (:88–96) and
  the hover action icons. Selection is arguably fine read-only (it is just viewing), but _dragging_
  must stay blocked. Decide explicitly rather than by accident.
- Cell ids are `activity.uid` (:616, :642) and uids are stable server individual ids, so
  `graph.getCell(uid)` resolves correctly after every rebuild. This is what makes uid-keyed selection
  viable.
- The issue's _"respect the graph layout constraints"_ is ambiguous. Reading it as "stay within the
  paper bounds and do not corrupt dagre's output" — the `restrictTranslate` callback covers the
  first; the `hasManualLayout` short-circuit covers the second.

## Lessons Learned

- **Read the library source, not just the typings, before relying on event semantics.** The typings
  say `element:pointerdown` hands you an event; they do not say `dragStart()` is called as a plain
  function immediately afterwards, so `stopPropagation` looks like it should work and silently would
  not have. One `grep` of `ElementView.mjs` caught it before the first browser run.
- Preferring a **model attribute** (`setBorder`) over a **view-level highlighter** removed a whole
  class of async-rendering sequencing problems. Worth reaching for whenever the paper is `async`.
- Measuring a drag delta from the **actual position change** rather than the pointer made the
  clamping problem disappear instead of needing to be solved.

## Additional Context (Claude)

**Why this unlocks more than it looks.** A selection set is the prerequisite for most of the rest of
the PowerPoint-style list. Once `selectionModel` exists, these become small, independent follow-ups —
all client-side, all zero-server-cost for the same reason as above:

- Align / distribute (`getCellsBBox` + arithmetic) — the classic Arrange menu
- Z-order (`toFront`/`toBack`, both in core)
- Zoom-to-selection (`paper.scaleContentToFit` accepts a cell subset)
- Bulk copy — `activityClipboard.ts` currently serializes one activity into a
  `{kind, activityType, label, sourceModelId, root}` payload. A `v2` payload holding an array would
  extend it naturally; the format was designed with a version tag for exactly this.

**What is genuinely expensive, and why — for whoever revisits the `wontfix`.** Bulk _delete_ and bulk
_property edit_ are a different class of problem from anything in this plan: they emit `Operation[]`
through m3Batch, so they inherit round-trip latency, partial-failure semantics, and conflict with
other curators. `buildDeleteActivityOperations` (`activityOperations.ts:438`) already batches many
requests into one call, so N deletes is one round trip — but that is a real persistence change, not a
rendering change. Undo/redo is harder still: there is no history machinery today, and a client-side
undo stack would be lying about server state. **These are plausibly what "cannot do with the current
codebase" was actually about — and for those it is a fair assessment. It just does not apply to #114,
which is purely positional.**

**Adjacent cleanup spotted, out of scope.** `reactflow` is a declared dependency with zero imports in
`src/` — its only mention is a `manualChunks` rule at `vite.config.ts:72`. Likewise `dagre`,
`graphlib` and `@dagrejs/graphlib` overlap. Worth a separate housekeeping pass; explicitly not part
of this work.
