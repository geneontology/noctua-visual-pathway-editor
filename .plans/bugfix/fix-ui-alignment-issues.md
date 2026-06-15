# Task: Fix UI Alignment Issues - Activity Forms & Dialogs

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Fix two specific UI issues:
1. Activity form has horizontal scrolling (should fit without scrolling)
2. Dialog widths are not working correctly

## Summary

Fixed activity form horizontal overflow by adding `min-w-0` to flex children in entity-form, which prevents flex items from exceeding their container. Fixed dialog widths by adding `max-width: 100%` and `max-height: 100%` to `.mat-mdc-dialog-surface` so MDC dialog containers properly respect the width set on their panel class.

## What Was Done

- Diagnosed horizontal scrolling caused by `flex-1` and `basis-[65%]` without shrink constraints, combined with padding causing total width to exceed container
- Added `min-w-0` to flex children in `entity-form.component.html` to allow proper shrinking
- Added `overflow-hidden` to the main container
- Added `max-width: 100%` and `max-height: 100%` to `.mat-mdc-dialog-surface` in `_angular-material-fix.scss`

## Files Modified

| File | Action |
| ---- | ------ |
| `src/app/main/apps/noctua-form/cam/activity/activity-form/entity-form/entity-form.component.html` | Added `min-w-0` and `overflow-hidden` to flex layout |
| `src/@noctua/scss/partials/_angular-material-fix.scss` | Added `max-width`/`max-height` to `.mat-mdc-dialog-surface` |

## Key Decisions

- **Used `min-w-0` over `overflow-x-hidden`**: The `min-w-0` approach fixes the root cause (flex items not shrinking below content size) rather than hiding overflow symptoms
- **Applied fix at `.mat-mdc-dialog-surface` level**: MDC dialogs have a new container structure; the surface element needed explicit max-width/max-height to respect the panel class dimensions

## Notes

- In CSS flexbox, flex items have an implicit `min-width: auto` which prevents them from shrinking below their content size; `min-w-0` overrides this
- The `deep-width` mixin on dialog panel classes (e.g., `.noc-search-database-dialog`) was correct; the issue was the MDC surface element inside not inheriting the constraint
