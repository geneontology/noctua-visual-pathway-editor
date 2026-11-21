# Proposal

## Why

Activity units with no causal relation to another activity unit are not allowed in a model, and "Unconnected nodes" misses units that only link to a chemical (#305). The "No causal relations" Select-menu check is in the code and covered by unit tests; only the browser check remains.

## What Changes

- No code or spec changes. The `model-analysis` baseline ("No causal relations check", "Chain through one chemical counts as causal") already describes which units are flagged; `graph-selection-and-clipboard` covers the Select-menu entry and its no-match message.
- Track the remaining manual browser check.

Out of scope: reporting these units in the validation errors panel; chains through more than one chemical.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

None beyond verification.
