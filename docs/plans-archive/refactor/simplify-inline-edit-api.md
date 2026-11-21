# Task: Simplify inline-edit API — remove bulk/pendingChanges machinery

**Status:** COMPLETE (pending manual UI verification)
**Issue:** (internal cleanup, no GH issue)
**Branch:** issue-235-mutations-workflow

## Goal

Replace the `saveActivityReplace` → `bulkEditActivityNode` → `pendingChanges` chain with direct per-field edit methods. The editor dropdown knows exactly which one field is being edited (term/evidence/reference/with), so save should emit exactly the Minerva ops needed for that field — no cloning, no diff-walking, no pending-marker state left on model objects.

## Context

**Only caller:** `editor-dropdown.component.ts:150` (`saveActivityReplace`). That's the single entry point to all the bulk/pending machinery in the codebase.

**Dead code confirmed:**
- `CamService.bulkEditCam` — no callers
- `GraphService.bulkEditActivity` — only called by `bulkEditCam`
- `GraphService.editIndividual` — no callers
- `GraphService.replaceIndividual` — no callers
- `Cam.addPendingChanges` (find/replace variant, cam.ts:382) — no callers

**Latent bug (out of scope):** `EditorCategory.relationship` inline edits currently hit `saveActivityReplace` → `bulkEditIndividual`, which only checks `pendingEntityChanges` (term), not `pendingRelationChanges`. So changing a relationship via the inline editor is already a silent no-op today. New API will match current behavior — it can be fixed in a follow-up.

## Current State

**Flow today:**
1. `editor-dropdown.save()` switches on category, calls `saveActivityReplace(cam)`
2. `saveActivityReplace`:
   - `oldEntity = cloneDeep(self.entity)`
   - `activityEntityFormToActivity()` mutates `self.entity` with new values
   - `self.entity.addPendingChanges(oldEntity)` — diff-walks node + every evidence, sets `pending*` markers
   - Calls `camService.bulkEditActivityNode(cam, entity)`
3. `camService.bulkEditActivityNode` → `graphService.bulkEditActivityNode`
4. `graphService.bulkEditActivityNode` loops node + every evidence, emits ops only where `pending*` markers are set, sends via `cam.replaceManager`

**Problems:**
- 3-pass flow for a 1-field edit (mutate-new → clone-old → diff-walk → loop-check-markers)
- Pending-change state lingers on model objects between saves
- Two managers (`manager` vs `replaceManager`) with no meaningful difference
- 3 separate `pending*` fields on Evidence that could be one dispatch
- `PendingChange` class exists solely to bridge steps 2→4

## Target Design

**New API (graph.service.ts):**
```ts
editTerm(cam, individualUuid, oldTermId, newTermId): Observable<any>
editEvidenceCode(cam, evidenceUuid, oldCodeId, newCodeId): Observable<any>
editEvidenceReference(cam, evidenceUuid, oldRef, newRef): Observable<any>
editEvidenceWith(cam, evidenceUuid, oldWith, newWith): Observable<any>
```
Each builds a `minerva_requests.request_set` with 1–3 ops, attaches user/group annotations, calls `cam.manager.request_with(reqs)`. No pending state, no cam.replaceManager.

**New service method (activity-entity.service.ts):**
```ts
saveInlineEdit(cam: Cam, category: EditorCategory, evidenceIndex = 0): Observable<any>
```
Clones `self.entity` pre-mutation (to capture old values), runs `activityEntityFormToActivity()`, then dispatches on category to the appropriate `graphService.edit*` method with exact old/new values.

## Steps

### Phase 1: Add new API in graph.service.ts
- [x] Add `editTerm(cam, uuid, oldTermId, newTermId)` — single remove_type + add_type, store_model, via `cam.manager`
- [x] Add `editEvidenceCode(cam, uuid, oldCodeId, newCodeId)` — same shape, plus `editUserEvidenceAnnotations`
- [x] Add `editEvidenceReference(cam, uuid, oldRef, newRef)` — source annotation swap
- [x] Add `editEvidenceWith(cam, uuid, oldWith, newWith)` — with annotation swap
- Note: private helpers skipped — each method is small enough to inline cleanly

### Phase 2: Add `saveInlineEdit` in activity-entity.service.ts
- [x] Added `saveInlineEdit(cam, category, evidenceIndex = 0)` with local string-literal category type (avoids cross-module dep on `@noctua.editor`)

### Phase 3: Switch caller
- [x] Updated `editor-dropdown.component.ts` `save()` to call `saveInlineEdit(cam, category, evidenceIndex)` — casts EditorCategory to the local string type

### Phase 4: Delete dead code
- [x] `saveActivityReplace` removed from activity-entity.service.ts
- [x] `bulkEditActivityNode` + `bulkEditCam` removed from cam.service.ts (+ unused `forkJoin`, `map` imports)
- [x] `bulkEditActivity`, `bulkEditActivityNode`, `bulkEditIndividual`, `bulkEditEvidence`, `editIndividual`, `replaceIndividual` removed from graph.service.ts
- [x] `cam.replaceManager` init removed from `getGraphInfo`; `replaceManager` field removed from Cam
- [x] `ActivityNode.pendingEntityChanges` / `pendingRelationChanges` / `addPendingChanges` removed
- [x] `Evidence.pendingEvidenceChanges` / `pendingReferenceChanges` / `pendingWithChanges` / `addPendingChanges` removed
- [x] `Cam.addPendingChanges` (find/replace variant) removed
- [x] `src/@noctua.form/models/activity/pending-change.ts` deleted
- [x] `PendingChange` export removed from index.ts; imports removed from activity-node.ts, evidence.ts, cam.ts
- [x] Unused `camService` + `CamService` import removed from activity-entity.service.ts (orphaned after saveActivityReplace removal)

### Phase 5: Verify
- [x] `npx tsc --noEmit -p tsconfig.app.json` passes (exit 0) — TypeScript clean across all changes
- [ ] Manual UI check by user: open model → inline-edit a term → confirm save + rebuild
- [ ] Manual UI check by user: inline-edit evidence code, reference, with — each should save and rebuild
- [ ] Full `npm run build` (with 6GB memory) — skipped; not run in this session

## Recovery Checkpoint

> **Last completed action:** All phases 1–4 done. `tsc --noEmit` passes exit 0.
> **Next immediate action:** User runs `npm start` and does the 4 inline-edit manual checks listed in Phase 5.

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/@noctua.form/services/graph.service.ts` | Add edit* methods, delete bulk* + editIndividual + replaceIndividual + replaceManager init | Done |
| `src/@noctua.form/services/cam.service.ts` | Delete bulkEditActivityNode + bulkEditCam + unused imports | Done |
| `src/@noctua.form/services/activity-entity.service.ts` | Add saveInlineEdit, delete saveActivityReplace, drop unused camService | Done |
| `src/@noctua.editor/inline-editor/editor-dropdown/editor-dropdown.component.ts` | Switch to saveInlineEdit | Done |
| `src/@noctua.form/models/activity/cam.ts` | Delete replaceManager field, addPendingChanges, PendingChange import | Done |
| `src/@noctua.form/models/activity/activity-node.ts` | Delete pending* fields + addPendingChanges + PendingChange import | Done |
| `src/@noctua.form/models/activity/evidence.ts` | Delete pending* fields + addPendingChanges + PendingChange import | Done |
| `src/@noctua.form/models/activity/pending-change.ts` | Delete file | Done |
| `src/@noctua.form/models/activity/index.ts` | Remove PendingChange export | Done |

## Notes

- `editor-dropdown`'s `finalize` block calls `cam.loading.status = false` and `cam.reviewCamChanges()`. Keep this intact — those are model-review hooks independent of the save machinery.
- `loadingOverlayService.show()` is already called inside each existing edit method. New methods must call it too so the global overlay behavior (issue #235) is preserved.
- `cam.manager` has a rebuild callback registered — that's what clears the overlay. All 4 new methods go through `cam.manager`, so rebuild fires automatically.
- EditorCategory enum lives in `@noctua.editor` which is a DOWNSTREAM module from `@noctua.form`. To avoid circular dep, `saveInlineEdit` will accept a local string literal type `'term' | 'evidence' | 'reference' | 'with'` — editor-dropdown maps EditorCategory → that string at call site.
