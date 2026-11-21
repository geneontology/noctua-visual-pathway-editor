# activity-relations Specification

## Purpose
Lets curators create, view, edit and delete causal relations between activity units (and between activity units and chemicals) by drawing lines on the pathway graph and answering a short relation decision tree.

## Requirements

### Requirement: Draw a connection to start a relation
When a logged-in curator drags a connection from one node on the graph and releases it on a different node, the system SHALL open the causal relation dialog for that source and target. The dialog header SHALL read "Connect", then the source's root term label, an arrow, and the target's root term label.

#### Scenario: Drag between two activity units
- **WHEN** a logged-in curator drags from activity unit A and releases on activity unit B, and A and B are not yet connected
- **THEN** the causal relation dialog opens with A as the source and B as the target
- **AND** the header shows "Connect", A's molecular function label, an arrow, and B's molecular function label

### Requirement: Disallowed connection gestures
The system MUST NOT start a connection when the drag is released on the node it started from or on empty canvas.

#### Scenario: Connection to itself
- **WHEN** a curator drags from activity unit A and releases on A
- **THEN** no connection is made and no dialog opens

#### Scenario: Released on empty canvas
- **WHEN** a curator drags from a node and releases on empty canvas
- **THEN** no line remains and no dialog opens

### Requirement: One relation per pair of nodes
The system SHALL allow at most one drawn relation between the same two nodes, in either direction. A new drag between an already-connected pair MUST NOT add a line and SHALL show a dialog titled "Activities Already Connected" with the message "These two activities are already connected. Use the 'Edit relation' function or delete the relation before creating a new one." and an OK button.

#### Scenario: Second relation between the same pair
- **WHEN** A and B already have a saved relation and the curator drags from B to A
- **THEN** no new line is added
- **AND** the "Activities Already Connected" dialog appears with the duplicate-connection message
- **AND** clicking OK closes it

### Requirement: No line without a saved relation
A line drawn by dragging SHALL NOT stay on the graph on its own. Lines on the graph MUST come only from relations saved in the model, so closing the relation dialog without saving leaves no line, and the pair can be connected again afterwards.

#### Scenario: Dialog closed without saving
- **WHEN** the curator draws a connection from A to B and closes the relation dialog with Cancel or the close control
- **THEN** no line remains between A and B
- **AND** nothing is sent to the server

#### Scenario: Redraw after cancel
- **WHEN** the curator cancels a new connection between A and B and then drags from A to B again
- **THEN** the relation dialog opens again
- **AND** the "Activities Already Connected" dialog is not shown

#### Scenario: Saved relation appears
- **WHEN** the curator draws a connection, picks a valid relation and clicks Save
- **THEN** exactly one line appears between the two nodes once the model refreshes

### Requirement: Relationship choices depend on what is connected
The relation dialog SHALL offer relationship choices by connector type. Activity unit to activity unit: Regulation, Constitutively Upstream, Provides Input For, Removes Input For, Undetermined. Activity unit to chemical: Product. Chemical to activity unit: Regulation, Substrate. Each choice SHALL show its description.

#### Scenario: Activity unit to activity unit
- **WHEN** the dialog opens for two activity units
- **THEN** the Relationship choices are Regulation, Constitutively Upstream, Provides Input For, Removes Input For and Undetermined

#### Scenario: Activity unit to chemical
- **WHEN** the dialog opens with an activity unit as source and a chemical as target
- **THEN** the only Relationship choice is Product

#### Scenario: Chemical to activity unit
- **WHEN** the dialog opens with a chemical as source and an activity unit as target
- **THEN** the Relationship choices are Regulation and Substrate

### Requirement: Default selection for a new relation
For a new relation the dialog SHALL preselect defaults by connector type: activity unit to activity unit is Regulation, Positive, Direct; activity unit to chemical is Product; chemical to activity unit is Regulation, Positive.

#### Scenario: New activity-to-activity relation
- **WHEN** the dialog opens for a new relation between two activity units
- **THEN** Regulation, Positive and Direct are selected
- **AND** the suggested causal relation reads "directly positively regulates"

### Requirement: Effect direction and directness questions
The dialog SHALL show an Effect Direction choice (Positive, Negative) only for Regulation and Undetermined, with the hint "The mechanism regulation should be known, so it should be possible to pick the direction of the regulation." It SHALL show a Directness choice (Direct, Indirect) only for Regulation between two activity units.

#### Scenario: Regulation between activity units
- **WHEN** Regulation is selected for two activity units
- **THEN** both Effect Direction and Directness are shown

#### Scenario: Undetermined
- **WHEN** Undetermined is selected
- **THEN** Effect Direction is shown and Directness is hidden

#### Scenario: Relationship with a fixed relation
- **WHEN** Constitutively Upstream, Provides Input For, Removes Input For, Product or Substrate is selected
- **THEN** neither Effect Direction nor Directness is shown

### Requirement: Decision tree resolves the relation
The dialog SHALL resolve the answers to one relation and show its label under "Suggested Causal Relation", or "No valid relation" when the answers do not resolve. Mapping: Constitutively Upstream → constitutively upstream of; Provides Input For → directly provides input for; Removes Input For → removes input for; Undetermined → causally upstream of, positive/negative effect; Product → has output; Substrate → has input.

#### Scenario: Fixed relationships
- **WHEN** the curator selects Constitutively Upstream, Provides Input For, Removes Input For or Product
- **THEN** the suggested causal relation is "constitutively upstream of" (RO:0012009), "directly provides input for" (RO:0002413), "removes input for" (RO:0012010) or "has output" (RO:0002234) respectively

#### Scenario: Undetermined with a direction
- **WHEN** the curator selects Undetermined and Positive, or Undetermined and Negative
- **THEN** the suggested causal relation is "causally upstream of, positive effect" (RO:0002304) or "causally upstream of, negative effect" (RO:0002305)

### Requirement: Regulation resolves by direction and directness
Between two activity units, Regulation SHALL resolve by effect direction and directness: Positive+Direct → directly positively regulates (RO:0002629); Positive+Indirect → indirectly positively regulates (RO:0002407); Negative+Direct → directly negatively regulates (RO:0002630); Negative+Indirect → indirectly negatively regulates (RO:0002409). From a chemical, Regulation SHALL resolve by direction alone to is small molecule activator of (RO:0012005) or is small molecule inhibitor of (RO:0012006).

#### Scenario: Indirect negative regulation
- **WHEN** the curator picks Regulation, Negative, Indirect between two activity units
- **THEN** the suggested causal relation is "indirectly negatively regulates"

#### Scenario: Chemical inhibits an activity
- **WHEN** the curator picks Regulation and Negative with a chemical as source
- **THEN** the suggested causal relation is "is small molecule inhibitor of"

### Requirement: Substrate is stored as has input
When a chemical is connected to an activity unit as Substrate, the dialog SHALL show the suggested relation as "input of", and saving MUST store the statement as the activity unit has input the chemical. On the graph that statement SHALL be drawn from the chemical to the activity unit labelled "input of".

#### Scenario: Save a substrate relation
- **WHEN** the curator connects chemical X to activity unit A, picks Substrate and saves
- **THEN** the model stores "A has input X"
- **AND** the graph shows a line from X to A labelled "input of"

### Requirement: Save only with a valid relation
The dialog SHALL keep Save disabled until the answers resolve to a relation and while a save is in progress, showing "Saving..." on the button during the save. While Save is disabled for lack of a relation, the footer SHALL show a "Why is the "Save" button disabled?" control.

#### Scenario: No valid relation
- **WHEN** the current answers do not resolve to a relation
- **THEN** Save is disabled and the suggested relation reads "No valid relation"
- **AND** the "Why is the "Save" button disabled?" control is shown

### Requirement: Saving a new relation
Clicking Save on a new relation SHALL add the relation from the source's root node to the target's root node together with its evidence, store the model, show the message "Causal relation successfully created.", and close the dialog. Nothing SHALL be saved before Save is clicked.

#### Scenario: Save a new regulation
- **WHEN** the curator picks Regulation, Positive, Direct between A and B and clicks Save
- **THEN** "A directly positively regulates B" is added and the model is stored
- **AND** "Causal relation successfully created." is shown and the dialog closes

### Requirement: Open an existing relation
Double-clicking a relation line SHALL clear the graph selection and open the relation dialog for that relation, with the relationship, effect direction and directness that produce its current relation preselected and its saved evidence loaded. A line with no matching saved relation SHALL open nothing.

#### Scenario: Double-click a regulation line
- **WHEN** the curator double-clicks a line saved as "indirectly positively regulates"
- **THEN** the dialog opens with Regulation, Positive and Indirect selected and the saved evidence rows filled in

### Requirement: Editing waits for an explicit Save
Changing answers in the dialog for an existing relation MUST NOT save anything. Clicking Save SHALL remove the existing relation and then add the newly resolved relation with the evidence in the form, store the model, show "Causal relation successfully created.", and close the dialog.

#### Scenario: Change a relation to regulation
- **WHEN** the curator opens an existing "constitutively upstream of" relation, picks Regulation, then Negative, then Direct
- **THEN** no request is sent while choosing
- **AND** clicking Save replaces the relation with "directly negatively regulates" in one save and closes the dialog

#### Scenario: Cancel an edit
- **WHEN** the curator changes answers on an existing relation and clicks Cancel
- **THEN** the relation is unchanged and the dialog closes

### Requirement: Delete a relation
For an existing relation the dialog SHALL offer a Delete button. Delete SHALL ask for confirmation with title "Delete Causal Relation" and message "Are you sure you want to delete this causal relation? This cannot be undone."; confirming SHALL remove the relation, store the model and close the dialog. A new, unsaved relation SHALL NOT offer Delete.

#### Scenario: Delete confirmed
- **WHEN** the curator clicks Delete on an existing relation and confirms
- **THEN** the relation is removed from the model and its line disappears
- **AND** the dialog closes

#### Scenario: Delete declined
- **WHEN** the curator clicks Delete and then dismisses the confirmation
- **THEN** the relation is unchanged and the relation dialog stays open

### Requirement: Relation dialog evidence
The relation dialog SHALL let the curator add, edit and remove evidence rows (evidence code, reference, with/from). Only rows with an evidence code SHALL be saved, each carrying its reference, with/from, and the curator's contributor and group. Removing the last row SHALL clear it instead. A relation MAY be saved without evidence.

#### Scenario: Blank evidence row ignored
- **WHEN** the curator saves a relation with one complete evidence row and one row without an evidence code
- **THEN** only the complete row is saved as evidence on the relation

### Requirement: New relation evidence is seeded from the upstream activity
For a new relation the dialog SHALL prefill evidence rows from the evidence on the upstream activity unit's enabled-by statement; when the source is a chemical, from the target activity unit's enabled-by statement. With no such evidence, one empty row SHALL be shown.

#### Scenario: Upstream activity has enabled-by evidence
- **WHEN** a curator draws a new relation from activity unit A, whose enabled-by statement has two evidence entries
- **THEN** the dialog opens with those two evidence rows prefilled

### Requirement: Connect via chemical intermediate
For Provides Input For between two activity units, a logged-in curator SHALL see a "Connect via Chemical Intermediate" button. It SHALL open a dialog listing known chemical participants of both molecular functions in groups: common to both (preselected), upstream only, downstream only. Save SHALL be disabled until one is selected.

#### Scenario: Open the chemical intermediate dialog
- **WHEN** the curator selects Provides Input For between A and B and clicks "Connect via Chemical Intermediate"
- **THEN** a dialog titled "Connect via Chemical Intermediate" lists chemicals under "Participants common to upstream and downstream activities", "Participants in upstream activity only" and "Participants in downstream activity only"
- **AND** chemicals common to both are already ticked

#### Scenario: No participants
- **WHEN** neither molecular function has known chemical participants
- **THEN** the dialog shows "No chemical participants found for these molecular functions."

### Requirement: Saving a chemical intermediate
Saving the chemical intermediate dialog SHALL, for each ticked chemical, add a chemical node with the upstream activity unit having output it and the downstream activity unit having input it, store the model, show "Chemical Reactions created.", and close both the chemical dialog and the relation dialog.

#### Scenario: Save one chemical intermediate
- **WHEN** the curator ticks chemical X and clicks Save
- **THEN** the model gains "A has output X" and "B has input X"
- **AND** "Chemical Reactions created." is shown and both dialogs close

### Requirement: Relation line appearance
Each relation line SHALL be labelled with its relation and coloured by effect: green for positive effects (positively regulates family, causally upstream of positive effect, small molecule activator), red for negative ones, grey for neutral causal relations (causally upstream of, constitutively upstream of, provides/removes input for), black otherwise. A line with no evidence SHALL show a no-evidence marker.

#### Scenario: Negative relation without evidence
- **WHEN** the model has "A directly negatively regulates B" with no evidence
- **THEN** the line from A to B is red, labelled "directly negatively regulates", and shows the no-evidence marker
