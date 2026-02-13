# Task: Migrate to Tailwind CSS

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Replace the legacy SCSS architecture and deprecated @angular/flex-layout with Tailwind CSS utility classes, simplifying styling, reducing custom code, and adopting a maintainable utility-first approach.

## Summary

Completed a full three-phase migration from a complex SCSS-based styling system to Tailwind CSS. Phase 1 established the Tailwind infrastructure by replacing the old `src/@noctua/scss/` architecture with a new `src/@noctua/styles/` directory using CSS Custom Properties and comprehensive Material overrides. Phase 2 removed the deprecated @angular/flex-layout library (513+ directive replacements across 35 files), deleted 6 redundant SCSS partials, and converted 97 custom utility class usages to Tailwind equivalents. Phase 3 migrated component-level SCSS into Tailwind utility classes in HTML templates across 46 component files, removing significant dead code discovered through ViewEncapsulation analysis.

## Phases

### Phase 1: Tailwind Infrastructure Setup

Replaced the old SCSS architecture (10+ partials, ~1,400 lines, complex mixin system) with a new Tailwind-based setup adapted from a demo project. Created `src/@noctua/styles/` with tailwind.scss, themes.scss, main.scss, and Material overrides. Updated `tailwind.config.js` with Noctua-specific colors (noc-primary, MF/BP/CC aspect colors), Material-aligned breakpoints, and custom plugins. Updated `angular.json` styles array and `src/styles.scss` entry point. Removed the old `src/@noctua/scss/` directory after confirming the new setup worked. Simplified the theming approach to a single Noctua color theme rather than the demo's multi-theme system.

### Phase 2: Remove flex-layout & SCSS Cleanup

Removed the deprecated @angular/flex-layout library entirely. Converted 513+ fxLayout/fxFlex/fxLayoutAlign/fxLayoutGap directives to Tailwind flex/grid utilities across all 35 HTML template files (two batches: 22 files then 13 files). Removed FlexLayoutModule from all 34 component imports and standalone-imports.ts. Replaced NoctuaMatchMediaService with a vanilla JS window.matchMedia implementation. Deleted 6 redundant SCSS partials (helpers, reset, normalize, global, borders, icons). Converted 84 px-based spacing classes, 10 border classes, and 3 icon sizing classes to Tailwind equivalents. Cleaned up dead fxLayout selectors from angular-material-fix and mdc-form-field-theme partials. Removed ~210 lines of unused utilities from the typography partial. Fixed a post-migration bug where the graph page stopped displaying (JointJS requires explicit height/position on container elements).

### Phase 3: Migrate Component SCSS to Tailwind Templates

Migrated styles from 46 component SCSS files into Tailwind utility classes in HTML templates across 9 sub-phases: plugin setup, pilot migration, dialogs, CAM components, other noctua-form components, noctua-graph components, editor module, layout/core components, and core SCSS cleanup. Added `deep-w-*` and `deep-h-*` Tailwind plugins to replace SCSS mixins. Discovered and removed significant dead code through ViewEncapsulation analysis (e.g., activity-table.component.scss went from 376 to 8 lines, layout-noctua.component.scss from 69 to 2 lines). Kept SCSS only for Material overrides, theme-based colors, pseudo-elements, complex nested selectors, and third-party plugin overrides.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Single Noctua theme (not multi-theme) | Only one color theme needed; matches existing branding |
| `important: true` in Tailwind config | Required to override Material's default styles |
| Material-aligned breakpoints (600/960/1280/1440px) | Match Angular Material's responsive behavior |
| Keep Roboto font (not Inter from demo) | Roboto is Material Design standard, already in use |
| `--noctua-*` CSS variable prefix | Consistency with Noctua branding |
| Keep SCSS for theme-based colors, pseudo-elements, Material overrides | Tailwind cannot express these patterns |
| `deep-w-*`/`deep-h-*` as Tailwind plugins | Replaces SCSS mixins, usable directly in templates |
| Vanilla JS for matchMedia | Replaces @angular/flex-layout's media observer without new dependencies |

## Migration Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| @angular/flex-layout | Installed | Removed | Eliminated |
| fxLayout directives | 513+ | 0 | -100% |
| SCSS partials (deleted) | 18 | 12 | -6 files |
| Custom spacing classes | 84 | 0 | Converted to Tailwind |
| Custom border classes | 10 | 0 | Converted to Tailwind |
| Custom icon classes | 3 | 0 | Converted to Tailwind |
| Component SCSS files migrated | 0 | 46 | All components done |
| Total SCSS lines | ~3,500+ | ~1,800 | ~-49% |
| CSS bundle size | 750.81 kB | 748.46 kB | -2.35 kB |
| HTML files converted | 0 | 35 | All templates done |

Notable individual file reductions:

- activity-table.component.scss: 376 to 8 lines (-97%)
- layout-noctua.component.scss: 69 to 2 lines (-97%)
- activity-form-table.component.scss: 269 to 49 lines (-82%)
- noctua-graph.component.scss: 271 to 62 lines (-77%)
- toolbar.component.scss: 242 to 75 lines (-69%)

## Lessons Learned

1. **ViewEncapsulation reveals dead code**: Many SCSS files contained styles for classes not present in the component's own template. Scoped styles (the Angular default) only apply to elements within that component, making these styles dead code.
2. **Copy-paste SCSS across components**: Editor dropdown components shared copy-pasted `.noc-edit-field` and `.noc-article-*` styles that were only used in some files.
3. **JointJS needs explicit dimensions**: After removing fxLayout, the graph page broke because JointJS requires explicit `height: 100%` and `position: relative` on container elements.
4. **Material chip/tree styling stays in SCSS**: Dynamic coloring via `noc-chip-color` mixin and tree visualization pseudo-elements cannot be expressed in Tailwind.
5. **CSS bundle size barely changed**: Moving styles from SCSS to Tailwind utility classes in templates doesn't significantly change bundle size since Tailwind generates similar CSS. The real win is maintainability and dead code removal.

## Notes

- Components using `ViewEncapsulation.None` (app.component, layout-noctua) provide global styles and were handled carefully during migration.
- The `noctua.common.scss` file was kept as-is since all classes are actively used across 18+ files.
- `_buttons.scss` was kept because `.noc-rounded-button` is used in 22 files.
- Theme-aware Material color classes (`secondary-text`, etc.) remain in SCSS as they depend on Material theme variables.
- Future optional work: further consolidate Material overrides, create Tailwind components for repeated patterns, continue removing dead SCSS as components are refactored.

## Progress Log

| Date | Phase | Notes |
|------|-------|-------|
| 2026-02-03 | Phase 1-2 | Tailwind infrastructure setup, config expanded, build verified |
| 2026-02-03 | Phase 2 | Converted 22 of 35 files (378 of 513 fxLayout directives) |
| 2026-02-04 | Phase 2 | Completed remaining 13 files, removed @angular/flex-layout entirely |
| 2026-02-04 | Phase 2 | SCSS cleanup: deleted 6 files, converted 97 utility classes |
| 2026-02-04 | Phase 2 | Simplified angular-material-fix, typography, and mdc-form-field-theme partials |
| 2026-02-05+ | Phase 3 | Component SCSS migration across 9 sub-phases, all 46 files complete |
