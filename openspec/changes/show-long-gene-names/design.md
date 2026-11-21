# Design

## Context

See proposal.md for motivation. A search of the source found no `maxLength` (or similar) cap on any input that edits a gene name. The only place a gene name is visibly cut short is the activity box header on the canvas: a single text line (bold, 12px) beside the coverage icon, limited to one line with an ellipsis inside a 40px-tall header on a 200px-wide box. The relation/term lines below the header already wrap to two lines. The activity drawer header also truncates its title to one line, but the drawer is resizable and the full label is visible in the enabler row beneath it.

## Goals / Non-Goals

**Goals:**
- Long enabler labels readable on the canvas without opening the activity.

**Non-Goals:**
- Changing box width, layout spacing, or how relation lines render.
- The drawer header, top menus, or row action menus.

## Decisions

- **Wrap to two lines rather than widen the box.** Widening every box changes auto-layout spacing for all models; allowing a second header line uses room the 40px header already has (two 12px lines fit beside the 30px icon). Alternative considered: grow the header height for unlimited lines — rejected because very long labels would push the entity lines down unpredictably.
- **Keep the ellipsis beyond two lines** so pathological labels still cannot overflow the box.

## Risks / Trade-offs

- [Second header line sits closer to the first entity line] → verify in the "Default" layout that the two-line header does not overlap the first line; nudge the label's vertical offset if it does.
- [The requested behavior may have meant something else] → task 1.1 confirms with the stakeholder before implementation.
