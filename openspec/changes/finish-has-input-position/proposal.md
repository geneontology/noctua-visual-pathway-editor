# Proposal

## Why

The `has input` row was moved to render directly below the molecular function (#264), and the ordering is in place in the activity form, the activity table and the activity box. One piece was missed: the activity form's row-connector colour table has no entry for the new has-input group, so has-input rows in the create form draw their tree connector lines without a colour class (and the app type-check reports the missing entry). The change was also never checked in the browser.

## What Changes

- Give has-input rows in the activity create form the same green connector lines as the other molecular-function-level rows (the molecular function and `happens during` rows).
- Run the outstanding manual check of the #264 ordering in all three views.
- No change to ordering, labels, menus or saved data.

Out of scope: moving `happens during` (it stays last, as the issue only concerned `has input`); reordering the "Add Context" menu items, which keep their current order.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

_None._ The ordering behavior is already captured by the "Row ordering within an activity" requirement of `activity-editing`; this change is a visual fix plus verification, so `skip_specs: true` is set.

## Impact

- `src/features/gocam/components/forms/EntityRow.tsx` (connector colour map).
- No API, data or dependency changes.
