# term-search Specification

## Purpose
Defines how curators find ontology terms and gene products while editing CAMs: the GOlr-backed term autocomplete and the category each field searches, and the Search Annotations picker that pre-fills a term and evidence from a gene product's existing GO annotations.

## Requirements

### Requirement: Term search trigger
The term autocomplete SHALL search the ontology-class index once the curator has typed at least one character and paused briefly, returning up to 50 results. When the query is a single alphanumeric word of three or more characters (or several words) not ending in a space, the last word SHALL be matched as a prefix.

#### Scenario: Prefix search
- **WHEN** the curator types "kinas" in a Molecular Function field and pauses
- **THEN** the results include terms whose label contains a word starting with "kinas", such as "protein kinase activity"

### Requirement: Field search scope by category
Each term field SHALL restrict results to its category: molecular function GO:0003674; biological process GO:0008150; cellular component GO:0005575 excluding protein-containing complex GO:0032991; gene product CHEBI:33695; chemical CHEBI:24431 excluding gene products; protein complex GO:0032991; anatomical entity UBERON:0001062; cell type CL:0000000; organism NCBITaxon:1; biological phase GO:0044848; life stage UBERON:0000105; plant stage PO:0009012.

#### Scenario: Cellular component hides complexes
- **WHEN** the curator searches "complex" in a Cellular Component field
- **THEN** no protein-containing complex terms are returned

#### Scenario: Chemical search hides gene products
- **WHEN** the curator searches a chemical field
- **THEN** results are chemical entities and no gene products are returned

### Requirement: Search scope for existing nodes
When editing an existing node whose stored types span several categories, the system SHALL derive the search scope from the node's most specific categories, dropping any category superseded by another present one (gene product supersedes chemical; protein complex supersedes cellular component). If no type maps to a known category, the node's raw types SHALL be searched.

#### Scenario: Editing a gene-product enabler
- **WHEN** the curator edits the enabler of an existing activity whose gene product is stored with both gene-product and chemical types
- **THEN** the autocomplete returns gene products (e.g. UniProtKB entries) and no CHEBI chemicals

#### Scenario: Editing a complex part
- **WHEN** the curator edits a "has part" member of an existing protein complex
- **THEN** the autocomplete returns gene products

#### Scenario: Editing a chemical
- **WHEN** the curator edits an existing chemical node
- **THEN** the autocomplete returns chemicals and no gene products

### Requirement: Union search ranges
When a field accepts several disjoint categories, the system SHALL search all of them together. The "has input" field SHALL search both gene products and protein complexes.

#### Scenario: Has input search
- **WHEN** the curator searches in a "has input (Gene Product/Protein Complex)" field
- **THEN** results may include both gene products and protein-containing complexes

### Requirement: Evidence code field scope
Evidence code fields SHALL search ECO terms under ECO:0000352 (evidence used in manual assertion).

#### Scenario: Evidence search
- **WHEN** the curator types "sequence" in an Evidence field
- **THEN** only ECO terms used in manual assertion are returned

### Requirement: Suggestions from the model
Before the curator types, a focused term field SHALL list the terms already used in the current model that fall within the field's scope and outside its exclusions; a focused evidence field SHALL list the evidence codes already used in the model.

#### Scenario: Reuse a model term
- **WHEN** the curator focuses an empty Biological Process field in a model that already uses "apoptotic process"
- **THEN** "apoptotic process" is suggested without typing

### Requirement: Search result display
Each result SHALL show the term label and its id; the id SHALL link to the term's external page in a new tab without selecting the result. Selecting a result SHALL set the field to it and display it as `<label> (<id>)`.

#### Scenario: Select a result
- **WHEN** the curator clicks the result "protein kinase activity"
- **THEN** the field shows `protein kinase activity (GO:0004672)`

### Requirement: Unselectable results
Obsolete terms SHALL be shown struck through and SHALL NOT be selectable. Terms in the do-not-annotate subset SHALL be highlighted in red with the tooltip "Do not annotate" and SHALL NOT be selectable, except in fields whose range is a biological phase or life/plant stage, where they SHALL be selectable.

#### Scenario: Do-not-annotate term blocked
- **WHEN** a Biological Process search returns a do-not-annotate term
- **THEN** it is highlighted red, shows "Do not annotate" on hover, and clicking it does nothing

#### Scenario: Phase term allowed in happens during
- **WHEN** the curator searches a "happens during" field
- **THEN** do-not-annotate phase terms are selectable

### Requirement: Search status messages
When the list is open with nothing to show, the autocomplete SHALL display "Type at least 3 characters to search" if nothing has been typed, "Search failed — the term service did not answer. Try again." if the search failed, and otherwise "No results found".

#### Scenario: Search service failure
- **WHEN** the term search request fails
- **THEN** the list reads "Search failed — the term service did not answer. Try again." rather than "No results found"

### Requirement: Autocomplete keyboard behavior
The autocomplete SHALL move the highlight with the arrow keys and select the highlighted result with Enter. Enter SHALL never insert a line break in the field. Escape SHALL close only the result list, not the dialog or drawer containing the field.

#### Scenario: Escape inside a dialog
- **WHEN** the result list is open in a field inside a dialog and the curator presses Escape
- **THEN** the list closes and the dialog stays open

### Requirement: Search Annotations source
The Search Annotations picker SHALL list the existing GO annotations of the activity's gene product for the chosen aspect, excluding NOT-qualified annotations. For cellular component it SHALL include terms that are part of cellular component (GO:0005575) and exclude protein-containing complex (GO:0032991) terms. Results SHALL be grouped by term and sorted by term label.

#### Scenario: Molecular function annotations
- **WHEN** the picker opens for a gene product and the molecular function aspect
- **THEN** the "Select Term" list shows each annotated molecular function term once, in label order

### Requirement: Search Annotations layout
The picker SHALL be a dialog titled "Search Annotations" with a "Select Term" list (subtitle "Please select below", "Loading…" while loading, "No terms found" when empty) and a "Select Evidence (optional)" table for the selected term with columns Evidence, Reference, With, and Assigned By. The table SHALL read "Please select a term to view evidence" before a term is chosen and "No evidence available for this term" when it has none.

#### Scenario: Choose a term
- **WHEN** the curator clicks a term in the "Select Term" list
- **THEN** it is marked selected and the evidence table lists that term's evidence with reference, with/from, and assigning group

### Requirement: Annotation extensions in the picker
For each evidence, the picker SHALL list its annotation extensions as "Ext: <relation> : <target>", showing the target as returned and linking it to the issuing database's own page. Hovering a target SHALL show its label, looked up on demand ("Looking up…" while pending).

#### Scenario: Hover an extension target
- **WHEN** the curator hovers an extension target shown as a bare gene-product id
- **THEN** a tooltip shows the gene product's label and the displayed text is unchanged

### Requirement: Search Annotations evidence selection
The curator SHALL be able to select evidence rows individually (row click or checkbox) or all at once with the header checkbox, which shows a partial state when some are selected. Choosing a different term SHALL clear the evidence selection. The footer SHALL read "<n> of <total> evidence selected" when evidence is selected, otherwise "Select evidence (optional) to copy along with the term".

#### Scenario: Select all evidence
- **WHEN** a term with three evidences is selected and the curator ticks the header checkbox
- **THEN** all three rows are selected and the footer reads "3 of 3 evidence selected"

### Requirement: Search Annotations is a picker
The picker SHALL NOT save anything to the model. "Done" SHALL be disabled until a term is selected; clicking it SHALL hand the selected term and selected evidence to whatever opened the picker and close it. "Cancel" or closing the dialog SHALL discard the selection.

#### Scenario: Done pre-fills without saving
- **WHEN** the curator selects a term and two evidences and clicks "Done"
- **THEN** the opening form is pre-filled with them and the model is not changed until the curator saves that form

### Requirement: Picker stacks over its opener
The picker SHALL open on top of the form that opened it without closing that form. Closing the picker by "Cancel", Escape, or a backdrop click SHALL close only the picker and SHALL leave the form and anything already typed in it intact.

#### Scenario: Cancel keeps typed values
- **WHEN** the curator types a reference in the annotation dialog, opens Search Annotations, then clicks "Cancel"
- **THEN** the annotation dialog is still open with the typed reference

### Requirement: Preselect the current term
When the picker is opened for a row that already has a term and that term is among the results, the system SHALL select it by default once results load; a manual selection SHALL take precedence.

#### Scenario: Current term preselected
- **WHEN** the curator opens Search Annotations on a molecular function row whose term appears in the gene product's annotations
- **THEN** that term is already selected and its evidence is shown

### Requirement: Search Annotations in the activity form
In the activity form, rows whose term has a GO aspect SHALL offer "Search Annotations" in their ⋮ menu, only in activity-unit forms (not chemical or protein-complex forms). If the form has no gene product yet, choosing it SHALL show the warning "Add a gene product first to search annotations" instead of opening the picker.

#### Scenario: No gene product yet
- **WHEN** the curator chooses "Search Annotations" on the Molecular Function row before entering a gene product
- **THEN** the warning "Add a gene product first to search annotations" is shown and the picker does not open

#### Scenario: Hidden in chemical and complex forms
- **WHEN** the curator opens a row menu in a chemical or protein-complex form
- **THEN** "Search Annotations" is not offered

### Requirement: Applying a pick in the activity form
On "Done" in the activity form, the system SHALL set the row's term to the picked term and, when evidence was picked, SHALL replace that row's evidence with the picked evidence; when no evidence was picked the row's existing evidence SHALL be kept.

#### Scenario: Term only
- **WHEN** the curator picks a term without evidence and clicks "Done"
- **THEN** the row's term changes and its existing evidence is unchanged

### Requirement: Search Annotations in the annotation dialog
The term section of the annotation dialog SHALL show a "Search Annotations" button when the activity has an enabler and the term being edited has a GO aspect. On "Done" the dialog SHALL set its term to the picked term and replace its evidence rows with the picked evidence, or with one blank row when none was picked.

#### Scenario: Add context with Search Annotations
- **WHEN** the curator uses Add Context → "part of" on a molecular function in the activity table, clicks "Search Annotations", and picks a term with one evidence
- **THEN** the dialog's term and a single evidence row are pre-filled and nothing is saved until "Save"

### Requirement: Search Annotations on an existing activity
In the activity table, rows with a statement whose term has a GO aspect SHALL offer "Search Annotations" as the first ⋮ menu item when the activity has an enabler and is not a chemical or protein-complex activity. It SHALL open the annotation dialog titled "Edit <term label>", pre-filled with the row's current term and all of its evidence. On Save the system SHALL replace the term if it changed and reconcile the evidence in a single model update.

#### Scenario: Change an existing molecular function
- **WHEN** the curator chooses "Search Annotations" on an existing activity's Molecular Function row, picks a different term with its evidence, clicks "Done", then "Save"
- **THEN** the row shows the new term and evidence after one model update

#### Scenario: Not offered for complexes
- **WHEN** the curator opens the row menu of a protein-complex activity in the activity table
- **THEN** "Search Annotations" is not offered
