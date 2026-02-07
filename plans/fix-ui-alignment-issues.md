# Fix UI Alignment Issues - Activity Forms & Dialogs

## Goal

Fix two specific UI issues:
1. Activity form has horizontal scrolling (should fit without scrolling)
2. Dialog widths are not working correctly

## Issues Analysis

### Issue 1: Activity Form Horizontal Scrolling

**Location**: `entity-form.component.html`

**Root Cause**: The flex layout has improper width constraints:
```html
<!-- Line 39: Term input section -->
<div class="p-4 flex-1 flex flex-row...">

<!-- Line 82: Evidence section -->
<div class="basis-[65%] flex flex-col...">
```

- `flex-1` means "grow to fill remaining space" but has no shrink constraint
- `basis-[65%]` is a starting point, not a max width
- Combined with `p-4` padding on each internal element, total width exceeds container
- Inside evidence section: `w-1/2` + `w-1/4` + `w-1/4` = 100%, but with button at end it overflows

**Fix Options**:
1. Add `overflow-x-hidden` to the drawer body (quick fix)
2. Change layout to use proper width constraints with `shrink-0` and `min-w-0`
3. Use `max-w` constraints on the flex children

### Issue 2: Dialog Widths Not Working

**Location**: Dialog components + `noctua.scss`

**Root Cause**: The `deep-width` mixin sets width on the dialog panel class (`.noc-search-database-dialog`), but:
- MDC dialogs have new container structure
- The inner content may not be constrained by parent width

**Current styling** (noctua.scss:104-111):
```scss
.noc-search-database-dialog {
  @include deep-height(90%);
  @include deep-width(1100px);
}
```

**Fix**: Ensure the dialog content div inherits the width properly or add width constraints to inner elements.

---

## Implementation Plan

### Phase 1: Fix Activity Form Horizontal Scrolling

#### 1.1 Fix entity-form layout

Change the flex layout to properly constrain widths:

**Current** (entity-form.component.html):
```html
<div class="p-4 flex-1 flex flex-row justify-start items-stretch">
<!-- ... term input ... -->
</div>
<div class="basis-[65%] flex flex-col justify-start items-stretch">
<!-- ... evidence section ... -->
</div>
```

**Fix**: Add `min-w-0` to prevent flex items from overflowing:
```html
<div class="p-4 flex-1 min-w-0 flex flex-row justify-start items-stretch">
<!-- ... term input ... -->
</div>
<div class="basis-[65%] min-w-0 flex flex-col justify-start items-stretch">
<!-- ... evidence section ... -->
</div>
```

Also add `overflow-hidden` to the main container and ensure inner elements have proper truncation.

### Phase 2: Fix Dialog Widths

#### 2.1 Verify mat-dialog container passes width

Check that `_angular-material-fix.scss` properly allows width to flow through:
```scss
.mat-mdc-dialog-container {
  padding: 0 !important;
}
```

May need to add:
```scss
.mat-mdc-dialog-surface {
  max-width: 100% !important;
  max-height: 100% !important;
}
```

#### 2.2 Ensure dialog content respects container width

The inner div should use `w-full` (which it does), but may need `max-w-full` to prevent overflow.

---

## Progress Tracking

| Task | Status | Notes |
|------|--------|-------|
| 1.1 Fix entity-form flex layout | DONE | Added `min-w-0` and `overflow-hidden` |
| 1.2 Test activity form scrolling | PENDING | |
| 2.1 Fix mat-dialog-surface | DONE | Added max-width/max-height 100% |
| 2.2 Test dialog widths | PENDING | |

---

## Files to Modify

1. `src/app/main/apps/noctua-form/cam/activity/activity-form/entity-form/entity-form.component.html`
2. `src/@noctua/scss/partials/_angular-material-fix.scss` (if needed for dialogs)

---

## Testing

After fixes:
- [ ] Activity form fits without horizontal scrollbar
- [ ] Search database dialog displays at correct 1100px width
- [ ] Other dialogs display at their defined widths
