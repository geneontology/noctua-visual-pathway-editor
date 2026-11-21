# Design

## Context

See proposal.md for motivation. Current state, verified in the code:

- **Already uniform:** the header bar (every dialog renders the shared dialog header through the shared dialog wrapper); section headings (one shared section-heading component, whose bar style the activity form's column-header row also uses); font family.
- **Footers:** the shared wrapper's built-in footer, the confirm dialog, the term-and-evidence dialog, Edit Title, Change State and Copy Model use a `gray-50` bar with a `gray-200` top border and `px-4 py-3`. The activity form uses `gray-100`, a `gray-300` border, a fixed 50px height and `px-3`. The causal relation form uses `gray-100`, a drop shadow and a split left/right layout. The chemical connector form uses `gray-100` and offers only "Save". Forms pass `size="sm"` to their buttons; the shared wrapper and confirm dialog footers use the theme default size.
- **Evidence rows:** the term-and-evidence dialog cards each row (bordered, `gray-50`) with 1/2 · 1/4 · 1/4 columns and a row menu; the causal relation form uses bare rows with `grow` / 30% (max 180px) columns and a trash icon; the chemical connector form uses bare rows with 55% / 25% / 20% columns, heavy `p-4` padding and a trash icon.
- **Add-evidence buttons:** light, primary, compact with the main icon set's plus ("Add evidence" / "Add another evidence") versus subtle, compact with a second icon set's plus ("Add Evidence").
- **Body backgrounds:** the activity form body is tinted (`slate-50`); every other dialog body is white.

## Goals / Non-Goals

**Goals:**
- Centralize footer and evidence-row chrome so each form consumes one definition.
- Zero change to text, enablement, button order or saved data.

**Non-Goals:**
- Everything listed as out of scope in proposal.md.
- The dialog header and section-heading component (already uniform).
- The inline single-field term editor popover (not a dialog).

## Decisions

1. **Footer tokens = the majority recipe**: `gray-50` background, `gray-200` top border, `px-4 py-3`, actions right-aligned, buttons at `size="sm"`, secondary actions in an optional left slot. Seven of ten footers already use it; `gray-100` is used by three forms only. The causal relation form keeps Delete and its disabled-reason button in the left slot; its drop shadow is dropped.
2. **A shared footer component in the core dialog folder**, also used for the shared wrapper's built-in footer and the confirm dialog, so a later restyle is a one-file edit. Alternative considered: a class-name constant (as done for section headings) — rejected because the footer also fixes button size and alignment, which a class string cannot enforce.
3. **Evidence row = the term-and-evidence dialog's card layout** (bordered card, `gray-50`, 1/2 · 1/4 · 1/4 columns), as a shared row container that takes the row's action control as a slot. Each form keeps its own action control (row menu or trash icon), so delete behavior does not change.
4. **Add-evidence button = light, primary, compact with the main icon set's plus.** Each form keeps its current label.
5. **Icons:** plus and trash from the main icon set (`react-icons/fa`, already used by 23 files); the second set's plus is replaced.
6. **Body background = white for every dialog body.** The activity form's tint is the only exception today; its rows are already separated by section headings and tree connector lines.

## Risks / Trade-offs

- [The activity form loses its tinted background, which some curators may use to tell it apart] → decisions 1, 3 and 6 are confirmed with the stakeholder (task 1.3) before implementation.
- [A form's buttons get reordered by accident] → the shared footer renders the form's own buttons as children in their existing order; each form is checked in the browser after migration.
- [The activity form footer grows slightly once its fixed 50px height becomes `py-3`] → acceptable; the body scrolls independently.
