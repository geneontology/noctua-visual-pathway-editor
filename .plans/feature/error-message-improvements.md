# Task: Improve error messages and fix molecule uuid for diffEdges matching

**Status:** ACTIVE
**Issue:** #184
**Branch:** noctua-184-error-message

## Goal

Inter-activity/molecule edges leak into `diffEdges` because `graphToMolecules` doesn't set `activity.uuid`, causing the causal relation triple IDs to not match raw triple IDs in `setDiffs()`. Fix the root cause and rename error labels.

## Context

- **Related files:** see Files Modified table below
- **Triggered by:** Issue #184

## Current State

- What works now: `getCausalRelations()` correctly captures inter-activity edges. `setDiffs()` tries to exclude them via `existingTripleUuids`.
- What's broken: `generateTripleId()` uses `subject?.uuid` to build IDs. In `graphToActivities` (line 546), `activity.uuid = bbopSubjectId` is set. In `graphToMolecules` (line 584-585), `activity.uuid` is **never set** — only `activity.id`. So when `getCausalRelations` builds `Triple<Activity>` involving molecules, the triple ID uses `undefined` for the molecule's uuid, producing IDs like `_RO:0002233_xxx` instead of `nodeId_RO:0002233_xxx`. These don't match the raw triple IDs in `setDiffs`, so the edges aren't excluded from `diffEdges`.

## Steps

### Phase 1: Set `activity.uuid` in `graphToMolecules`

- [ ] In `src/@noctua.form/services/graph.service.ts` `graphToMolecules()`, add `activity.uuid = bbopNode.id()` after line 585 (`activity.id = bbopNode.id()`), matching the pattern in `graphToActivities` at line 546.

### Phase 2: Rename labels

- [ ] Toolbar chip (`src/app/main/apps/noctua-form/cam/cam-toolbar/cam-toolbar.component.html` line 20-22): `"{{cam.totalErrors}} Error(s) Found"` → `"{{cam.totalErrors}} Data model violation errors (ShEx)"`
- [ ] Right panel summary stats (`src/app/main/apps/noctua-graph/cam-errors/cam-errors.component.html`):
  - Line 33: `"Total Errors"` → `"Data model violation errors (ShEx)"`
  - Line 37: `"Node Errors"` → `"Activity Units / Chemicals errors"`
  - Line 41: `"Relation Errors"` → `"Relations errors"`
- [ ] Right panel section headers (same file):
  - Line 101: `"Nodes"` → `"Activity Units / Chemicals errors"`
  - Line 119: `"Edges"` → `"Relations errors"`
- [ ] Dialog titles:
  - `src/app/main/apps/noctua-form/dialogs/cam-errors/cam-errors.component.html` line 5: `"Violations"` → `"Data model violation errors (ShEx)"`
  - `src/app/main/apps/noctua-form/dialogs/activity-errors/activity-errors.component.html` line 5: `"Errors"` → `"Data model violation errors (ShEx)"`

### Phase 3: Add subcategory labels

- [ ] In right panel (`cam-errors.component.html`): add `<div class="annotations__subcategory">Node/relation combination not allowed</div>` after the "Activity Units / Chemicals errors" and "Relations errors" section headers
- [ ] Add `.annotations__subcategory` style in `cam-errors.component.scss`

### Phase 4: Verify

- [ ] `npm run build` — no compilation errors
- [ ] Manual test: load a CAM model with molecules, confirm inter-activity/molecule edges no longer inflate error count

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** All phases complete, build passes
- **Next immediate action:** Manual test / commit
- **Recent commands run:** `npm run build` — success
- **Uncommitted changes:** graph.service.ts, cam-toolbar.component.html, cam-errors (graph + form dialogs), cam-errors.component.scss
- **Environment state:** branch noctua-184-error-message

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Filter in `generateViolation()` (ShEx layer) | Wrong root cause — issue is in setDiffs/diffEdges not ShEx | 2026-03-26 |
| Create `allowedViolationPredicateIds` constant | Unnecessary — root cause is missing uuid on molecule activities | 2026-03-26 |
| Filter by activityRootIds in setDiffs | Workaround, not fix — getCausalRelations already handles it, just IDs don't match | 2026-03-26 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/@noctua.form/services/graph.service.ts` | Add `activity.uuid = bbopNode.id()` in `graphToMolecules()` after line 585 | Done |
| `src/app/main/apps/noctua-form/cam/cam-toolbar/cam-toolbar.component.html` | Update chip label | Done |
| `src/app/main/apps/noctua-graph/cam-errors/cam-errors.component.html` | Rename stats, sections, add subcategories | Done |
| `src/app/main/apps/noctua-graph/cam-errors/cam-errors.component.scss` | Add subcategory style | Done |
| `src/app/main/apps/noctua-form/dialogs/cam-errors/cam-errors.component.html` | Rename dialog title | Done |
| `src/app/main/apps/noctua-form/dialogs/activity-errors/activity-errors.component.html` | Rename dialog title | Done |

## Blockers

- None currently

## Notes

- The one-line fix (`activity.uuid = bbopNode.id()`) makes molecule `Triple<Activity>` IDs match raw `Triple<ActivityNode>` IDs, so `setDiffs` correctly excludes them via the existing `existingTripleUuids` check
- No new constants, config changes, or filter logic needed
- `cam.totalErrors` automatically reflects the fix since it sums `errors.length + diffEdges.length + diffNodes.length`
