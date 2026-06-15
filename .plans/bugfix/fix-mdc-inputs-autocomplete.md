# Task: Fix MDC Migration Issues - Inputs, Selects, and Autocomplete

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Fix styling and functionality issues after migrating Angular Material form components (form-field, autocomplete, input, option, optgroup, select) from legacy to MDC versions.

## Summary

Updated all SCSS files that still targeted legacy Angular Material internal class names to use MDC equivalents. Fixed form field wrappers, underlines, select triggers, autocomplete panels, disabled options, and color mixins across 4 SCSS files. This was later superseded by the CSS custom properties approach in fix-mdc-form-fields-proper.md.

## What Was Done

- Updated form field wrapper from `.mat-form-field-wrapper` to `.mat-mdc-text-field-wrapper`
- Updated underline from `.mat-form-field-underline` to `.mdc-line-ripple`
- Updated `.noc-sm` form field sizing for MDC structure (using `.mat-mdc-form-field-infix`)
- Hidden `.mat-mdc-form-field-subscript-wrapper` (equivalent to old `padding-bottom: 0`)
- Updated select trigger classes to MDC equivalents (`.mat-mdc-select-trigger`, `.mat-mdc-select-value`, `.mat-mdc-select-arrow-wrapper`)
- Updated autocomplete panel from `.mat-autocomplete-panel` to `.mat-mdc-autocomplete-panel`
- Added CDK overlay backdrop styling for autocomplete
- Updated form field and select color classes in `_colors.scss` to target MDC classes (`.mdc-floating-label`, `.mdc-line-ripple`, `.mat-mdc-select-*`)
- Updated disabled option from `.mat-option-disabled` to `.mat-mdc-option-disabled`

## Files Modified

| File | Action |
| ---- | ------ |
| `src/@noctua/scss/noctua.scss` | Updated form field wrapper and sizing to MDC classes |
| `src/@noctua/scss/partials/_angular-material-fix.scss` | Fixed all legacy internal class names to MDC equivalents |
| `src/@noctua/scss/partials/_material.scss` | Updated autocomplete panel class, added backdrop, fixed disabled options |
| `src/@noctua/scss/partials/_colors.scss` | Updated form field and select color classes to MDC |

## Key Decisions

- **Renamed classes rather than restructured**: This was a first-pass fix that updated class names to MDC equivalents; the proper CSS custom properties approach was done separately in fix-mdc-form-fields-proper.md
- **Added both `.mat-mdc-option-disabled` and `[disabled]`** selectors for disabled options to ensure coverage
- **All changes were SCSS-only**: No template changes required since Angular migration CLI handled HTML class updates

## Notes

- This plan was superseded by fix-mdc-form-fields-proper.md, which replaced class-based targeting with MDC CSS custom properties
- MDC uses BEM naming convention (block__element--modifier)
- Some legacy classes may still work but should be updated for future compatibility
