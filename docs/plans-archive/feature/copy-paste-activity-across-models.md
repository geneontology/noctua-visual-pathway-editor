# Task: Copy an activity to the clipboard and paste it into another model

**Status:** COMPLETE
**Issue:** —
**Branch:** dev

## Goal

Replace the node's in-place "duplicate" action with a clipboard **Copy**. Copying writes a
serialized activity to the system clipboard as text; pasting (Ctrl+V) anywhere on the pathway
canvas — in the same model or a different one — opens the Activity Form prefilled with those
values. Also add a right-click context menu on nodes mirroring the hover icons.

## Context

- **Related files:**
  - `src/features/pathway/graph/shapes.ts` — node markup + hover icons (`duplicateIcon`, `.duplicate`)
  - `src/features/pathway/graph/camCanvas.ts` — JointJS paper event wiring
  - `src/features/pathway/components/PathwayGraph.tsx` — React ↔ canvas callback bridge
  - `src/app/PathwayViewer.tsx` — dialog/state orchestration
  - `src/features/gocam/slices/activityFormSlice.ts` — `initDuplicateForm` / `reIdTree`
  - `src/features/gocam/data/activityTemplates.ts` — `activityToFormTree`
- **Triggered by:** user request — "copy activity from another model"

## Current State

- What works now: the duplicate icon on node hover fires `element:duplicate:pointerdown` →
  `onDuplicateClick` → `handleDuplicateActivity` → `initDuplicateForm` → Activity Form opens
  prefilled with fresh uids. Same-model only, no clipboard involved.
- What's missing: no clipboard step, so an activity can't cross models/tabs. No context menu
  anywhere in the app (zero `contextmenu` handlers).

## Decisions (confirmed with user)

1. Copy **replaces** duplicate — the icon no longer opens the form directly.
2. Paste is the browser `paste` event (Ctrl+V). No `navigator.clipboard.readText()`, so no
   clipboard-read permission prompt and Firefox works.
3. Ship the right-click context menu on nodes alongside the icon.

## Steps

### Phase 1: Clipboard payload
- [x] `src/features/gocam/services/activityClipboard.ts` — `ACTIVITY_CLIPBOARD_KIND`
      (`noctua-activity/v1`), `serializeActivity(activity, modelId)`,
      `parseActivityClipboard(text)`, `writeClipboardText(text)` with `execCommand` fallback
- [x] Payload carries `{ kind, activityType, label, sourceModelId, root: TermNode }` — the
      form tree, not the `Activity`, since the target tab has no access to the source model

### Phase 2: Copy replaces duplicate
- [x] `shapes.ts` — `duplicateIcon` → `copyIcon`, `.duplicate` → `.copy`, event
      `element:copy:pointerdown` (keep `duplicate.svg`; it already reads as a copy icon)
- [x] `camCanvas.ts` — `onDuplicateClick` → `onCopyClick`, handler on the new event
- [x] `PathwayGraph.tsx` — prop rename
- [x] `PathwayViewer.tsx` — `handleCopyActivity` writes the clipboard + shows a toast

### Phase 3: Paste
- [x] `activityFormSlice.ts` — `initDuplicateForm` → `initPasteForm({ root, activityType })`
- [x] `src/app/hooks/useActivityPaste.ts` — document `paste` listener, ignores editable
      targets, parses the payload, `preventDefault()` only on a valid payload
- [x] `PathwayViewer.tsx` — paste opens the Activity Form through `checkGroup`

### Phase 4: Context menu
- [x] `camCanvas.ts` — `element:contextmenu` → `onContextMenu(activityId, clientX, clientY)`.
      JointJS already sets `preventContextMenu: true` on the paper, so the browser menu was
      suppressed on the canvas before this change; no `blank:contextmenu` handler needed.
- [x] `src/features/pathway/components/NodeContextMenu.tsx` — reuses the shared
      `AnchoredMenu` (viewport flipping, outside-click, Escape) against a 1×1 placeholder
      parked at the cursor, rather than a raw Mantine `Menu`
- [x] Items mirror the hover icons: logged in → Edit / Copy / Comments / Delete;
      read-only → View / Comments

### Phase 5: Verify
- [x] `npm run type-check` — clean
- [x] `npx eslint src` — only 2 pre-existing errors, both untouched by this work
      (`findParentOfRelation` dead since before, `Autocomplete.tsx` unused `variant`)
- [x] `npm run test` — 853 passed / 62 files

## Recovery Checkpoint

✅ TASK COMPLETE

- **Last completed action:** all phases implemented and verified
- **Next immediate action:** manual smoke test in the app (`npm run dev`), then commit
- **Recent commands run:**
  - `npm run type-check`
  - `npx eslint src`
  - `npm run test`
- **Uncommitted changes:** see Files Modified
- **Environment state:** nothing running

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Environment issue hit during testing (unrelated to this feature)

The built workbench threw `TypeError: Cannot read properties of undefined (reading 'APPROX')`
from the `CamCanvas` constructor. Cause: `node_modules` had drifted from `package.json` +
`package-lock.json` — `jointjs@2.1.4` (2018) was installed where both files declare `3.7.7`,
and `socket.io-client@4.8.3` where both declare `2.5.0`. `joint.dia.Paper.sorting` only exists
from JointJS 3.0, so `camCanvas.ts`'s pre-existing `sorting: joint.dia.Paper.sorting.APPROX`
blew up at runtime.

`npm run type-check` did **not** catch it: TS resolved the 2.1.4 typings
(`node_modules/jointjs/dist/joint.d.ts`), which type `Paper`'s statics loosely enough to accept
the expression.

Fixed with a plain `npm install` (reconciles `node_modules` in place; `package.json` and the
lock were left byte-identical), then `npm run build`. If this recurs, check
`npm ls --depth=0` for `invalid` entries before suspecting application code.

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `.plans/feature/copy-paste-activity-across-models.md` | create | done |
| `src/features/gocam/services/activityClipboard.ts` | create | done |
| `src/app/hooks/useActivityPaste.ts` | create | done |
| `src/features/pathway/components/NodeContextMenu.tsx` | create | done |
| `src/features/pathway/graph/shapes.ts` | edit | done |
| `src/features/pathway/graph/camCanvas.ts` | edit | done |
| `src/features/pathway/components/PathwayGraph.tsx` | edit | done |
| `src/features/gocam/slices/activityFormSlice.ts` | edit | done |
| `src/app/PathwayViewer.tsx` | edit | done |

## Round 2 — review follow-ups

Reviewed the shipped feature; user triaged the findings:

| Finding | Verdict |
| ------- | ------- |
| Discoverability: Ctrl+V is invisible. Proposed a Redux "clipboard" slice + menu paste | **Rejected** — copy targets a *different window*, which has its own store, so Redux can't carry it. Right-click paste accepted, reading the system clipboard instead. |
| Copy should work logged-out (it's non-destructive) | **Rejected** — copying requires login. |
| Pasted node doesn't land where you asked | **Fixed** — see below. |
| No taxon/model-fit check on paste | **Won't do** — the form already validates before save. |
| Multi-activity copy + preserving connections | **Deferred** — separate project. |

Implemented:
- `blank:contextmenu` → `onBlankContextMenu(clientX, clientY)` → `CanvasContextMenu` with a
  **Paste activity** item, gated on `isLoggedIn`. Verified against the real 3.7.7 dist:
  `contextMenuTrigger` fires `blank:contextmenu` with `(evt, x, y)`.
- `readActivityClipboard()` — menu paste has no paste event to read, so it uses
  `navigator.clipboard.readText()`. Returns a 3-way result so the UI can distinguish
  "clipboard holds nothing pasteable" (warning toast) from "browser refused the read"
  (info toast pointing at Ctrl+V — Firefox blocks `readText` for web content, and Chrome's
  permission can be declined). Ctrl+V remains permission-free via `clipboardData`.
- `CamCanvas.armDropAt(client?)` — reuses the existing `DropPlacement` so a pasted activity is
  positioned like a stencil drop. Menu paste passes the right-click point; Ctrl+V passes
  nothing and falls back to the last pointer position over the canvas (tracked via a
  `mousemove` listener, removed in `destroy()`), then to the canvas center.
- Extracted `CursorAnchoredMenu` so the node and canvas menus share the 1×1 cursor-placeholder
  anchoring rather than duplicating it.

## Round 3 — tests

97 new tests across 4 files (853 → 950 total, 66 files).

| File | Tests | Covers |
| ---- | ----- | ------ |
| `tests/features/gocam/services/activityClipboard.test.ts` | 47 | type mapping, label fallbacks, serialize shape + round trip, 16 rejection cases for foreign clipboard text, `writeClipboardText` fallback matrix, `readActivityClipboard` ok/empty/unsupported |
| `tests/app/hooks/useActivityPaste.test.tsx` | 21 | payload dispatch, `preventDefault` only on our own payloads, editable-target guards, enabled flag transitions, listener lifecycle + latest-callback-without-resubscribe |
| `tests/features/pathway/components/NodeContextMenu.test.tsx` | 13 | interactive vs read-only item sets, each action fires + closes, cursor anchoring |
| `tests/features/pathway/components/CanvasContextMenu.test.tsx` | 5 | paste item, closed state, cursor anchoring |
| `tests/features/gocam/slices/activityFormSlice.test.ts` (extended) | +11 | `initPasteForm`: CREATE mode, dirty, re-id of terms/relations/evidence, content preservation, payload not mutated, fresh uids per paste |

**Bug found and fixed by these tests:** `writeClipboardText` stranded its hidden textarea in
the DOM when `document.execCommand` *threw* (as opposed to returning false) — the `removeChild`
sat after the call inside the same `try`. Moved cleanup to a `finally`.

Note for whoever picks this up: `CamCanvas.armDropAt` is **not** covered. It needs a live
JointJS paper (`clientToLocalPoint` wants real SVG matrix support), which jsdom doesn't provide.
`DropPlacement` itself — the part holding the logic — is already covered by
`tests/features/pathway/graph/dropPlacement.test.ts`. The canvas glue is e2e territory.

## Summary

The node's copy icon now writes the activity to the system clipboard as JSON text instead of
opening the form directly. Ctrl+V on the pathway canvas — in the same model, a different model,
or another tab — parses that payload and opens the Activity Form prefilled. A right-click menu
on nodes exposes the same actions as the hover icons.

Follow-ups not done (not requested):
- No paste entry in a blank-canvas context menu — that would need
  `navigator.clipboard.readText()` and its permission prompt.
- No tests added (per standing instruction not to write tests unasked). If wanted later, the
  natural units are `parseActivityClipboard` (rejects foreign clipboard text) and
  `initPasteForm` (re-ids the tree, lands in CREATE mode).
- `npm run format` / Prettier is broken repo-wide: `prettier-plugin-tailwindcss` looks for a
  Tailwind v3 `tailwind.config.js` and this project is on v4. Pre-existing.

## Blockers
- None currently

## Notes

- Serializing the **form tree** (`activityToFormTree` output) rather than the `Activity` keeps
  paste on the existing `reIdTree` code path and avoids shipping model-specific individual IDs.
- `reIdTree` already strips every uid, so a pasted activity has no identity overlap with its
  source — safe across models.
- Terms, evidence codes, references and with/from values are global identifiers, so they carry
  over between models unchanged.
- Paste is guarded on `isLoggedIn` and on no dialog being open, and skipped when focus is in an
  input/textarea/contenteditable so it can't hijack normal text pasting.
