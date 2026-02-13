# Task: Convert CAM Form and Copy Model from Left Drawer Panels to Dialogs

## Goal
Convert the CAM Form and Copy Model components from left slide panels to Material dialogs to improve UX and modernize the UI architecture.

## Current State

### What Currently Works
- **CAM Form Panel**: Opens in left drawer (350px wide) when "Model Details" is clicked
  - Displays model information (title, state, group)
  - Allows editing model comments
  - Shows model contributors and groups
  - Has Save button in footer
  - Located at: [cam-form.component.ts](src/app/main/apps/noctua-form/cam/cam-form/cam-form.component.ts)

- **Copy Model Panel**: Opens in left drawer when "Copy Model" is clicked
  - Shows current model information
  - Has "Include Evidence" checkbox
  - Displays duplicated model information after copy
  - Opens a confirmation dialog (ConfirmCopyModelDialog) before copying
  - Located at: [copy-model.component.ts](src/app/main/apps/noctua-form/components/copy-model/copy-model.component.ts)

### Current Architecture
- **Panel Management**: [NoctuaCommonMenuService](src/@noctua.common/services/noctua-common-menu.service.ts)
  - Controls left/right drawer state
  - Tracks selected panel via `LeftPanel` enum
  - Methods: `selectLeftPanel()`, `openLeftDrawer()`, `closeLeftDrawer()`, `toggleLeftDrawer()`

- **Panel Enum**: [menu-panels.ts](src/@noctua.common/models/menu-panels.ts)
  ```typescript
  enum LeftPanel {
    camForm = 'camForm',
    copyModel = 'copyModel',
    activityForm = 'activityForm'
  }
  ```

- **Panel Rendering**: [noctua-graph.component.html](src/app/main/apps/noctua-graph/noctua-graph.component.html)
  - Lines 12-25: Left drawer with switch statement for panels
  - Currently renders `<noc-cam-form>` and `<noc-copy-model>` based on `selectedLeftPanel`

- **Triggers**: [cam-toolbar.component.ts](src/app/main/apps/noctua-form/cam/cam-toolbar/cam-toolbar.component.ts)
  - `openCamForm()` (lines 84-89): Initializes form, selects panel, opens drawer
  - `openCopyModel()` (lines 91-95): Selects panel, opens drawer

### What Needs to Change
- Remove panel-based architecture for these two components
- Convert to lazy-loaded dialogs like other dialogs in the app
- Update toolbar triggers to open dialogs instead of panels
- Remove `panelDrawer` input from both components
- Keep `activityForm` in the left panel (not converting)
- Clean up unused LeftPanel enum values

## Implementation Plan

### Phase 1: Create CAM Form Dialog ✓
- [x] Create dialog wrapper component at `src/app/main/apps/noctua-form/dialogs/cam-form-dialog/`
- [x] Convert standalone component to dialog format
- [x] Add dialog-specific styling (based on drawer styles)
- [x] Update close() method to use MatDialogRef
- [x] Remove panelDrawer Input and dependency
- [x] Add MAT_DIALOG_DATA injection for cam data if needed

### Phase 2: Create Copy Model Dialog ✓
- [x] Create dialog wrapper component at `src/app/main/apps/noctua-form/dialogs/copy-model-dialog/`
- [x] Convert standalone component to dialog format
- [x] Add dialog-specific styling
- [x] Update close() method to use MatDialogRef
- [x] Remove panelDrawer Input and dependency
- [x] Remove panel selection logic from close() (line 109)

### Phase 3: Update Dialog Service ✓
- [x] Add `openCamFormDialog()` method to [NoctuaFormDialogService](src/app/main/apps/noctua-form/services/dialog.service.ts)
  - Lazy load CAM Form Dialog
  - Set panelClass to `noc-cam-form-dialog`
  - Set appropriate width (suggest 600px-800px)
- [x] Add `openCopyModelDialog()` method to NoctuaFormDialogService
  - Lazy load Copy Model Dialog
  - Set panelClass to `noc-copy-model-dialog`
  - Set appropriate width (suggest 600px-800px)

### Phase 4: Update Dialog Styles ✓
- [x] Add dialog styles to [noctua.scss](src/@noctua/scss/noctua.scss)
  ```scss
  .noc-cam-form-dialog {
    width: 800px;
    max-height: 90vh;
  }
  .noc-copy-model-dialog {
    width: 800px;
    max-height: 90vh;
  }
  ```

### Phase 5: Update Toolbar Component ✓
- [x] Modify [cam-toolbar.component.ts](src/app/main/apps/noctua-form/cam/cam-toolbar/cam-toolbar.component.ts)
- [x] Inject NoctuaFormDialogService
- [x] Update `openCamForm()` method:
  - Remove drawer open/close logic
  - Call `noctuaFormDialogService.openCamFormDialog()`
  - Keep `camService.initializeForm(this.cam)` call
- [x] Update `openCopyModel()` method:
  - Remove drawer open/close logic
  - Call `noctuaFormDialogService.openCopyModelDialog()`

### Phase 6: Remove Panel References ✓
- [x] Update [noctua-graph.component.html](src/app/main/apps/noctua-graph/noctua-graph.component.html)
  - Remove `LeftPanel.camForm` case (lines 15-18)
  - Remove `LeftPanel.copyModel` case (lines 19-22)
  - Keep only activityForm in left drawer
- [x] Update [LeftPanel enum](src/@noctua.common/models/menu-panels.ts)
  - Remove `camForm` and `copyModel` values
  - Keep only `activityForm`
- [x] Clean up any other references to these panel types
  - Removed openCamForm() and openCopyModel() methods from noctua-graph.component.ts
  - These are now handled by toolbar component

### Phase 7: Testing & Cleanup ✓
- [x] Verified TypeScript compilation (no errors from our changes)
- [x] Checked linting (no new errors introduced)
- [x] Confirmed old panel components still in module for backward compatibility
- [x] Left drawer template simplified to only show activity form placeholder
- [x] NoctuaFormModule kept in imports to provide toolbar component
- [x] All dialog infrastructure in place and ready to use

## Progress Summary

| Phase   | Status      | Progress |
| ------- | ----------- | -------- |
| Phase 1 | Complete    | 6/6      |
| Phase 2 | Complete    | 6/6      |
| Phase 3 | Complete    | 2/2      |
| Phase 4 | Complete    | 1/1      |
| Phase 5 | Complete    | 4/4      |
| Phase 6 | Complete    | 3/3      |
| Phase 7 | Complete    | 6/6      |

## Files to Create/Modify

| File                                                                           | Action | Status  |
| ------------------------------------------------------------------------------ | ------ | ------- |
| src/app/main/apps/noctua-form/dialogs/cam-form-dialog/                        | Create | ✓ Done  |
| src/app/main/apps/noctua-form/dialogs/cam-form-dialog/cam-form-dialog.component.ts    | Create | ✓ Done  |
| src/app/main/apps/noctua-form/dialogs/cam-form-dialog/cam-form-dialog.component.html  | Create | ✓ Done  |
| src/app/main/apps/noctua-form/dialogs/cam-form-dialog/cam-form-dialog.component.scss  | Create | ✓ Done  |
| src/app/main/apps/noctua-form/dialogs/copy-model-dialog/                      | Create | ✓ Done  |
| src/app/main/apps/noctua-form/dialogs/copy-model-dialog/copy-model-dialog.component.ts | Create | ✓ Done  |
| src/app/main/apps/noctua-form/dialogs/copy-model-dialog/copy-model-dialog.component.html | Create | ✓ Done  |
| src/app/main/apps/noctua-form/dialogs/copy-model-dialog/copy-model-dialog.component.scss | Create | ✓ Done  |
| src/app/main/apps/noctua-form/services/dialog.service.ts                      | Modify | ✓ Done  |
| src/@noctua/scss/noctua.scss                                                   | Modify | ✓ Done  |
| src/app/main/apps/noctua-form/cam/cam-toolbar/cam-toolbar.component.ts        | Modify | ✓ Done  |
| src/app/main/apps/noctua-graph/noctua-graph.component.html                     | Modify | ✓ Done  |
| src/app/main/apps/noctua-graph/noctua-graph.component.ts                      | Modify | ✓ Done  |
| src/@noctua.common/models/menu-panels.ts                                       | Modify | ✓ Done  |

## Dependencies
- [x] Angular Material Dialog module
- [x] Existing dialog service pattern
- [x] Original component implementations

## Blockers
- None currently

## API/Interface Changes

### New Dialog Methods
```typescript
// In NoctuaFormDialogService
async openCamFormDialog(cam: Cam): Promise<void>
async openCopyModelDialog(cam: Cam): Promise<void>
```

### Component Changes
```typescript
// CamFormComponent - Remove:
@Input() panelDrawer: MatDrawer;

// CamFormComponent - Add:
@Inject(MAT_DIALOG_DATA) public data: { cam: Cam }
private dialogRef: MatDialogRef<CamFormComponent>

// CopyModelComponent - Remove:
@Input() panelDrawer: MatDrawer;
@Input() panelSide: string;

// CopyModelComponent - Add:
@Inject(MAT_DIALOG_DATA) public data: { cam: Cam }
private dialogRef: MatDialogRef<CopyModelComponent>
```

### Enum Changes
```typescript
// Before:
enum LeftPanel {
  camForm = 'camForm',
  copyModel = 'copyModel',
  activityForm = 'activityForm'
}

// After:
enum LeftPanel {
  activityForm = 'activityForm'
}
```

## Design Decisions

1. **Dialog vs Drawer**: Dialogs provide better focus and modal behavior for form editing
2. **Lazy Loading**: Following existing pattern in dialog service for performance
3. **Width**: Using 800px to provide more space than the 350px drawer
4. **Keep Activity Form as Panel**: Activity form remains in left panel as it wasn't requested for conversion
5. **Preserve Functionality**: All existing functionality (save, copy, validation) maintained exactly as-is

## Next Steps
1. Create CAM Form dialog components
2. Create Copy Model dialog components
3. Update dialog service with new methods
4. Add dialog styles to noctua.scss
5. Update toolbar triggers
6. Remove panel references from template and enum
7. Test all functionality
8. Clean up unused code

## Notes
- Both components are already standalone, making conversion easier
- Dialog pattern is well-established in the codebase (lazy-loaded via dynamic imports)
- Panel close() methods need to switch from `panelDrawer.close()` to `dialogRef.close()`
- The toolbar already injects dialog service, so minimal changes needed there
- Must preserve all reactive subscriptions and form validation logic
- Dialog styling can reuse most of the existing drawer styles (noc-drawer-header, noc-drawer-body, noc-drawer-footer)
