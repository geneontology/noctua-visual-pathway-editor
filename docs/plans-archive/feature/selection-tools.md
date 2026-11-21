# Task: Selection tools — scoped auto-layout, duplicate, Ctrl+S, unified clipboard

**Status:** ACTIVE — implemented, not yet exercised in a browser
**Issue:** — (follows on from [#114](https://github.com/geneontology/noctua-visual-pathway-editor/issues/114))
**Branch:** `issue-114-group-selection`

## Goal

Four follow-ons once a selection exists: tidy only the selection, duplicate it in place, make Ctrl+S
do something sane, and let the context menu know what is actually on the clipboard.

## Context

- **Related files:**
  - `src/features/pathway/graph/camCanvas.ts` — `autoLayout`, region placement, selection API
  - `src/app/hooks/usePathwayCanvas.ts` — the toolbar's Auto Layout handler
  - `src/features/gocam/services/clipboardStore.ts` — new; availability across both payload kinds
  - `src/features/pathway/components/CanvasContextMenu.tsx` — blank-canvas menu
  - `src/features/pathway/components/GraphToolbar.tsx` — selection action bar
- **Triggered by:** user request, picking from the ideas list.

## Steps

### Phase 1: Auto-layout the selection
- [x] `autoLayout(spacing, uids?)` filters the elements it lays out; `autoLayoutSelection()` passes
      the selection. The dagre call is unchanged — it already ran against
      `graph.getSubgraph(elements)`, so scoping is just a filter on `elements`.
- [x] The toolbar's Auto Layout button tidies the selection when there is one, the whole graph
      otherwise. No new button — the existing one becomes context-sensitive.
- [x] **Fixed a pre-existing gap:** `autoLayout` never persisted positions. That went unnoticed
      because re-running dagre on the whole graph is deterministic, but a selection-only tidy sits
      alongside manual positions and would have been lost on reload. Now calls `_persistPositions()`.

### Phase 2: Duplicate (Ctrl+D)
- [x] `handleDuplicateSelection` — builds a region payload from the selection, then the same paste
      operations, and writes in one m3Batch call. **No dialog**: this is the user's own data copied
      inside the model they are looking at, so there is nothing stale to warn about.
- [x] Lands offset by `DUPLICATE_OFFSET` (40) from the originals' top-left, via a new
      `armRegionAtGraphPoint` (the existing `armRegionAt` takes a *viewport* point).
- [x] Evidence is excluded, matching paste and Copy Model.
- [x] Ctrl+D plus a Duplicate button in the selection action bar.

### Phase 3: Ctrl+S
- [x] Intercepted and always `preventDefault`ed — a browser "Save page" dialog is never the right
      answer on a graph editor.
- [x] Emits a lone `MODEL / STORE` and toasts "Model saved".

**Interpretation to confirm with the user.** Every edit already ends with a STORE, so this is
strictly a reassurance affordance rather than a necessity — curators press Ctrl+S reflexively and
currently get the browser's save dialog. If the intent was something else (e.g. saving *layout*
positions, which are already auto-saved to localStorage on drop), this is the wrong behaviour and
should change.

### Phase 4: Unified clipboard availability
- [x] `clipboardStore.ts` — `readClipboard()` returns the **most recently copied** of the two
      payload kinds, or null. Single-activity copies are now mirrored into localStorage
      (`writeActivityClipboardLocal`) alongside the system clipboard.
- [x] The blank-canvas context menu reads it as it opens and offers exactly one accurate item —
      "Paste 3 activities and 2 relations", "Paste activity", or a greyed "Nothing to paste".
      Previously "Paste activity" always showed and only failed once clicked.
- [x] **Replaces the `clearRegion()` workaround** from the earlier bug fix. Precedence is now
      newest-wins by timestamp rather than one store nuking the other, which is both simpler and
      correct in orderings the workaround only happened to cover.
- [x] **The menu now pastes from the mirror, not the system clipboard.** First pass only used
      localStorage to decide *whether* to show the item — the click still went through
      `readActivityClipboard()` → `navigator.clipboard.readText()`, which Firefox blocks outright.
      So the menu would offer "Paste activity" and then fail with "press Ctrl+V instead". It now
      pastes the payload the menu already holds: no async read, no permission, works everywhere.

**Known limitation.** The menu can only see what this app mirrored, so an activity copied in a
different browser or profile (or before this change shipped) shows as "Nothing to paste" even though
the system clipboard holds it. `Ctrl+V` still handles that case — it reads the paste event's
`clipboardData`, which needs no permission. `readActivityClipboard()` is now unused by the app but
kept (and still tested) as the only system-clipboard read path.

Why localStorage makes this possible: the system clipboard can only be *read* behind a permission
Firefox never grants to web content, so availability was previously unknowable without trying.

### Phase 5: Verify
- [x] `npx eslint src tests` — the 3 pre-existing errors, none new
- [x] `npm run test` — **1102 passed / 74 files** (was 1078 / 73)
- [x] Tests added — `clipboardStore.test.ts` (15: summary pluralisation, newest-wins both
      directions, malformed/missing-timestamp/failed-validation entries, clear-and-fall-back);
      8 more in `useCanvasKeyboard.test.ts` for Ctrl+D and Ctrl+S; `CanvasContextMenu.test.tsx`
      reworked for the availability prop (region label, empty state, nothing clickable when empty)
- [x] **Mutation-checked** the newest-wins comparison (reverting it to "region always wins" — the
      original bug — failed the expected test) and the auto-layout scope filter
- [ ] **Manual (outstanding):** everything on this branch is still unexercised in a browser

### Phase 6: localStorage becomes the only clipboard

The system clipboard is gone. Its stated purpose — "so the pasting tab never needs access to the
source model" — is fully covered by localStorage, which is shared across tabs of the same origin.

- [x] Copy writes only to localStorage. No `writeClipboardText`, no `execCommand` fallback.
- [x] `Ctrl+V` and the context menu both go through one `handleRequestPaste`, which reads
      `readClipboard()` and dispatches on kind — region to the confirm dialog, single activity to
      the prefilled form.
- [x] Deleted `useActivityPaste` and its test. The browser `paste` event had no remaining purpose
      once nothing was written to the system clipboard, so keeping the hook would have been dead
      code. (Suite drops from 1102 to 1081 tests for this reason, not from lost coverage.)
- [x] `handlePasteFromMenu` collapsed into `handleRequestPaste` — the two had become the same
      dispatch.
- [x] Fixed a bug introduced in this pass: `writeActivityClipboardLocal` returned `void`, so the
      copy toast always reported failure. TypeScript allowed it because `void` is a legal ternary
      condition. Now returns a boolean, with tests for both outcomes.

**Cross-window behaviour (asked):** a copy in one window is visible in another **immediately**,
because the clipboard is read on demand — at right-click and at Ctrl+V — never cached in React
state. No `storage` event listener is needed. One would only become necessary for a persistent
Paste button that had to enable/disable itself live.

**What this gives up:** pasting into a different browser or profile, and pasting the payload into a
text editor. Neither is a real workflow, and the previous cross-browser story was already broken —
reading the system clipboard needs a permission Firefox never grants.

`writeClipboardText` and `readActivityClipboard` are now unused by the app but left in place (and
still tested) rather than deleted, since they are the only system-clipboard access and may be wanted
again.

### Phase 7: Paste preview

- [x] `RegionPreview` — a miniature of the region, drawn as inline SVG from the offsets stored at
      copy time, so it is the *actual* copied layout rather than an approximation. Node colours
      match the canvas (`getColor`, same green/teal/purple by activity type).
- [x] Relations are drawn between the activities that own their endpoints, resolved with
      `activityEntryNodeUids` — an endpoint isn't always an activity root, so the full tree walk is
      needed to place a line correctly.
- [x] `ConfirmDialog` gained an optional `size`; the paste dialog is now `sm` so the preview has room.

## Recovery Checkpoint

- **Last completed action:** Phases 1-7. localStorage is now the only clipboard, and the paste
  dialog shows a mini-graph preview. Lint at baseline; suite **1081 passing / 73 files** (down from
  1102/74 only because the dead `useActivityPaste` test was removed); real type-check unchanged at
  its pre-existing baseline.
- **Next immediate action:** confirm the Ctrl+S interpretation, then browser smoke test.
- **Uncommitted changes:** everything in this plan
- **Environment state:** nothing running

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Fixed dates either side of "now" in the clipboard tests | `writeActivityClipboardLocal` stamps the real clock, so a `LATER` constant of 2026-09-03T10:00 was already in the past and newest-wins flipped. Use 1999/2099 so real "now" always sits between. | 2026-09-03 |
| `clearRegion()` on single copy (previous fix) | Superseded. Worked for the reported ordering but relied on one store clearing the other; timestamp precedence covers every ordering and needs no cross-talk. | 2026-09-03 |
| Using localStorage only to *decide* whether to show the menu's Paste item | The click still called `navigator.clipboard.readText()`, which Firefox blocks — so the item appeared and then failed. The menu must paste the mirrored payload it already holds. | 2026-09-03 |
| `const ok = writeActivityClipboardLocal(...)` while that function returned `void` | `ok` was always undefined, so the copy toast always reported failure. `tsc` accepts `void` as a ternary condition, so nothing flagged it — only reading the code did. | 2026-09-03 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `.plans/feature/selection-tools.md` | create | done |
| `src/features/gocam/services/clipboardStore.ts` | create | done |
| `src/features/pathway/graph/camCanvas.ts` | edit | done |
| `src/app/hooks/usePathwayCanvas.ts` | edit | done |
| `src/app/hooks/useCanvasKeyboard.ts` | edit | done |
| `src/app/PathwayViewer.tsx` | edit | done |
| `src/features/pathway/components/CanvasContextMenu.tsx` | rewrite | done |
| `src/features/pathway/components/GraphToolbar.tsx` | edit | done |
| `tests/features/gocam/services/clipboardStore.test.ts` | create | done, 15 passing |
| `tests/app/hooks/useCanvasKeyboard.test.tsx` | edit | done, 37 passing |
| `tests/features/pathway/components/CanvasContextMenu.test.tsx` | edit | done, 9 passing |
| `src/features/gocam/components/dialogs/RegionPreview.tsx` | create | done |
| `src/features/gocam/components/dialogs/PasteRegionDialog.tsx` | edit | done |
| `src/@noctua.core/components/dialog/ConfirmDialog.tsx` | edit (optional `size`) | done |
| `src/features/gocam/services/regionClipboard.ts` | edit (`activityEntryNodeUids`) | done |
| `src/app/hooks/useActivityPaste.ts` | **delete** | done |
| `tests/app/hooks/useActivityPaste.test.tsx` | **delete** | done |

## Blockers

- None. One open question: the Ctrl+S interpretation above.

## Notes

- The selection action bar is now **N selected · Copy · Duplicate · Delete · ✕**.
- Ctrl+S is only intercepted while the keyboard hook is enabled, i.e. logged in with no dialog open.
  Logged out, Ctrl+S still opens the browser dialog — acceptable, since there is nothing to save.
- Auto Layout deliberately stayed a single button rather than gaining a "layout selection" sibling;
  making it context-sensitive matches how Copy/Delete already behave.

## Lessons Learned

- Tests that bake in "now"-relative dates rot silently. The clipboard test passed when written and
  would have started failing on its own; anchoring the fixtures far either side of the clock fixes
  it properly rather than by re-stamping the constant.
- The type-check caught the `CanvasContextMenu` prop change breaking its existing test, which is the
  third real thing `-p tsconfig.app.json` has found since discovering the root config is a no-op.

## Additional Context (Claude)

Still on the ideas list and untouched: **graph-aware selection growth** (select downstream /
upstream / connected — `getSuccessors`/`getPredecessors` are already used for hover highlighting, so
this is cheap and is the one thing here PowerPoint cannot do), **bulk evidence** (the highest
curator value, same batch shape as paste and delete), **align & distribute**, **layout-only
undo/redo**, and **export to SVG/PNG**.
