# Proposal

## Why

A with/from value whose namespace is not on the allowed list must be rejected with an error before it is saved (#253). The activity form and inline editing in the activity table already reject it, but the evidence dialog (table row menu "Add Evidence" / "Edit Evidence", Add Context, and Search Annotations on an existing row) saves with/from without any check, so a disallowed namespace still reaches the model through that path.

Note: the allowed list now includes `TAIR`, `dictyBase`, and `Ensembl` (it follows the canonical with/from namespace list), so those prefixes are accepted; a disallowed prefix such as `NCBIGene` is used to verify rejection.

## What Changes

- On Save, the evidence dialog runs the with/from validation rule on every evidence row; on failure it shows the error message as an error notification, keeps the dialog open with the curator's values, and saves nothing.
- Manual verification of the already-implemented activity-form and inline paths, with examples updated to the current allowed list.

Out of scope:
- Reference validation in the evidence dialog or in inline reference edits (neither checks the reference prefix today; not requested here).
- Changing the allowed namespace list.

## Capabilities

### New Capabilities

### Modified Capabilities
- `evidence-and-references`: adds with/from validation on Save in the evidence dialog.

## Impact

- Evidence dialog save path in `src/features/gocam/components/forms/` (reuses the existing with/from validation rule and error notification).
- No API or data-model changes.
