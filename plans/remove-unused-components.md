# Task: Remove Unused Components from noctua-form Module

## Goal
Identify and safely remove unused components from the noctua-form module to reduce code bloat.

## Current State Analysis

The noctua-form module (`src/app/main/apps/noctua-form/noctua-form.module.ts`) imports 22 standalone components. After thorough analysis, **3 components are unused**:

### Unused Components

| Component | Location | Reason Unused |
|-----------|----------|---------------|
| `SelectEvidenceComponent` | `components/select-evidence/` | Non-dialog version - the dialog version (`SelectEvidenceDialogComponent`) is used instead |
| `NoctuaTermDetailComponent` | `components/term-detail/` | No template usage found anywhere in codebase |
| `BeforeSaveDialogComponent` | `dialogs/before-save/` | Dialog service method exists but is never called by any component |

### Additional Finding
- **Duplicate CopyModelComponent** exists at `cam/copy-model/` - the one in `components/copy-model/` is the active one

## Implementation Plan

### Phase 1: Verify Unused Status
- [x] Double-check SelectEvidenceComponent usage
- [x] Double-check NoctuaTermDetailComponent usage
- [x] Double-check BeforeSaveDialogComponent usage
- [x] Confirm duplicate CopyModelComponent status

### Phase 2: Remove Components
- [x] Remove SelectEvidenceComponent and its files
- [x] Remove NoctuaTermDetailComponent and its files
- [x] Remove BeforeSaveDialogComponent and its files
- [x] Remove duplicate CopyModelComponent (cam/copy-model/)
- [x] Update noctua-form.module.ts imports/exports
- [x] Remove dialog service method for BeforeSaveDialog

### Phase 3: Verify Build
- [x] Run `npm run build` to ensure no broken imports
- [ ] Run `npm run lint` to check for issues (skipped - not required)

## Files to Delete

```
src/app/main/apps/noctua-form/components/select-evidence/
  - select-evidence.component.ts
  - select-evidence.component.html
  - select-evidence.component.scss

src/app/main/apps/noctua-form/components/term-detail/
  - term-detail.component.ts
  - term-detail.component.html
  - term-detail.component.scss

src/app/main/apps/noctua-form/dialogs/before-save/
  - before-save.component.ts
  - before-save.component.html
  - before-save.component.scss

src/app/main/apps/noctua-form/cam/copy-model/  (duplicate)
  - copy-model.component.ts
  - copy-model.component.html
  - copy-model.component.scss
```

## Files to Modify

1. `src/app/main/apps/noctua-form/noctua-form.module.ts` - Remove imports/exports
2. `src/app/main/apps/noctua-form/services/dialog.service.ts` - Remove `openBeforeSaveDialog` method

## Current Status
**Phase**: COMPLETED ✓

## Summary
All unused components have been successfully removed:

### Files Deleted
- `src/app/main/apps/noctua-form/components/select-evidence/` (3 files)
- `src/app/main/apps/noctua-form/components/term-detail/` (3 files)
- `src/app/main/apps/noctua-form/dialogs/before-save/` (3 files)
- `src/app/main/apps/noctua-form/cam/copy-model/` (3 files - duplicate)

### Files Modified
- `src/app/main/apps/noctua-form/noctua-form.module.ts` - Removed imports/exports
- `src/app/main/apps/noctua-form/services/dialog.service.ts` - Removed `openBeforeSaveDialog` method
- `src/app/main/apps/noctua-form/index.ts` - Removed barrel export

### Build Verification
Build completed successfully with no errors related to the removed components.
