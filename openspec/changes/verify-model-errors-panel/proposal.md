# Proposal

## Why

The model validation-errors panel needed clearer labels and must not count edges between activities or to chemicals as errors (#184). This is implemented: the panel shows "Data model violation errors (ShEx)", "Activity Units / Chemicals errors", and "Relations errors"; orphaned nodes are split into "Node not shown" and "Node/relation combination not allowed"; only edges outside every activity and activity-to-activity connection count as relation errors. Only a manual check in the browser remains.

## What Changes

- No code or requirement changes. This change tracks the remaining manual verification.

Out of scope: no baseline capability in this migration currently owns the model validation-errors panel; describing it in a main spec is left to whichever capability takes that area.

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- None (verification only).
