# Task: Fix Dialog Structure and Button Styling

## Goal
1. Fix dialog boxes to have proper header, footer, and scrollable content sections (based on old code patterns)
2. Fix dialog widths to match old code specifications
3. Fix icon buttons - icons are not well positioned inside buttons
4. Fix buttons that should be flex row but are wrapping

## Current State

### Analysis Complete

**Dialogs:**
- Dialog structure styles ARE defined in `noctua.common.scss` (lines 96-141) - `.noc-dialog`, `.noc-dialog-header`, `.noc-dialog-body`, `.noc-dialog-footer`
- Some dialogs (like `select-evidence`) don't use the `.noc-dialog` parent class - they use `mat-toolbar` instead
- The `.dialog-content-wrapper` class has no styles defined
- Dialog widths are correctly defined in `noctua.scss` (lines 74-165)

**Icon Buttons:**
- Current `_angular-material-fix.scss` has icon button fixes but missing key properties from starter template
- Missing `display: inline-flex !important` for proper centering
- Missing `align-items: center` and `justify-content: center`

**Button Layout:**
- Missing `white-space: nowrap` on `.mdc-button__label` to prevent text wrapping
- The starter template has this fix at lines 251-255

### What Needs to Change
1. Add missing icon button centering properties
2. Add button label nowrap rule
3. Verify all dialogs use consistent structure

## Reference Code Analysis

### Old Code Dialog Pattern (downloads/old-code/src)
```scss
// noctua.common.scss lines 88-133
.noc-dialog-header {
  padding: 0 12px;
  background-color: rgba(map-get($primary, default), 0.7);
  color: #eee;
  @include deep-height(40px);
  @include mat.elevation(2);
  z-index: 1000;
}

.noc-dialog-body {
  @include deep-height(calc(100% - 90px));  // 90px = header(40px) + footer(50px)
}

.noc-dialog-footer {
  padding: 0 12px;
  @include deep-height(50px);
  background-color: #f2f2f2;
  border-top: 1px solid #ccc;
  z-index: 1000;
  box-shadow: 2px -5px 2px 0px rgba(0, 0, 0, 0.26);
}
```

### Starter Template Button Pattern (downloads/starter/src)
```scss
// angular-material.scss
.mat-mdc-icon-button {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 40px !important;
  padding: 0 !important;
}

// Standard buttons all 40px height
.mat-mdc-button,
.mat-mdc-raised-button,
.mat-mdc-outlined-button,
.mat-mdc-unelevated-button,
.mat-mdc-icon-button {
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  line-height: 1 !important;
}
```

## Implementation Plan

### Phase 1: Add Dialog Structure SCSS
- [x] Dialog styles already exist in `noctua.common.scss` (lines 104-153)
- [x] Added `overflow-y: auto` and `flex: 1` to `.noc-dialog-body`
- [x] Added `flex-shrink: 0` to header and footer to keep them fixed
- [x] `.noc-dialog-header-title` styles already exist
- [x] Added `.dialog-content-wrapper` styles

### Phase 2: Verify Dialog Widths
- [x] Dialog widths verified in `noctua.scss` (lines 74-165) - all correct
- [x] Responsive breakpoints properly applied with `media-breakpoint("lt-lg")`
- [x] No changes needed

### Phase 3: Fix Icon Button Styling
- [x] Added `display: inline-flex !important` to `.mat-mdc-icon-button`
- [x] Added `align-items: center` and `justify-content: center`
- [x] Added `padding: 0 !important` for proper centering
- [x] Added `.mat-icon` flex centering within icon buttons

### Phase 4: Fix Button Row Layout
- [x] Added `flex-shrink: 0` to all button types to prevent shrinking
- [x] Added `white-space: nowrap` to `.mdc-button__label` to prevent text wrapping
- [x] Button containers now maintain proper flex row layout

### Phase 5: Update Dialog Templates (if needed)
- [x] Templates reviewed - all use proper class structure
- [x] Some dialogs use `mat-toolbar` for header (valid alternative)
- [ ] Visual testing pending

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1 | Complete | 5/5 |
| Phase 2 | Complete | 3/3 |
| Phase 3 | Complete | 4/4 |
| Phase 4 | Complete | 3/3 |
| Phase 5 | In Progress | 2/3 |

## Files to Create/Modify

| File | Action | Status |
|------|--------|--------|
| src/@noctua.common/scss/noctua.common.scss | Modify - Add dialog/drawer flex structure | Done |
| src/@noctua/scss/partials/_angular-material-fix.scss | Modify - Add icon button + nowrap fixes | Done |
| src/@noctua/scss/noctua.scss | Review - Verify dialog widths | Done |
| activity-form.component.html | Fix - Remove pb-[200px], fix footer | Done |
| activity-connector-form.component.html | Fix - Remove overflow-y-auto, fix footer | Done |
| chemical-connector-form.component.html | Fix - Remove overflow-y-auto, fix footer | Done |

## Dialog Width Reference (from old code)

| Dialog Class | Width | Height |
|--------------|-------|--------|
| `.noc-activity-create-dialog` | 900px | 90% |
| `.noc-select-evidence-dialog` | 1100px | - |
| `.noc-search-database-dialog` | 1100px | 90% |
| `.noc-add-evidence-dialog` | 600px | 200px |
| `.noc-confirm-copy-model-dialog` | 600px | 200px |
| `.noc-search-evidence-dialog` | 1000px | 90% |
| `.noc-preview-activity-dialog` | 1100px | 90% |

## Icon Button Reference (from starter)

```scss
// Key fixes needed
.mat-mdc-icon-button {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 40px !important;
  height: 40px !important;
  padding: 0 !important;

  .mat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
```

## Dependencies
- [x] Angular Material 20+ (installed)
- [x] SCSS mixins available (deep-height, deep-width, etc.)

## Blockers
- None currently

## Next Steps
1. Run `npm start` to test changes visually
2. Verify all dialogs have proper fixed header/footer with scrollable body
3. Verify icon buttons are properly centered
4. Verify buttons don't wrap in flex containers

## Notes
- `.noc-drawer` now has `display: flex; flex-direction: column; height: 100%`
- `.noc-drawer-header` and `.noc-drawer-footer` have `flex-shrink: 0`
- `.noc-drawer-body` has `flex: 1; overflow-y: auto`
- Same pattern applied to `.noc-dialog` structure
- Removed redundant Tailwind classes from templates that conflicted with CSS
- Icon buttons now properly centered with `display: inline-flex; align-items: center; justify-content: center`
- Button labels have `white-space: nowrap` to prevent wrapping
