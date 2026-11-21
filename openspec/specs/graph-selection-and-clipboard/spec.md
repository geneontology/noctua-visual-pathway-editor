# graph-selection-and-clipboard Specification

## Purpose
Lets a curator select one or many nodes on the pathway graph, move and tidy them as a group, and copy, paste or delete them in bulk, with keyboard shortcuts and confirmation dialogs that state exactly what will be written to the model.

## Requirements

### Requirement: Node terminology
The system SHALL refer to every activity unit, chemical and protein complex on the canvas as a "node" in all selection, copy, paste and delete wording, using "node" for a count of one and "nodes" otherwise, and "relation"/"relations" for the links between them.

#### Scenario: Singular and plural counts
- **WHEN** a message reports one node and two relations
- **THEN** it reads "1 node and 2 relations"

#### Scenario: Count without relations
- **WHEN** a message reports three nodes and no relations
- **THEN** it reads "3 nodes" with no mention of relations

### Requirement: Focused node
The system SHALL mark a node as focused when the curator double-clicks it, drawing an orange outline on it and opening its details in the right-hand drawer; only one node is focused at a time.

#### Scenario: Double-click focuses a node
- **WHEN** the curator double-clicks a node
- **THEN** that node gets an orange outline and its details open in the right-hand drawer

#### Scenario: Focus survives a save
- **WHEN** the model is saved and the graph redraws while a node that still exists is focused
- **THEN** that node keeps its orange outline

### Requirement: Selection appearance
The system SHALL draw every selected node with a blue outline, taking precedence over the focused node's orange outline, and SHALL draw a relation as selected exactly when both nodes it joins are selected; relations are never selected on their own.

#### Scenario: Selected node that is also focused
- **WHEN** the focused node is also part of the selection
- **THEN** it shows the blue outline, not the orange one

#### Scenario: Relation follows its endpoints
- **WHEN** both nodes joined by a relation are selected
- **THEN** the relation is drawn as selected
- **AND** it stops being drawn as selected as soon as either node leaves the selection

### Requirement: Marquee selection
The system SHALL let the curator press the left mouse button on empty canvas and drag to draw a blue dashed rectangle; on release, every node the rectangle touches (not only those fully inside it) SHALL replace the selection, or be added to it when Shift was held at the start of the drag. Drags in any direction SHALL behave the same.

#### Scenario: Drag a box over nodes
- **WHEN** the curator drags a rectangle on empty canvas that overlaps two nodes
- **THEN** exactly those two nodes are selected

#### Scenario: Shift-drag adds to the selection
- **WHEN** one node is selected and the curator Shift-drags a rectangle over two other nodes
- **THEN** all three nodes are selected

#### Scenario: Up-and-left drag
- **WHEN** the curator drags from bottom-right to top-left over a node
- **THEN** that node is selected, as for a top-left to bottom-right drag

### Requirement: Clicking empty canvas clears the selection
The system SHALL treat a left click on empty canvas that moves the pointer less than 3 pixels as a click rather than a marquee, clearing the selection without drawing a rectangle; a double-click on empty canvas SHALL clear both the selection and the focused node.

#### Scenario: Single click on empty canvas
- **WHEN** nodes are selected and the curator clicks empty canvas without dragging
- **THEN** the selection is cleared and no rectangle appears

#### Scenario: Double-click on empty canvas
- **WHEN** a node is focused and others are selected, and the curator double-clicks empty canvas
- **THEN** no node is selected and no node is focused

### Requirement: Modifier-click toggles a node
The system SHALL toggle a node's membership in the selection when the curator clicks it while holding Shift, Ctrl or Cmd, without moving the node and without opening the drawer.

#### Scenario: Add a node
- **WHEN** the curator Shift-clicks an unselected node
- **THEN** the node joins the selection and stays where it was

#### Scenario: Remove a node
- **WHEN** the curator Ctrl-clicks (Cmd-clicks on a Mac) a selected node
- **THEN** the node leaves the selection and the rest stay selected

### Requirement: Selection persists across model refreshes
The system SHALL keep the selection when the graph redraws after a save or refresh, dropping only nodes that no longer exist in the model.

#### Scenario: Save while nodes are selected
- **WHEN** three nodes are selected and an edit elsewhere saves the model
- **THEN** after the redraw the same three nodes are still selected

#### Scenario: Selected node removed
- **WHEN** a selected node is deleted from the model
- **THEN** after the redraw it is no longer in the selection and the other selected nodes remain

### Requirement: Selection is available read-only
The system SHALL allow a curator who is not logged in to select nodes by marquee, modifier-click, the Select menu and Find in model, but SHALL NOT let them move a group of nodes or nudge a selection.

#### Scenario: Logged-out marquee
- **WHEN** a curator who is not logged in drags a rectangle over nodes
- **THEN** those nodes are selected and the selection bar shows the count with no Copy or Delete actions

#### Scenario: Logged-out group drag
- **WHEN** a curator who is not logged in drags one of several selected nodes
- **THEN** the other selected nodes do not move with it

### Requirement: Group move by dragging
The system SHALL, when a logged-in curator drags a node that belongs to a selection of two or more, move every other selected node by the same distance so the group keeps its shape, including when the dragged node stops at the canvas edge. Dragging a node outside the selection SHALL clear the selection and move that node alone.

#### Scenario: Drag a member of the selection
- **WHEN** three nodes are selected and the curator drags one of them 100 pixels right
- **THEN** all three move 100 pixels right and keep their relative positions

#### Scenario: Drag a node outside the selection
- **WHEN** nodes are selected and the curator drags a node that is not selected
- **THEN** the selection is cleared and only the dragged node moves

### Requirement: Node positions are stored locally
The system SHALL store node positions, including those produced by dragging, nudging, Auto Layout and paste placement, in the curator's browser per model, and SHALL NOT write positions to the model on the server.

#### Scenario: Positions survive a reload
- **WHEN** the curator moves a group of nodes and reloads the page
- **THEN** the nodes appear where they were moved to

#### Scenario: Moving nodes is not a model edit
- **WHEN** the curator drags or nudges nodes
- **THEN** no update is sent to the server

### Requirement: Selection bar
The system SHALL show a selection bar at the right of the graph toolbar whenever one or more nodes are selected, reading "N selected" with Copy, Delete and a clear (✕) button; Copy and Delete SHALL be shown only to a logged-in curator. The tooltips SHALL read "Copy selection (Ctrl+C)", "Delete selected nodes" and "Clear selection (Esc)".

#### Scenario: Selection bar appears
- **WHEN** a logged-in curator selects four nodes
- **THEN** the toolbar shows "4 selected" with Copy, Delete and ✕

#### Scenario: Clear from the selection bar
- **WHEN** the curator clicks ✕ in the selection bar
- **THEN** the selection is cleared and the bar disappears

### Requirement: Bulk operation limit
The system SHALL cap a single bulk Copy or Delete at 13 nodes. Above the cap the selection bar SHALL turn red and read "N selected — max 13", its Copy and Delete SHALL look disabled and do nothing, with tooltips "Select 13 or fewer to copy" and "Select 13 or fewer to delete", and Ctrl+C or Delete SHALL instead show "Select 13 or fewer nodes to copy" or "Select 13 or fewer nodes to delete".

#### Scenario: Over the cap
- **WHEN** 20 nodes are selected
- **THEN** the selection bar is red and reads "20 selected — max 13"
- **AND** clicking its Copy or Delete does nothing

#### Scenario: Keyboard over the cap
- **WHEN** 20 nodes are selected and the curator presses Ctrl+C
- **THEN** nothing is copied and a warning reads "Select 13 or fewer nodes to copy"

#### Scenario: Exactly at the cap
- **WHEN** 13 nodes are selected
- **THEN** Copy and Delete in the selection bar are enabled

### Requirement: Select menu
The system SHALL provide a Select menu in the graph toolbar with, in order: "Select all" (shown with Ctrl+A), "Invert selection"; under "By type": "Activities", "Chemicals", "Protein complexes"; under "Quality": "Without evidence", "With comments", "Unconnected nodes", "No causal relations". Each item SHALL replace the current selection.

#### Scenario: Select all
- **WHEN** the curator chooses Select → Select all
- **THEN** every node on the canvas is selected

#### Scenario: Invert selection
- **WHEN** two of five nodes are selected and the curator chooses Invert selection
- **THEN** the other three nodes are selected and the original two are not

#### Scenario: Select by type
- **WHEN** the curator chooses Select → Chemicals
- **THEN** exactly the chemical nodes are selected

### Requirement: Quality selection filters
The system SHALL select, for "Without evidence", every node carrying at least one statement with no evidence; for "With comments", every node with at least one comment, counted as its comment badge counts; for "Unconnected nodes", every node with no relation drawn to any other node in either direction; and for "No causal relations", activity units with no causal relation to another activity unit.

#### Scenario: Unconnected nodes
- **WHEN** the model has two nodes with no relation to anything and the rest are linked
- **THEN** Select → Unconnected nodes selects exactly those two nodes

#### Scenario: Node with only an incoming relation
- **WHEN** a node is the target of a relation but the source of none
- **THEN** Select → Unconnected nodes does not select it

### Requirement: Filter with no matches
The system SHALL, when a Select menu filter matches nothing, clear the selection and show a warning "No <noun> in this model", where the noun is "activities", "chemicals", "protein complexes", "nodes without evidence", "nodes with comments", "unconnected nodes" or "activities without causal relations".

#### Scenario: No unconnected nodes
- **WHEN** nodes are selected and the curator chooses Select → Unconnected nodes in a model where every node has a relation
- **THEN** the selection is cleared and a warning reads "No unconnected nodes in this model"

### Requirement: Grow selection along the graph
The system SHALL offer, when right-clicking a node with fewer than two nodes selected, a "Select" section with "Downstream" (the node and everything it leads to), "Upstream" (the node and everything leading to it) and "Connected" (its whole connected sub-graph, following relations both ways). Each SHALL replace the selection, always include the right-clicked node, and show "Selected N nodes".

#### Scenario: Select downstream
- **WHEN** the curator right-clicks node A, which leads to B and B leads to C, and chooses Select → Downstream
- **THEN** A, B and C are selected and a message reads "Selected 3 nodes"

#### Scenario: Connected through a shared target
- **WHEN** A and B both lead to C and the curator chooses Select → Connected on A
- **THEN** A, B and C are all selected

### Requirement: Find in model selects matches
The system SHALL, from the toolbar's "Find in model…" box, select a single picked match and scroll it to the centre of the view; "Select all N matches" SHALL select every match without moving the view; pressing Enter on a query with no match ("No match in this model") SHALL clear the selection.

#### Scenario: Pick one match
- **WHEN** the curator picks one result from Find in model
- **THEN** only that node is selected and the canvas scrolls to centre it

#### Scenario: Select all matches
- **WHEN** the curator chooses "Select all 4 matches"
- **THEN** those four nodes are selected and the view does not move

### Requirement: Node context menu for a single node
The system SHALL, when a logged-in curator right-clicks a node while fewer than two nodes are selected, offer Edit, Copy, Comments and Delete followed by the Select section; a curator who is not logged in SHALL see "View activity", "Comments" and the Select section.

#### Scenario: Logged in, single node
- **WHEN** a logged-in curator right-clicks a node with no multi-selection
- **THEN** the menu shows Edit, Copy, Comments, Delete, then Select → Downstream, Upstream, Connected

#### Scenario: Copy from the menu
- **WHEN** the curator chooses Copy on a node
- **THEN** that one node is copied, regardless of what else is selected

### Requirement: Node context menu for a multi-selection
The system SHALL, when the curator right-clicks a node while two or more nodes are selected, offer only "Copy N nodes" and "Delete N nodes" to a logged-in curator and only "View activity" to one who is not logged in; Edit, Comments and the Select section SHALL be hidden. Above the 13-node cap both rows SHALL be disabled with the line "Select 13 or fewer to copy or delete" beneath them.

#### Scenario: Logged in, five selected
- **WHEN** five nodes are selected and a logged-in curator right-clicks one of them
- **THEN** the menu shows exactly "Copy 5 nodes" and "Delete 5 nodes"

#### Scenario: Logged out, several selected
- **WHEN** a curator who is not logged in right-clicks a node while three nodes are selected
- **THEN** the menu shows only "View activity"

#### Scenario: Over the cap in the menu
- **WHEN** 20 nodes are selected and the curator right-clicks a node
- **THEN** "Copy 20 nodes" and "Delete 20 nodes" are disabled and "Select 13 or fewer to copy or delete" is shown

### Requirement: Copy nodes
The system SHALL copy the selected nodes, or the single right-clicked node, together with every relation whose two ends are both among the copied nodes, and their positions relative to one another. It SHALL confirm with "Copied <count> — paste into this or any other model", or show the error "Could not store the copied region" if the copy cannot be stored.

#### Scenario: Copy three nodes with two inner relations
- **WHEN** three selected nodes have two relations among them and one relation to an unselected node, and the curator copies them
- **THEN** the clipboard holds the three nodes and the two inner relations only
- **AND** a message reads "Copied 3 nodes and 2 relations — paste into this or any other model"

### Requirement: Browser clipboard
The system SHALL hold copied nodes in a single browser-local clipboard entry, not the system clipboard, so no clipboard permission is needed; the entry SHALL be readable from any tab or window of the same browser, including other models, and each copy SHALL replace the previous entry.

#### Scenario: Copy in one tab, paste in another model
- **WHEN** the curator copies nodes in one model's tab and then pastes in another model's tab of the same browser
- **THEN** the paste offers the nodes copied in the first tab

#### Scenario: Last copy wins
- **WHEN** the curator copies two nodes and then copies one other node
- **THEN** the clipboard holds only the one node copied last

### Requirement: Paste from the canvas menu
The system SHALL, when a logged-in curator right-clicks empty canvas, offer "Paste N nodes" (or "Paste 1 node") read from the clipboard at that moment, or a greyed "Nothing to paste" when the clipboard is empty; a curator who is not logged in SHALL see "Log in to edit" instead.

#### Scenario: Clipboard holds nodes
- **WHEN** three nodes were copied and a logged-in curator right-clicks empty canvas
- **THEN** the menu offers "Paste 3 nodes"

#### Scenario: Empty clipboard
- **WHEN** nothing has been copied and the curator right-clicks empty canvas
- **THEN** the menu shows "Nothing to paste" and offers no action

#### Scenario: Not logged in
- **WHEN** a curator who is not logged in right-clicks empty canvas
- **THEN** the menu shows "Log in to edit"

### Requirement: Paste confirmation dialog
The system SHALL, before pasting, show a dialog titled "Paste copied nodes" asking "Paste N nodes and their relations?" (or "Paste N nodes?" / "Paste 1 node?" when there are no relations), with a preview of the copied nodes, an "Include evidence" checkbox described "Copy evidence and references from the source nodes", ticked each time the dialog opens, and Cancel and Paste buttons, Paste in the primary theme colour.

#### Scenario: Paste dialog contents
- **WHEN** the curator pastes three nodes with two relations
- **THEN** the dialog asks "Paste 3 nodes and their relations?", shows the preview, and "Include evidence" is ticked

#### Scenario: Cancel
- **WHEN** the curator chooses Cancel in the paste dialog
- **THEN** nothing is written to the model

#### Scenario: Checkbox resets
- **WHEN** the curator unticks "Include evidence", cancels, and pastes again
- **THEN** "Include evidence" is ticked again

### Requirement: Selection preview
The system SHALL draw, in the paste and bulk-delete dialogs, a miniature of the nodes in their recorded relative layout, coloured by node type as on the canvas, with lines for the relations between them, labelled "Preview of N nodes" for assistive technology.

#### Scenario: Preview layout
- **WHEN** the paste dialog opens for two nodes copied side by side with one relation between them
- **THEN** the preview shows two side-by-side boxes joined by one line

### Requirement: Paste writes nodes and relations in one save
The system SHALL, on confirming a paste, create every copied node with new identities and every copied relation between them in a single save, then show "Pasted <count>"; with "Include evidence" unticked it SHALL omit all evidence and references from both nodes and relations. On failure it SHALL show "Could not paste the region" and write nothing.

#### Scenario: Paste with evidence
- **WHEN** the curator confirms pasting three nodes and two relations with "Include evidence" ticked
- **THEN** three new nodes and two relations with their evidence are created in one save
- **AND** a message reads "Pasted 3 nodes and 2 relations"

#### Scenario: Paste without evidence
- **WHEN** the curator unticks "Include evidence" and confirms
- **THEN** the pasted statements and relations carry no evidence

#### Scenario: Paste into another model
- **WHEN** the curator pastes nodes copied from a different model
- **THEN** the new nodes share no identity with the originals and the source model is unchanged

### Requirement: Paste into an untitled model
The system SHALL, when pasting into a model that has no title, give the model the same default title an activity save would, taken from the first pasted node that names a gene product.

#### Scenario: Untitled target model
- **WHEN** the curator pastes nodes into a model with no title
- **THEN** the model receives a default title from the first pasted node with a gene product

### Requirement: Paste placement
The system SHALL place pasted nodes at the right-click point when pasted from the canvas menu, or at the pointer's last position over the canvas (the canvas centre if none) when pasted with Ctrl+V, rebuilding their copied relative layout and falling back to a compact grid where a node cannot be matched; the pasted nodes SHALL then be selected.

#### Scenario: Paste at a right-click point
- **WHEN** the curator right-clicks empty canvas, chooses Paste and confirms
- **THEN** the new nodes appear at that point in the layout they were copied in
- **AND** they are selected

#### Scenario: Keyboard paste position
- **WHEN** the curator presses Ctrl+V with the pointer last over a spot on the canvas and confirms
- **THEN** the new nodes appear at that spot

### Requirement: Bulk delete confirmation
The system SHALL, before deleting a multi-selection, show a dialog titled "Delete selected nodes" asking "Delete N nodes and their relations?" with a preview of the selected nodes and the relations between them, the note "This cannot be undone.", and Cancel and Delete buttons.

#### Scenario: Delete dialog contents
- **WHEN** the curator deletes a selection of three nodes
- **THEN** the dialog asks "Delete 3 nodes and their relations?", shows the preview and "This cannot be undone."

#### Scenario: Cancel delete
- **WHEN** the curator chooses Cancel
- **THEN** nothing is deleted and the selection is unchanged

### Requirement: Bulk delete removes the selection in one save
The system SHALL, on confirming a bulk delete, remove every selected node and its relations in a single save, close the drawer, clear the focused node and the selection, and show "Deleted N nodes"; on failure it SHALL show "Could not delete the selection".

#### Scenario: Confirm bulk delete
- **WHEN** the curator confirms deleting three selected nodes
- **THEN** the three nodes and their relations are removed in one save
- **AND** the selection is empty and a message reads "Deleted 3 nodes"

### Requirement: Single node delete confirmation
The system SHALL, when the curator deletes one node from its hover icon or its context menu, ask "Deleting this node cannot be undone. Continue?" in a dialog titled "Confirm Delete?", and on confirmation remove the node, close the drawer and clear the focused node.

#### Scenario: Delete one node
- **WHEN** the curator chooses Delete on a node's context menu and confirms
- **THEN** the node is removed from the model

### Requirement: Group permission check before writing
The system SHALL run the same group-permission check used for other edits before opening the paste dialog or the bulk delete dialog, opening the dialog only if the curator proceeds.

#### Scenario: Paste into another group's model
- **WHEN** the curator pastes into a model that belongs to a group they are not in
- **THEN** the group-permission check is shown before the paste dialog

### Requirement: Scoped auto layout
The system SHALL make the toolbar's Auto Layout button context-sensitive: with nodes selected it re-arranges only those nodes and leaves the rest in place; with nothing selected it re-arranges the whole graph. The resulting positions SHALL be stored.

#### Scenario: Auto layout a selection
- **WHEN** four nodes are selected and the curator clicks Auto Layout
- **THEN** only those four nodes move and every other node stays where it was

#### Scenario: Auto layout with nothing selected
- **WHEN** nothing is selected and the curator clicks Auto Layout
- **THEN** the whole graph is re-arranged

### Requirement: Keyboard shortcut scope
The system SHALL enable canvas keyboard shortcuts only while the curator is logged in and no activity form, relation dialog or model-updated notice is open, and SHALL ignore keys typed into a text field, select box or editable area.

#### Scenario: Typing in a field
- **WHEN** focus is in a text field and the curator presses Ctrl+A or Delete
- **THEN** the field handles the key and the canvas selection is unaffected

#### Scenario: Logged out
- **WHEN** a curator who is not logged in presses Escape or an arrow key
- **THEN** the canvas does not react

### Requirement: Selection keyboard shortcuts
The system SHALL clear the selection on Escape, select every node on Ctrl/Cmd+A, and move the whole selection 10 units per press of an arrow key when something is selected.

#### Scenario: Select all by keyboard
- **WHEN** the curator presses Ctrl+A on the canvas
- **THEN** every node is selected

#### Scenario: Nudge
- **WHEN** two nodes are selected and the curator presses the right arrow key
- **THEN** both nodes move 10 units right and their new positions are stored

#### Scenario: Escape
- **WHEN** nodes are selected and the curator presses Escape
- **THEN** the selection is cleared

### Requirement: Clipboard and delete keyboard shortcuts
The system SHALL copy the selection on Ctrl/Cmd+C and request deletion of the selection on Delete or Backspace, each only when something is selected, and SHALL paste on Ctrl/Cmd+V only when the clipboard holds nodes, otherwise leaving the keystroke to the browser.

#### Scenario: Delete key
- **WHEN** two nodes are selected and the curator presses Delete
- **THEN** the bulk delete dialog opens for those two nodes

#### Scenario: Ctrl+V with empty clipboard
- **WHEN** the clipboard is empty and the curator presses Ctrl+V
- **THEN** no paste dialog opens

#### Scenario: Ctrl+C with nothing selected
- **WHEN** nothing is selected and the curator presses Ctrl+C
- **THEN** the clipboard is unchanged

### Requirement: Save shortcut
The system SHALL, on Ctrl/Cmd+S, suppress the browser's save-page dialog and store the current model, showing "Model saved" on success or "Could not save the model" on failure.

#### Scenario: Ctrl+S
- **WHEN** the curator presses Ctrl+S on the canvas
- **THEN** the browser save dialog does not appear, the model is stored, and a message reads "Model saved"
