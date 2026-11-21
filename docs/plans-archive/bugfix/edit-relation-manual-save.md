# Task: Replace autosave with manual Save button when editing a relation edge

**Status:** ACTIVE
**Issue:** #235 (last comment from @pgaudet)
**Branch:** issue-235-mutations-workflow

## Goal

When a curator edits an existing causal-relation edge and picks "regulation", the form currently auto-saves on the first radio-click before they can pick effect direction / directness. Require an explicit Save click instead — matching the create flow, which already has a Save button.

## Context

- **Screen recording from reporter:** https://drive.google.com/file/d/1DnW-H98NsxTFxDyMmWQXBDyQGqddIqPO/view
- **Edit drawer (the one with autosave):** `src/app/main/apps/noctua-graph/activity-connector-table/activity-connector-table.component.{ts,html}`
- **Create drawer (already has Save button, serves as reference):** `src/app/main/apps/noctua-form/cam/activity/activity-connector-form/activity-connector-form.component.{ts,html}`
- **Shared service with autosave logic:** `src/@noctua.form/services/activity-connector.service.ts`

## Current State

**Autosave lives in `activity-connector.service.ts:173-181`:**
```ts
private _onActivityFormChanges(): void {
  this.connectorFormGroup.getValue().valueChanges.subscribe(value => {
    this.connectorActivity.checkConnection(value);
    if (this.connectorActivity.predicate?.edge?.id && this._allowRequestWatch && (this.connectorActivity.state === ConnectorState.editing)) {
      this.saveActivity()
    }
    this._allowRequestWatch = true
  });
}
```

The guard `state === ConnectorState.editing` means autosave fires ONLY on the edit path (table component), not the create path (form component). `checkConnection(value)` must remain because it toggles `displaySection.effectDirection/directness/chemicalIntermediate` which controls whether the dependent radio groups render.

**Edit drawer template:** Footer has Delete button only, no Save. Component already has a `save()` method (lines 129-140) wired to nothing, with a stale "successfully created" message and unnecessary `initializeForm` + `closeDialog` calls (the latter is always undefined in this usage).

## Steps

### Phase 1: Drop autosave from the service
- [x] Remove `saveActivity()` call + `_allowRequestWatch` gate in `_onActivityFormChanges`. Keep `checkConnection(value)`.
- [x] Remove `_allowRequestWatch` field + `initializeForm` reset (dead once autosave is gone).

### Phase 2: Add Save button to edit drawer
- [x] Update `activity-connector-table.component.html` footer: add `Save` button before Delete, disabled when `!connectorActivity?.predicate.edge?.id` (matches create-form's disable rule).
- [x] Fix `save()` in `activity-connector-table.component.ts`: change toast to "successfully updated"; drop redundant `initializeForm` call (service already does it) and the dead `closeDialog` branch.

### Phase 3: Verify
- [x] `npx tsc --noEmit -p tsconfig.app.json` passes.
- [ ] Manual UI check (user): pick a regulation relation on an existing edge → nothing saves → pick effect direction + directness → click Save → one save request fires with full regulation data.
- [ ] Manual UI check: non-regulation relation → pick new relation → click Save → saves once.
- [ ] Manual UI check: create a new edge (stencil flow) → Save button still works as before.

## Recovery Checkpoint

> **Last completed action:** Implemented phases 1 & 2; `tsc --noEmit` passes.
> **Next immediate action:** User runs `npm start` and does the 3 manual checks in Phase 3.

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/@noctua.form/services/activity-connector.service.ts` | Drop autosave + `_allowRequestWatch` | Done |
| `src/app/main/apps/noctua-graph/activity-connector-table/activity-connector-table.component.html` | Add Save button to footer | Done |
| `src/app/main/apps/noctua-graph/activity-connector-table/activity-connector-table.component.ts` | Fix save() message + drop dead code | Done |

## Notes

- The create flow (`activity-connector-form.component`) was already manual-save; it was only the edit flow that auto-saved. The `state === editing` guard in the service makes this a surgical change.

## Follow-up: Edit flow moved from right drawer to dialog

Second pass on this branch — host the edit view in a dialog to match create-flow UI. Cheap approach: keep `<noc-activity-connector-table>` as-is, wrap it in a tiny graph-local dialog host.

- Added `EditActivityConnectorDialogComponent` under `src/app/main/apps/noctua-graph/dialogs/edit-activity-connector-dialog/` — just hosts `<noc-activity-connector-table [cam]="cam" [closeDialog]="closeDialog">`. Reuses the `noc-activity-create-dialog` panel class (same 900px × 90% shape).
- `cam-graph.service.ts`: `openConnector` now opens the dialog via injected `MatDialog` with `{ cam: self.cam }` as data, instead of `selectRightPanel(RightPanel.activityConnectorTable)` + `openRightDrawer()`.
- `activity-connector-table.component.ts`: `save()` and `deleteConnectorEdge()` now call `closeDialog()` after their promise resolves (matching the create form's pattern). Removed the stale `editActivity()` method (never wired up, wrong confirm-dialog text).
- `noctua-graph.component.html`: dropped the `@case (RightPanel.activityConnectorTable)` block — nothing opens that drawer anymore.
- `menu-panels.ts`: removed the orphaned `activityConnectorTable = 'activityConnectorTable'` enum entry.
- Registered `EditActivityConnectorDialogComponent` in `noctua-graph.module.ts` declarations.

Type-check clean. Left to verify manually: clicking an existing edge opens the dialog (not the drawer), regulation → pick options → Save dismisses dialog, Delete dismisses dialog, creation flow via stencil still hits the original create dialog.
