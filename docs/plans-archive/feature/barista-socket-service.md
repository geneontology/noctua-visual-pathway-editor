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
- `packet_id`-based deduplication with 500ms debounce for the rare "socket before HTTP" case

### The Race Condition

When the current user makes a change, both an HTTP response (via manager rebuild callback) and a socket relay event arrive for the same operation. These carry the same `packet_id` (confirmed in `barista.js:2305-2322`). The old `isModelDataEqual()` approach compared data snapshots and was unreliable because the socket could arrive before `cam.lastResponseData` was set.

### Solution: `packet_id` dedup with debounce

**How it works:**
1. The existing `rebuild()` callback in `graph.service.ts` registers `response.packet_id()` in `cam.processedPacketIds`
2. Socket relay events check `packet_id` against `processedPacketIds` — matches are skipped (common case: HTTP arrives first)
3. If no match on first check, a 500ms debounce gives the HTTP response time to arrive, then re-checks before showing the dialog

**Why 500ms:** Both the HTTP response and socket relay originate from the same Barista server-side function call (`barista.js:2308-2326`). Slow internet slows both equally. The 500ms covers the relative jitter between HTTP and WebSocket channels, not absolute network latency.

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

### Phase 3: packet_id dedup
- [x] Add `processedPacketIds` to Cam model
- [x] Remove `lastResponseData` from Cam model and `graph.service.ts`
- [x] Add `cam.processedPacketIds.add(response.packet_id())` in existing `rebuild()` method
- [x] Rewrite `watchModel()` — packet_id check with 500ms debounce fallback
- [x] Remove `isModelDataEqual()` and lodash `isEqual` import

### Phase 4: Verify
- [x] `npm start` / `ng build` compiles without errors
- [ ] Socket handshake visible in DevTools Network/WS tab when opening a CAM
- [ ] Model reloads when another tab/user makes a change
- [ ] Own changes do NOT trigger the dialog

## Recovery Checkpoint

> **Last completed action:** Implemented packet_id dedup with debounce, build compiles clean
> **Next immediate action:** Manual testing — verify socket handshake, external changes trigger dialog, own changes do not
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
| `src/@noctua.form/services/barista-socket.service.ts` | Create new service → packet_id dedup with debounce | Done |
| `src/@noctua.form/services/index.ts` | Add export | Done |
| `src/@noctua.form/services/cam.service.ts` | Removed BaristaSocketService injection | Done |
| `src/@noctua.form/models/activity/cam.ts` | Add `processedPacketIds: Set<string>`; remove `lastResponseData` | Done |
| `src/@noctua.form/services/graph.service.ts` | Add `cam.processedPacketIds.add(packet_id)` in `rebuild()`; remove `lastResponseData` assignment | Done |
| `src/app/main/apps/noctua-graph/noctua-graph.component.ts` | Inject + call connect/watchModel/disconnect | Done |

## Blockers
- None currently

## Notes
- `socket.io-client ^1.4.6` already in package.json — no install needed
- Barista server uses socket.io 1.4.6, v1.x client is wire-compatible
- `NgZone` already injected in CamService (line 50) but unused — socket callbacks run outside Angular zone
- `bbop-client-barista` is in package.json but intentionally NOT used — we use socket.io-client directly for a clean Angular integration
- CamService.getCam() already does full model load: sets up managers, calls `manager.get_model()`, triggers rebuild → loadCam → onCamGraphChanged

## Future: Deterministic dedup with prerun/postrun (if debounce causes problems)

If the 500ms debounce proves unreliable (false-positive dialogs for own changes), upgrade to deterministic buffering using the manager's `prerun`/`postrun` lifecycle hooks. These are internal events on `bbop-manager-minerva` (same registry as `rebuild`), NOT Barista socket events:

- `prerun` — fires before every HTTP request to Minerva (`manager.js:1026`)
- `postrun` — fires after every response, success or error (`manager.js:149`, "Postrun goes no matter what")
- Already registered as empty callbacks in `graph.service.ts:registerManager()` (`shieldsUp`/`shieldsDown`)

**How it would work:** Register 3 additional callbacks on `cam.manager` in `getGraphInfo()`:
```typescript
cam.manager.register('prerun', function () { cam.pendingOps++; });
cam.manager.register('rebuild', function (resp) {
  const packetId = resp.packet_id();
  if (packetId && packetId !== 'unknown') cam.processedPacketIds.add(packetId);
}, 9);
cam.manager.register('postrun', function () {
  cam.pendingOps--;
  if (cam.pendingOps <= 0) {
    cam.pendingOps = 0;
    if (cam.onPendingOpsComplete) cam.onPendingOpsComplete();
  }
}, 8);
```

Priority ordering ensures: main rebuild (10) → packet_id registration (9) → pending decrement + flush (8).

Add `pendingOps: number` and `onPendingOpsComplete: (() => void) | null` to the Cam model. In `watchModel()`, buffer events when `cam.pendingOps > 0` instead of using setTimeout, and flush the buffer from `onPendingOpsComplete`. This removes all timing assumptions.

## Additional Context (Claude)
- The old Noctua app (C:\work\go\noctua\js\NoctuaEditor.js lines 2499-2543) used `bbop-client-barista` which wraps socket.io-client with its own callback registry. We skip that layer.
- Circular DI avoided by passing a reload callback function to `watchModel()` instead of injecting CamService into BaristaSocketService.
