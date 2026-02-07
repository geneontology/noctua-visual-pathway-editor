# SCSS @import to @use Migration Plan

## Goal
Eliminate all Sass `@import` deprecation warnings by migrating to the modern `@use` and `@forward` syntax, following the patterns established in `downloads/starter`.

## Current State

### Problems
- 15+ deprecation warnings: "Sass @import rules are deprecated and will be removed in Dart Sass 3.0.0"
- Mixed usage of `@use` and `@import` in the same files
- Global variables accessed implicitly across files (e.g., `$theme`, `$typography`, `$primary`)

### Files Using @import
| File | @import Statements / Global Dependencies |
|------|------------------------------------------|
| `core.scss` | `@import "noctua"`, `@import "partials/*"` (10 imports), uses `$typography`, `$theme` |
| `noctua.scss` | `@import "theming"`, `@import "mixins/breakpoints"`, `@import "partials/mdc-form-field-theme"` |
| `partials/_material.scss` | Uses `$theme`, `$primary`, `$accent` from global scope + `@include deep-height/width` mixins |
| `partials/_colors.scss` | Uses `$primary`, `$accent`, `$warn`, `$mat-white`, `$mat-black`, `$mat-noctuadark` from global |
| `partials/_buttons.scss` | Uses `@include deep-height/width` mixins from global scope |
| `partials/plugins/_plugins.scss` | `@import "prism"`, `"perfect-scrollbar"`, `"ngx-datatable"`, `"ngx-color-picker"` |

### Component Files Using @import (34 files!)
All these files import from `@noctua/scss/noctua`:

**noctua-graph (4 files)**
- `src/app/main/apps/noctua-graph/noctua-graph.component.scss`
- `src/app/main/apps/noctua-graph/cam-graph/cam-graph.component.scss`
- `src/app/main/apps/noctua-graph/activity-table/activity-table.component.scss`
- `src/app/main/apps/noctua-graph/activity-connector-table/activity-connector-table.component.scss`

**noctua-form dialogs (7 files)**
- `src/app/main/apps/noctua-form/dialogs/select-evidence/select-evidence.component.scss`
- `src/app/main/apps/noctua-form/dialogs/search-evidence/search-evidence.component.scss`
- `src/app/main/apps/noctua-form/dialogs/search-database/search-database.component.scss`
- `src/app/main/apps/noctua-form/dialogs/create-activity/create-activity.component.scss`
- `src/app/main/apps/noctua-form/dialogs/cam-errors/cam-errors.component.scss`
- `src/app/main/apps/noctua-form/dialogs/allowed-with-databases/allowed-with-databases.component.scss`
- `src/app/main/apps/noctua-form/dialogs/activity-errors/activity-errors.component.scss`

**noctua-form cam (11 files)**
- `src/app/main/apps/noctua-form/components/copy-model/copy-model.component.scss`
- `src/app/main/apps/noctua-form/cam/cam-toolbar/cam-toolbar.component.scss`
- `src/app/main/apps/noctua-form/cam/cam-table/activity-tree-table/activity-tree-table.component.scss`
- `src/app/main/apps/noctua-form/cam/cam-table/activity-form-table/evidence-table/evidence-table.component.scss`
- `src/app/main/apps/noctua-form/cam/cam-table/activity-form-table/activity-form-table.component.scss`
- `src/app/main/apps/noctua-form/cam/cam-table/activity-form-table/activity-form-table-node/activity-form-table-node.component.scss`
- `src/app/main/apps/noctua-form/cam/cam-form/cam-form.component.scss`
- `src/app/main/apps/noctua-form/cam/activity/chemical-connector-form/chemical-connector-form.component.scss`
- `src/app/main/apps/noctua-form/cam/activity/activity-form/entity-form/entity-form.component.scss`
- `src/app/main/apps/noctua-form/cam/activity/activity-form/activity-form.component.scss`
- `src/app/main/apps/noctua-form/cam/activity/activity-connector-form/activity-connector-form.component.scss`

**layout & app (3 files)**
- `src/app/layout/components/toolbar/toolbar.component.scss`
- `src/app/layout/components/footer/footer.component.scss`
- `src/app/app.component.scss`

**@noctua components (1 file)**
- `src/@noctua/components/confirm-dialog/confirm-dialog.component.scss`

**@noctua.editor (5 files)**
- `src/@noctua.editor/inline-with/with-dropdown/with-dropdown.component.scss`
- `src/@noctua.editor/inline-reference/reference-dropdown/reference-dropdown.component.scss`
- `src/@noctua.editor/inline-editor/inline-editor.component.scss`
- `src/@noctua.editor/inline-editor/editor-dropdown/editor-dropdown.component.scss`
- `src/@noctua.editor/inline-detail/detail-dropdown/detail-dropdown.component.scss`

**Root styles (1 file)**
- `src/styles.scss`

### Reference Implementation
The `downloads/starter/src/@noctua/styles/` folder shows the correct pattern:
- Uses `@use` with namespacing
- Uses `@forward` to re-export from index files
- Properly scoped variables

---

## Implementation Plan

### Phase 1: Create Foundation Files with @forward

**Step 1.1: Create theming module with @forward**
- [ ] Update `theming.scss` to use `@forward` for its exports
- [ ] Ensure `$theme`, `$typography`, `$primary`, `$accent`, `$warn`, `$background`, `$foreground` are properly forwarded

**Step 1.2: Create mixins index**
- [ ] Create `mixins/_index.scss` that forwards `breakpoints`
- [ ] Update `_breakpoints.scss` if needed for @use compatibility

**Step 1.3: Create partials index**
- [ ] Create `partials/_index.scss` that forwards all partials
- [ ] Each partial may need its own adjustments

---

### Phase 2: Update Individual Partials

**Step 2.1: Update `_mdc-form-field-theme.scss`**
- [ ] Already self-contained with local variables - minimal changes needed
- [ ] Verify no implicit global dependencies

**Step 2.2: Update `_material.scss`**
- [ ] Add `@use '../theming' as theming;` at top
- [ ] Change `$theme` → `theming.$theme`
- [ ] Change `$primary` → `theming.$primary`
- [ ] Change `$accent` → `theming.$accent`
- [ ] Change `map.get($theme, ...)` → `map.get(theming.$theme, ...)`

**Step 2.3: Update `_colors.scss`**
- [ ] Check for global variable usage
- [ ] Add necessary `@use` statements

**Step 2.4: Update `_buttons.scss`**
- [ ] Check for global variable usage
- [ ] Add necessary `@use` statements

**Step 2.5: Update `_forms.scss`**
- [ ] Check for global variable usage
- [ ] Add necessary `@use` statements

**Step 2.6: Update `_typography.scss`**
- [ ] Check for global variable usage
- [ ] Add necessary `@use` statements

**Step 2.7: Update `_cards.scss`**
- [ ] Check for global variable usage
- [ ] Add necessary `@use` statements

**Step 2.8: Update `_scrollbars.scss`**
- [ ] Check for global variable usage
- [ ] Add necessary `@use` statements

**Step 2.9: Update `_alert.scss`**
- [ ] Check for global variable usage
- [ ] Add necessary `@use` statements

**Step 2.10: Update `_angular-material-fix.scss`**
- [ ] Check for global variable usage
- [ ] Add necessary `@use` statements

**Step 2.11: Update plugins partials**
- [ ] Update `plugins/_plugins.scss` to use `@use`
- [ ] Update individual plugin files as needed

---

### Phase 3: Update Main Entry Points

**Step 3.1: Update `noctua.scss`**
- [ ] Change `@import "theming"` → `@use "theming" as *;` (or with namespace)
- [ ] Change `@import "mixins/breakpoints"` → `@use "mixins/breakpoints" as *;`
- [ ] Change `@import "partials/mdc-form-field-theme"` → `@use "partials/mdc-form-field-theme";`
- [ ] Ensure all variables and mixins used in this file are properly namespaced
- [ ] Consider using `@forward` to re-export for core.scss

**Step 3.2: Update `core.scss`**
- [ ] Change `@import "noctua"` → `@use "noctua" as noctua;` or `@use "noctua" as *;`
- [ ] Update `$typography` reference to use proper namespace
- [ ] Update `$theme` reference to use proper namespace
- [ ] Change all partial imports to `@use` statements
- [ ] Ensure Material includes still work: `@include mat.all-component-themes($theme);`

---

### Phase 4: Handle Component SCSS Files (34 files)

**Step 4.1: Update noctua-graph components (4 files)**
- [ ] `noctua-graph.component.scss`
- [ ] `cam-graph.component.scss`
- [ ] `activity-table.component.scss`
- [ ] `activity-connector-table.component.scss`

**Step 4.2: Update noctua-form dialog components (7 files)**
- [ ] `select-evidence.component.scss`
- [ ] `search-evidence.component.scss`
- [ ] `search-database.component.scss`
- [ ] `create-activity.component.scss`
- [ ] `cam-errors.component.scss`
- [ ] `allowed-with-databases.component.scss`
- [ ] `activity-errors.component.scss`

**Step 4.3: Update noctua-form cam components (11 files)**
- [ ] `copy-model.component.scss`
- [ ] `cam-toolbar.component.scss`
- [ ] `activity-tree-table.component.scss`
- [ ] `evidence-table.component.scss`
- [ ] `activity-form-table.component.scss`
- [ ] `activity-form-table-node.component.scss`
- [ ] `cam-form.component.scss`
- [ ] `chemical-connector-form.component.scss`
- [ ] `entity-form.component.scss`
- [ ] `activity-form.component.scss`
- [ ] `activity-connector-form.component.scss`

**Step 4.4: Update layout & app components (3 files)**
- [ ] `toolbar.component.scss`
- [ ] `footer.component.scss`
- [ ] `app.component.scss`

**Step 4.5: Update @noctua components (1 file)**
- [ ] `confirm-dialog.component.scss`

**Step 4.6: Update @noctua.editor components (5 files)**
- [ ] `with-dropdown.component.scss`
- [ ] `reference-dropdown.component.scss`
- [ ] `inline-editor.component.scss`
- [ ] `editor-dropdown.component.scss`
- [ ] `detail-dropdown.component.scss`

**Step 4.7: Update root styles (1 file)**
- [ ] `styles.scss`

**Common pattern for all:**
```scss
// Old
@import "@noctua/scss/noctua";

// New
@use "@noctua/scss/noctua" as noc;
// Then prefix: noc.$variable, @include noc.mixin()
```

---

### Phase 5: Testing & Verification

**Step 5.1: Build verification**
- [ ] Run `npm run build`
- [ ] Verify zero deprecation warnings
- [ ] Verify build completes successfully

**Step 5.2: Visual verification**
- [ ] Run `npm start`
- [ ] Check that all styles render correctly
- [ ] Verify Material components styled properly
- [ ] Check custom components (chips, buttons, forms, etc.)

---

## Key Syntax Changes Reference

### @import → @use
```scss
// Old
@import "theming";
.foo { color: $primary; }

// New
@use "theming";
.foo { color: theming.$primary; }

// Or with namespace wildcard (use sparingly)
@use "theming" as *;
.foo { color: $primary; }
```

### @import → @forward (for re-exporting)
```scss
// In _index.scss
@forward "colors";
@forward "buttons";
@forward "forms";
```

### Accessing map functions
```scss
// Old (with global $theme)
$primary: map.get($theme, primary);

// New (with namespaced theming)
@use '../theming' as theming;
$primary: map.get(theming.$theme, primary);
```

---

## Files to Create

| New File | Purpose |
|----------|---------|
| `mixins/_index.scss` | Forward all mixins |
| `partials/_index.scss` | Forward all partials |

## Files to Modify

| File | Changes |
|------|---------|
| `theming.scss` | Add @forward or ensure variables are accessible |
| `noctua.scss` | Convert @import → @use |
| `core.scss` | Convert @import → @use, namespace variables |
| `partials/_material.scss` | Add @use for theming, namespace variables |
| `partials/_*.scss` | Add @use statements as needed |
| `partials/plugins/_plugins.scss` | Convert @import → @use |
| Various component .scss files | Update imports |

---

## Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | DONE | Created mixins/_index.scss, mixins/_noctua-mixins.scss, updated noctua.scss with @forward |
| Phase 2: Partials | DONE | Updated all partials with @use statements for their dependencies |
| Phase 3: Entry Points | DONE | Updated core.scss, styles.scss with @use, fixed @use rule ordering |
| Phase 4: Components | DONE | Updated 34 component SCSS files from @import to @use |
| Phase 5: Testing | DONE | Build succeeds with zero SCSS @import deprecation warnings |

---

## Risks & Considerations

1. **Variable scoping**: With @use, variables are scoped. Need to ensure all usages are updated.
2. **Circular dependencies**: @use doesn't allow circular imports. May need to restructure if found.
3. **Load order**: @use loads files only once. This is actually better but different from @import behavior.
4. **Component styles**: Many components may import the main scss. All need updating.
5. **Build time**: Should improve slightly since @use caches loaded files.

## Rollback Plan
- Git branch: All changes on feature branch
- Can revert entire branch if issues arise
- Keep @import syntax commented temporarily during transition for reference
