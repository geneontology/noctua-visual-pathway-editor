# Task: Fix Dialog Structure and Button Styling

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

1. Fix dialog boxes to have proper header, footer, and scrollable content sections (based on old code patterns)
2. Fix dialog widths to match old code specifications
3. Fix icon buttons - icons are not well positioned inside buttons
4. Fix buttons that should be flex row but are wrapping

## Summary

Fixed dialog layout by adding flex column structure with fixed header/footer and scrollable body. Added icon button centering properties and button label nowrap rules to prevent layout issues. All dialog widths were verified correct; only structural flex properties were missing.

## What Was Done

- Added `overflow-y: auto` and `flex: 1` to `.noc-dialog-body` for scrollable content
- Added `flex-shrink: 0` to dialog header and footer to keep them fixed
- Added `.dialog-content-wrapper` styles
- Applied same flex pattern to `.noc-drawer` (header, body, footer)
- Verified all dialog widths in `noctua.scss` -- no changes needed
- Added `display: inline-flex`, `align-items: center`, `justify-content: center` to `.mat-mdc-icon-button`
- Added `.mat-icon` flex centering within icon buttons
- Added `flex-shrink: 0` to all button types to prevent shrinking in flex containers
- Added `white-space: nowrap` to `.mdc-button__label` to prevent text wrapping
- Reviewed dialog templates -- all use proper class structure
- Removed redundant Tailwind classes from templates that conflicted with CSS

## Files Modified

| File | Action |
|------|--------|
| `src/@noctua.common/scss/noctua.common.scss` | Added dialog/drawer flex structure |
| `src/@noctua/scss/partials/_angular-material-fix.scss` | Added icon button + nowrap fixes |
| `src/@noctua/scss/noctua.scss` | Verified dialog widths (no changes) |
| `activity-form.component.html` | Removed `pb-[200px]`, fixed footer |
| `activity-connector-form.component.html` | Removed `overflow-y-auto`, fixed footer |
| `chemical-connector-form.component.html` | Removed `overflow-y-auto`, fixed footer |

## Key Decisions

- Used the same flex pattern (fixed header/footer, scrollable body) for both dialogs and drawers
- Kept `mat-toolbar` as a valid alternative to `.noc-dialog-header` in some dialogs (e.g. select-evidence)
- Used `display: inline-flex` with centering on icon buttons rather than relying on MDC defaults

## Notes

- `.noc-drawer` has `display: flex; flex-direction: column; height: 100%`
- `.noc-drawer-header` and `.noc-drawer-footer` have `flex-shrink: 0`
- `.noc-drawer-body` has `flex: 1; overflow-y: auto`
- Same pattern applied to `.noc-dialog` structure
- Icon buttons now properly centered with `display: inline-flex; align-items: center; justify-content: center`
- Button labels have `white-space: nowrap` to prevent wrapping
