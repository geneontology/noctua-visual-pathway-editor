# Proposal

## Why

Drawing a connection between two activities and closing the relation dialog without saving used to leave a line on the graph that could not be edited or deleted, and that blocked drawing the connection again with a false "Activities Already Connected" warning. The fix is in the code; only the browser check remains.

## What Changes

- No code or spec changes. The `activity-relations` baseline ("No line without a saved relation", "One relation per pair of nodes") already describes the fixed behavior.
- Track the remaining manual browser check.

Out of scope: keeping the drawn line visible while the dialog is open, and any extra handling when a double-clicked line has no saved relation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

None beyond verification.
