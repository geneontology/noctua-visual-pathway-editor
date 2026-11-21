# Proposal

## Why

Curators asked to "allow more characters for gene names". There is no character limit on any gene-product input: the enabler, has-input and has-part term fields accept any length. What cuts long gene names short is the activity box on the canvas, whose header shows the enabler label on a single line and truncates the rest with an ellipsis, so long gene-product labels (and long complex labels) cannot be read without opening the activity.

## What Changes

- The activity box header shows the enabler label on up to two lines, wrapping long names, before truncating with an ellipsis.
- The box stays the same width; only the header text wraps within the existing header height.

Out of scope (each blocked until the stakeholder provides details, and not part of this change):
- "Simplify the top menus" — depends on a top-menu specification that has not been provided.
- "Form: more action menus" — not yet defined; needs clarification of which rows or forms should get which actions.
- Line wrapping for the relation/term lines inside the box, which already wrap to two lines.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `activity-editing`: adds a requirement for how the activity box header displays long enabler labels.

## Impact

- Canvas activity box shape (`src/features/pathway/graph/shapes.ts` header label wrapping).
- No API, data or dependency changes.
