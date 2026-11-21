# Proposal

## Why

Dialogs follow a two-tier pattern: entry-point dialogs (opened from the toolbar, a table row, or a menu) use the single global dialog slot, and dialogs opened from inside another dialog or component are rendered locally by their caller so they stack instead of evicting it. Both should share one visual contract through the shared dialog wrapper. Most of this is in place: the Search Annotations picker is rendered locally by the annotation dialog and the activity form, its global-slot entry and callback hand-off are gone, the annotation dialog receives its submit callback directly, and the activity form dialog uses the shared wrapper. One locally rendered dialog still uses a raw modal, and the stacking behavior has not been checked in the browser.

## What Changes

- Render the activity form's "Validation Errors" dialog through the shared dialog wrapper instead of a raw modal, keeping its title, error list, and "Close" button unchanged.
- Manually verify the picker stacking and cancel behavior described in the `term-search` baseline ("Search Annotations is a picker", "Picker stacks over its opener").

Out of scope:
- The "Model Updated" notice in the pathway viewer (a short-lived, non-dismissable notice; deliberately left as is).
- Any change to which dialogs use the global slot.

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- `src/features/gocam/components/forms/ActivityForm.tsx` (errors dialog wrapper only). No behavior or API changes.
