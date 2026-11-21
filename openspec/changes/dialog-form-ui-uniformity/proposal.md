# Proposal

## Why

Curators report that fonts, backgrounds and chrome are not uniform across the create and edit dialogs. Every dialog already shares the same header bar, and section headings now share one style, but footers, evidence rows, "add evidence" buttons, body backgrounds and icons are still styled separately in each form, so opening different dialogs looks inconsistent.

## What Changes

- One shared footer (action bar) look for every create/edit dialog: same background, border, padding, button size and right-aligned actions, with an optional left-hand slot for secondary actions (such as Delete or the `Why is the "Save" button disabled?` link). Applied to the Activity Unit / Protein Complex / Chemical forms, the term-and-evidence dialog, the causal relation and chemical connector forms, and the Edit Title, Change State and Copy Model dialogs.
- One shared evidence-row layout (card, column widths, spacing) and one "add evidence" button style across the term-and-evidence dialog and the two connector forms.
- One body background for dialog bodies.
- One icon set for plus and delete icons.
- Purely visual: labels, the buttons offered, enablement rules and saved data stay exactly as they are.

Out of scope (each changes curator-facing wording or behavior, so needs its own decision and change):
- Renaming dialog titles to one verb pattern (today e.g. "Activity Unit Form", "Add part of", "Edit Title", "Change State").
- Renaming the activity form's "Clear" button, or adding a "Cancel" button to the chemical connector form.
- Changing how evidence rows are deleted in the connector forms (trash icon, immediate) versus the term-and-evidence dialog (row menu, with confirmation).
- The causal relation form's `Why is the "Save" button disabled?` button, which currently does nothing when clicked.
- Dialog sizes and dialog anchoring (right vs centre).
- Moving the activity form's "Validation Errors" dialog onto the shared dialog wrapper — already covered by the `finish-local-dialog-pattern` change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

_None._ No spec-level behavior changes, so `skip_specs: true` is set. The existing `activity-editing` requirement "Shared dialog chrome for create and edit dialogs" already states the uniform header and section headings and is not tightened here.

## Impact

- `src/@noctua.core/components/dialog/` (new shared footer piece; the shared dialog wrapper's built-in footer and the confirm dialog reuse it).
- Forms: `src/features/gocam/components/forms/ActivityForm.tsx`, `AnnotationForm.tsx`; `src/features/gocam/components/CamTitleForm.tsx`, `CamStateForm.tsx`, `CopyModelDialog.tsx`; `src/features/relations/components/RelationForm.tsx`, `ChemicalConnectorForm.tsx`.
- No API, data or dependency changes.
