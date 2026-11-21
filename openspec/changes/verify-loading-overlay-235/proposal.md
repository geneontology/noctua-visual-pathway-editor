# Proposal

## Why

Curators could trigger the same save or delete twice while the first was still in flight, sending duplicate changes to Barista (#235). The global loading overlay that blocks the screen during model loads, saves and copies is implemented, but it has never been checked in a browser.

## What Changes

- No code or behavior changes. A browser walkthrough confirms the overlay appears with the right message for each operation, blocks clicks (including inside open dialogs), clears about one second after the work finishes, and never sticks.
- The behavior being checked is already described in `openspec/specs/model-sync/spec.md` (loading overlay requirements).

Out of scope: a click-debounce on individual buttons (considered and rejected; the overlay alone prevents duplicate actions) and blocking keyboard shortcuts while the overlay shows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a verify-only change (`skip_specs: true`).

## Impact

None on code. Needs a running dev server, a valid Barista token, and a model the curator may edit. Throttling the network in DevTools makes the overlay easier to observe.
