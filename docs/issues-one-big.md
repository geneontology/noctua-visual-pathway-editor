# VPE Review Notes

Tracking review feedback against the new Visual Pathway Editor.
Use the checkboxes to mark items as done.

---

# 2026-05-27

## Toolbox
- [ ] Rename **Molecule** → **Chemical**
- [ ] Rename **Default** → **Activity Unit**

## Model States
- [ ] Use the model state list from the legacy VPE form config:
  - [ ] `development` — "Development"
  - [ ] `production` — "Production"
  - [ ] `review` — "Review"
  - [ ] `template` — "Template"
  - [ ] `delete` — "Delete"
  - [ ] `internal_test` — "Internal Test"
  - [ ] Remove `closed` (not in the legacy list)

## Layout Menu — match legacy VPE labels
- [ ] **Detail**
  - [ ] `detailed` → "Default"
  - [ ] `activity` → "Simple view"
  - [ ] `simple` → "Preview"
- [ ] **Spacing**
  - [ ] `compact` → "Compact View"
  - [ ] `relaxed` → "Expanded View"

## Causal Relation Form
- [ ] Replace the two-line Subject/Object header with one header line
  - **Before:** _Subject: aire.L Xlae / Object: Btk Mmus_
  - **After:** _Causal Relation Form: Connect aire.L Xlae to Btk Mmus_
- [ ] Remove text wrapping so content fills all the way to the right
- [ ] Font size: keep the same as the rest of the form (revisit later if needed)

## Evidence
- [ ] Drop the count from the section title: `Evidence (1)` → `Evidence`
- [ ] Replace the `×` close icon with a trashcan icon (match the rest of the app)
- [ ] When adding a new evidence row, prefill / show any already-existing evidence
- [ ] Add **Add ISO** menu item wherever **Add ISS** appears (MF / BP / CC, in both Add and Edit menus)
  - evidence = `ECO:0000266` — sequence orthology evidence used in manual assertion
  - reference = `GO_REF:0000024` (same as ISS)
- [ ] Add **Add IC** menu item wherever **Add ISS** appears
  - evidence = `ECO:0000305` — curator inference used in manual assertion
  - reference = `GO_REF:0000036` — manual annotations that require more than one source of functional data to support the assignment of the associated GO term (IC)
- [ ] Confirm 3-letter codes work in autocomplete (currently slow)
  - `IDA` → "inferred from direct assay"
  - `IMP` → "inferred from mutant phenotype"
  - Should behave like the legacy VPE

## Protein-Containing Complex Form
- [ ] Restrict the complex term input to GO **protein-containing complex** terms only (GO:0032991 + descendants)
- [ ] Remove **Search annotation** option from MF, BP, and CC rows
- [ ] Remove **Clear Values** on the protein complex (first line)
- [ ] Change the `…` (ellipsis) menu to a `+` button, offering only **has part**
- [ ] Fix Edit-mode behavior:
  - [ ] Display existing parts (gene products)
  - [ ] Allow adding **has part** (a gene product)
  - [ ] Disallow **part_of CC**

## Chemical Form
- [ ] Remove **Search annotation**
- [ ] Widen the Chemical term box by ~50% so longer chemical names fit
- [ ] When adding a new chemical, remove **Clear values**
- [ ] Change **Add** → **Add context** (in both New and Edit forms)
- [ ] Evidence: disallow GO complexes (mirror Activity Unit behavior)
- [ ] Remove "no evidence present" text next to the chemical (not applicable for Chemical)

### Edit Chemical Form
- [ ] Match labels to the creation form:
  - **Chemical Form** (not "Activity")
  - **Chemical** (not "Function Description")

## Activity Unit Form
- [ ] Change **Add** → **Add context**
- [ ] Stop repeating per-row field labels
  - [ ] Show column headers once at the top: **Evidence**, **Reference**, **With/From**
  - [ ] Drop the inline labels from each row's inputs (rows already follow the same column layout)

---

# 2026-05-22

_Reviewed the new VPE form against the legacy site._

## Bugs / Functionality Causing Annotation Errors

### Nested BPs and "happens during"
- [ ] Remove **Fill with Root** menu item from nested-BP rows reached via `happens during`

### Protein Complex Form
- [ ] Surface the **Molecular Function** root row in the protein complex form (show the MF the complex enables)

### Chemical
- [ ] Remove **Search Annotation**
- [ ] Remove **Add ISS evidence**
- [ ] Remove **Fill with root**
- [ ] Only allow ChEBI terms (and use ChEBI for autofill)

## Nice to Have

### Evidence menus
- [ ] Move **Add ISS evidence** under the **Add Evidence** group for:
  - [ ] MF — both Add and Edit menus
  - [ ] BP — both Add and Edit menus
  - [ ] CC — both Add and Edit menus
- [ ] Add **Add ISS evidence** for nested BPs (skip for `happens during` — no direct annotations available)

### Nested CC menu labels
- [ ] Strip the `CC/` prefix from the Add-menu sub-labels (e.g. `CC/Cell/Anatomy/Organism` → `Cell/Anatomy/Organism`)

### Layout of Forms
- [ ] Standardize font size across all forms
- [ ] Make form dialogs wider so more information is readable
- [ ] Decide form anchor (right vs. centered) and wire it

### Layout of VPE
- [ ] Allow gene labels to display in full (no truncation in the form)

### Protein-Containing Complexes — Remove Iterative Menus
- [ ] In the protein complex form: GP children of the complex (reached via `has_part`) should not re-offer `part of → Protein Complex`
- [ ] In the normal form: when a Protein Complex is reached via `part_of` from a GP, it should not re-offer `has_part → Gene Product`

### Top Menus
- [ ] Simplify _(specifics to be filed separately)_
