# Task: Prevent the unremovable "empty" relation line when a connection is drawn but no relation is picked

**Status:** ACTIVE
**Issue:** Reported by user (showstopper) — no GitHub # yet
**Branch:** issue-vep-updates-after

## Goal

When a curator drags a line between two activities but closes the relation dialog without picking a relation, no phantom edge should be left behind. Re-drawing must work (no false "already a relation"), and there must never be a stuck edge that can't be edited or deleted.

## Context

- **Related files:**
  - `src/features/pathway/graph/camCanvas.ts:180-204` — `change:source change:target` handler (link creation + `alreadyConnected` dedup)
  - `src/features/pathway/graph/camCanvas.ts:168-177` — `link:pointerdblclick` → `onLinkClick(sourceId, targetId)`
  - `src/app/PathwayViewer.tsx:116-138` — `handleLinkClick` (searches `model.activityConnections`) and `handleLinkCreated` (opens dialog with `edge: null`)
  - `src/features/relations/components/RelationForm.tsx` — Save disabled until a `relation` is resolved; Delete only shown when `existingEdgeId` is set
  - `src/features/relations/services/connectorServices.ts` — `buildConnectorOperations` / `buildConnectorDeleteOperations`
- **Triggered by:** User report: "If you draw the line but don't add a relation, there is no way anymore to remove the relation… if you try to add another relation, the VPE tells you there already is a relation."

## Current State

**What works:** Drawing a line opens the connector dialog; saving with a relation persists a real edge to Barista; existing real edges can be edited/deleted.

**What's broken (root cause):**
1. On drag, JointJS creates a link in the in-memory `graph`. `camCanvas.ts:203` fires `onLinkCreated` → dialog opens with `edge: null`. The link is **never removed** if the user cancels.
2. `alreadyConnected` (`camCanvas.ts:190-195`) scans **all** in-memory links — confirmed or not — so the leftover phantom blocks a fresh draw with the "already connected" popup (`onDuplicateLink`).
3. The phantom has no entry in `model.activityConnections` (never persisted), so `handleLinkClick` (`PathwayViewer.tsx:116-123`) finds no `edge` and returns early → can't open the form → can't delete. Delete button only renders when `existingEdgeId` exists.

**Important mitigating fact:** the phantom link lives only in JointJS memory and is **never sent to Barista**. A page reload clears it. That's the current (bad) workaround and means no data migration/cleanup is needed — only forward prevention.

## Steps

### Phase 1: Prevent the empty line (Option B) — DONE

- [x] **Option B (minimal, proven-safe): remove the just-dragged link immediately, let the model drive the real edge.** In `camCanvas.ts` `change:source change:target`, after capturing `sourceId`/`targetId` and confirming not `alreadyConnected`, call `link.remove()` before firing `onLinkCreated(sourceId, targetId)`. On Save the model refetch (`updateGraphModel` `invalidatesTags: ['graph']` → refetch → `addCanvasGraph`/`resetCells`) redraws the real edge; on Cancel nothing remains. (The duplicate branch already calls `link.remove()` at line 198, so removing inside the handler is known-safe.)
- [x] `alreadyConnected` now only matches **persisted** edges (only model-derived edges remain in the graph) — re-drawing a cancelled connection no longer trips the popup.
- [x] `npm run type-check` passes clean.

### Phase 1-alt: Option A (keep the line visible during the dialog)
- [ ] If we want the line shown while the dialog is open: have `onLinkCreated` pass the new link's `id` up; `PathwayViewer` stores it; expose `camCanvas.removeLink(id)`; call it from the dialog's close-without-save path. On Save, the refetch redraw replaces it (guard against a transient duplicate).
- Trade-off: more wiring + a save/cancel distinction. Option B is simpler and matches the user's "prevent that empty line" ask.

### Phase 2: Hardening (optional safety net)
- [ ] In `handleLinkClick` (`PathwayViewer.tsx`), if no matching `edge` is found in `activityConnections`, treat the link as unconfirmed and remove it from the canvas instead of returning silently — guarantees no path can leave a stuck line.

### Phase 3: Verify (manual, user)
- [ ] Draw a line, close dialog without picking a relation → no line remains.
- [ ] Re-draw between the same two activities → connector dialog opens (no "already connected" popup).
- [ ] Pick a relation + Save → exactly one real edge appears, persisted to Barista.
- [ ] Two activities with a real edge → drawing a second still correctly shows "already connected".
- [ ] Reload after a real save → edge persists; after a cancel → nothing.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Implemented Option B in `camCanvas.ts` (`change:source change:target` now `link.remove()`s the transient link before firing `onLinkCreated`); `npm run type-check` clean.
- **Next immediate action:** User runs the Phase 3 manual checks. Phase 2 (hardening) optional — likely unnecessary now that no path leaves a temp link.
- **Uncommitted changes:** `src/features/pathway/graph/camCanvas.ts`.

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/pathway/graph/camCanvas.ts` | Remove temp link on draw (Option B) | Done |
| `src/app/PathwayViewer.tsx` | (Phase 2, optional) harden `handleLinkClick` | Not needed (Option B prevents stranded links) |

## Notes

- Do **not** try to make the phantom deletable via the form (it has no `existingEdgeId`); the right fix is to never leave it. The "already a relation" check is correct *once* phantoms are gone.
- Decision needed from user: Option A (line stays visible during dialog) vs Option B (line not shown while dialog open). Recommend B.

## Additional Context (Claude)
- Architectural root cause: JointJS render state and the Barista model are decoupled, but `alreadyConnected` treats them as one. Option B re-couples them by making the model the only source of drawn edges.
