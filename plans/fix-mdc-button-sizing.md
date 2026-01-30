# Task: Fix MDC Button Sizing After Angular Material Migration

## Goal

Fix button sizing issues after migrating from Angular Material legacy components to MDC components using `ng generate @angular/material:mdc-migration`. Buttons became too large after the migration.

## Current State

### What's Broken

- MDC icon buttons are 48×48px (legacy was 40×40px)
- All buttons appear larger than expected
- Existing SCSS overrides don't apply properly to MDC components
- Component-level size overrides (using `deep-height`, `deep-width`) are not taking effect

### What Works

- Angular Material MDC migration completed
- Application builds and runs
- SCSS override structure exists in `src/@noctua/scss/partials/_angular-material-fix.scss`

## Root Cause Analysis

### MDC vs Legacy Size Differences

| Button Type | Legacy Size | MDC Size |
| ----------- | ----------- | -------- |
| `mat-icon-button` | 40×40px | **48×48px** |
| `mat-button` | 36px height | 36px height (more padding) |
| `mat-raised-button` | 36px height | 36px height (larger min-width) |

### Existing Overrides (Insufficient)

**File:** `src/@noctua/scss/partials/_angular-material-fix.scss`

```scss
.mat-mdc-button {
  min-width: 20px !important;  // Only addresses min-width, not height
}

.mat-mdc-icon-button {
  .mat-button-ripple { border-radius: 50%; }  // Doesn't address size
}
```

**Problem:** These overrides don't use MDC CSS custom properties to control button sizing.

### Component-Level Overrides (Not Working)

**File:** `src/@noctua.editor/inline-editor/editor-dropdown/editor-dropdown.component.scss`

```scss
.noc-evidence-db-trigger {
  @include deep-height(20px);
  @include deep-width(20px);
}
```

**Problem:** MDC uses internal CSS custom properties that override these height/width rules.

## Implementation Plan

### Phase 1: Research SCSS Overrides ✓

- [x] Explore `src/@noctua/scss` for button-related styles
- [x] Explore `src/@noctua.common/scss` for button-related styles
- [x] Identify all button classes and custom size variants
- [x] Document current state and root cause

### Phase 2: Add MDC Button Size Overrides ✓

- [x] Add default MDC icon button size reset (40×40px)
- [x] Add small icon button overrides (20×20px) for custom classes
- [x] Add toolbar button overrides (30×30px)
- [x] Consolidate duplicate `.mat-mdc-icon-button` blocks
- [x] Use MDC CSS custom properties (`--mdc-icon-button-state-layer-size`, `--mdc-icon-button-icon-size`)

### Phase 3: Replace mat-icon with Font Awesome ✓

**Issue:** mat-icon components are not rendering properly after MDC migration.

**Solution:** Replace all mat-icon usage with Font Awesome icons (fa-icon) which are already in use in some parts of the codebase.

**Scope:**
- 94 mat-icon occurrences across 33 files
- 32 fa-icon occurrences already exist (for reference)

**Icon Mapping:**

| Material Icon | Font Awesome Equivalent |
| ------------- | ----------------------- |
| close | fas/times or fas/times-circle |
| edit | fas/edit or fas/pencil-alt |
| cancel | fas/times-circle or fas/ban |
| check_circle | fas/check-circle |
| person | fas/user |
| date_range | fas/calendar-alt |
| delete_forever | far/trash-alt (already used) |
| add | fas/plus |
| palette | fas/palette |
| arrow_back | fas/arrow-left |
| delete | fas/trash |
| check | fas/check |
| playlist_add | fas/plus-square |
| more_vert | fas/ellipsis-v |
| arrow_drop_down | fas/caret-down |
| error_outline | fas/exclamation-circle |
| account_tree | fas/sitemap |
| link | fas/link |
| youtube_searched_for | fas/search |

**Files Updated:**

- [x] src/@noctua.editor/inline-detail/detail-dropdown/detail-dropdown.component.html
- [x] src/@noctua.editor/inline-editor/inline-editor.component.html
- [x] src/@noctua.editor/inline-reference/reference-dropdown/reference-dropdown.component.html
- [x] src/@noctua.editor/inline-with/with-dropdown/with-dropdown.component.html
- [x] src/@noctua/components/confirm-dialog/confirm-dialog.component.html
- [x] src/@noctua/components/material-color-picker/material-color-picker.component.html
- [x] src/@noctua.editor/inline-editor/editor-dropdown/editor-dropdown.component.html
- [x] src/app/layout/components/toolbar/toolbar.component.html
- [x] src/app/main/apps/noctua-graph/activity-connector-table/activity-connector-table.component.html
- [x] src/app/main/apps/noctua-graph/activity-table/activity-table.component.html
- [x] src/app/main/apps/noctua-form/components/term-detail/term-detail.component.html
- [x] src/app/main/apps/noctua-form/dialogs/activity-errors/activity-errors.component.html
- [x] src/app/main/apps/noctua-graph/cam-errors/cam-errors.component.html
- [x] src/app/main/apps/noctua-graph/cam-graph/cam-graph.component.html
- [x] src/app/main/apps/noctua-form/cam/activity/activity-connector-form/activity-connector-form.component.html
- [x] src/app/main/apps/noctua-form/cam/activity/chemical-connector-form/chemical-connector-form.component.html
- [x] src/app/main/apps/noctua-form/cam/activity/activity-form/activity-form.component.html
- [x] src/app/main/apps/noctua-form/cam/activity/activity-form/entity-form/entity-form.component.html
- [x] src/app/main/apps/noctua-form/cam/cam-form/cam-form.component.html
- [x] src/app/main/apps/noctua-form/cam/cam-toolbar/cam-toolbar.component.html
- [x] src/app/main/apps/noctua-form/cam/cam-table/activity-tree-table/activity-tree-table.component.html
- [x] src/app/main/apps/noctua-form/cam/cam-table/activity-form-table/activity-form-table.component.html
- [x] src/app/main/apps/noctua-form/cam/cam-table/activity-form-table/activity-form-table-node/activity-form-table-node.component.html
- [x] src/app/main/apps/noctua-form/cam/cam-table/activity-form-table/evidence-table/evidence-table.component.html
- [x] src/app/main/apps/noctua-form/cam/copy-model/copy-model.component.html
- [x] src/app/main/apps/noctua-form/dialogs/add-evidence/add-evidence.component.html
- [x] src/app/main/apps/noctua-form/dialogs/allowed-with-databases/allowed-with-databases.component.html
- [x] src/app/main/apps/noctua-form/dialogs/before-save/before-save.component.html
- [x] src/app/main/apps/noctua-form/dialogs/cam-errors/cam-errors.component.html
- [x] src/app/main/apps/noctua-form/dialogs/confirm-copy-model/confirm-copy-model.component.html
- [x] src/app/main/apps/noctua-form/dialogs/search-database/search-database.component.html
- [x] src/app/main/apps/noctua-form/dialogs/search-evidence/search-evidence.component.html
- [x] src/app/main/apps/noctua-form/dialogs/select-evidence/select-evidence.component.html

**Modules Updated to Import FontAwesomeModule:**

- [x] src/@noctua/components/confirm-dialog/confirm-dialog.module.ts
- [x] src/@noctua/components/material-color-picker/material-color-picker.module.ts

**Note:** Other modules already imported FontAwesomeModule via NoctuaSharedModule or directly.

**Font Awesome Icons Registered in Library:**

Added the following icon imports and registrations to `app.module.ts`:
- `faArrowLeft` - for arrow_back replacement
- `faCalendarAlt` - for date_range replacement
- `faCheck` - for check replacement
- `faEdit` - for edit replacement
- `faEllipsisV` - for more_vert replacement
- `faExclamationCircle` - for error_outline replacement
- `faPalette` - for palette replacement
- `faPlusSquare` - for playlist_add replacement
- `faTrash` - for delete replacement

All icons are now properly registered and should render without errors.

**Icon Alignment Fixes:**

Fixed Font Awesome icon alignment in buttons by adding comprehensive CSS rules to `_angular-material-fix.scss`:

1. **Mat-icon-buttons** (lines 18-25):
   - Added flex display and centering for fa-icons
   - Set font-size: 20px, width/height: 24px for default buttons

2. **Small icon buttons** (lines 37-41):
   - Font-size: 14px, width/height: 16px for noc-trigger-button, noc-delete-button, etc.

3. **Material buttons** (lines 62-92):
   - Smart icon spacing: margin-left when icon follows text, margin-right when icon precedes text
   - Added flex layout support for buttons with fxLayout attribute
   - flex-shrink: 0 to prevent icon shrinking

4. **Action buttons** (lines 104-126):
   - Force inline-flex display to work with Angular @if blocks
   - Specific fixes for mat-stroked-button.noc-action-button combination
   - margin-left: 6px for proper spacing

5. **Buttons with fxLayout** (lines 129-157):
   - Override fixed line-height from custom button classes
   - Force flex layout with !important declarations
   - Font-size: 14px (12px for noc-xs buttons)
   - line-height: normal to fix alignment issues

**Icon Prefix Corrections:**

- Changed `times-circle` from `fas` to `far` prefix (it's a regular icon, not solid)
- Added `noc-delete-button` class to small icon buttons sizing

**Complex Issues Resolved:**

1. **Angular @if block rendering**: Icons wrapped in `@if` blocks create comment nodes in the DOM, breaking CSS selectors like `:first-child` and `:last-child`. Fixed by using inline-flex and explicit margins.

2. **Custom button class conflicts**: `.noc-rounded-button` has fixed `line-height` that conflicts with flex layouts. Fixed with `line-height: normal !important`.

3. **Mat-stroked-button + noc-action-button**: These combined classes needed special handling with `display: inline-flex !important` to work with conditional icon rendering.

4. **Flex layout buttons**: Buttons with `fxLayout="row"` attribute needed forceful CSS overrides to work correctly with Font Awesome icons.

### Phase 4: Testing & Validation

- [ ] Run `npm start` and verify button sizes
- [ ] Check icon buttons in toolbar
- [ ] Check small buttons in editor dropdowns
- [ ] Check dialog header buttons
- [ ] Check delete float buttons
- [ ] Verify button appearance across all components
- [ ] Verify all icons render correctly with Font Awesome

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| File/Task | Action | Status |
| --------- | ------ | ------ |
| `src/@noctua/scss/partials/_angular-material-fix.scss` | Add MDC button size overrides | ✓ DONE |
| 33 HTML component files | Replace mat-icon with fa-icon | ✓ DONE |
| 2 module files | Add FontAwesomeModule import | ✓ DONE |
| `src/app/app.module.ts` | Register all Font Awesome icons in library | ✓ DONE |
| `src/@noctua/scss/partials/_angular-material-fix.scss` | Add Font Awesome icon alignment CSS (90+ lines) | ✓ DONE |
| 2 HTML files | Fix times-circle prefix from fas to far | ✓ DONE |
| CSS fixes for action buttons | Handle inline-flex and @if block rendering | ✓ DONE |
| CSS fixes for flex layout buttons | Override custom button classes with !important | ✓ DONE |

## Progress Summary

- Current: Phase 3 complete - All mat-icons replaced with Font Awesome icons and alignment issues fixed
- Completed: 33 HTML files updated, 2 modules updated, icon library registered, comprehensive CSS fixes applied
- Next: Manual testing in browser to verify all icons and buttons display correctly
- Blockers: None

## Solution Implemented

### Added to `_angular-material-fix.scss`

```scss
// Reset MDC icon button to match legacy size (40x40)
.mat-mdc-icon-button {
  --mdc-icon-button-state-layer-size: 40px;
  --mdc-icon-button-icon-size: 24px;
  width: var(--mdc-icon-button-state-layer-size);
  height: var(--mdc-icon-button-state-layer-size);
  padding: 8px;

  .mat-button-ripple {
    border-radius: 50%;
  }
}

// Small icon buttons (20x20)
.mat-mdc-icon-button.noc-trigger-button,
.mat-mdc-icon-button.noc-evidence-db-trigger,
.mat-mdc-icon-button.noc-delete-float-button {
  --mdc-icon-button-state-layer-size: 20px;
  --mdc-icon-button-icon-size: 16px;
  padding: 2px;
}

// Toolbar buttons (30px height)
.noc-column-toolbar .mat-mdc-icon-button {
  --mdc-icon-button-state-layer-size: 30px;
  --mdc-icon-button-icon-size: 20px;
  padding: 5px;
}
```

## Key Technical Decisions

### Why MDC CSS Custom Properties?

MDC components use CSS custom properties (CSS variables) for theming and sizing. Direct `height`/`width` rules are overridden by internal MDC styles. Using `--mdc-*` properties ensures our overrides take precedence.

### Button Size Targets

- **Default (40px):** Matches legacy Material icon button size for consistency
- **Small (20px):** For inline editor triggers and delete buttons
- **Toolbar (30px):** For toolbar icon buttons per existing `noctua.common.scss` specs

### Custom Classes Targeted

Based on existing SCSS patterns:

- `.noc-trigger-button` - Inline editor triggers
- `.noc-evidence-db-trigger` - Evidence database triggers
- `.noc-delete-float-button` - Delete action buttons
- `.noc-column-toolbar` - Toolbar containers

## Button Size Inventory

### Files with Button Styles

1. **`src/@noctua/scss/partials/_angular-material-fix.scss`** - Material button overrides (MDC fixes)
2. **`src/@noctua/scss/partials/_buttons.scss`** - Custom button classes (`.noc-rounded-button`, `.noc-half-button`)
3. **`src/@noctua/scss/partials/_cards.scss`** - Card button overrides
4. **`src/@noctua/scss/noctua.scss`** - Custom `.noc-button-border` class
5. **`src/@noctua.common/scss/noctua.common.scss`** - Dialog and toolbar button styling

### Custom Button Classes (Not Affected)

These custom classes work independently of MDC migration:

- `.noc-rounded-button` - Rounded buttons with size variants (xxs, xs, sm)
- `.noc-half-button` - Button groups with controlled corners
- `.noc-button-border` - Custom bordered buttons (36×36px)

## Testing Checklist

- [ ] **Editor Dropdowns**
  - [ ] Inline editor trigger buttons (should be 20×20px)
  - [ ] Evidence database triggers (should be 20×20px)
  - [ ] Save/close buttons in editor dropdown

- [ ] **Toolbar Areas**
  - [ ] Column toolbar icon buttons (should be 30×30px)
  - [ ] Graph toolbar buttons
  - [ ] Main app toolbar buttons

- [ ] **Dialogs**
  - [ ] Dialog header close buttons (should be 40×40px)
  - [ ] Dialog footer action buttons
  - [ ] Confirm dialog buttons

- [ ] **Forms**
  - [ ] Activity form buttons
  - [ ] CAM form buttons
  - [ ] Entity form buttons

- [ ] **Tables**
  - [ ] Activity table action buttons
  - [ ] Connector table buttons
  - [ ] Delete float buttons (should be 20×20px)

- [ ] **Graph Components**
  - [ ] Zoom buttons (should use `.noc-rounded-button` sizing)
  - [ ] Layout buttons
  - [ ] Graph manipulation controls

## Known Limitations

1. **Custom button classes** (`.noc-rounded-button`, etc.) maintain their own sizing via `deep-height()` mixins
2. **Legacy components** not yet migrated may have inconsistent sizing
3. **Third-party components** (JointJS graph controls) unaffected by Material changes

## Next Steps

1. Run `npm start` to test changes
2. Perform manual UI testing using checklist above
3. If buttons still too large in specific areas, add component-specific overrides
4. Consider adding more granular size controls if needed (e.g., `.noc-icon-button-sm` helper class)

## Lessons Learned

- MDC migration changes default button sizes significantly
- MDC uses CSS custom properties for sizing - must override using `--mdc-*` variables
- Component-level `height`/`width` rules don't work with MDC buttons
- Button size consistency requires overrides at multiple specificity levels
- Existing `deep-height()`/`deep-width()` mixins don't apply to MDC button internals

## Related Issues

- Angular Material legacy to MDC migration
- Button sizing consistency across application
- SCSS override patterns for MDC components

## References

- [Angular Material MDC Migration Guide](https://material.angular.io/guide/mdc-migration)
- [MDC Button Documentation](https://material.angular.io/components/button/overview)
- Project: `src/@noctua/scss/partials/_angular-material-fix.scss`
- Project: `src/@noctua.common/scss/noctua.common.scss`
