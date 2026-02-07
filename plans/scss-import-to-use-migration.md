# SCSS @import to @use Migration Plan

## Goal
Eliminate all Sass `@import` deprecation warnings by migrating to the modern `@use` and `@forward` syntax, following the patterns established in `downloads/starter`.

## Current State

### Problems
- 15+ deprecation warnings: "Sass @import rules are deprecated and will be removed in Dart Sass 3.0.0"
- Mixed usage of `@use` and `@import` in the same files
- Global variables accessed implicitly across files (e.g., `$theme`, `$typography`, `$primary`)

### Files Using @import
| File | @import Statements |
|------|-------------------|
| `core.scss` | `@import "noctua"`, `@import "partials/scrollbars"`, etc. (10 imports) |
| `noctua.scss` | `@import "theming"`, `@import "mixins/breakpoints"`, `@import "partials/mdc-form-field-theme"` |
| `partials/_material.scss` | Uses `$theme`, `$primary`, `$accent` from global scope |
| `partials/plugins/_plugins.scss` | Likely has @import for sub-plugins |

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

### Phase 4: Handle Component SCSS Files

**Step 4.1: Audit component .scss files**
- [ ] Find all component .scss files that import from @noctua/scss
- [ ] List files that need updates

**Step 4.2: Update component imports**
- [ ] Update each component's @import to @use
- [ ] Common pattern: `@import "~@noctua/scss/noctua"` → `@use "@noctua/scss/noctua" as noc;`

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
| Phase 1: Foundation | NOT STARTED | |
| Phase 2: Partials | NOT STARTED | |
| Phase 3: Entry Points | NOT STARTED | |
| Phase 4: Components | NOT STARTED | |
| Phase 5: Testing | NOT STARTED | |

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
