# Task: Improve error messages, fix molecule uuid, refactor validation model

**Status:** ACTIVE
**Issue:** #184
**Branch:** noctua-184-error-message

## Goal

1. Fix inter-activity/molecule edges leaking into diff errors (missing `activity.uuid` in `graphToMolecules`)
2. Rename error labels to be more descriptive
3. Align error panel UI with site theme and standard drawer pattern
4. Refactor scattered error properties into a unified `CamValidationErrors` class
5. Split orphaned nodes into "Node not shown" vs "Node/relation combination not allowed" to eliminate duplication

## Context

- **Related files:** see Files Modified table below
- **Triggered by:** Issue #184

## Current State

All phases complete. Pending manual test and commit.

## Steps

### Phase 1: Fix `activity.uuid` in `graphToMolecules` — Done

- [x] In `graph.service.ts` `graphToMolecules()`, added `activity.uuid = bbopNode.id()` after `activity.id = bbopNode.id()`, matching the pattern in `graphToActivities`. This makes molecule `Triple<Activity>` IDs match raw `Triple<ActivityNode>` IDs so `setDiffs()` correctly excludes inter-activity/molecule edges.

### Phase 2: Rename labels — Done

- [x] Right panel summary stats: "Total Errors" → "Data model violation errors (ShEx)", "Node Errors" → "Activity Units / Chemicals errors", "Relation Errors" → "Relations errors"
- [x] Right panel section headers renamed to match
- [x] Toolbar chip text kept as original `"{{cam.totalErrors}} Error(s) Found"` (user decision)
- [x] Dialog titles kept as original "Violations" / "Errors" (user reverted changes)

### Phase 3: UI improvements — Done

- [x] Error panel header changed from custom blue Material header to standard `noc-drawer` / `noc-drawer-header` pattern (white bg, 40px, elevation-2, stroked close button) matching all other right-panel drawers
- [x] Added `@import "@noctua.common/scss/noctua.common"` to cam-errors SCSS (was missing — caused header styles not to apply)
- [x] Replaced generic Material color variables with Noctua theme colors (`$noc-primary-color`, `$noc-secondary-color`, `$noc-primary-color-accent`, etc.)
- [x] Toolbar error chip uses `noc-table-chip` class for consistent sizing, color-coded green/red via `noc-has-errors` class
- [x] Added `.annotations__subcategory` style for section descriptions

### Phase 4: Refactor validation model — Done

- [x] Created `CamValidationErrors` class in `cam.ts` grouping:
  - `shexViolations: ActivityError[]` (was untyped `errors = []`)
  - `orphanedNodes: ActivityNode[]` (was `diffNodes`)
  - `orphanedEdges: Triple<ActivityNode>[]` (was `diffEdges`)
  - Derived getters: `total`, `hasErrors`
- [x] Replaced five scattered properties on `Cam` (`errors`, `diffNodes`, `diffEdges`, `hasViolations`, `totalErrors`) with single `validationErrors: CamValidationErrors`
- [x] `totalErrors` getter now delegates to `validationErrors.total`
- [x] Typed `getViolationDisplayErrors()` return as `ActivityError[]`; fixed base `Violation.getDisplayError()` return type
- [x] Updated all consumers: `graph.service.ts`, cam-errors template, cam-toolbar template

### Phase 5: Split orphaned nodes by context — Done

- [x] Added `standaloneNodes` getter on `CamValidationErrors` — orphaned nodes NOT referenced by any orphaned edge (pure standalone, "Node not shown")
- [x] Added `relationNodes` getter — orphaned nodes that ARE subject/object of an orphaned edge ("Node/relation combination not allowed")
- [x] Template splits "Activity Units / Chemicals errors" section into two subsections, each conditionally rendered

### Phase 6: Verify

- [ ] Manual test: load a CAM model, verify error counts and categories are correct
- [ ] Commit

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Phase 5 — split orphaned nodes into standalone vs relation nodes
- **Next immediate action:** Manual test / commit
- **Recent commands run:** `npm run build` — success (multiple times during development)
- **Uncommitted changes:** cam.ts, graph.service.ts, violation-error.ts, cam-toolbar (.html/.scss), cam-errors graph panel (.html/.scss), cam-errors dialog (.html), activity-errors dialog (.html)
- **Environment state:** branch noctua-184-error-message

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Filter in `generateViolation()` (ShEx layer) | Wrong root cause — issue is in setDiffs/diffEdges not ShEx | 2026-03-26 |
| Create `allowedViolationPredicateIds` constant | Unnecessary — root cause is missing uuid on molecule activities | 2026-03-26 |
| Filter by activityRootIds in setDiffs | Workaround, not fix — getCausalRelations already handles it, just IDs don't match | 2026-03-26 |
| Filter by `noctuaFormConfig.moleculeEdges` predicate IDs | Unnecessary — same as above | 2026-03-26 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/@noctua.form/models/activity/cam.ts` | Created `CamValidationErrors` class; replaced scattered props with `validationErrors`; added `standaloneNodes`/`relationNodes` getters; typed `getViolationDisplayErrors()` | Done |
| `src/@noctua.form/models/activity/error/violation-error.ts` | Fixed `getDisplayError()` base return type to `ActivityError` | Done |
| `src/@noctua.form/services/graph.service.ts` | Added `activity.uuid = bbopNode.id()` in `graphToMolecules()`; updated `loadCam` to use `validationErrors.shexViolations`; removed `cam.hasViolations` assignment | Done |
| `src/app/main/apps/noctua-form/cam/cam-toolbar/cam-toolbar.component.html` | Chip uses `noc-table-chip`, `noc-validation-chip`, color-coded `noc-has-errors`; text kept as original | Done |
| `src/app/main/apps/noctua-form/cam/cam-toolbar/cam-toolbar.component.scss` | Added `.noc-validation-chip` styles with green/red states | Done |
| `src/app/main/apps/noctua-graph/cam-errors/cam-errors.component.html` | Standard `noc-drawer-header`; renamed labels; uses `validationErrors.*`; split nodes into standalone/relation subsections | Done |
| `src/app/main/apps/noctua-graph/cam-errors/cam-errors.component.scss` | Added `noctua.common` import; Noctua theme colors; subcategory style; removed custom header styles | Done |
| `src/app/main/apps/noctua-form/dialogs/cam-errors/cam-errors.component.html` | Title kept as "Violations" (user reverted) | Done |
| `src/app/main/apps/noctua-form/dialogs/activity-errors/activity-errors.component.html` | Title kept as "Errors" (user reverted) | Done |

## Blockers

- None currently

## Notes

- `violations: Violation[]` stays on Cam as internal plumbing for `setViolations()` propagation to activities
- `activity.hasViolations` on the Activity class is unchanged — separate from `Cam.validationErrors`
- Dialog titles were reverted by user to original "Violations" / "Errors"
- Toolbar chip text was kept as original per user request
