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
- What works now: HTTP-only communication via `bbop-manager-minerva`. Each client only sees its own changes.
- What's broken/missing: No real-time awareness of other users' edits. Users can overwrite each other's work.

## Barista Server Protocol
- socket.io 1.4.6, no namespaces/rooms, default `/` namespace
- On connect: server emits `'initialization'` → `{socket_id, user_name, user_email, user_color}`
- On any Minerva API change: server broadcasts `'relay'` → `{class: 'merge'|'rebuild', model_id, packet_id, data: <minerva response>}`
- Client must filter by `model_id` locally

## Steps

### Phase 1: Create BaristaSocketService
- [ ] Create `src/@noctua.form/services/barista-socket.service.ts`
  - `connect()` — connect to `environment.globalBaristaLocation` via socket.io-client
  - `disconnect()` — tear down socket
  - `watchModel(cam)` — subscribe to relay events, filter by `cam.id`, call `getCam(cam.id)` on match
  - All socket callbacks in `NgZone.run()`
  - Use `Injector` to get `CamService` (avoid circular DI: CamService → GraphService → potential issues)
- [ ] Export from `src/@noctua.form/services/index.ts`

### Phase 2: Integrate into NoctuaGraphComponent
- [x] Inject `BaristaSocketService` into `NoctuaGraphComponent` (not CamService)
- [x] Call `connect()` once in constructor
- [x] Call `watchModel(cam, reloadFn)` after `loadCam()` in the `onUserChanged` subscription
- [x] Call `disconnect()` in `ngOnDestroy()`

### Phase 3: Verify
- [ ] `npm start` compiles without errors
- [ ] Socket handshake visible in DevTools Network/WS tab when opening a CAM
- [ ] Model reloads when another tab/user makes a change

## Recovery Checkpoint

> **Last completed action:** All 3 phases implemented and build verified
> **Next immediate action:** Commit and create PR
> **Recent commands run:** `npx ng build --configuration=development` (success)
> **Uncommitted changes:** package-lock.json (pre-existing), barista-socket.service.ts (new), index.ts (modified), cam.service.ts (modified)
> **Environment state:** Branch issue-1077-noctua-stale-ui

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Over-engineered version with CamRebuildRule, refreshModelBeforeSave wrapping all save methods, UI notifications | User wants simple approach — just reload via getCam() | 2026-03-25 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/@noctua.form/services/barista-socket.service.ts` | Create new service | Done |
| `src/@noctua.form/services/index.ts` | Add export | Done |
| `src/@noctua.form/services/cam.service.ts` | Removed BaristaSocketService injection | Done |
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
