# Task: Migrate to Tailwind CSS & Clean Up SCSS

## Goal

- Adopt Tailwind CSS for utility-based styling
- Keep Angular Material only for complex components (buttons, autocomplete, dialogs, tables)
- Remove @angular/flex-layout (deprecated) - replace with Tailwind flexbox
- Clean up hacky Material fixes, keeping only necessary overrides
- Reduce custom SCSS significantly

---

## Current State Analysis

### What We Have

| Category | Count | Notes |
|----------|-------|-------|
| SCSS files | 28 | Many redundant with Tailwind |
| Flex-layout directives | 513+ | Spread across 35 HTML files |
| Custom utility classes | 100+ | Spacing, sizing, borders - all Tailwind replaceable |
| Material fixes | 238 lines | Mix of necessary and hacky |
| Tailwind | Installed | v3.4.4, minimal config |

### Files to REMOVE Completely

- `src/@noctua/scss/partials/_helpers.scss` - Custom spacing/sizing (Tailwind replaces)
- `src/@noctua/scss/partials/_reset.scss` - Tailwind has modern reset
- `src/@noctua/scss/partials/_normalize.scss` - Tailwind includes this
- `src/@noctua/scss/partials/_buttons.scss` - Use Tailwind + Material
- `src/@noctua/scss/partials/_borders.scss` - Tailwind has border utilities
- `src/@noctua/scss/partials/_icons.scss` - Tailwind sizing works

### Files to SIGNIFICANTLY REDUCE

- `src/@noctua/scss/partials/_angular-material-fix.scss` (238 → ~50 lines)
- `src/@noctua/scss/partials/_typography.scss` (373 → ~30 lines)
- `src/@noctua/scss/partials/_colors.scss` (192 → ~20 lines)
- `src/@noctua/scss/noctua.scss` (366 → ~100 lines)

### Files to KEEP (Necessary)

- `src/@noctua/scss/partials/_mdc-form-field-theme.scss` - MDC form fields need custom props
- `src/@noctua/scss/partials/_material.scss` - Menu panel, autocomplete theming
- `src/@noctua/scss/theming.scss` - Material theme palette
- `src/@noctua/scss/partials/_scrollbars.scss` - Perfect scrollbar overrides
- Plugin styles (ngx-datatable, ng-pick-datetime) - Third-party overrides

### Material Components to Keep

| Component | Reason |
|-----------|--------|
| mat-form-field / mat-input | Complex accessibility, validation states |
| mat-autocomplete | Complex dropdown positioning, keyboard nav |
| mat-button variants | Ripple effects, disabled states |
| mat-dialog | Overlay management, animations |
| mat-menu | Dropdown positioning, nested menus |
| mat-table | Virtual scrolling, sorting, pagination |
| mat-checkbox / mat-radio | Accessibility, form integration |
| mat-expansion-panel | Animation, accessibility |
| mat-tabs | Tab management, lazy loading |

---

## Implementation Plan

### Phase 1: Tailwind Configuration
**Status**: [ ] Not Started

#### 1.1 Configure tailwind.config.js

Key decisions:
- **`important: true`** - Required to override Material's default styles
- **Material-aligned breakpoints** - Match Angular Material's responsive behavior
- **Extended spacing** - Support larger layout values common in this app

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,scss,ts}'],
  important: true,
  theme: {
    screens: {
      sm: '600px',
      md: '960px',
      lg: '1280px',
      xl: '1440px',
    },
    extend: {
      colors: {
        'noc-primary': '#3b5998',
        'noc-primary-accent': '#8b9dc3',
        'noc-primary-lighter': '#dfe3ee',
        'noc-secondary': '#995014',
        'noc-toolbar': '#e7ecf4',
        'noc-highlight': '#fffcd8',
        'noc-highlight-model': '#e1f5fe',
        'noc-mf': '#7cd488',
        'noc-bp': '#f4c89c',
        'noc-cc': '#d3b5f5',
      },
      spacing: {
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
        50: '12.5rem',
        90: '22.5rem',
        100: '25rem',
        120: '30rem',
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        99: '99',
        999: '999',
        9999: '9999',
      },
    },
  },
  corePlugins: {
    container: false,
  },
  plugins: [],
};
```

#### 1.2 Update styles.scss

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

// Keep only necessary custom styles
@import '@noctua/scss/core';
```

#### 1.3 Verify Build

- [ ] Run `npm start` - verify dev server works
- [ ] Run `npm run build` - verify production build

---

### Phase 2: Remove @angular/flex-layout
**Status**: [ ] Not Started

This is the largest change - 513+ directive replacements across 35 files.

#### Conversion Reference

| Flex-Layout | Tailwind |
|-------------|----------|
| `fxLayout="row"` | `class="flex flex-row"` |
| `fxLayout="column"` | `class="flex flex-col"` |
| `fxLayout="row wrap"` | `class="flex flex-row flex-wrap"` |
| `fxLayoutAlign="start center"` | `class="justify-start items-center"` |
| `fxLayoutAlign="center center"` | `class="justify-center items-center"` |
| `fxLayoutAlign="end center"` | `class="justify-end items-center"` |
| `fxLayoutAlign="space-between center"` | `class="justify-between items-center"` |
| `fxLayoutGap="8px"` | `class="gap-2"` |
| `fxLayoutGap="16px"` | `class="gap-4"` |
| `fxFlex` (spacer) | `class="flex-1"` or `class="grow"` |
| `fxFlex="100"` | `class="w-full"` |
| `fxFlex="50"` | `class="w-1/2"` |
| `fxHide` | `class="hidden"` |
| `fxShow` | Remove hidden or use `block` |

#### 2.1 High-Priority Files (Forms)

- [ ] `cam-form.component.html` (24 directives)
- [ ] `activity-form.component.html`
- [ ] `entity-form.component.html`
- [ ] `evidence-form.component.html`

#### 2.2 Dialog Components

- [ ] `select-evidence-dialog.component.html`
- [ ] `search-database-dialog.component.html`
- [ ] `confirm-dialog.component.html`
- [ ] `link-to-existing-dialog.component.html`
- [ ] Other dialogs in `src/app/main/apps/noctua-form/dialogs/`

#### 2.3 Table Components

- [ ] `cam-table.component.html`
- [ ] `activity-table.component.html`
- [ ] Other table components

#### 2.4 Layout Components

- [ ] `toolbar.component.html`
- [ ] `header.component.html`
- [ ] `noctua-form.component.html`
- [ ] `noctua-graph.component.html`

#### 2.5 Remaining Components

- [ ] All other components with fxLayout

#### 2.6 Remove Dependency

- [ ] Remove from package.json: `@angular/flex-layout`
- [ ] Remove FlexLayoutModule from all module imports
- [ ] Run `npm install` to clean up

---

### Phase 3: Clean Up SCSS Files
**Status**: [ ] Not Started

#### 3.1 Remove Redundant Files

- [ ] Delete `_helpers.scss`
- [ ] Delete `_reset.scss`
- [ ] Delete `_normalize.scss`
- [ ] Delete `_buttons.scss`
- [ ] Delete `_borders.scss`
- [ ] Delete `_icons.scss`
- [ ] Delete `_global.scss` (mostly empty)

#### 3.2 Simplify _angular-material-fix.scss

Keep ONLY:
- Font Awesome icon alignment in Material buttons (~30 lines)
- MDC tab flex fixes (~15 lines)
- Dialog padding reset (~5 lines)

Remove:
- Generic spacing/margin fixes (use Tailwind)
- Color overrides (use Tailwind)
- Size utilities (use Tailwind)

#### 3.3 Simplify _typography.scss

Keep ONLY:
- Font family definitions
- Maybe 2-3 heading styles if very custom

Remove:
- Font size utilities (Tailwind: text-xs, text-sm, etc.)
- Font weight utilities (Tailwind: font-normal, font-bold, etc.)
- Line height utilities (Tailwind: leading-*)
- Text alignment (Tailwind: text-left, text-center, etc.)

#### 3.4 Simplify _colors.scss

Keep ONLY:
- Material theme color generation (if still needed)

Remove:
- Text color utilities (Tailwind: text-noc-primary, etc.)
- Background color utilities (Tailwind: bg-noc-primary, etc.)

#### 3.5 Simplify noctua.scss

Keep ONLY:
- Complex component styles that can't be Tailwind
- Necessary mixins (deep-width, deep-height, noc-chip-color)

Remove:
- Utility class definitions
- Simple component styles replaceable with Tailwind

#### 3.6 Update Imports

- [ ] Update `_partials.scss` to remove deleted file imports
- [ ] Update `core.scss` if needed
- [ ] Update component SCSS imports

---

### Phase 4: Update Component Templates
**Status**: [ ] Not Started

Replace custom classes with Tailwind utilities throughout templates.

#### Common Replacements

| Custom Class | Tailwind |
|--------------|----------|
| `.m-8` | `m-2` |
| `.m-16` | `m-4` |
| `.p-8` | `p-2` |
| `.p-16` | `p-4` |
| `.w-100-p` | `w-full` |
| `.h-100-p` | `h-full` |
| `.position-relative` | `relative` |
| `.position-absolute` | `absolute` |
| `.cursor-pointer` | `cursor-pointer` |
| `.text-center` | `text-center` |
| `.font-bold` | `font-bold` |

---

### Phase 5: Update Component SCSS Files
**Status**: [ ] Not Started

Many components have their own `.scss` files with custom styles.

#### Strategy

1. Review each component's SCSS
2. Move utility-style rules to template Tailwind classes
3. Keep only truly component-specific styles
4. Remove empty SCSS files

---

### Phase 6: Testing & Validation
**Status**: [ ] Not Started

- [ ] Run `npm run build` - ensure production build works
- [ ] Run `npm start` - verify dev server
- [ ] Visual regression test major pages:
  - [ ] CAM Form
  - [ ] Activity Form
  - [ ] CAM Table
  - [ ] Graph View
  - [ ] All dialogs
- [ ] Test responsive breakpoints
- [ ] Verify Material components still function
- [ ] Check for console errors

---

## Files to Modify Summary

### Delete (7 files)

```text
src/@noctua/scss/partials/_helpers.scss
src/@noctua/scss/partials/_reset.scss
src/@noctua/scss/partials/_normalize.scss
src/@noctua/scss/partials/_buttons.scss
src/@noctua/scss/partials/_borders.scss
src/@noctua/scss/partials/_icons.scss
src/@noctua/scss/partials/_global.scss
```

### Significantly Modify (4 files)

```text
src/@noctua/scss/partials/_angular-material-fix.scss  (238 → ~50 lines)
src/@noctua/scss/partials/_typography.scss            (373 → ~30 lines)
src/@noctua/scss/partials/_colors.scss                (192 → ~20 lines)
src/@noctua/scss/noctua.scss                          (366 → ~100 lines)
```

### Config Files (3 files)

```text
tailwind.config.js       (expand configuration)
src/styles.scss          (add Tailwind imports)
package.json             (remove @angular/flex-layout)
```

### Template Files (~35 files)

All HTML files with fxLayout directives need conversion.

---

## Estimated Effort by Phase

| Phase | Scope | Risk |
|-------|-------|------|
| Phase 1: Tailwind Config | Small | Low |
| Phase 2: Remove Flex-Layout | Large (513+ changes) | Medium |
| Phase 3: Clean SCSS | Medium | Low |
| Phase 4: Update Templates | Medium | Low |
| Phase 5: Component SCSS | Small | Low |
| Phase 6: Testing | Medium | Low |

---

## Dependencies & Blockers

1. **Tailwind v3.4.4** already installed - no blockers
2. **Angular 20** compatible with Tailwind - no blockers
3. **@angular/flex-layout** deprecated - removal is recommended

---

## Success Criteria

- [ ] `@angular/flex-layout` completely removed from project
- [ ] All fxLayout directives replaced with Tailwind classes
- [ ] SCSS file count reduced from 28 to ~15
- [ ] _angular-material-fix.scss reduced by 80%
- [ ] No visual regressions in major UI components
- [ ] Production build succeeds
- [ ] No console errors related to styling

---

## Current Status

**Phase**: Planning Complete
**Next Step**: Phase 1.1 - Configure tailwind.config.js

## Progress Log

| Date | Phase | Notes |
|------|-------|-------|
| 2026-02-03 | Planning | Initial analysis complete, plan created |
