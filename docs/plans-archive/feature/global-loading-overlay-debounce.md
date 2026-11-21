# Task: Global loading overlay for mutations workflow

**Status:** ACTIVE
**Issue:** #235 — Preventing actions in VPE as long as first action is not completed
**Branch:** issue-235-mutations-workflow

## Goal

Prevent users from triggering duplicate backend operations during rebuild/save by displaying a full-screen semi-transparent overlay that blocks all interaction while backend operations are in flight, with a 1-second linger after rebuild completes.

## Context

- **Problem:** Users can click save/delete buttons repeatedly during rebuild, causing duplicate Minerva requests and stale/floating UI elements
- **Current state:** `cam.loading` (CamLoadingIndicator) exists but only 2 places set it to `true` and only `rebuild()` clears it. No UI blocks interaction during loading.
- **Existing overlay pattern:** `noc-draw-body-disabled` class exists in `noctua.common.scss` but only used for logged-out state, scoped inside `.noc-drawer-body`

## Steps

### Phase 1: Global Loading Overlay Service

- [x] Create `src/@noctua/services/loading-overlay.service.ts`
  - `providedIn: 'root'`
  - Counter-based `show(message?)` / `hide()` / `forceHide()`
  - `BehaviorSubject<boolean>` for visibility, `BehaviorSubject<string>` for message

### Phase 2: Global Loading Overlay Component

- [x] Create `src/@noctua/components/loading-overlay/loading-overlay.component.ts`
- [x] Create `src/@noctua/components/loading-overlay/loading-overlay.component.html`
- [x] Create `src/@noctua/components/loading-overlay/loading-overlay.component.scss`
- [x] Create `src/@noctua/components/loading-overlay/loading-overlay.module.ts`
- [x] Export from `src/@noctua/components/index.ts`
- [x] Add `<noctua-loading-overlay>` to `src/app/app.component.html`
- [x] Import `NoctuaLoadingOverlayModule` in `src/app/app.module.ts`

### Phase 3: Wire overlay into backend operations

- [x] `src/@noctua.form/services/graph.service.ts`
  - Inject `NoctuaLoadingOverlayService`
  - `show()` before: `getGraphInfo`, `saveCamAnnotations`, `addActivity`, `editConnection`, `editActivity`, `bulkEditActivity`, `bulkEditActivityNode`, `deleteActivity`, `deleteEvidence`, `deleteEvidenceAnnotation`
  - `hide()` in `rebuild()` with **1-second `setTimeout` delay** so overlay lingers after rebuild completes

### Phase 4: Verification

- [ ] `npm start` — dev server runs without errors
- [ ] Trigger save on activity form — overlay appears, blocks clicks, clears ~1s after rebuild
- [ ] Delete activity — overlay appears during operation
- [ ] Copy model — overlay appears with message
- [ ] Verify overlay doesn't stick (no orphaned loading states)

## Recovery Checkpoint

> **Last completed action:** Phases 1-3 complete. Debounce directive created then fully reverted per user feedback.
> **Next immediate action:** `npm start` to verify build

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/@noctua/services/loading-overlay.service.ts` | Create | Done |
| `src/@noctua/components/loading-overlay/*` (4 files) | Create | Done |
| `src/@noctua/components/index.ts` | Modify | Done |
| `src/app/app.component.html` | Modify | Done |
| `src/app/app.module.ts` | Modify | Done |
| `src/@noctua.form/services/graph.service.ts` | Modify | Done |

## Notes

- Counter-based show/hide handles overlapping operations: each `show()` increments, each `hide()` decrements, overlay clears at 0.
- All Minerva operations funnel through the manager's `rebuild` callback in `graph.service.ts`, making `rebuild()` the single clearing point.
- 1-second `setTimeout` delay on `hide()` in `rebuild()` keeps the overlay visible slightly longer so the UI has time to settle.
- `ViewEncapsulation.None` on AppComponent means overlay styles are global — no scoping issues.
- Debounce click directive was considered and rejected — the overlay alone is sufficient to block duplicate actions.
