# Task: Migrate SCSS to Tailwind CSS

## Goal

**Delete styles from SCSS files and add Tailwind utility classes directly in HTML templates.**

The primary objective is to simplify the codebase by:
1. **Removing** CSS properties from `.scss` files (padding, margin, width, height, colors, shadows, etc.)
2. **Adding** equivalent Tailwind utility classes directly in the HTML templates
3. **Keeping SCSS only** for what Tailwind cannot handle (Material overrides, theme-based colors, pseudo-elements, complex nested selectors)

### Migration Approach

For each component:
1. Read the `.scss` file and identify styles that can be expressed as Tailwind utilities
2. Remove those styles from the SCSS
3. Add the equivalent Tailwind classes to the corresponding HTML elements
4. Test that the component still looks correct

**Example:**
```scss
// BEFORE: component.scss
.noc-dialog-body {
  margin: 0;
  padding: 0;
  width: 100%;
}

// AFTER: component.scss
// (class removed entirely - now empty or deleted)

// AFTER: component.html
<div class="m-0 p-0 w-full">
```

## Current State

- **Total SCSS files in src/**: 66 files
- **Lines of SCSS code**: ~3,500+ lines across component and core files
- **Previous work completed**: fxLayout → Tailwind migration (513+ directives)
- **Tailwind config**: Already set up with custom colors, spacing, and plugins

### What Currently Works
- Build compiles successfully
- Tailwind is configured and working
- fxLayout has been replaced with Tailwind flex utilities
- Custom utilities: `deep-w-*`, `deep-h-*`, `aspect-border-*`

### What Needs Migration
- Component-level SCSS files (46 files) - move styles to HTML templates
- Remove dead/redundant SCSS classes after moving to Tailwind
- `deep-width`/`deep-height` mixin usage → `deep-w-[Xpx]`/`deep-h-[Xpx]` classes

## Implementation Plan

### Phase 1: Tailwind Plugin Setup ✓
- [x] Add `deep-w-*` / `deep-h-*` utilities (replaces mixins)
- [x] Add `aspect-border-*` utilities for MF/BP/CC indicators
- [x] Verify build works with new plugins

### Phase 2: Pilot Migration ✓
- [x] Migrate cam-form.component (52 → 7 lines)
- [x] Migrate activity-form.component (179 → 16 lines)
- [x] Validate approach and build

### Phase 3: noctua-form Dialogs ✓

- [x] add-evidence.component.scss (already empty)
- [x] before-save.component.scss (already empty)
- [x] confirm-copy-model.component.scss (already empty)
- [x] activity-errors.component.scss (85 → 17 lines)
- [x] cam-errors.component.scss (85 → 17 lines)
- [x] select-evidence.component.scss (139 → 50 lines)
- [x] search-database.component.scss (134 → 70 lines)
- [x] search-evidence.component.scss (122 → 64 lines)
- [x] create-activity.component.scss (40 → 25 lines)
- [x] allowed-with-databases.component.scss (21 → 4 lines)

### Phase 4: noctua-form CAM Components ✓

- [x] cam-toolbar.component.scss (262 → 204 lines)
- [x] copy-model.component.scss (47 → 26 lines)
- [x] activity-connector-form.component.scss (285 → 223 lines)
- [x] chemical-connector-form.component.scss (53 → 19 lines)
- [x] entity-form.component.scss (236 → 143 lines) - removed dead code, migrated sizing
- [x] activity-form-table.component.scss (269 → 49 lines) - removed 220 lines dead code
- [x] activity-form-table-node.component.scss (214 → 119 lines) - removed unused styles
- [x] evidence-table.component.scss (158 → 100 lines) - removed dead code
- [x] activity-tree-table.component.scss (327 → 244 lines) - removed unused tree/form styles

### Phase 5: noctua-form Other Components ✓

- [x] copy-model.component.scss (47 → 24 lines) - removed dead header/body styles
- [x] term-detail.component.scss (83 → 60 lines) - removed unused edit-field/article styles
- [x] select-evidence.component.scss (139 → 45 lines) - removed 94 lines dead code

### Phase 6: noctua-graph Components ✓

- [x] noctua-graph.component.scss (271 → 62 lines) - removed massive dead code, kept child component sizing
- [x] cam-graph.component.scss (112 → 84 lines) - removed unused flypaper/heading styles
- [x] activity-table.component.scss (376 → 8 lines) - removed 368 lines dead code, all styles unused
- [x] activity-connector-table.component.scss (281 → 80 lines) - removed unused activity-list/triple styles
- [x] cam-errors.component.scss (319 lines) - kept as-is, all classes actively used
- [x] relation-preview.component.scss (0 lines) - already empty

### Phase 7: Editor Module (@noctua.editor) ✓

- [x] inline-editor.component.scss (22 → 19 lines) - moved line-height/border-radius to Tailwind
- [x] editor-dropdown.component.scss (20 → 14 lines) - removed dead .noc-edit-field
- [x] detail-dropdown.component.scss (82 → 59 lines) - removed dead .noc-edit-field/.noc-article-* styles
- [x] reference-dropdown.component.scss (34 → 26 lines) - removed dead .noc-edit-field, empty .noc-article-date
- [x] with-dropdown.component.scss (43 → 17 lines) - removed dead .noc-edit-field/.noc-article-*, redundant margin

### Phase 8: Layout & Core Components
- [ ] layout-noctua.component.scss
- [ ] toolbar.component.scss
- [ ] footer.component.scss
- [ ] content.component.scss
- [ ] confirm-dialog.component.scss
- [ ] app.component.scss

### Phase 9: Core SCSS Cleanup
- [ ] Review noctua.scss - remove converted patterns
- [ ] Review noctua.common.scss - consider Angular component replacement
- [ ] Clean up unused partials
- [ ] Remove dead code from _typography.scss, _buttons.scss, etc.

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Plugin Setup | Complete | 2/2 |
| Phase 2: Pilot Migration | Complete | 2/2 |
| Phase 3: Dialogs | Complete | 10/10 |
| Phase 4: CAM Components | Complete | 9/9 |
| Phase 5: Other noctua-form | Complete | 3/3 |
| Phase 6: noctua-graph | Complete | 6/6 |
| Phase 7: Editor Module | Complete | 5/5 |
| Phase 8: Layout & Core | Not Started | 0/6 |
| Phase 9: Core SCSS Cleanup | Not Started | 0/4 |

## Files to Create/Modify

### Configuration Files
| File | Action | Status |
|------|--------|--------|
| tailwind.config.js | Modified | ✓ Done |

### Component SCSS Files (46 total)
| File | Action | Status |
|------|--------|--------|
| cam-form.component.scss | Simplified | ✓ Done |
| activity-form.component.scss | Simplified | ✓ Done |
| add-evidence.component.scss | Simplify | Pending |
| (... 43 more files) | Simplify | Pending |

### Core SCSS Files
| File | Action | Status |
|------|--------|--------|
| noctua.scss | Cleanup | Pending |
| noctua.common.scss | Cleanup | Pending |
| _typography.scss | Cleanup | Pending |
| _buttons.scss | Review | Pending |

## Dependencies

- [x] Tailwind CSS installed and configured
- [x] Build system working
- [ ] None blocking

## Blockers

- None currently

## Conversion Patterns

**Key principle: Remove from SCSS, add to HTML template**

### Pattern 1: Padding/Margin

```scss
// REMOVE from SCSS:
.noc-dialog-body {
  margin: 0;
  padding: 0;
  padding-bottom: 200px;
}
```

```html
<!-- ADD to HTML: -->
<div class="m-0 p-0 pb-[200px]">
```

### Pattern 2: Width/Height

```scss
// REMOVE from SCSS:
.noc-cam-form {
  width: 350px;
  min-width: 350px;
  max-width: 350px;
}
// or: @include deep-width(350px);
```

```html
<!-- ADD to HTML: -->
<div class="deep-w-[350px]">
```

### Pattern 3: Colors/Backgrounds

```scss
// REMOVE from SCSS:
.noc-no-info {
  color: #999;
  background-color: white;
}
```

```html
<!-- ADD to HTML: -->
<div class="text-gray-400 bg-white">
```

### Pattern 4: Shadows (Material elevation)

```scss
// REMOVE from SCSS:
.noc-term-group {
  @include mat.elevation(1);
  // or: box-shadow: ...
}
```

```html
<!-- ADD to HTML: -->
<div class="shadow">  <!-- elevation 1-2 -->
<div class="shadow-md">  <!-- elevation 3-4 -->
```

### Pattern 5: Hover visibility → group-hover

```scss
// REMOVE from SCSS:
.noc-form-field-container:hover .noc-delete-button {
  visibility: visible;
}
```

```html
<!-- ADD to HTML: -->
<div class="group">
  <button class="invisible group-hover:visible">
</div>
```

### Pattern 6: Aspect borders (MF/BP/CC)

```scss
// REMOVE from SCSS:
.noc-term-group {
  border-left: #fff solid 5px;
  &.mf { border-left-color: rgba($noc-mf, 0.8); }
}
```

```html
<!-- ADD to HTML: -->
<div class="aspect-border-none mf">  <!-- dynamic class adds color -->
<div class="aspect-border-mf">  <!-- static MF border -->
```

### Pattern 7: Text styling

```scss
// REMOVE from SCSS:
.noc-heading {
  font-size: 14px;
  text-transform: uppercase;
  text-align: center;
}
```

```html
<!-- ADD to HTML: -->
<div class="text-sm uppercase text-center">
```

### Pattern 8: Borders

```scss
// REMOVE from SCSS:
.noc-row {
  border-bottom: 1px solid #ccc;
}
```

```html
<!-- ADD to HTML: -->
<div class="border-b border-[#ccc]">
```

## What Must Stay in SCSS

Only keep styles in SCSS when Tailwind cannot express them:

1. **Theme-based colors**: `map-get($theme, primary)` - needs SCSS variable resolution
2. **Dynamic aspect colors**: `.mf`, `.bp`, `.cc` classes that get colors from SCSS variables
3. **Pseudo-elements**: `::before`, `::after` with content or decorations
4. **Material component overrides**: `::ng-deep`, MDC form field styling, chip customization
5. **Third-party plugin overrides**: ngx-datatable, ng-pick-datetime, etc.
6. **Complex nested selectors**: Where Tailwind's group-hover/peer patterns don't work
7. **CSS custom properties**: When values come from Angular Material theme

**Rule of thumb**: If a style is just a static value (padding, margin, color hex, width), move it to HTML. If it references a SCSS variable, Material mixin, or needs complex selectors, keep it in SCSS.

## Quick Reference: SCSS → Tailwind

| SCSS Property | Tailwind Class |
|---------------|----------------|
| `padding: 0` | `p-0` |
| `padding: 8px` | `p-2` |
| `padding: 10px 14px` | `py-2.5 px-3.5` |
| `margin: 0` | `m-0` |
| `margin-bottom: 16px` | `mb-4` |
| `width: 100%` | `w-full` |
| `width: 350px` | `w-[350px]` or `deep-w-[350px]` |
| `height: 100%` | `h-full` |
| `min-height: 80%` | `min-h-[80%]` |
| `background-color: white` | `bg-white` |
| `background-color: #ddd` | `bg-[#ddd]` |
| `color: #999` | `text-gray-400` or `text-[#999]` |
| `font-size: 12px` | `text-xs` |
| `font-size: 14px` | `text-sm` |
| `text-align: center` | `text-center` |
| `text-transform: uppercase` | `uppercase` |
| `font-style: italic` | `italic` |
| `border-bottom: 1px solid #ccc` | `border-b border-[#ccc]` |
| `border: 2px double #aaa` | `border-2 border-double border-[#aaa]` |
| `overflow-y: auto` | `overflow-y-auto` |
| `overflow: hidden` | `overflow-hidden` |
| `@include mat.elevation(1)` | `shadow` |
| `@include mat.elevation(2)` | `shadow` |
| `@include mat.elevation(4)` | `shadow-md` |
| `@include deep-width(Xpx)` | `deep-w-[Xpx]` |
| `@include deep-height(Xpx)` | `deep-h-[Xpx]` |
| `visibility: hidden` on hover | `invisible group-hover:visible` |

## Next Steps

1. Phase 8: Layout & Core Components
2. Phase 9: Core SCSS Cleanup
3. Test build after each batch of changes
4. Update progress table as files are completed

## Notes

- **Phase 3 Complete**: Dialog components simplified, many using existing Tailwind in HTML templates
- **Phase 4 Complete**: Significant dead code removal across CAM components:
  - entity-form.component.scss: 236 → 143 lines (removed unused form/activity styles)
  - activity-form-table.component.scss: 269 → 49 lines (removed 220 lines of dead code)
  - activity-form-table-node.component.scss: 214 → 119 lines (removed unused styles)
  - evidence-table.component.scss: 158 → 100 lines (removed dead code)
  - activity-tree-table.component.scss: 327 → 244 lines (removed unused tree/form styles)
- Key insight: Many SCSS files contain dead code due to ViewEncapsulation - styles scoped to `:host` only apply to elements in that component's template
- Material chip styling with `noc-chip-color` mixin must stay in SCSS for dynamic coloring
- Tree visualization components use `$noc-tree-line-color` and pseudo-elements - keep in SCSS
- Theme-based colors (map-get($primary, default), $noc-primary-color-light) must stay in SCSS
- **Phase 6 Complete**: noctua-graph components had significant dead code:
  - noctua-graph.component.scss: 271 → 62 lines (removed cam-row/form/activity/editor styles unused in template)
  - activity-table.component.scss: 376 → 8 lines (massive dead code - component uses activity-tree-table styles)
  - cam-errors.component.scss: Left at 319 lines - uses modern BEM naming with all classes actively used
- **Phase 7 Complete**: Editor module cleanup - removed copy-pasted dead code across dropdown components:
  - Common pattern: `.noc-edit-field` and `.noc-article-*` styles were copied across files but only used in some
  - Kept theme-based styles (Material elevation, accent colors) in SCSS as required
  - Total reduction: ~66 lines removed across 5 files
