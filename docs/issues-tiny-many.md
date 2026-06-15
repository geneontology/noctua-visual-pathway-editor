# Review — Per-Section Issues

Each H1 below is a standalone GitHub issue (title format
`<Section>: <summary>`). Items merged across review dates.

---

# Toolbox: rename Molecule → Chemical, Default → Activity Unit

- [ ] Rename **Molecule** → **Chemical**
- [ ] Rename **Default** → **Activity Unit**

---

# Model States: match legacy VPE list

- [ ] Use the model state list from the legacy VPE form config:
  - [ ] `development` — "Development"
  - [ ] `production` — "Production"
  - [ ] `review` — "Review"
  - [ ] `template` — "Template"
  - [ ] `delete` — "Delete"
  - [ ] `internal_test` — "Internal Test"
- [ ] Remove `closed` (not in the legacy list)

---

# Layout Menu: align Detail and Spacing labels with legacy VPE

- [ ] **Detail**
  - [ ] `detailed` → "Default"
  - [ ] `activity` → "Simple view"
  - [ ] `simple` → "Preview"
- [ ] **Spacing**
  - [ ] `compact` → "Compact View"
  - [ ] `relaxed` → "Expanded View"

---

# Causal Relation Form: header, wrapping, font size

- [ ] Replace the two-line Subject/Object header with one header line
  - **Before:** _Subject: aire.L Xlae / Object: Btk Mmus_
  - **After:** _Causal Relation Form: Connect aire.L Xlae to Btk Mmus_
- [ ] Remove text wrapping so content fills all the way to the right
- [ ] Font size: keep the same as the rest of the form (revisit later if needed)

---

# Evidence: counts, icon, prefill, ISO/IC shortcuts, nested-BP menu

## Section header + row icon
- [ ] Drop the count from the section title: `Evidence (1)` → `Evidence`
- [ ] Replace the `×` close icon with a trashcan icon (match the rest of the app)

## Prefill on add
- [ ] When adding a new evidence row, prefill / show any already-existing evidence

## ISS / ISO / IC shortcuts
- [ ] Move **Add ISS evidence** under the **Add Evidence** group for:
  - [ ] MF — both Add and Edit menus
  - [ ] BP — both Add and Edit menus
  - [ ] CC — both Add and Edit menus
- [ ] Add **Add ISS evidence** for nested BPs (skip for `happens during` — no direct annotations available)
- [ ] Add **Add ISO** menu item wherever **Add ISS** appears
  - evidence = `ECO:0000266` — sequence orthology evidence used in manual assertion
  - reference = `GO_REF:0000024` (same as ISS)
- [ ] Add **Add IC** menu item wherever **Add ISS** appears
  - evidence = `ECO:0000305` — curator inference used in manual assertion
  - reference = `GO_REF:0000036` — manual annotations that require more than one source of functional data to support the assignment of the associated GO term (IC)

## Nested BPs reached via "happens during"
- [ ] Remove the **Fill with Root** menu item from nested-BP rows reached via `happens during`

## Autocomplete
- [ ] Confirm 3-letter codes work in autocomplete (currently slow)
  - `IDA` → "inferred from direct assay"
  - `IMP` → "inferred from mutant phenotype"
  - Should behave like the legacy VPE

---

# Protein-Containing Complex Form: surface MF, restrict terms, fix edit mode, drop iterative menus

## Term restriction
- [ ] Restrict the complex term input to GO **protein-containing complex** terms only (GO:0032991 + descendants)

## Visible structure
- [ ] Surface the **Molecular Function** root row in the protein complex form (show the MF the complex enables)

## Row menu cleanup
- [ ] Remove **Search annotation** option from MF, BP, and CC rows
- [ ] Remove **Clear Values** on the protein complex (first line)
- [ ] Change the `…` (ellipsis) menu to a `+` button, offering only **has part**

## Edit-mode behavior
- [ ] Display existing parts (gene products)
- [ ] Allow adding **has part** (a gene product)
- [ ] Disallow **part_of CC**

## Remove iterative menus
- [ ] In the protein complex form: GP children of the complex (reached via `has_part`) should not re-offer `part of → Protein Complex`
- [ ] In the normal form: when a Protein Complex is reached via `part_of` from a GP, it should not re-offer `has_part → Gene Product`

---

# Chemical Form: width, search annotation, ChEBI-only, Add Context, labels

## Term input
- [ ] Widen the Chemical term box by ~50% so longer chemical names fit
- [ ] Only allow ChEBI terms (and use ChEBI for autofill)

## Menus / actions
- [ ] Remove **Search annotation**
- [ ] When adding a new chemical, remove **Clear values**
- [ ] Change **Add** → **Add Context** (in both New and Edit forms)
- [ ] Remove **Fill with root**

## Evidence
- [ ] Remove **Add ISS evidence** from the Chemical form
- [ ] Evidence: disallow GO complexes (mirror Activity Unit behavior)
- [ ] Remove "no evidence present" text next to the chemical (not applicable for Chemical)

## Edit Chemical Form
- [ ] Match labels to the creation form:
  - **Chemical Form** (not "Activity")
  - **Chemical** (not "Function Description")

---

# Activity Unit Form: Add → Add Context, drop repeated row labels

- [ ] Change **Add** → **Add Context**
- [ ] Stop repeating per-row field labels
  - [ ] Show column headers once at the top: **Evidence**, **Reference**, **With/From**
  - [ ] Drop the inline labels from each row's inputs (rows already follow the same column layout)

---

# Layout of Forms: font size, dialog width, anchor, nested CC labels

- [ ] Standardize font size across all forms
- [ ] Make form dialogs wider so more information is readable
- [ ] Decide form anchor (right vs. centered) and wire it
- [ ] Strip the `CC/` prefix from nested-CC Add-menu sub-labels (e.g. `CC/Cell/Anatomy/Organism` → `Cell/Anatomy/Organism`)

---

# Layout of VPE: show gene labels in full

- [ ] Allow gene labels to display in full (no truncation in the form)

---

# Top Menus: simplify

- [ ] Simplify the top menus _(specifics to be added)_
