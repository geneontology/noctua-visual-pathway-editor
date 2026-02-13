# Task: Angular Material MDC Migration Style Updates

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Update and verify all custom styles after migrating from Angular Material legacy components to MDC (Material Design Components) versions. The migration covered 16 component types: card, checkbox, chips, dialog, list, menu, paginator, progress-bar, progress-spinner, radio, slide-toggle, slider, snack-bar, table, tabs, and tooltip.

## Summary

Resolved all 14 TODO comments left by the automated MDC migration tool across chips (3), tabs (4), radio buttons (4), buttons (2), and paginator (1). Also addressed form field outline visibility and icon button alignment issues that emerged after the Angular 16 to 20 version jump. The final approach for form fields was to strip `_mdc-form-field-theme.scss` to bare minimum and let Angular Material defaults work.

## What Was Done

- **Phases 1-5:** Resolved all 14 TODO comments by adding MDC selector equivalents alongside legacy selectors for chips, tabs, radio buttons, buttons, and paginator
- **Phase 6-7:** Visual testing and common issue identification
- **Phase 8:** Linter and dev server verification passed
- **Phase 11 (Form Fields):** Investigated and fixed text input outline and icon button alignment issues
  - Updated `_forms.scss` to exclude `.mat-mdc-input-element` from global resets
  - Stripped `_mdc-form-field-theme.scss` to bare minimum (focus colors, subscript hiding, autocomplete panel styling only)
  - Reverted several attempted fixes (Tailwind `@layer base` override, CSS custom properties, icon button alignment rules) that caused issues like double-notch borders

## Files Modified

**SCSS files (16):**

- `src/@noctua.common/scss/noctua.common.scss`
- `src/@noctua/scss/noctua.scss`
- `src/@noctua/scss/partials/_angular-material-fix.scss`
- `src/@noctua/scss/partials/_material.scss`
- `src/@noctua/scss/partials/_cards.scss`
- `src/@noctua/scss/partials/_forms.scss`
- `src/@noctua/scss/partials/_mdc-form-field-theme.scss`
- 5 component SCSS files (confirm-dialog, color-picker, progress-bar, app, entity-form)
- 4 component SCSS files (activity-form-table-node, activity-tree-table, cam-toolbar, select-evidence, activity-errors, cam-errors)

**Component/Module files (5):** Updated dialog and component references to use new MDC APIs

## Key Decisions

- **Dual selectors pattern:** Added `.mat-mdc-*` selectors alongside legacy `mat-*` element selectors for compatibility
- **Form field approach:** Stripped custom overrides to minimum rather than fighting Angular Material defaults - let the framework handle container sizing, outline rendering, etc.
- **Reverted over-engineering:** Removed Tailwind `@layer base` override, extensive CSS custom properties, and internal MDC class targeting that caused more problems than they solved
- **4 modules deferred:** Autocomplete, form-field, input, and select left on legacy versions for future migration

## Lessons Learned

- When upgrading across multiple major Angular Material versions (16 to 20), CSS custom property names change significantly - avoid hardcoding them
- Targeting internal MDC classes (`.mdc-*`) is fragile and should be avoided when possible
- Letting Angular Material defaults work is often better than adding custom overrides
- The `important: true` setting in Tailwind config can cause unexpected conflicts with Material components
