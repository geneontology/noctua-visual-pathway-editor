# activity-editing Specification

## Purpose
Creating and editing activities in a Causal Activity Model: the activity create forms (Activity Unit, Protein Complex, Chemical), the per-row entity menus, the activity table used to edit an existing activity, the add-term-and-evidence dialog, the per-field model edits on the CAM toolbar, and how an activity box renders its lines on the canvas.

## Requirements

### Requirement: Create an activity from the toolbox
The system SHALL let a logged-in curator drag an "ACTIVITY UNIT", "PROTEIN COMPLEX" or "CHEMICAL" item from the toolbox onto the canvas, and SHALL then open a blank create form of that type titled "Activity Unit Form", "Protein Complex Form" or "Chemical Form" respectively. Dismissing the form without saving SHALL NOT place anything on the canvas.

#### Scenario: Drop an activity unit
- **WHEN** the curator drags "ACTIVITY UNIT" from the toolbox onto the canvas
- **THEN** a dialog titled "Activity Unit Form" opens with a blank activity unit template

#### Scenario: Dismiss a create form
- **WHEN** the curator drops "CHEMICAL" on the canvas and then closes the "Chemical Form" dialog without saving
- **THEN** no new activity is created and a later-created activity is not placed at the earlier drop point

### Requirement: Activity Unit form template
The Activity Unit create form SHALL show a "Gene Product" section holding the enabler row and a "Function Description" section holding, in order, the required "Molecular Function" row, the "(MF) part of (BP)" row and the "(MF) occurs in (CC)" row. The enabler row SHALL be labelled "enabled by (GP)" and SHALL be required.

#### Scenario: Blank activity unit
- **WHEN** the "Activity Unit Form" opens
- **THEN** it shows an empty "enabled by (GP)" row under "Gene Product" and empty "Molecular Function", "(MF) part of (BP)" and "(MF) occurs in (CC)" rows under "Function Description"

### Requirement: Enabled-by evidence sits on the molecular function row
In the activity create form, the evidence for the `enabled by` relation SHALL be entered on the molecular function row, and the enabler row itself SHALL show no evidence columns; its term field SHALL widen to fill the row.

#### Scenario: Evidence columns placement
- **WHEN** the curator views the "Activity Unit Form"
- **THEN** the Molecular Function row shows the evidence, reference and with/from fields and the gene product row shows only its term field

### Requirement: Protein Complex form template
The Protein Complex create form SHALL show a visible, required "Molecular Function" row, a required protein complex enabler with no parts, and the "(MF) part of (BP)" and "(MF) occurs in (CC)" rows. Above the sections it SHALL show the note "Note that this should be used rarely, and only in the case where the activity cannot be ascribed to a single subunit of a complex".

#### Scenario: Complex starts with no parts
- **WHEN** the "Protein Complex Form" opens
- **THEN** the protein complex row has no has-part rows beneath it and the Molecular Function row is visible and editable

### Requirement: Chemical form template
The Chemical create form SHALL show a "Chemical" section holding the required chemical row, which carries no evidence fields, and a "Location (optional)" section holding a "(Chemical) located in (CC)" row.

#### Scenario: Blank chemical
- **WHEN** the "Chemical Form" opens
- **THEN** it shows a "Chemical" section with a single chemical term field without evidence fields, and a "Location (optional)" section with a "(Chemical) located in (CC)" row

### Requirement: Required rows must have a term
In the activity create form, each required row (the molecular function, the gene product or protein complex enabler, or the chemical) without a term SHALL produce the validation error `"<row label>" is required`, which keeps "Save" disabled.

#### Scenario: Missing molecular function
- **WHEN** the curator fills the gene product but leaves "Molecular Function" empty
- **THEN** "Save" is disabled and the "Validation Errors" dialog lists `"Molecular Function" is required`

### Requirement: Saving a new activity
When the curator saves a valid create form, the system SHALL create every row that has a term, together with its relation to its parent row and that relation's evidence, in a single model update, SHALL skip rows left without a term (and the rows beneath them), and SHALL close the dialog.

#### Scenario: Optional rows left blank
- **WHEN** the curator saves an activity unit with a gene product and molecular function but an empty "(MF) occurs in (CC)" row
- **THEN** the activity is created without an occurs-in relation and the dialog closes

### Requirement: Default model title from the first activity
When an activity is created in a model that has no title, the system SHALL also set the model title to "enabled by <gene product label>", using the gene product found under the enabler (directly or as a protein complex part). When no gene product is present, or the model already has a title, the title SHALL NOT change.

#### Scenario: First activity names the model
- **WHEN** the curator saves an activity unit enabled by gene product "ABC1" in an untitled model
- **THEN** the model title becomes "enabled by ABC1"

### Requirement: Clear resets the create form
The create form footer SHALL offer "Clear", which resets every field to a blank template of the same activity type and keeps the dialog open.

#### Scenario: Clear a partially filled form
- **WHEN** the curator has filled several rows of the "Protein Complex Form" and clicks "Clear"
- **THEN** the form shows a blank protein complex template and stays open

### Requirement: Protein complex as has input
The `has input` relation on a molecular function SHALL accept a protein complex as well as a gene product, and a saved protein-complex input SHALL be grouped, ordered and labelled exactly like a gene-product input. (#270)

#### Scenario: Add a complex as input
- **WHEN** the curator adds "has input" to a molecular function, picks a protein complex term and saves
- **THEN** the complex renders as a "has input" row directly below the molecular function, like a gene-product input

### Requirement: Add Context offers the relations allowed for the row
A row's "Add Context" submenu SHALL list each allowed relation with its range beneath: molecular function — "part of" (Biological Process), "occurs in" (Cellular Component), "has input" (Gene Product/Protein Complex), "happens during" (Biological Phase/Stage); biological process — "part of" (Biological Process); CC, cell type, anatomy — "part of" (Cell/Anatomy/Organism); chemical — "located in" (Cellular Component); gene product — "part of" (Protein Complex).

#### Scenario: Molecular function context menu
- **WHEN** the curator opens "Add Context" on an empty molecular function row of a new activity unit
- **THEN** it lists "has input" and "happens during" and not "part of" or "occurs in", which the template already holds

#### Scenario: Nothing insertable
- **WHEN** a row's category allows no further relations
- **THEN** its menu has no "Add Context" entry

### Requirement: Single-valued relations are offered once
A relation that may appear only once on a row (molecular function `part of`, `occurs in` and `happens during`; biological process `part of`; the cellular, anatomical and chemical location relations) SHALL be removed from the row's insert menu once the row already has it. Multi-valued relations (`has input`, `has part`, gene product `part of`) SHALL remain offered.

#### Scenario: has input stays available
- **WHEN** a molecular function row already has one "has input" row
- **THEN** "Add Context" still offers "has input" and no longer offers "happens during" once a happens-during row exists

### Requirement: No recursive complex insertion
A row reached through `has part` SHALL NOT offer `part of` a protein complex, and a row reached through `part of` SHALL NOT offer `has part` a gene product. Other nesting, such as a biological process `part of` another biological process, SHALL remain available.

#### Scenario: Part of a complex
- **WHEN** the curator opens the menu on a gene product that is a part of a protein complex
- **THEN** "part of" (Protein Complex) is not offered

### Requirement: Protein complex rows offer only has part
A protein complex row, in the create form and in the activity table, SHALL show a "+" button instead of the ellipsis menu, offering only "has part" (Gene Product). Each part added this way SHALL be labelled "(Protein Complex) has part (GP)". An existing complex SHALL be recognised as a protein complex even though it is also a cellular component, so its parts load and display. (#257, #275)

#### Scenario: Add complex parts
- **WHEN** the curator clicks "+" on the protein complex row and chooses "has part" twice
- **THEN** two rows labelled "(Protein Complex) has part (GP)" appear under the complex

#### Scenario: Edit an existing complex
- **WHEN** the curator opens an existing protein complex activity
- **THEN** its has-part gene products are listed under the complex and its "+" offers "has part"

### Requirement: Relation rows are labelled by edge and object
A row added under another row SHALL be labelled by relation and object, not category alone: "(MF) part of (BP)", "(MF) occurs in (CC)", "has input (Gene Product/Protein Complex)", "happens during (Biological Phase/Stage/Plant Stage)", "part of (BP)", "part of (CC/Cell/Anatomy/Organism)", "located in (CC)", "(GP) part of (Protein Complex)", "(Protein Complex) has part (GP)". The enabler row SHALL keep its section label, also when an existing activity is loaded.

#### Scenario: has input row label
- **WHEN** the curator adds "has input" to a molecular function
- **THEN** the new row is labelled "has input (Gene Product/Protein Complex)", distinct from the enabler's gene product row

### Requirement: Row ordering within an activity
Rows SHALL be ordered the same way in the create form, the activity table and the activity box: gene-product rows first, then the molecular function, then `has input`, then `part of` biological process, then `occurs in` cellular component, then `happens during`. Rows nested under another row SHALL stay in their parent's section, and several rows of one relation SHALL stay together. (#264)

#### Scenario: has input directly below the function
- **WHEN** an activity has a molecular function with has input, part of, occurs in and happens during values
- **THEN** each view lists them in the order has input, part of, occurs in, happens during, directly below the molecular function

#### Scenario: Nested part stays with its input
- **WHEN** a has-input gene product is itself part of a protein complex
- **THEN** that part-of row renders under the has-input row, not in the gene product section

### Requirement: Fill with root term
Rows that carry a GO aspect (molecular function, biological process, cellular component) and a relation, outside a Chemical activity, SHALL offer "Fill with root term", which sets the term to the aspect's root (molecular_function, biological_process or cellular_component) and replaces the relation's evidence with a single ND evidence (ECO:0000307, GO_REF:0000015). Rows without an aspect, such as happens-during, gene product and chemical rows, SHALL NOT offer it.

#### Scenario: Fill a biological process
- **WHEN** the curator chooses "Fill with root term" on a "(MF) part of (BP)" row
- **THEN** the term becomes biological_process (GO:0008150) and its evidence becomes a single ND evidence with reference GO_REF:0000015

#### Scenario: Not offered on happens during
- **WHEN** the curator opens the menu of a happens-during row
- **THEN** "Fill with root term" is not listed

### Requirement: Fill with unknown enabler
The gene-product enabler row of the Activity Unit form SHALL offer "Fill with unknown enabler", placed below "Add Context", which sets the enabler term to PR:000000001 ("protein") without touching any evidence. It SHALL NOT be offered on any other row, on a protein complex enabler, or in the Chemical form. (#279)

#### Scenario: Unknown enabler
- **WHEN** the curator chooses "Fill with unknown enabler" on the enabler row
- **THEN** the enabler term becomes "protein" (PR:000000001)

### Requirement: Entity row menu structure
In the create form, each non-complex row SHALL have an ellipsis menu containing, in this order and as applicable, "Add Context", "Fill with unknown enabler", an "Evidence" submenu (only on rows that carry a relation), "Fill with root term", and a red "Remove" (only on rows the curator added; rows that come with the form template cannot be removed).

#### Scenario: Enabler row
- **WHEN** the curator opens the menu of the gene product enabler in the "Activity Unit Form"
- **THEN** it lists "Add Context" then "Fill with unknown enabler", and no "Evidence" submenu or "Remove"

#### Scenario: Chemical location row
- **WHEN** the curator opens the menu of the located-in cellular component row in a Chemical form
- **THEN** it lists the "Evidence" submenu but neither "Fill with root term" nor "Remove"

### Requirement: Remove a row from the create form
Choosing "Remove" on a row SHALL ask for confirmation in a "Remove Node" dialog reading "Remove <term or 'this node'> from the form? Unsaved changes will be lost." and, on "Remove", SHALL drop the row and everything beneath it from the form.

#### Scenario: Remove an added context row
- **WHEN** the curator removes a "has input" row and confirms
- **THEN** the row and its evidence disappear from the form

### Requirement: Open an existing activity for editing
Double-clicking an activity box, or clicking its edit icon, SHALL open the activity table for that activity in the right drawer. The table SHALL show a "Gene Product" and a "Function Description" section, or for a chemical activity a "Chemical" section (the chemical, without evidence) and a "Location (optional)" section. The header SHALL show the enabler label with the molecular function beneath, or "Chemical Form" for a chemical activity.

#### Scenario: Open a chemical activity
- **WHEN** the curator double-clicks a chemical activity on the canvas
- **THEN** the drawer shows header "Chemical Form", a "Chemical" section with the chemical and no evidence, and a "Location (optional)" section with its located-in rows

### Requirement: Activity table rows
Each row of the activity table SHALL show its term label with its id beneath. Logged-in curators SHALL get an ellipsis menu per row with "Add Context" (when anything is insertable), "Add Evidence" on rows with a relation, and a red "Delete" on deletable rows; the enabler row instead gets a "+" button listing its insertable relations.

#### Scenario: Enabler row in the table
- **WHEN** a logged-in curator views an activity unit in the activity table
- **THEN** the gene product row shows a "+" button offering "part of" (Protein Complex) and no ellipsis menu

### Requirement: Add context from the activity table
Choosing a relation from a table row's "Add Context" or "+" menu SHALL open a dialog titled "Add <relation label>" with a "Term" section and an "Evidence" section. On "Save" the system SHALL create the new term, its relation to the row and all entered evidence in a single model update.

#### Scenario: Add has input from the table
- **WHEN** the curator chooses "Add Context" then "has input" on a molecular function row, picks a term and an evidence, and saves
- **THEN** the dialog closes and the activity gains a has-input row carrying that evidence

### Requirement: Term-and-evidence dialog
When the term-and-evidence dialog shows its "Term" section, it SHALL disable "Save" until a term is chosen, and SHALL offer a "Fill with root term" button in that section under the same rules as the row menu, which sets the aspect's root term and replaces the evidence rows with a single ND evidence. On save, wholly empty evidence rows SHALL be dropped.

#### Scenario: Save disabled without a term
- **WHEN** the "Add part of" dialog is open and no term is chosen
- **THEN** "Save" is disabled

#### Scenario: Fill with root term in the dialog
- **WHEN** the curator clicks "Fill with root term" in the "Add part of" dialog opened from a molecular function row
- **THEN** the term becomes biological_process and a single ND evidence row replaces the existing rows

#### Scenario: Empty evidence rows dropped
- **WHEN** the curator saves with one filled and one empty evidence row
- **THEN** only the filled evidence is saved

### Requirement: Inline term replacement in the activity table
Clicking the edit affordance on a row's term cell in the activity table SHALL open an inline editor for that term only; saving it SHALL replace the term of that individual and leave its relations and evidence unchanged.

#### Scenario: Replace a molecular function term
- **WHEN** the curator edits the molecular function cell, picks a different function and saves
- **THEN** the molecular function changes and its enabled-by evidence is kept

### Requirement: Delete a row from the activity table
Choosing "Delete" on a table row SHALL ask for confirmation in a "Delete Annotation" dialog reading "Are you sure you want to delete <label>? This cannot be undone." and, on confirm, SHALL remove that individual together with everything nested beneath it.

#### Scenario: Delete a nested process
- **WHEN** the curator deletes a biological process that has another process part of it, and confirms
- **THEN** both processes are removed from the model

### Requirement: Delete an activity from the activity table
The activity table header SHALL offer a "Delete Activity" menu entry to logged-in curators, which asks "Are you sure you want to delete this activity? This cannot be undone." and, on confirm, removes the activity and closes the drawer.

#### Scenario: Delete activity
- **WHEN** the curator chooses "Delete Activity" and confirms
- **THEN** the activity disappears from the canvas and the drawer closes

### Requirement: Activity box content
An activity box SHALL be headed by the enabler label (else the root term label). In the "Default" layout it SHALL list gene-product-section lines other than `enabled by`, then the molecular function, then the remaining lines in row order, each prefixed with one em-dash per level below its section and marked when it lacks evidence. "Simple View" SHALL list only the molecular function; "Preview" only the header.

#### Scenario: Default layout lines
- **WHEN** an activity unit with a has input, a part-of process and a nested part-of process is shown in the "Default" layout
- **THEN** the box lists the molecular function, then "—has input", then "—part of", then "——part of" for the nested process

### Requirement: Chemical activity shape
A chemical activity SHALL render on the canvas as a circle labelled with the chemical and, when it has a cellular component location, a second line "located in: <cellular component>".

#### Scenario: Chemical box
- **WHEN** a chemical activity located in the cytosol is shown
- **THEN** it renders as a circle reading the chemical label followed by "located in: cytosol"

### Requirement: Per-field model edits from the CAM toolbar
The CAM toolbar SHALL give each editable model field its own entry: the title's pen icon SHALL open an "Edit Title" dialog containing only a "Title" field, whose "Save" is disabled while the title is blank; the state chip SHALL open a "Change State" dialog containing only a "State" selector (Development, Production, Review, Template, Delete, Internal Test). The date chip SHALL be informational and open nothing. Each save SHALL change only its own field.

#### Scenario: Change state only
- **WHEN** the curator clicks the state chip, picks "Review" and saves
- **THEN** the model state becomes review and the title and comments are unchanged

#### Scenario: Blank title
- **WHEN** the curator clears the text in the "Edit Title" dialog
- **THEN** "Save" is disabled

### Requirement: Shared dialog chrome for create and edit dialogs
Every create and edit dialog SHALL open with the same header bar showing its title and a close control, and SHALL close on that control. Form section titles within these dialogs SHALL use one shared section-heading style.

#### Scenario: Consistent header
- **WHEN** the curator opens the "Activity Unit Form" and then the "Edit Title" dialog
- **THEN** both show the same header bar with the title on the left and a close control on the right
