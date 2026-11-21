# model-comments Specification

## Purpose
Curators attach categorized comments to a CAM as a whole, to individual terms, and to the references that support statements; the editor stores them with the model, shows them where they apply, gathers them in a Comments side panel, and can escalate disputes and missing terms to the GitHub trackers that triage them.

## Requirements

### Requirement: Structured comment format
Every comment SHALL consist of a category and a text and SHALL be stored as a single string `"<Category>: <text>"`. A comment saved without a category SHALL be stored as its text alone, with no prefix. Comments on the same target SHALL keep the order in which they were added.

#### Scenario: Categorized comment is stored with its prefix
- **WHEN** the curator saves a comment with category `General` and text `Check isoform`
- **THEN** the stored comment is `General: Check isoform`

#### Scenario: Order is preserved
- **WHEN** a target has two comments and the curator adds a third and saves
- **THEN** the three comments are stored and shown in the order they were added

### Requirement: Uncategorized and unrecognized comments
When a stored comment has no `": "` separator, or its text before the first `": "` is not a known category from any comment scope, the system SHALL load it with a blank category and the full stored string as its text, and SHALL save it back unchanged if the curator does not pick a category.

#### Scenario: Plain-text comment round-trips unchanged
- **WHEN** a target holds the stored comment `see PMID:123` and the curator opens and saves its comments without editing that row
- **THEN** the comment is stored again as `see PMID:123`

#### Scenario: Unknown prefix is kept as text
- **WHEN** a stored comment reads `Annotation dispute: wrong term`
- **THEN** it is shown with no category badge and the text `Annotation dispute: wrong term`

### Requirement: Model comment categories
Comments on the model as a whole SHALL offer exactly these categories, in this order: `General`, `Feedback to curator`, `Comment to reviewer`.

#### Scenario: Model comment category list
- **WHEN** the curator opens the category picker on a model comment
- **THEN** the options are `General`, `Feedback to curator`, `Comment to reviewer`

### Requirement: Individual comment categories
Comments on an individual term (a GO term, input, gene product, or chemical in an activity) SHALL offer exactly these categories, in this order: `Ontology term pending`, `Ontology term annotation dispute`, `General`.

#### Scenario: Individual comment category list
- **WHEN** the curator opens the category picker on a comment on a GO term
- **THEN** the options are `Ontology term pending`, `Ontology term annotation dispute`, `General`

### Requirement: Reference comment categories
Comments on a reference (the evidence supporting a statement) SHALL offer exactly these categories, in this order: `Figure/Table`, `Evidence confidence`, `Justification for evidence`, `Evidence dispute`, `General`.

#### Scenario: Reference comment category list
- **WHEN** the curator opens the category picker on a reference comment
- **THEN** the options are `Figure/Table`, `Evidence confidence`, `Justification for evidence`, `Evidence dispute`, `General`

### Requirement: Category badges
Wherever comments are listed for reading, the system SHALL show a comment's category as a colored badge before its text, with a distinct color per known category and a neutral color otherwise. A comment with a blank category SHALL show no badge.

#### Scenario: Dispute badge
- **WHEN** the Comments panel lists `Ontology term annotation dispute: wrong process`
- **THEN** the comment shows an `Ontology term annotation dispute` badge followed by `wrong process`

### Requirement: Comment editor rows
The comment dialog SHALL list each comment as a row with a `Category` picker (placeholder `Select a category`, limited to the target's categories) and a `Comment` text field (placeholder `Write your comment...`). The text field SHALL appear only once the row has a category or already has text. With no comments the dialog SHALL show `No comments yet`.

#### Scenario: Text field appears after choosing a category
- **WHEN** the curator adds a new row and picks the category `General`
- **THEN** a `Comment` text field appears in that row

#### Scenario: Empty target
- **WHEN** the curator opens the comment dialog for a target with no comments
- **THEN** the dialog shows `No comments yet` and an `Add Comment` button

### Requirement: Adding comments
The comment dialog SHALL offer a button labelled `Add Comment` when there are no rows and `Add Another Comment` otherwise; pressing it SHALL append an empty row with no category.

#### Scenario: Add another comment
- **WHEN** the target already has one comment and the curator presses `Add Another Comment`
- **THEN** a second, empty row is appended below the first

### Requirement: Removing comments
Each row SHALL have a remove control. Removing a row whose text is blank SHALL delete it immediately; removing a row with text SHALL first ask for confirmation in a dialog titled `Remove Comment` with the message `Remove this comment? This cannot be undone.` and a `Remove` button, and SHALL delete the row only if confirmed.

#### Scenario: Removing a populated comment asks first
- **WHEN** the curator presses remove on a row that has text
- **THEN** the `Remove Comment` confirmation appears and the row stays until `Remove` is pressed

#### Scenario: Removing an empty row
- **WHEN** the curator presses remove on a row with no text
- **THEN** the row disappears without a confirmation

### Requirement: Saving comments
Saving the comment dialog SHALL replace the target's stored comments with exactly the dialog's rows whose text is not blank or whitespace-only, persist the model, and close the dialog. While the save is in progress the button SHALL read `Saving...` and be disabled. `Cancel` SHALL close the dialog without saving.

#### Scenario: Blank rows are dropped
- **WHEN** the curator saves with one filled row and one row whose text is only spaces
- **THEN** only the filled comment is stored and the dialog closes

#### Scenario: Clearing all comments
- **WHEN** the curator removes every row and saves
- **THEN** the target has no comments after the save

### Requirement: Comment storage targets
Model comments SHALL be stored as `comment` annotations on the model; individual comments as `comment` annotations on that individual; reference comments as `comment` annotations on the evidence individual. All of them SHALL be read back from those annotations when the model loads.

#### Scenario: Reference comment survives reload
- **WHEN** the curator saves a reference comment and the model is reloaded
- **THEN** the comment appears again on that reference's evidence row

### Requirement: Statement-level comments are not surfaced
Comments stored directly on a statement (an edge between two individuals) SHALL NOT be shown, counted, or editable anywhere in the editor.

#### Scenario: Statement comment is ignored in counts
- **WHEN** a loaded model has a comment annotation on a statement and no other comments
- **THEN** the toolbar comment button shows no count and the Comments panel lists no comments

### Requirement: Term cell comment icon
In the activity table, each term cell SHALL show a comment icon that opens that individual's comment dialog, titled `Individual Comments`, with the term's label (or id) as a header line. The icon SHALL be always visible: grey with tooltip `Add comment` when there are none, green with a count badge and tooltip `N comment(s)` otherwise.

#### Scenario: Term with comments
- **WHEN** a GO term in the activity table has two comments
- **THEN** its cell shows a green comment icon with the count `2`

#### Scenario: Term without comments
- **WHEN** a logged-in curator views a term with no comments
- **THEN** its cell shows a grey comment icon without needing to hover

### Requirement: Reference cell comment icon
On each evidence row, the Reference cell SHALL show a comment icon, with the same visibility, color, and count rules as the term cell, that opens that reference's comment dialog titled `Reference Comments`, headed by the reference (or the evidence code label, or `Reference`).

#### Scenario: Open reference comments
- **WHEN** the curator clicks the comment icon in an evidence row's Reference cell
- **THEN** a `Reference Comments` dialog opens offering the reference comment categories

### Requirement: Read-only comments when logged out
When the curator is not logged in, comment dialogs SHALL show existing comments read-only, with no add or remove controls, no `Save`, and a `Close` button instead of `Cancel`. Table comment icons SHALL appear only on targets that already have comments, and the Comments panel SHALL show no edit or add controls.

#### Scenario: Logged-out viewer
- **WHEN** a viewer who is not logged in opens a term's comment dialog
- **THEN** the comments are visible but cannot be changed, and only `Close` is offered

#### Scenario: No add affordance when logged out
- **WHEN** a viewer who is not logged in looks at a term with no comments
- **THEN** no comment icon is shown on its cell

### Requirement: Comment counts
The total comment count of a model SHALL be the number of model comments plus all individual and reference comments. An activity's comment count SHALL be the number of comments on its individuals plus comments on the references of its statements.

#### Scenario: Total includes every surfaced comment
- **WHEN** a model has one model comment, two comments on one GO term, and one reference comment
- **THEN** the total comment count is 4

### Requirement: Toolbar comments button
The model toolbar SHALL have a comment button that opens the Comments panel showing all comments (never scoped to an activity). It SHALL show the total comment count as a badge when non-zero, with tooltip `N comment(s) — view all`, or `No comments` when there are none.

#### Scenario: Toolbar opens the full list
- **WHEN** the panel was last opened scoped to one activity and the curator clicks the toolbar comment button
- **THEN** the Comments panel opens showing all comments, including the Model section

### Requirement: Graph node comment icon
Every activity and chemical node on the graph SHALL show a grey comment icon with the activity's comment count (including `0`). Clicking it SHALL select that activity and open the Comments panel scoped to it.

#### Scenario: Open scoped comments from the graph
- **WHEN** the curator clicks the comment icon on an activity node
- **THEN** the activity is highlighted and the Comments panel opens showing only that activity's comments

### Requirement: Node menu Comments item
The graph node right-click menu SHALL include a `Comments` item, for logged-in and logged-out users alike, that behaves like the node's comment icon. The item SHALL be hidden when two or more nodes are selected.

#### Scenario: Comments from the node menu
- **WHEN** the curator right-clicks a single node and chooses `Comments`
- **THEN** the Comments panel opens scoped to that activity

### Requirement: Comments panel header
The Comments panel SHALL have a header reading `Comments` with a count badge (the model total, or the scoped activity's count when scoped) shown only when non-zero, and a `Close` button that closes the side panel.

#### Scenario: Close the panel
- **WHEN** the curator presses `Close` in the Comments panel
- **THEN** the side panel closes

### Requirement: Comments panel model section
When not scoped, the Comments panel SHALL show a `Model` section listing the model comments with their count, or `No model comments yet` when there are none. For a logged-in curator it SHALL offer a control (tooltip `Edit model comments`, or `Add model comment` when empty) that opens the model comment dialog titled `Model Comments`.

#### Scenario: Add the first model comment
- **WHEN** a logged-in curator presses the add control in an empty Model section
- **THEN** the `Model Comments` dialog opens offering the model comment categories

### Requirement: Comments panel activity sections
Under a heading `Activity units comments` with the combined count, the panel SHALL show one section per activity that has comments, in model order, plus the selected activity even if it has none (showing `No comments on this activity yet`). Each section SHALL be titled by the enabling gene product (else the function or root term label) with its count, and SHALL list its commented individuals and then its commented references, each followed by its comments.

#### Scenario: Only commented activities are listed
- **WHEN** a model has three activities and only one has comments, and none is selected
- **THEN** the panel shows a section for that one activity only

#### Scenario: Nothing to list
- **WHEN** no activity has comments and none is selected
- **THEN** the panel shows `No annotation comments yet. Use the comment icon on a node or relation to add one.`

### Requirement: Comment subject labels in the panel
In the panel, an individual SHALL be labelled `label (id)`, and a reference SHALL be labelled by the statement it supports as `relation → object` followed by ` · ` and the evidence as `code · reference`.

#### Scenario: Reference subject line
- **WHEN** an `enabled by` statement to gene product `ABCA14` has IDA evidence from `PMID:25415977` with a comment
- **THEN** the panel labels it `enabled by → ABCA14 · IDA · PMID:25415977`

### Requirement: Editing from the panel
For a logged-in curator each panel subject SHALL have an `Edit comments` control that selects its activity and opens that subject's comment dialog: `Node Comments` for an individual and `Relation Comments` for a reference, each headed by the subject's panel label.

#### Scenario: Edit a reference comment from the panel
- **WHEN** a logged-in curator presses `Edit comments` on a reference in the panel
- **THEN** its activity is selected and a `Relation Comments` dialog opens offering the reference comment categories

### Requirement: Selecting an activity from a comment
Clicking a comment in an activity section SHALL select that activity, highlighting it on the graph without moving the viewport, and SHALL keep the Comments panel open. The selected activity's section SHALL be visually highlighted and scrolled into view.

#### Scenario: Click a comment
- **WHEN** the curator clicks a comment listed under an activity
- **THEN** that activity is highlighted on the graph and its panel section is highlighted, and the panel stays on Comments

### Requirement: Scoped Comments panel
When scoped to an activity, the panel SHALL show only that activity's section, hide the Model section, show the activity's name in the header, and offer a `Show all comments` button that removes the scope. If the scoped activity is no longer listed, the panel SHALL show all comments.

#### Scenario: Show all comments
- **WHEN** the panel is scoped to one activity and the curator presses `Show all comments`
- **THEN** the panel lists the Model section and every activity with comments

### Requirement: Ticket button on escalating comments
A comment whose category is `Ontology term annotation dispute`, `Ontology term pending`, or `Evidence dispute` SHALL show a GitHub button, both in the Comments panel and in its comment dialog (also when read-only), that opens a pre-filled new-issue page in a new tab. Other categories SHALL show no such button.

#### Scenario: Pending term button
- **WHEN** a GO term carries an `Ontology term pending` comment
- **THEN** a GitHub button with tooltip `Request this term on go-ontology` is shown beside it

### Requirement: Term ticket content
An `Ontology term annotation dispute` ticket SHALL open on the go-annotation tracker (tooltip `File this dispute on go-annotation`); an `Ontology term pending` ticket on the go-ontology tracker. The title SHALL be the category, a space, and the current model page URL. The body SHALL list as bullets the activity's gene product, the term as `label (id)`, and the term's contributors, then a blank line and the comment text without its category.

#### Scenario: Dispute ticket body
- **WHEN** the curator opens the dispute ticket for a comment `Ontology term annotation dispute: wrong process`
- **THEN** the new issue's body ends with `wrong process` below the bullet list

### Requirement: Evidence dispute ticket content
An `Evidence dispute` ticket SHALL open on the go-annotation tracker with tooltip `File this evidence dispute on go-annotation`, titled `Evidence dispute` plus the model page URL. Its body SHALL list as bullets the gene product, the supported statement as `relation → object`, the evidence as `code · reference`, and the evidence's contributors, then the comment text.

#### Scenario: Evidence dispute names the statement
- **WHEN** the curator opens the ticket for an evidence dispute on an `enabled by` statement
- **THEN** the body names the statement `enabled by → <gene product>` rather than a GO term

### Requirement: Contributors on tickets
Each contributor on a ticket SHALL be written as `Name (ORCID iD)`, or the ORCID iD alone when there is no name, or the name alone when there is no ORCID; multiple contributors SHALL be comma-separated, and the bullet SHALL be omitted when there are none.

#### Scenario: Contributor with name and ORCID
- **WHEN** the commented term was contributed by a curator with a name and ORCID URI
- **THEN** the ticket body lists them as `Name (0000-0002-1825-0097)`
