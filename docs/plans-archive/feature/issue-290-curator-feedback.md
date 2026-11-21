# Task: #290 curator feedback — multi-select menu, "node" wording, paste/delete dialogs, unconnected select

**Status:** COMPLETE — implemented, browser-checked by the user, tested, committed (not pushed)
**Issue:** [#290](https://github.com/geneontology/noctua-visual-pathway-editor/issues/290) (comments of Sep 17 and Sep 23)
**Branch:** `issue-114-group-selection`

## Goal

Apply the curator feedback on #290: with 2+ nodes selected the right-click menu offers only the
group actions; every copy/paste/delete message says "node"; the paste and delete dialogs match the
marked-up screenshots, and the delete dialog gets the same thumbnail as paste. Plus, on user
request, a **Select → Unconnected nodes** preset.

## Context

- **Related files:**
  - `src/features/pathway/components/NodeContextMenu.tsx` — node right-click menu
  - `src/app/PathwayViewer.tsx` — toasts, bulk-delete dialog, Select-menu handler
  - `src/app/hooks/useRegionDelete.ts` — bulk delete and its toast
  - `src/features/gocam/components/dialogs/PasteRegionDialog.tsx` — paste dialog
  - `src/features/gocam/components/dialogs/RegionPreview.tsx` — the paste-dialog thumbnail
  - `src/features/pathway/data/toolbarOptions.ts` — Select-menu presets
  - `src/features/pathway/graph/camCanvas.ts` — selection filters (`_selectMatching`)
  - `docs/ui-selection-and-copy-paste.md` — the UI doc linked from the issue
- **Triggered by:** #290 comments (Sep 17; Sep 23 ×2) and the user's request to select unconnected
  nodes.

## Feedback being addressed

| Where                       | Now                                                          | Wanted                                  |
| --------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| Node menu, 2+ selected      | Edit · Copy N nodes · Comments · Delete N nodes              | Copy N nodes · Delete N nodes only      |
| Copy / paste / delete toast | "Copied 1 activity — paste into this or any other model"     | "node"                                  |
| Paste — title               | Paste copied region                                          | Paste copied nodes                      |
| Paste — question            | Paste 7 activities and 5 relations into this model?          | Paste 7 nodes and their relations?      |
| Paste — footnote            | Copied from this model just now. They are added straight away — there is no form to review first. | removed |
| Delete — title              | Delete selected activities                                   | Delete selected nodes                   |
| Delete — question           | Delete 2 activities and their relations?                     | Delete 2 nodes and their relations?     |
| Delete — body               | text only                                                    | thumbnail of selected nodes & relations |

The issue asked only for Comments to go; the user added Edit. The delete mock reads "their
relation?" (singular) — treated as a typo, so "relations", matching the paste wording.

## Steps

### Phase 1: Multi-select right-click menu
- [x] `NodeContextMenu.tsx` — **Edit** and **Comments** render only when `regionSummary` is unset,
      so 2+ selected shows Copy N nodes / Delete N nodes (+ the over-limit line).
- [x] Logged out — Comments hidden with 2+ selected; **View activity** stays, or the menu would be
      empty.
- [x] `regionSummary` prop comment updated.

### Phase 2: "node" wording
- [x] `describeRegion` (`PathwayViewer.tsx`) → node/nodes — copy and paste toasts; comment fixed.
- [x] `useRegionDelete.ts` → "Deleted N nodes".
- [x] User said "change to nodes" for the unflagged strings too: toolbar tooltip "Delete selected
      nodes" (`GraphToolbar.tsx`), "Selected N nodes" (Downstream/Upstream/Connected), "Deleting
      this node cannot be undone", "…from the source nodes" (Include evidence), and the Select-menu
      no-match nouns "nodes without evidence / with comments".

### Phase 3: Paste dialog (`PasteRegionDialog.tsx`)
- [x] Title "Paste copied nodes"; question "Paste N nodes and their relations?" / "Paste 1 node?".
- [x] Footnote removed, with `describeAge`, `fromAnotherModel`, the `currentModelId` prop and
      `currentModelId={modelId}` in `PathwayViewer.tsx`. Docstring refreshed.
- [x] `regionClipboard.ts` — two comments that said the dialog shows the copy's age now say
      otherwise (`copiedAt` doc, `clearRegion`).

### Phase 4: Delete dialog + thumbnail
- [x] Title "Delete selected nodes", question "Delete N nodes and their relations?", `size="sm"`,
      "This cannot be undone." kept.
- [x] `handleDeleteSelection` reads `getSelectionPositions()` with the selection (before
      `checkGroup`, so a guard prompt can't let them drift) and passes both to `requestDelete`.
- [x] `useRegionDelete` — one `request` state `{ activities, preview }` (preview from
      `buildRegionPayload`), exposed as `deleteTargets` + `deletePreview`; cleared together.
- [x] `RegionPreview.tsx` — aria-label "Preview of N nodes"; docstring covers paste and delete.

### Phase 5: Select → Unconnected nodes
- [x] `toolbarOptions.ts` — `'unconnected'` preset, "Unconnected nodes" after "With comments".
- [x] `camCanvas.ts` — `selectUnconnected()` via `graph.getConnectedLinks(el).length === 0`;
      `_selectMatching`'s predicate now also gets the element.
- [x] `PathwayViewer.tsx` `handleSelectPreset` — `unconnected` → "No unconnected nodes in this
      model".
- [x] First shipped as "Orphaned nodes" (`orphans` / `selectOrphans`); the user picked
      "Unconnected nodes" and the id and method were renamed to match. Just as well — "orphaned"
      already means something else here: `orphanedNodes` / `orphanedEdges` in `violationService.ts`
      (model errors).

### Phase 5b: Paste button colour
- [x] User: the save button colour didn't match the primary. The paste dialog's Paste button was
      `confirmColor="blue"` — Mantine's stock blue, not the theme's navy `primary` (`#173672`)
      that every form Save button uses. Now `confirmColor="primary"`. No other confirm button sets
      a non-theme colour (the rest are red deletes, or the group guard's filled Cancel).

### Phase 5c: Toolbar selection chip — disabled state + restyle
- [x] User: at "41 selected — max 13", Copy and Delete did nothing but didn't *look* disabled.
      Cause: `!bg-white !text-blue-800 !border-blue-300` (Tailwind `!important`) beat Mantine's
      `[data-disabled]` styling, and `hover:` still fired.
- [x] User also found the buttons ugly (bordered white mini-buttons inside the pill). Replaced them
      with a local `SelectionAction`: borderless, h-7 rounded-full, icon + label, lifting to white +
      `shadow-xs` on hover like the zoom group. Disabled = `text-gray-400` + `cursor-not-allowed`, no
      hover — the same grey as the right-click menu's disabled rows (`AnchoredMenu` `MenuItem`).
- [x] Disabled via `aria-disabled` + a guarded click rather than the `disabled` attribute, so the
      "Select 13 or fewer to copy/delete" tooltip still shows on hover.
- [x] Chip is `h-8 p-0.5` to match the zoom group; the ✕ is a plain 28px round button in the same
      style. Chip colour stays blue — it's the selection's colour (canvas outline `blue-600`,
      marquee `#3b82f6`) — red past the cap.
- [x] `GraphToolbar.test.tsx` passes unchanged (5); lint clean; type-check still 101.

### Phase 6: Docs (`docs/ui-selection-and-copy-paste.md`)
- [x] §1.5 — 2+ selected: menu is Copy N / Delete N only.
- [x] §2 — Unconnected nodes row. §4.2 — copy-toast example. §4.4 — new dialog text, age bullet gone.
- [x] §5 — delete wording + thumbnail. §6 — "nodes ended up selected". §10 — View only at 2+.

### Phase 7: Tests
- [x] Updated the three existing tests this broke (user OK'd updates):
      `NodeContextMenu.test.tsx` (multi-select now asserts Edit/Comments are **absent**),
      `PasteRegionDialog.test.tsx` (dropped `currentModelId`), `toolbarOptions.test.ts`
      (`'unconnected'` in the expected id list).
- [x] **New tests, after the user's browser check** — 19 more (suite 1096 → 1115, 77 → 79 files):
      - `useRegionDelete.test.tsx` (new, 7) — thumbnail laid out from the canvas positions with the
        relation between the two, unknown ids ignored, cancel drops both, one batch ending in
        STORE, "Deleted 1 node" / "Deleted 2 nodes"
      - `camCanvas.test.ts` (new, 2) — `selectUnconnected` picks only nodes with no link in either
        direction; leaves the selection alone when none match. Runs against a real JointJS Graph
        with the constructor skipped — a Paper can't be built in jsdom (probed: fails on `xhtml`)
      - `GraphToolbar.test.tsx` (+4) — over-cap text, Copy/Delete `aria-disabled` and inert past
        the cap, live at exactly the cap, Delete called with no arguments
      - `PasteRegionDialog.test.tsx` (+5) — title, question with/without relations, no age line,
        preview labelled "Preview of 2 nodes"
      - `NodeContextMenu.test.tsx` (+1) — logged out with 2+ selected: View only
- [x] **Mutation-checked** — broke the toolbar disabled guard, counted only outgoing links for
      unconnected, reverted the delete toast wording, dropped the positions from the thumbnail, and
      changed the paste question: each was caught; files restored from copies (not git).

### Phase 8: Verify
- [x] `npx eslint` on every changed file — clean.
- [x] `npx tsc --noEmit -p tsconfig.app.json` — **101 before, 101 after**; errors in touched files
      are the same pre-existing ones (one `PathwayViewer.tsx` error moved 8 lines down).
- [x] `npx vitest run` — **1096 passed / 77 files**. After the rename and colour fix: the three
      affected test files re-run, 32 passed; lint clean; type-check still 101.
- [x] Prettier (project options minus the Tailwind plugin) — nothing on changed lines; one
      delete-dialog line re-joined to match.
- [ ] **Browser (user):** multi-select menu (logged in and out); copy, paste and delete toasts;
      paste dialog (navy Paste button); delete-dialog thumbnail; Select → Unconnected nodes with
      and without any present.

### Not code
- Minerva-level testing of bulk copy and delete, assigned in the Sep 23 comment — a coordination
  item for the user.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** 2026-09-24 — Phases 1-8 implemented and verified (lint, real
  type-check, full suite); docs updated; three broken tests updated. Then: Paste button to theme
  primary (5b), and "Orphaned nodes" renamed "Unconnected nodes" (id/method too). Then: toolbar
  selection chip — real disabled look past the cap, restyled buttons (5c).
  User checked in the browser; 19 new tests written and mutation-checked. Committed in five
  commits tagged `(#114, #290)` (user's choice).
- ✅ **TASK COMPLETE.** Next, if wanted: push the branch; the Minerva-level testing (Not code).
- **Recent commands run:**
  - `npx vitest run` — 1115 passed / 79 files
  - `npx tsc --noEmit -p tsconfig.app.json` — 101 errors, same as before
- **Uncommitted changes:** none
- **Environment state:** nothing running

## Summary

Five commits on `issue-114-group-selection`:

| Commit | What |
| ------ | ---- |
| `df76305` | Node menu: Edit and Comments hidden with 2+ selected |
| `7c9c87e` | "node" wording; paste dialog (title, question, no age line, primary button); delete dialog (wording + thumbnail) |
| `08a2eab` | Select → Unconnected nodes |
| `2c04ef8` | Toolbar selection chip restyled; Copy/Delete really disabled past the cap |
| `6d21b4b` | `docs/ui-selection-and-copy-paste.md` and this plan |
| (docs follow-up) | UI doc says "node" throughout (as the UI now does), defines a node, links #290, tables realigned |

`PathwayViewer.tsx` was split across the second and third commits by taking the unconnected
filter entry out of the working file, staging, and putting it back.

Follow-ups: push when ready; Minerva-level testing of bulk copy/delete (Sep 23 comment).

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `.plans/feature/issue-290-curator-feedback.md` | create | done |
| `src/features/pathway/components/NodeContextMenu.tsx` | edit | done |
| `src/app/PathwayViewer.tsx` | edit | done |
| `src/app/hooks/useRegionDelete.ts` | edit | done |
| `src/features/gocam/components/dialogs/PasteRegionDialog.tsx` | edit | done |
| `src/features/gocam/components/dialogs/RegionPreview.tsx` | edit | done |
| `src/features/gocam/services/regionClipboard.ts` | edit (comments only) | done |
| `src/features/pathway/data/toolbarOptions.ts` | edit | done |
| `src/features/pathway/graph/camCanvas.ts` | edit | done |
| `src/features/pathway/components/GraphToolbar.tsx` | edit (tooltip; selection chip restyle) | done |
| `docs/ui-selection-and-copy-paste.md` | edit | done |
| `tests/features/pathway/components/NodeContextMenu.test.tsx` | edit | done |
| `tests/features/gocam/components/dialogs/PasteRegionDialog.test.tsx` | edit | done |
| `tests/features/pathway/data/toolbarOptions.test.ts` | edit | done |
| `tests/features/pathway/components/GraphToolbar.test.tsx` | edit (+4) | done |
| `tests/app/hooks/useRegionDelete.test.tsx` | create | done, 7 passing |
| `tests/features/pathway/graph/camCanvas.test.ts` | create | done, 2 passing |

## Blockers

- None. Both open questions answered 2026-09-24: change the unflagged strings to "node" too, and
  update the broken tests; new tests wait for the user's browser check.

## Notes

- **Comments hidden, not widened.** The issue allowed keeping Comments if it could show every
  selected node's comments, but the drawer's comment scope holds one activity id
  (`drawerSlice.ts:38`), so that would be new filtering in `CommentsPanel`. Hiding is what the user
  chose.
- **The delete thumbnail draws only relations between selected nodes** — the ones the canvas shows
  as selected. Relations to unselected nodes are deleted too; they just aren't drawn.
- **Unconnected = no link drawn on the canvas**, checked against the JointJS graph like
  `selectConnected`, so the selection matches what the curator sees. Any node type counts.
- Label options offered: "Without relations" (parallels "Without evidence"), "Unconnected nodes",
  "Isolated nodes". The user chose "Unconnected nodes".

## Lessons Learned

- **`npm run format` / `prettier --check` can't run as configured.** `.prettierrc.json` points
  `tailwindConfig` at `./tailwind.config.js`, which doesn't exist (Tailwind v4), so the plugin
  throws on every TS/TSX file. Check with the same options minus the plugin instead. Doing that also
  shows many files are wrapped narrower than the 100-char width — pre-existing, left alone.

## Additional Context (Claude)

The Sep 16 checklist on #290 ticks "remove or grey out Edit for multiple node selection", but Edit
was still showing, and the menu test asserted it on purpose. Phase 1 closes that gap. With Edit,
Comments and the Select rows all gone at 2+, the multi-select menu becomes exactly the "copy and
delete only" menu the issue suggested on Sep 16.
