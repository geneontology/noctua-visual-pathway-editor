# Task: Copy and paste a selected region (activities + the relations between them)

**Status:** ACTIVE — implemented, not yet exercised in a browser
**Issue:** — (follows on from [#114](https://github.com/geneontology/noctua-visual-pathway-editor/issues/114))
**Branch:** `issue-114-group-selection` (builds directly on the selection layer)

## Goal

With a multi-selection on the canvas, **Copy** captures those activities *and* the relations
between them. **Paste** creates them all directly in the target model — no Activity Form — behind a
confirmation dialog that says exactly what is about to be written.

## Context

- **Related files:**
  - `src/features/gocam/services/activityClipboard.ts` — the existing single-activity payload
  - `src/features/gocam/services/activityOperations.ts` — `buildActivityGraphOperations` (:44),
    `buildCreateActivityOperations` (:113), `addEvidenceOperations` (:144)
  - `src/features/gocam/data/activityTemplates.ts` — `activityToFormTree` (:167)
  - `src/features/gocam/services/graphServices.ts` — `extractActivityConnections` (:165)
  - `src/features/pathway/graph/dropPlacement.ts` — single-node drop placement
  - `src/features/gocam/components/CopyModelDialog.tsx` — the "Include evidence" precedent (:79)
  - `src/features/pathway/graph/selectionModel.ts` — the selection this reads from
- **Triggered by:** user request, straight after the #114 selection work landed.

## The enabler: one m3Batch call for the whole region

`buildActivityGraphOperations` (`activityOperations.ts:44-102`) already assigns each new individual a
fresh `uuidv4()` as `'assign-to-variable'` and then references those **variables** as the
`subject`/`object` of edge operations in the same array. Minerva resolves them within the batch.

So a region of N activities and M relations is **one** `updateGraphModel` round trip:

1. per activity — individual ADDs (with variables) + intra-activity edge ADDs
2. per relation — one edge ADD whose subject/object are the variables of already-queued individuals
3. one `MODEL / STORE`

No new persistence machinery, no N+1 saves, and it is atomic from the UI's point of view. This is
what makes the feature reasonable rather than a rewrite.

**The one change needed:** `buildActivityGraphOperations` builds `termVarIds` (original node uid →
varId) internally and throws it away. It must return that map so the inter-activity relations can be
wired. _Done_ via an optional 4th parameter it populates when given — `buildCreateActivityOperations`
does not pass it, so the form-save path is untouched. Keyed by the original node uid, which
`activityToFormTree` preserves as `TermNode.uid` (`activityTemplates.ts:179`).

## Decision: localStorage, not the system clipboard

**Recommendation — store the region payload in `localStorage`.** The user asked whether this is
better; for a region it is, on three counts:

1. **The menu-driven Paste is broken in Firefox today.** `readActivityClipboard`
   (`activityClipboard.ts`) returns `unsupported` whenever `navigator.clipboard.readText` is absent
   or refused, and the UI falls back to a toast telling the user to press Ctrl+V instead. Reading
   `localStorage` needs no permission and works everywhere, so right-click → Paste becomes reliable.
2. **No size or encoding anxiety.** A ten-activity region carrying evidence is far bigger than the
   single-activity payload the text clipboard was sized for.
3. **Nobody wants region JSON in a text editor.** The one real benefit of the text clipboard —
   pasting into another app — is meaningless for this payload.

`localStorage` is per-origin, so cross-tab and cross-model paste (the whole point of the original
clipboard design) still works — the workbench serves every model from the same origin.

**What this gives up:** pasting into a different browser or profile. Judged not worth the
permission-prompt fragility.

**Not touching the single-activity path.** `noctua-activity/v1` over the text clipboard works, is
tested, and ships. Regions get their own key; unifying later is optional, not required.

Storage shape — one key, last-copy-wins:

```
localStorage['noctua-region-clipboard'] = {
  kind: 'noctua-region/v1',
  copiedAt: <ISO string>,          // shown in the paste dialog so a stale paste is obvious
  sourceModelId: string | null,
  activities: [{ activityType, label, rootNodeUid, root: TermNode }],
  connections: [{ predicateId, predicateLabel, sourceNodeUid, targetNodeUid, evidence }],
}
```

`Ctrl+V` and the context-menu Paste both read this same key, so there is one code path.

## Decision: paste skips the form, behind a dialog

Per the request, paste does **not** open the Activity Form — it builds the operations and calls
`updateGraphModel`.

**This is not a new kind of write.** The existing single-activity paste already ends at
`buildCreateActivityOperations` → `updateGraphModel` (`ActivityForm.tsx:212-215`); the form is just
the UI in front of it. Region paste calls the same builder for each activity and sends one batch, so
there is no new persistence story, no new failure mode, and nothing about the server side that
differs from saving a form today.

The only actual difference is that the form lets you **edit before saving** and the dialog does not.
So the dialog exists for the reason it was asked for — so a paste of unknown size or age isn't a
surprise — not as a safety net for anything novel:

> **Paste 4 activities and 3 relations?**
> Copied from *Model X* 2 minutes ago. This will be added to the current model immediately.
> ☐ Include evidence

- Counts are stated explicitly, so a stale or unexpected payload is visible before it is written.
- `copiedAt` is rendered, which is what makes last-copy-wins safe.
- **"Include evidence" defaults to off**, mirroring `CopyModelDialog` (:79-85) and the
  `preserve-evidence` argument on `MODEL / COPY`. Consistency with the one existing precedent for
  this exact question.

## The genuinely awkward part: where the pasted nodes land

`DropPlacement` (`dropPlacement.ts`) resolves **one** newly-appeared uid against a drop point, by
diffing the uid set across renders. A region needs N nodes placed while preserving their relative
layout, and there is a correlation problem: the server assigns the new uids, and **nothing in the
m3Batch response maps them back to the variables we sent**. Order of appearance in
`transformGraphData` is not a contract.

Approach, degrading gracefully rather than pretending to be exact:

1. At copy time, record each activity's offset from the selection's top-left (via `getCellsBBox`).
2. At paste time, arm a region placement with the drop point plus those offsets.
3. On the post-save render, diff to get the N new activities (as `DropPlacement` already does), then
   correlate to source activities **by root term id**, resolving ties by order of appearance.
4. If correlation is incomplete or ambiguous, fall back to laying the new activities out in a
   compact grid at the drop point.

Relative *structure* — which is what the request is really about — is preserved exactly, because it
lives in the relations. Relative *position* is best-effort. Worth being explicit that step 3 is a
heuristic; if it proves annoying in practice the fallback is what curators will see, and Auto Layout
already exists as the escape hatch.

## Current State

- Region copy: does not exist. `serializeActivity` handles exactly one `Activity`.
- Region paste: does not exist.
- The selection set (`camCanvas.getSelection()`) does exist and is the input this needs.
- `NodeContextMenu` has a single "Copy activity" item; `CanvasContextMenu` has a single
  "Paste activity" item. Both need a region-aware sibling.
- `activityConnections` endpoints are **any** node uid within an activity, not necessarily the root
  (`graphServices.ts:168-173` maps every node to its activity). So the varId map must be keyed by
  node uid, not activity uid — root-to-root is the common case, not a guarantee.

## Steps

### Phase 1: Payload
- [x] `src/features/gocam/services/regionClipboard.ts` — `REGION_CLIPBOARD_KEY`,
      `RegionClipboardPayload`, `writeRegion(payload)`, `readRegion()`, `parseRegion(text)`,
      `clearRegion()`. Pure + localStorage only; no JointJS, no React.
- [x] `buildRegionPayload(model, selectedUids, offsets)` — `activityToFormTree` per selected
      activity, plus every `model.activityConnections` edge whose **both** endpoints belong to
      selected activities.

### Phase 2: Expose the varId map
- [x] `activityOperations.ts` — have `buildActivityGraphOperations` return
      `{ operations, varIdsByNodeUid }` (or take an out-param map). Keep
      `buildCreateActivityOperations` behaviour byte-identical so the single-activity path and its
      tests are unaffected.

### Phase 3: Region operations builder
- [x] `buildPasteRegionOperations(payload, modelId, userContext, { includeEvidence })` —
      concatenate each activity's ops, then one edge ADD per connection using
      `varIdsByNodeUid`, then a single `MODEL / STORE`.
- [x] Route connection evidence through the existing `addEvidenceOperations`; skip entirely when
      `includeEvidence` is false.
- [x] Drop any connection whose endpoint uid is missing from the map, rather than emitting a
      dangling edge.

### Phase 4: Copy path
- [x] `camCanvas` — expose selection offsets (`getSelectionOffsets()` via `getCellsBBox`).
- [x] `NodeContextMenu` / `CanvasContextMenu` — "Copy N activities" when the selection has 2+,
      falling back to today's single-activity wording otherwise.
- [x] Ctrl+C in `useCanvasKeyboard` when the selection is non-empty.
- [x] Toast confirming what was copied.

### Phase 5: Paste path + warning dialog
- [x] `PasteRegionDialog` on the shared `ConfirmDialog`, showing counts, source model, `copiedAt`,
      and the "Include evidence" checkbox.
- [x] On confirm — `updateGraphModel(ops)`; on success, arm the region placement and toast.
- [x] Ctrl+V and context-menu Paste both read `localStorage`; prefer a region payload over a
      single-activity one when both exist.
- [x] Guard on `checkGroup` (the existing group-permission gate) exactly like the current paste.
- [x] Read-only / logged-out must not offer paste — the keyboard hook and the blank context menu
      both already sit behind the same `pasteEnabled` / `isLoggedIn` gates as the existing paste.

### Phase 6: Region placement
- [x] Extend `DropPlacement` (or a sibling `RegionPlacement`) per the correlation approach above,
      including the compact-grid fallback.

### Phase 7: Verify
- [x] `npx eslint src tests` — back to the 3 pre-existing errors (one was mine: an unused
      destructured variable in a test, found and fixed)
- [x] `npm run test` — **1060 passed / 72 files** (was 1011 / 69)
- [x] Unit tests written — 49 new across 3 files:
      - `regionClipboard.test.ts` (25) — offsets relative to the region top-left, selection
        filtering, relations kept only when both ends are selected, payload rejection (foreign kind,
        malformed JSON, empty activities, missing connections), storage round-trip, last-copy-wins
      - `buildPasteRegionOperations.test.ts` (12) — individuals queued before the relations that
        reference them, relation wired to both batch variables, dangling relation dropped, endpoint
        on a **nested** node wired correctly, evidence off by default and on when asked, payload not
        mutated, exactly one `MODEL / STORE`
      - `regionPlacement.test.ts` (12) — layout rebuilt at the paste point, correlation independent
        of response order, duplicate terms not stacked, leftover-offset and grid fallbacks
- [x] **Mutation-checked.** Broke the evidence strip, the dangling-relation guard and the term
      correlation; 4 tests failed as they should; all three reverted.
- [ ] **Manual (outstanding):** copy a 3-activity region with relations, paste into the same model,
      then into a different model in another tab. Confirm relations survive, the evidence checkbox is
      honoured, and it is a single network call.

### Phase 8: Type-checking is broken project-wide (pre-existing, NOT fixed)

Found while verifying this work. `tsconfig.json` is a solution-style config (`files: []` plus
`references`), so **`tsc --noEmit` checks zero files and always exits 0**. That means:

- `npm run type-check` is a no-op
- the `tsc` step in `npm run build` is a no-op, so the build never type-checks
- `vite-plugin-checker` is configured as `tsChecker({ typescript: true })`, which also defaults to
  the root config — which is why dev and test runs report "Found 0 errors"

Running it properly (`npx tsc --noEmit -p tsconfig.app.json`) surfaces **103 errors across 37
files** — none in files added by this work or by #114. About a third share one root cause:
`jointjs/types/joint.d.ts` declares `/// <reference types="backbone" />` but **`@types/backbone` is
not installed**, so every JointJS class loses its inherited `on` / `get` / `set` / `model` / `el` /
`remove` members. The rest are genuine latent type bugs in app and test code.

- [ ] Not addressed here — it needs its own triage, and installing `@types/backbone` touches
      `package.json` and the lockfile.

### Phase 9: Selection action bar + bulk delete

Added after the first pass, on request — a PowerPoint-style contextual action bar and delete.

- [x] `GraphToolbar` selection panel is now an action bar: **N selected · Copy · Delete · ✕**,
      replacing the earlier text-and-Clear pill. Editing actions hide when logged out (`canEdit`).
- [x] `buildDeleteRegionOperations(activities, modelId)` — N activities in ONE m3Batch call.
      Refactored `buildDeleteActivityOperations` to share `addActivityRemovalOperations` so both
      paths emit identical per-activity removals; the single-activity builder is unchanged in
      behaviour (asserted by a test comparing the two for a selection of one).
- [x] De-duplicates individuals and edges across the selection — removing the same individual twice
      in one batch would fail, and a node can appear in more than one activity's subgraph.
- [x] `useRegionDelete` — confirm dialog ("Delete N activities and their relations? This cannot be
      undone."), `checkGroup` gated, clears the selection on success.
- [x] `Delete` / `Backspace` key deletes the selection, ignoring text fields.
- [x] "Delete N activities" added to the node context menu alongside "Copy N activities".
- [x] Tests — `buildDeleteRegionOperations.test.ts` (8) plus 4 more in `useCanvasKeyboard.test.ts`;
      mutation-checked the de-dup guard (broke it, the sharing test failed, reverted).

**Relations between deleted activities** need no explicit removal — they go with their individuals,
which is what the single-activity delete has always relied on. Matching that rather than inventing
new behaviour.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Phases 1-9. Region copy/paste, the selection action bar and bulk
  delete are all in; 61 new tests; lint at baseline; full suite 1078 passing; the real
  type-check (`-p tsconfig.app.json`) is at its 103-error pre-existing baseline with none in
  new files.
- **Next immediate action:** **browser smoke test.** This and the #114 selection work have only been
  exercised by unit tests. Region paste writes to the server, so it needs a real model before it can
  be trusted.
- **Recent commands run:**
  - `sed -n '44,113p' src/features/gocam/services/activityOperations.ts`
  - `grep -n "extractActivityConnections" -A 22 src/features/gocam/services/graphServices.ts`
- **Uncommitted changes:** the #114 work is still uncommitted on this branch; this plan adds to it
- **Environment state:** nothing running

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| (Considered) system clipboard for the region payload | Menu-driven paste degrades to "press Ctrl+V" whenever `clipboard.readText` is blocked (Firefox, or a declined permission). localStorage needs no permission and still covers cross-tab/cross-model. | 2026-09-02 |
| (Considered) keying the varId map by activity uid | `extractActivityConnections` maps **every** node to its activity, so a connection endpoint need not be the activity root. Key by node uid. | 2026-09-02 |
| (Considered) trusting m3Batch response order to place pasted nodes | The response carries no variable→id binding and ordering is not a contract. Correlate by root term id with a grid fallback. | 2026-09-02 |
| Relying on `npx tsc --noEmit` / `npm run type-check` to validate this work | Both resolve to the solution-style root `tsconfig.json` (`files: []`), so they check nothing and always pass. Use `npx tsc --noEmit -p tsconfig.app.json`. | 2026-09-02 |
| `const { connections: _dropped, ...rest }` to omit a key in a test | The `_` prefix only exempts unused *parameters* under this ESLint config, not destructured variables. Build the object and `delete` the key. | 2026-09-02 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `.plans/feature/region-copy-paste.md` | create | done |
| `src/features/gocam/services/regionClipboard.ts` | create | done |
| `src/features/gocam/services/activityOperations.ts` | edit | done |
| `src/features/pathway/graph/dropPlacement.ts` | edit | done |
| `src/features/pathway/graph/camCanvas.ts` | edit | done |
| `src/features/pathway/components/NodeContextMenu.tsx` | edit | done |
| `src/features/pathway/components/CanvasContextMenu.tsx` | edit | done |
| `src/app/hooks/useCanvasKeyboard.ts` | edit | done |
| `src/app/PathwayViewer.tsx` | edit | done |
| `src/features/gocam/components/dialogs/PasteRegionDialog.tsx` | create | done |
| `tests/features/gocam/services/regionClipboard.test.ts` | create | done, 25 passing |
| `tests/features/gocam/services/buildPasteRegionOperations.test.ts` | create | done, 12 passing |
| `tests/features/pathway/graph/regionPlacement.test.ts` | create | done, 12 passing |
| `src/app/hooks/useRegionDelete.ts` | create | done |
| `src/features/pathway/components/GraphToolbar.tsx` | edit | done |
| `tests/features/gocam/services/buildDeleteRegionOperations.test.ts` | create | done, 8 passing |

## Blockers

- None. One open question the user may want to overrule: **"Include evidence" defaults to off**,
  following `CopyModelDialog`. Defaulting it on would match "copy means copy everything" but risks
  silently duplicating evidence across models.

## Notes

- Skipping the form loses only the chance to edit before saving. The write itself is the same
  `updateGraphModel` call the app already makes for every form save, so the dialog's job is to state
  counts and age, not to guard against anything new.
- m3Batch appears atomic per request array, so a partial region should not be possible. Worth
  confirming against a deliberately invalid payload during manual QA.

## Lessons Learned

- **A green type-check meant nothing.** The root `tsconfig.json` is solution-style, so
  `tsc --noEmit` read zero files and exited 0 every time. Four real errors in `PathwayViewer.tsx` —
  one of them a reference to an undefined variable — sat there "passing". Confirm a checker actually
  reads files (`--listFilesOnly` printed 0) before trusting it.
- Mutation-checking found no faults this time, but it is what turns "49 tests pass" into a claim
  worth making.
- Paste selecting what it just created fell out of the placement work almost free, and makes the
  pasted region immediately draggable as a unit.

## Additional Context (Claude)

**This is the feature that justifies the selection layer.** Everything in #114 was positional and
client-side; this is the first thing that turns a selection into real curation leverage — and it is
almost entirely reuse: the same `buildCreateActivityOperations` per activity, the same
`updateGraphModel`, just batched and without the form in front.

**It also unlocks bulk delete almost for free.** Once `buildPasteRegionOperations` establishes the
pattern of concatenating per-activity operations into one batch, `buildDeleteRegionOperations` is the
same shape over `buildDeleteActivityOperations` (`activityOperations.ts:438`) — N deletes, one round
trip, one confirmation dialog listing what goes.

**Deliberately not in scope:** cut (copy + delete), duplicate-in-place, and pasting a region into a
*new* model. All straightforward once this lands; none needed to make it useful.
