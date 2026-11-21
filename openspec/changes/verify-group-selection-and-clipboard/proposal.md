# Proposal

## Why

Group node selection (#114) and its follow-ons — copying and pasting a selected region with its
relations, bulk delete, scoped Auto Layout, the browser clipboard and the Ctrl+S shortcut — are
implemented and covered by unit tests, but have never been exercised in a browser against a real
model. Region paste and bulk delete write to the model, so they must be checked end to end before
they can be trusted. The curator-feedback items from #290 (menu wording, dialog text, Unconnected
nodes) have already been checked in the browser and are not repeated here.

## What Changes

- No behavior changes. This change only tracks the outstanding manual browser checks for
  behavior already described in `openspec/specs/graph-selection-and-clipboard/spec.md`.
- Any defect found during the checks is fixed in a separate change, not here.

Out of scope:
- A drawn bounding box around the selection — deliberately not built; the toolbar selection bar is
  the visual cue, to be revisited only if curators ask.
- Duplicate in place (Ctrl+D / a Duplicate button) and opening a pasted single activity in a
  prefilled Activity Form — neither exists in the app any more; a single copied node pastes through
  the same confirmation dialog as a region.
- Whether Ctrl+S should store the model (the current behavior) or mean something else is a product
  question; this change only verifies the current behavior.
- Minerva-level load testing of large batches.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — verification only (`skip_specs: true`).

## Impact

- No code, API or dependency changes.
- Checks run against a development server (`npm run dev`, port 4208) and a scratch model the
  curator may freely modify.
