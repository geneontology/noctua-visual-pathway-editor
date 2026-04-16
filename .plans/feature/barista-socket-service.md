# Task: Add socket.io service to reload CAM on remote model changes

**Status:** ACTIVE
**Issue:** https://github.com/geneontology/noctua/issues/1077
**Branch:** issue-1077-noctua-stale-ui

## Goal
Create a simple Angular service that connects to Barista via socket.io, listens for model change events (`merge`/`rebuild` relays), and calls `getCam()` to reload the model when a remote change is detected.

## Context
- **Related files:**
  - `src/@noctua.form/services/cam.service.ts` — `getCam()` method (line 106)
  - `src/@noctua.form/services/graph.service.ts` — manager setup, commented barista client (line 118)
  - `src/@noctua.form/services/index.ts` — service exports
  - `src/@noctua.form/services/user.service.ts` — `baristaToken`
  - `src/environments/environment.ts` — `globalBaristaLocation`
  - `package.json` — already has `socket.io-client: ^1.4.6` (line 89)
- **Triggered by:** User request — want latest Minerva data when other users make changes

## Current State
- BaristaSocketService is implemented and connected
- **Implementing:** `packet_id`-based deduplication with manager lifecycle hooks to solve the race condition

### The Race Condition (solved)

When the current user makes a change, both an HTTP response (via manager rebuild callback) and a socket relay event arrive for the same operation. These carry the same `packet_id` (confirmed in `barista.js:2305-2322`). The old `isModelDataEqual()` approach compared data snapshots and was unreliable because the socket could arrive before `cam.lastResponseData` was set.

### Solution: `packet_id` dedup with pending operation buffering

**How it works:**
1. Manager lifecycle hooks (`prerun`/`postrun`) track in-flight operations on the Cam
2. Each `rebuild` callback registers its `response.packet_id()` in `cam.processedPacketIds`
3. Socket relay events are checked against `processedPacketIds` — matches are skipped
4. If an operation is pending (`cam.pendingOps > 0`), socket events are buffered
5. When pending ops complete, buffered events are flushed: matching packet_ids discarded, non-matching trigger the dialog

**Why this is correct:**
- HTTP before socket → packet_id registered → socket handler finds match → skip
- Socket before HTTP → `pendingOps > 0` → buffered → HTTP completes → packet_id registered → flush discards match
- External change → no pending ops, no matching packet_id → dialog shown
- Same user different tab → different manager = different packet_id → dialog shown correctly
- `packet_id === 'unknown'` → guard treats as no-match → conservative fallback (shows dialog)

## Barista Server Protocol
- socket.io 1.4.6, no namespaces/rooms, default `/` namespace
- On connect: server emits `'initialization'` → `{socket_id, user_name, user_email, user_color}`
- On any Minerva API change: server broadcasts `'relay'` → `{class: 'merge'|'rebuild', model_id, packet_id, data: <minerva response>}`
- Client must filter by `model_id` locally

## Steps

### Phase 1: Create BaristaSocketService
- [x] Create `src/@noctua.form/services/barista-socket.service.ts`
- [x] Export from `src/@noctua.form/services/index.ts`

### Phase 2: Integrate into NoctuaGraphComponent
- [x] Inject `BaristaSocketService` into `NoctuaGraphComponent` (not CamService)
- [x] Call `connect()` once in constructor
- [x] Call `watchModel(cam, reloadFn)` after `loadCam()` in the `onUserChanged` subscription
- [x] Call `disconnect()` in `ngOnDestroy()`

### Phase 3: packet_id dedup with manager lifecycle hooks
- [ ] Add `processedPacketIds`, `pendingOps`, `onPendingOpsComplete` to Cam model
- [ ] Remove `lastResponseData` from Cam model and `graph.service.ts`
- [ ] Register `prerun`/`rebuild`(p9)/`postrun`(p8) on `cam.manager` in `getGraphInfo()`
- [ ] Rewrite `watchModel()` — packet_id check, pending ops buffering, flush on complete
- [ ] Remove `isModelDataEqual()` and lodash `isEqual` import

### Phase 4: Verify
- [ ] `npm start` compiles without errors
- [ ] Socket handshake visible in DevTools Network/WS tab when opening a CAM
- [ ] Model reloads when another tab/user makes a change
- [ ] Own changes do NOT trigger the dialog

## Recovery Checkpoint

> **Last completed action:** Implementing packet_id dedup with manager lifecycle hooks
> **Next immediate action:** Verify build compiles and test
> **Environment state:** Branch issue-1077-noctua-stale-ui

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Over-engineered version with CamRebuildRule, refreshModelBeforeSave wrapping all save methods, UI notifications | User wants simple approach — just reload via getCam() | 2026-03-25 |
| Flag-based approach (`cam.localOperationPending`) — set before mutation, clear after rebuild, skip socket events while true | Requires tracking the flag in every Minerva call site, fragile if rebuild fails, adds unnecessary state | 2026-04-15 |
| Data comparison (`isModelDataEqual` with lodash `isEqual`) — compare socket event data against `cam.lastResponseData` | Race condition: socket event can arrive before rebuild sets `lastResponseData`, causing false positives. Also expensive (deep equality on large arrays) and fragile (order sensitivity) | 2026-04-15 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/@noctua.form/services/barista-socket.service.ts` | Create new service → rewrite with packet_id dedup | Done |
| `src/@noctua.form/services/index.ts` | Add export | Done |
| `src/@noctua.form/services/cam.service.ts` | Removed BaristaSocketService injection | Done |
| `src/@noctua.form/models/activity/cam.ts` | Add processedPacketIds, pendingOps, onPendingOpsComplete; remove lastResponseData | Done |
| `src/@noctua.form/services/graph.service.ts` | Register prerun/rebuild/postrun on cam.manager; remove lastResponseData assignment | Done |
| `src/app/main/apps/noctua-graph/noctua-graph.component.ts` | Inject + call connect/watchModel/disconnect | Done |

## Blockers
- None currently

## Notes
- `socket.io-client ^1.4.6` already in package.json — no install needed
- Barista server uses socket.io 1.4.6, v1.x client is wire-compatible
- `NgZone` already injected in CamService (line 50) but unused — socket callbacks run outside Angular zone
- `bbop-client-barista` is in package.json but intentionally NOT used — we use socket.io-client directly for a clean Angular integration
- CamService.getCam() already does full model load: sets up managers, calls `manager.get_model()`, triggers rebuild → loadCam → onCamGraphChanged

## Additional Context (Claude)
- The old Noctua app (C:\work\go\noctua\js\NoctuaEditor.js lines 2499-2543) used `bbop-client-barista` which wraps socket.io-client with its own callback registry. We skip that layer.
- Circular DI avoided by passing a reload callback function to `watchModel()` instead of injecting CamService into BaristaSocketService.
