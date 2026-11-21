# Task: Fix MDC Button Sizing After Angular Material Migration

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Fix button sizing issues after migrating from Angular Material legacy components to MDC components. Buttons became too large after the migration (MDC icon buttons are 48x48px vs legacy 40x40px). Also replace all `mat-icon` usage with Font Awesome icons, since mat-icon components were not rendering properly after MDC migration.

## Summary

Reset MDC icon button sizes to match legacy dimensions using CSS custom properties. Replaced all 94 `mat-icon` occurrences across 33 HTML files with Font Awesome `fa-icon` equivalents. Added comprehensive CSS rules for Font Awesome icon alignment in buttons, handling edge cases with Angular `@if` blocks and custom button classes.

## What Was Done

- Added MDC button size overrides using `--mdc-icon-button-state-layer-size` and `--mdc-icon-button-icon-size` custom properties
- Reset default icon buttons to 40x40px (matching legacy), small buttons to 20x20px, toolbar buttons to 30x30px
- Consolidated duplicate `.mat-mdc-icon-button` blocks in SCSS
- Replaced `mat-icon` with `fa-icon` in 33 HTML component files (94 occurrences)
- Created icon mapping from Material icons to Font Awesome equivalents (close, edit, delete, add, etc.)
- Added FontAwesomeModule import to 2 module files that lacked it
- Registered 9 new Font Awesome icons in `app.module.ts` library
- Fixed `times-circle` icon prefix from `fas` to `far`
- Added CSS rules for Font Awesome icon alignment in mat-icon-buttons, small buttons, material buttons, and action buttons
- Fixed issues with Angular `@if` blocks breaking CSS `:first-child`/`:last-child` selectors by using inline-flex and explicit margins
- Fixed `.noc-rounded-button` line-height conflicts with flex layouts

## Files Modified

| File | Action |
|------|--------|
| `src/@noctua/scss/partials/_angular-material-fix.scss` | Added MDC button size overrides and Font Awesome alignment CSS (~90 lines) |
| 33 HTML component files | Replaced `mat-icon` with `fa-icon` |
| `src/@noctua/components/confirm-dialog/confirm-dialog.module.ts` | Added FontAwesomeModule import |
| `src/@noctua/components/material-color-picker/material-color-picker.module.ts` | Added FontAwesomeModule import |
| `src/app/app.module.ts` | Registered Font Awesome icons in library |

## Key Decisions

- **Used MDC CSS custom properties** (`--mdc-*`) for button sizing because direct `height`/`width` rules are overridden by internal MDC styles
- **Replaced mat-icon with Font Awesome** rather than debugging mat-icon rendering, since Font Awesome was already partially used in the codebase
- **Button size targets**: Default 40px (legacy match), Small 20px (inline editor triggers), Toolbar 30px (per existing noctua.common.scss specs)
- **Used inline-flex + explicit margins** for action buttons to work around Angular `@if` comment nodes breaking CSS pseudo-selectors

## Lessons Learned

- MDC migration changes default button sizes significantly
- MDC uses CSS custom properties for sizing -- must override using `--mdc-*` variables, not direct height/width
- Existing `deep-height()`/`deep-width()` mixins don't apply to MDC button internals
- Angular `@if` blocks create DOM comment nodes that break `:first-child`/`:last-child` CSS selectors
- Custom button classes (`.noc-rounded-button`) with fixed `line-height` conflict with flex layouts and need `!important` overrides
