# Task: Convert CAM Form and Copy Model from Left Drawer Panels to Dialogs

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Convert the CAM Form and Copy Model components from left slide panels to Material dialogs to improve UX and modernize the UI architecture.

## Summary

Created new dialog wrapper components for CAM Form and Copy Model, registered them as lazy-loaded dialogs in the dialog service, updated the toolbar to open dialogs instead of drawer panels, and cleaned up the LeftPanel enum and graph template to remove the now-unused panel entries.

## What Was Done

- Created CAM Form dialog component (`cam-form-dialog/`) as a standalone dialog with MatDialogRef and MAT_DIALOG_DATA injection
- Created Copy Model dialog component (`copy-model-dialog/`) following the same pattern
- Added `openCamFormDialog()` and `openCopyModelDialog()` methods to NoctuaFormDialogService with lazy loading via dynamic imports
- Added dialog styles (800px width, 90vh max-height) to `noctua.scss`
- Updated cam-toolbar to inject NoctuaFormDialogService and call dialog methods instead of drawer open/close logic
- Removed `camForm` and `copyModel` cases from the left drawer template in noctua-graph.component.html
- Removed `camForm` and `copyModel` from the LeftPanel enum (only `activityForm` remains)
- Removed `openCamForm()` and `openCopyModel()` methods from noctua-graph.component.ts (now handled by toolbar)

## Files Modified

| File | Action |
| ---- | ------ |
| `src/app/main/apps/noctua-form/dialogs/cam-form-dialog/cam-form-dialog.component.ts` | Created |
| `src/app/main/apps/noctua-form/dialogs/cam-form-dialog/cam-form-dialog.component.html` | Created |
| `src/app/main/apps/noctua-form/dialogs/cam-form-dialog/cam-form-dialog.component.scss` | Created |
| `src/app/main/apps/noctua-form/dialogs/copy-model-dialog/copy-model-dialog.component.ts` | Created |
| `src/app/main/apps/noctua-form/dialogs/copy-model-dialog/copy-model-dialog.component.html` | Created |
| `src/app/main/apps/noctua-form/dialogs/copy-model-dialog/copy-model-dialog.component.scss` | Created |
| `src/app/main/apps/noctua-form/services/dialog.service.ts` | Modified |
| `src/@noctua/scss/noctua.scss` | Modified |
| `src/app/main/apps/noctua-form/cam/cam-toolbar/cam-toolbar.component.ts` | Modified |
| `src/app/main/apps/noctua-graph/noctua-graph.component.html` | Modified |
| `src/app/main/apps/noctua-graph/noctua-graph.component.ts` | Modified |
| `src/@noctua.common/models/menu-panels.ts` | Modified |

## Key Decisions

- **Dialog over Drawer**: Dialogs provide better focus and modal behavior for form editing
- **Lazy Loading**: Followed existing dialog service pattern with dynamic imports for performance
- **800px Width**: Provides significantly more editing space than the previous 350px drawer
- **Activity Form stays as panel**: Only CAM Form and Copy Model were converted; activity form remains in the left drawer as it was not requested for conversion
- **Preserved all functionality**: Save, copy, validation, and reactive subscriptions maintained as-is

## Notes

- Both components were already standalone, which made the conversion straightforward
- Dialog styling reuses existing drawer style classes (noc-drawer-header, noc-drawer-body, noc-drawer-footer)
- The toolbar already injected the dialog service, so changes there were minimal
