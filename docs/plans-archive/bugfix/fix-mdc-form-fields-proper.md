# Task: Fix MDC Form Fields - Proper CSS Custom Properties Approach

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Fix input/form field styling by using Angular Material MDC's CSS custom properties system instead of targeting internal class names. The previous approach (fix-mdc-inputs-autocomplete) only renamed CSS selectors from legacy to MDC class names, which is fragile and doesn't work reliably because MDC components use CSS custom properties for theming.

## Summary

Created a dedicated MDC form field theme file using CSS custom properties for outlined text fields, selects, options, and autocomplete. Removed old class-based overrides from multiple SCSS files. Build confirmed successful with ~400KB CSS size reduction from the cleanup.

## What Was Done

- Created `_mdc-form-field-theme.scss` with all MDC CSS custom properties for outlined text fields, form field containers, selects, options, and autocomplete
- Added small (`.noc-sm`) and extra-small (`.noc-xs`) form field size variants using CSS custom properties
- Hidden form field subscript wrappers globally (Noctua doesn't show inline hints/errors)
- Updated `noctua.scss` to import the new theme file and removed old class-based overrides
- Cleaned up `_angular-material-fix.scss` to remove redundant form field/select overrides
- Removed form field color overrides from `_colors.scss` (now handled by CSS custom properties)
- Updated autocomplete panel styling in `_material.scss` to use CSS custom properties

## Files Modified

| File | Action |
| ---- | ------ |
| `src/@noctua/scss/partials/_mdc-form-field-theme.scss` | Created -- MDC CSS custom properties theme |
| `src/@noctua/scss/noctua.scss` | Added import, removed old overrides |
| `src/@noctua/scss/partials/_angular-material-fix.scss` | Cleaned up form field/select overrides |
| `src/@noctua/scss/partials/_material.scss` | Updated autocomplete with CSS custom properties |
| `src/@noctua/scss/partials/_colors.scss` | Removed form field color overrides |

## Key Decisions

- **CSS custom properties over class targeting**: MDC components use `--mdc-*` and `--mat-*` CSS variables for theming; targeting internal class names is fragile and breaks with Angular Material updates
- **Global `:root` selector**: Ensures theme properties are available everywhere; class-specific overrides (`.noc-sm`) can locally override root values
- **Hidden subscript by default**: Noctua doesn't use inline form hints/errors, so the subscript wrapper is hidden globally
- **Autocomplete background**: Set to `#fbf9de` (Noctua light yellow) via `--mat-autocomplete-background-color`
- **Primary color**: `#3b5998` (Noctua blue) used for focus states, caret, and selected options

## Notes

- CSS custom properties are the official way to theme MDC components and are future-proof
- No template changes were required (Angular migration CLI handled class name updates in HTML)
- MDC uses BEM naming convention (block__element--modifier)
- Build produced ~400KB smaller CSS output after removing redundant overrides
