# Task: SCSS @import to @use Migration

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Eliminate all Sass `@import` deprecation warnings by migrating to the modern `@use` and `@forward` syntax, preparing for Dart Sass 3.0.0 which will remove `@import` support.

## Summary

Migrated all SCSS files from `@import` to `@use`/`@forward` syntax across the entire codebase. This included 34 component SCSS files, all core SCSS partials, and entry point files. Build succeeds with zero SCSS `@import` deprecation warnings.

## What Was Done

- **Phase 1 (Foundation):** Created `mixins/_index.scss` and `mixins/_noctua-mixins.scss`, updated `noctua.scss` with `@forward` to re-export variables and mixins
- **Phase 2 (Partials):** Updated all partials (`_material.scss`, `_colors.scss`, `_buttons.scss`, `_forms.scss`, `_typography.scss`, `_cards.scss`, `_scrollbars.scss`, `_alert.scss`, `_angular-material-fix.scss`, plugins) with `@use` statements for their dependencies
- **Phase 3 (Entry Points):** Updated `core.scss` and `styles.scss` with `@use`, fixed `@use` rule ordering issues
- **Phase 4 (Components):** Updated 34 component SCSS files from `@import` to `@use` across noctua-graph (4), noctua-form dialogs (7), noctua-form cam (11), layout/app (3), @noctua components (1), @noctua.editor (5), and root styles (1)
- **Phase 5 (Testing):** Build succeeds with zero SCSS `@import` deprecation warnings

## Files Modified

**New files created (2):**

- `src/@noctua/scss/mixins/_index.scss`
- `src/@noctua/scss/mixins/_noctua-mixins.scss`

**Core SCSS updated (10+):**

- `theming.scss`, `noctua.scss`, `core.scss`
- All partials: `_material.scss`, `_colors.scss`, `_buttons.scss`, `_forms.scss`, `_typography.scss`, `_cards.scss`, `_scrollbars.scss`, `_alert.scss`, `_angular-material-fix.scss`
- `plugins/_plugins.scss`

**Component SCSS updated (34 files):**

- All component `.scss` files that previously used `@import "@noctua/scss/noctua"` were updated to `@use`

**Root styles:**
- `src/styles.scss`

## Key Decisions

- Used `@use` with namespace wildcard (`as *`) sparingly to minimize changes in component files
- Used `@forward` in index files for clean re-exporting
- Variables and mixins properly scoped with namespacing where needed
- Maintained `@use` rule ordering (must come before any other rules)

## Lessons Learned

- `@use` loads files only once (cached), which is actually an improvement over `@import` behavior
- Variable scoping with `@use` requires all usages to be updated with proper namespaces
- `@use` does not allow circular imports - no circular dependencies were found in this codebase
- Build time may improve slightly due to `@use` caching
