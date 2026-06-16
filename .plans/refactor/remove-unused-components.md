# Task: Remove Unused Components from noctua-form Module

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Identify and safely remove unused components from the noctua-form module to reduce code bloat.

## Summary

Identified and removed 4 unused components (12 files deleted) from the noctua-form module after thorough codebase analysis. Build completed successfully with no errors.

## What Was Done

- Analyzed all 22 standalone components imported by `noctua-form.module.ts` for actual usage
- Identified 3 unused components and 1 duplicate component
- Removed `SelectEvidenceComponent` (non-dialog version, replaced by `SelectEvidenceDialogComponent`)
- Removed `NoctuaTermDetailComponent` (no template usage found anywhere)
- Removed `BeforeSaveDialogComponent` (dialog service method existed but was never called)
- Removed duplicate `CopyModelComponent` at `cam/copy-model/` (active version is in `components/copy-model/`)
- Updated module imports/exports, dialog service, and barrel exports
- Verified build completes successfully

## Files Modified

**Files deleted (12):**

- `src/app/main/apps/noctua-form/components/select-evidence/` (3 files)
- `src/app/main/apps/noctua-form/components/term-detail/` (3 files)
- `src/app/main/apps/noctua-form/dialogs/before-save/` (3 files)
- `src/app/main/apps/noctua-form/cam/copy-model/` (3 files - duplicate)

**Files updated (3):**

- `src/app/main/apps/noctua-form/noctua-form.module.ts` - Removed imports/exports
- `src/app/main/apps/noctua-form/services/dialog.service.ts` - Removed `openBeforeSaveDialog` method
- `src/app/main/apps/noctua-form/index.ts` - Removed barrel export

## Key Decisions

- Kept the `SelectEvidenceDialogComponent` (dialog version) since it is the actively used implementation
- Kept the `CopyModelComponent` in `components/copy-model/` as the canonical version
- Removed the dialog service method for `BeforeSaveDialog` since it was dead code
