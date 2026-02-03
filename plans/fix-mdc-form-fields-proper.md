# Fix MDC Form Fields - Proper CSS Custom Properties Approach

## Goal

Fix input/form field styling by using Angular Material MDC's CSS custom properties system instead of targeting internal class names.

## Problem Analysis

The previous approach (fix-mdc-inputs-autocomplete.md) only renamed CSS selectors from legacy to MDC class names. This doesn't work because:

1. **MDC components use CSS custom properties (CSS variables)** for theming
2. **Direct class targeting is fragile** and can break with Angular Material updates
3. **The outline appearance** requires specific MDC custom properties to control borders, spacing, labels, etc.

## MDC CSS Custom Properties Reference

### Outlined Text Field Properties

```scss
// Container and outline
--mdc-outlined-text-field-outline-width: 1px;
--mdc-outlined-text-field-focus-outline-width: 2px;
--mdc-outlined-text-field-container-shape: 4px;

// Colors
--mdc-outlined-text-field-outline-color: rgba(0, 0, 0, 0.38);
--mdc-outlined-text-field-hover-outline-color: rgba(0, 0, 0, 0.87);
--mdc-outlined-text-field-focus-outline-color: #3b5998;
--mdc-outlined-text-field-error-outline-color: #f44336;
--mdc-outlined-text-field-disabled-outline-color: rgba(0, 0, 0, 0.06);

// Label colors
--mdc-outlined-text-field-label-text-color: rgba(0, 0, 0, 0.6);
--mdc-outlined-text-field-hover-label-text-color: rgba(0, 0, 0, 0.87);
--mdc-outlined-text-field-focus-label-text-color: #3b5998;
--mdc-outlined-text-field-error-label-text-color: #f44336;
--mdc-outlined-text-field-disabled-label-text-color: rgba(0, 0, 0, 0.38);

// Input text
--mdc-outlined-text-field-input-text-color: rgba(0, 0, 0, 0.87);
--mdc-outlined-text-field-disabled-input-text-color: rgba(0, 0, 0, 0.38);
--mdc-outlined-text-field-input-text-placeholder-color: rgba(0, 0, 0, 0.6);

// Caret
--mdc-outlined-text-field-caret-color: #3b5998;
--mdc-outlined-text-field-error-caret-color: #f44336;
```

### Angular Material Form Field Properties

```scss
// Subscript (error/hint text area)
--mat-form-field-subscript-text-size: 12px;
--mat-form-field-subscript-text-line-height: 16px;
--mat-form-field-subscript-text-tracking: 0.4px;

// Container
--mat-form-field-container-height: 56px;
--mat-form-field-filled-with-label-container-padding-top: 24px;
--mat-form-field-filled-with-label-container-padding-bottom: 8px;

// For outlined specifically
--mat-form-field-container-vertical-padding: 16px;
--mat-form-field-container-text-size: 16px;
--mat-form-field-container-text-line-height: 24px;

// State layer (hover/focus effects)
--mat-form-field-state-layer-color: transparent;
--mat-form-field-error-text-color: #f44336;
--mat-form-field-disabled-text-color: rgba(0, 0, 0, 0.38);
```

### Select Properties

```scss
--mat-select-trigger-text-size: 16px;
--mat-select-enabled-trigger-text-color: rgba(0, 0, 0, 0.87);
--mat-select-disabled-trigger-text-color: rgba(0, 0, 0, 0.38);
--mat-select-placeholder-text-color: rgba(0, 0, 0, 0.6);
--mat-select-enabled-arrow-color: rgba(0, 0, 0, 0.54);
--mat-select-disabled-arrow-color: rgba(0, 0, 0, 0.38);
--mat-select-focused-arrow-color: #3b5998;
--mat-select-invalid-arrow-color: #f44336;

// Panel
--mat-select-panel-background-color: white;
```

### Option Properties

```scss
--mat-option-label-text-size: 16px;
--mat-option-label-text-color: rgba(0, 0, 0, 0.87);
--mat-option-hover-state-layer-color: rgba(0, 0, 0, 0.04);
--mat-option-focus-state-layer-color: rgba(0, 0, 0, 0.12);
--mat-option-selected-state-layer-color: rgba(59, 89, 152, 0.12);
--mat-option-selected-state-label-text-color: #3b5998;
```

### Autocomplete Properties

```scss
--mat-autocomplete-background-color: white;
```

## Implementation Plan

### Phase 1: Create MDC Form Field Theme File

**File:** `src/@noctua/scss/partials/_mdc-form-field-theme.scss` (NEW)

Create a dedicated file for MDC form field theming using CSS custom properties:

```scss
// =============================================================================
// MDC Form Field Theme - CSS Custom Properties
// =============================================================================

// Primary color for Noctua
$noc-primary: #3b5998;
$noc-primary-rgb: 59, 89, 152;

// =============================================================================
// Outlined Text Field Theme
// =============================================================================

:root {
  // Outline styling
  --mdc-outlined-text-field-outline-width: 1px;
  --mdc-outlined-text-field-focus-outline-width: 2px;
  --mdc-outlined-text-field-container-shape: 4px;

  // Outline colors
  --mdc-outlined-text-field-outline-color: rgba(0, 0, 0, 0.38);
  --mdc-outlined-text-field-hover-outline-color: rgba(0, 0, 0, 0.87);
  --mdc-outlined-text-field-focus-outline-color: #{$noc-primary};
  --mdc-outlined-text-field-error-outline-color: #f44336;
  --mdc-outlined-text-field-disabled-outline-color: rgba(0, 0, 0, 0.12);

  // Label colors
  --mdc-outlined-text-field-label-text-color: rgba(0, 0, 0, 0.6);
  --mdc-outlined-text-field-hover-label-text-color: rgba(0, 0, 0, 0.87);
  --mdc-outlined-text-field-focus-label-text-color: #{$noc-primary};
  --mdc-outlined-text-field-error-label-text-color: #f44336;
  --mdc-outlined-text-field-disabled-label-text-color: rgba(0, 0, 0, 0.38);

  // Input text
  --mdc-outlined-text-field-input-text-color: rgba(0, 0, 0, 0.87);
  --mdc-outlined-text-field-disabled-input-text-color: rgba(0, 0, 0, 0.38);
  --mdc-outlined-text-field-input-text-placeholder-color: rgba(0, 0, 0, 0.6);

  // Caret
  --mdc-outlined-text-field-caret-color: #{$noc-primary};
  --mdc-outlined-text-field-error-caret-color: #f44336;
}

// =============================================================================
// Form Field Container Sizing
// =============================================================================

:root {
  // Default sizing
  --mat-form-field-container-height: 56px;
  --mat-form-field-container-vertical-padding: 16px;
  --mat-form-field-container-text-size: 16px;
  --mat-form-field-container-text-line-height: 24px;

  // Subscript (hints/errors)
  --mat-form-field-subscript-text-size: 12px;
  --mat-form-field-subscript-text-line-height: 16px;
}

// =============================================================================
// Select Theme
// =============================================================================

:root {
  --mat-select-trigger-text-size: 16px;
  --mat-select-enabled-trigger-text-color: rgba(0, 0, 0, 0.87);
  --mat-select-disabled-trigger-text-color: rgba(0, 0, 0, 0.38);
  --mat-select-placeholder-text-color: rgba(0, 0, 0, 0.6);
  --mat-select-enabled-arrow-color: rgba(0, 0, 0, 0.54);
  --mat-select-disabled-arrow-color: rgba(0, 0, 0, 0.38);
  --mat-select-focused-arrow-color: #{$noc-primary};
  --mat-select-invalid-arrow-color: #f44336;
  --mat-select-panel-background-color: white;
}

// =============================================================================
// Option Theme
// =============================================================================

:root {
  --mat-option-label-text-size: 14px;
  --mat-option-label-text-color: rgba(0, 0, 0, 0.87);
  --mat-option-hover-state-layer-color: rgba(0, 0, 0, 0.04);
  --mat-option-focus-state-layer-color: rgba(0, 0, 0, 0.12);
  --mat-option-selected-state-layer-color: rgba(#{$noc-primary-rgb}, 0.12);
  --mat-option-selected-state-label-text-color: #{$noc-primary};
}

// =============================================================================
// Autocomplete Theme
// =============================================================================

:root {
  --mat-autocomplete-background-color: #fbf9de; // Noctua light yellow
}

// =============================================================================
// Small Form Field Variant (.noc-sm)
// =============================================================================

.mat-mdc-form-field.noc-sm {
  --mat-form-field-container-height: 40px;
  --mat-form-field-container-vertical-padding: 8px;
  --mat-form-field-container-text-size: 12px;
  --mat-form-field-container-text-line-height: 16px;
  --mdc-outlined-text-field-container-shape: 4px;

  font-size: 12px;
}

// =============================================================================
// Extra Small Form Field Variant (.noc-xs)
// =============================================================================

.mat-mdc-form-field.noc-xs {
  --mat-form-field-container-height: 32px;
  --mat-form-field-container-vertical-padding: 4px;
  --mat-form-field-container-text-size: 11px;
  --mat-form-field-container-text-line-height: 14px;
  --mdc-outlined-text-field-container-shape: 3px;

  font-size: 11px;
}

// =============================================================================
// Form Field Subscript Hidden (no error/hint space)
// =============================================================================

.mat-mdc-form-field.noc-no-subscript {
  .mat-mdc-form-field-subscript-wrapper {
    display: none;
  }
}

// Hide subscript by default (Noctua doesn't show hints/errors inline)
.mat-mdc-form-field {
  .mat-mdc-form-field-subscript-wrapper {
    display: none;
  }
}
```

### Phase 2: Update Main SCSS Import

**File:** `src/@noctua/scss/noctua.scss`

Add import for the new theme file and remove old class-based overrides:

```scss
@import "theming";
@import "mixins/breakpoints";
@import "partials/mdc-form-field-theme"; // ADD THIS LINE

// ... rest of file
```

### Phase 3: Clean Up Old Form Field Overrides

**File:** `src/@noctua/scss/noctua.scss`

Remove the old `.mat-mdc-form-field` block (lines 199-221) since it will be handled by CSS custom properties.

**File:** `src/@noctua/scss/partials/_angular-material-fix.scss`

Remove or simplify the form field and select overrides (lines 189-236) - keep only what CSS custom properties can't handle.

**File:** `src/@noctua/scss/partials/_colors.scss`

Remove the form field color overrides in `generateMaterialElementColors` mixin since colors will come from CSS custom properties.

### Phase 4: Update Autocomplete Panel Styling

**File:** `src/@noctua/scss/partials/_material.scss`

Keep the autocomplete customization but ensure it works with MDC:

```scss
// Term autocomplete panel customization
.mat-mdc-autocomplete-panel.noc-term-autocomplete {
  --mat-autocomplete-background-color: #fbf9de;
  width: 400px !important;
  max-width: 400px !important;
  min-width: 400px !important;

  &.scard-lg {
    width: 600px !important;
    max-width: 600px !important;
    min-width: 600px !important;
  }

  .mat-mdc-option {
    --mat-option-label-text-size: 12px;
    padding: 8px !important;
    border-bottom: rgba(59, 89, 152, 0.6) solid 1px;
    height: auto !important;
    min-height: 40px;
    white-space: normal !important;

    .noc-term-id {
      font-size: 10px;
    }

    .noc-term-label {
      font-size: 12px;
    }

    &.mat-mdc-option-disabled,
    &.mdc-list-item--disabled {
      --mat-option-label-text-color: rgba(0, 0, 0, 0.38);
      background-color: #f8cccc;
      opacity: 1;
    }
  }
}
```

### Phase 5: Test and Verify

1. Run `npm start` to start dev server
2. Check form fields in:
   - Activity forms (term autocomplete)
   - Evidence dialogs
   - Reference inputs
   - Select dropdowns (state, etc.)
3. Verify:
   - [ ] Outline borders appear correctly
   - [ ] Labels float properly on focus/filled
   - [ ] Focus state shows primary color (#3b5998)
   - [ ] Small form fields (.noc-sm) have reduced height
   - [ ] Autocomplete panel has yellow background
   - [ ] Disabled options have red background
   - [ ] Select dropdowns work properly

## Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Create MDC theme file | ✓ DONE | Created _mdc-form-field-theme.scss with CSS custom properties |
| Phase 2: Update imports | ✓ DONE | Added import to noctua.scss, removed old overrides |
| Phase 3: Clean up old overrides | ✓ DONE | Cleaned _angular-material-fix.scss |
| Phase 4: Update autocomplete | ✓ DONE | Updated with CSS custom properties |
| Phase 5: Clean up colors | ✓ DONE | Removed form field overrides from _colors.scss |
| Phase 6: Build and test | ✓ DONE | Build successful, CSS size reduced by ~400KB |

## Files to Create/Modify

1. **CREATE:** `src/@noctua/scss/partials/_mdc-form-field-theme.scss`
2. **MODIFY:** `src/@noctua/scss/noctua.scss` - Add import, remove old overrides
3. **MODIFY:** `src/@noctua/scss/partials/_angular-material-fix.scss` - Clean up
4. **MODIFY:** `src/@noctua/scss/partials/_material.scss` - Update autocomplete
5. **MODIFY:** `src/@noctua/scss/partials/_colors.scss` - Remove form field colors

## Notes

- CSS custom properties are the **official way** to theme MDC components
- This approach is **future-proof** as Angular Material continues to update
- The `:root` selector ensures properties are available globally
- Class-specific overrides (`.noc-sm`) can override the root values locally
- Some structural CSS may still be needed for layout-specific things
