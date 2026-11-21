# access-control Specification

## Purpose
Decide who may change the open model: how a curator's Barista session is established and checked, what the editor offers to a curator who is not logged in, and when a logged-in curator is warned before editing a model that belongs to another group.

## Requirements

### Requirement: Token from the address bar
The system SHALL accept a Barista token from the `barista_token` query parameter when the page opens, use it as the curator's session token, remember it in this browser, and remove the parameter from the address bar without reloading the page.

#### Scenario: Opening the editor from Noctua with a token
- **WHEN** the curator opens the editor with `?model_id=<id>&barista_token=<token>`
- **THEN** the session uses `<token>`
- **AND** the token is remembered in this browser
- **AND** the address bar no longer contains `barista_token` while `model_id` is kept

### Requirement: Remembered token
The system SHALL fall back to the token remembered in this browser when the page opens without a `barista_token` query parameter.

#### Scenario: Reopening without a token in the URL
- **WHEN** a token was remembered from an earlier visit
- **AND** the curator opens the editor with only `?model_id=<id>`
- **THEN** the session uses the remembered token

#### Scenario: No token anywhere
- **WHEN** the page opens with no `barista_token` parameter and no remembered token
- **THEN** the curator is not logged in

### Requirement: Logged-in status comes from Barista
The system SHALL treat the curator as logged in only after Barista returns user information for the session token that itself carries a token. The returned name, ORCID URI and groups SHALL become the curator's identity; the first listed group is the curator's primary group.

#### Scenario: Valid token
- **WHEN** Barista returns user information with a token for the session token
- **THEN** the curator is logged in with the returned name and groups

#### Scenario: Token present but not yet confirmed
- **WHEN** a session token exists but Barista has not yet answered
- **THEN** the editor behaves as not logged in

### Requirement: Rejected tokens are forgotten
The system SHALL forget the session token and the remembered token, leaving the curator logged out, when Barista answers without a token or with HTTP 401 or 403. A server error or network failure SHALL NOT discard the token.

#### Scenario: Barista rejects the token
- **WHEN** Barista answers the user-information request with 401, 403, or a response that has no token
- **THEN** the session token and the remembered token are cleared
- **AND** the curator is logged out

#### Scenario: Barista is temporarily unavailable
- **WHEN** the user-information request fails with a 5xx status or a dropped connection
- **THEN** the session token and the remembered token are kept

### Requirement: Session re-checked on focus
The system SHALL re-check the session token with Barista each time the browser window regains focus while a token is held.

#### Scenario: Curator logs out in another tab
- **WHEN** the curator logs out of Barista elsewhere and returns to the editor window
- **THEN** the token is re-checked
- **AND** the editor becomes logged out once Barista rejects the token

### Requirement: Login and logout controls
The system SHALL show a "Login" button in the top toolbar when the curator is not logged in, linking to Barista's login page with the current page as the return address. When logged in it SHALL instead show the curator's name and primary group, opening a menu with "Logout", which goes to Barista's logout page carrying the token and the current page as the return address.

#### Scenario: Logged out
- **WHEN** the curator is not logged in
- **THEN** the top toolbar shows a "Login" button that returns to the current page after login

#### Scenario: Logged in
- **WHEN** the curator is logged in
- **THEN** the top toolbar shows the curator's name with the primary group's label beneath it
- **AND** choosing "Logout" from its menu navigates to Barista's logout page

### Requirement: Noctua link keeps the session
The system SHALL add the session token to the "Noctua" link in the top toolbar when a token is held, so the curator stays logged in when moving to Noctua.

#### Scenario: Following the Noctua link
- **WHEN** a session token is held and the curator clicks "Noctua" in the top toolbar
- **THEN** Noctua opens in a new tab with `barista_token=<token>` in its address

### Requirement: Not-logged-in notice
The system SHALL show a prominent amber notice above the graph toolbar while the curator is not logged in, reading "Not Logged In:" followed by "You can only view existing annotations. Log in to edit."

#### Scenario: Viewing a model logged out
- **WHEN** the curator opens a model without being logged in
- **THEN** the notice "Not Logged In: You can only view existing annotations. Log in to edit." is shown above the graph toolbar

#### Scenario: Logged in
- **WHEN** the curator is logged in
- **THEN** the notice is not shown

### Requirement: Read-only canvas when logged out
The system SHALL prevent every canvas gesture that would change the model while the curator is not logged in: the Toolbox palette is hidden, dropping a palette item creates nothing, no relation can be drawn between nodes, and nodes offer no edit or delete icons on hover. Nodes MAY still be dragged; positions are kept only in this browser.

#### Scenario: Toolbox hidden
- **WHEN** the curator is not logged in
- **THEN** the Toolbox palette is not shown beside the canvas

#### Scenario: Drawing a relation
- **WHEN** a logged-out curator drags from one node toward another
- **THEN** no relation is created and no relation form opens

#### Scenario: Hovering a node
- **WHEN** a logged-out curator hovers a node
- **THEN** the node is highlighted and shows only a view icon, with no edit or delete icons

### Requirement: Read-only canvas menus and shortcuts when logged out
The system SHALL limit canvas menus and shortcuts to viewing while the curator is not logged in: a node's right-click menu offers only "View activity" and "Comments", the blank-canvas right-click menu shows "Log in to edit", the selection bar offers no Copy or Delete, and canvas keyboard shortcuts do nothing.

#### Scenario: Right-clicking a node
- **WHEN** a logged-out curator right-clicks a node
- **THEN** the menu offers "View activity" and "Comments" only

#### Scenario: Right-clicking empty canvas
- **WHEN** a logged-out curator right-clicks empty canvas
- **THEN** the menu shows "Log in to edit" and no paste item

#### Scenario: Keyboard shortcut
- **WHEN** a logged-out curator presses Delete, Ctrl+C, Ctrl+V or Ctrl+S on the canvas
- **THEN** nothing is copied, pasted, deleted or saved

### Requirement: Forms open view-only when logged out
The system SHALL let a logged-out curator open edit forms and dialogs to read their contents but SHALL hide every action that saves, clears or deletes. In dialogs that offer Cancel to a logged-in curator, that button SHALL read "Close"; comment text areas SHALL be read-only.

#### Scenario: Activity form
- **WHEN** a logged-out curator opens an activity form
- **THEN** the form body is shown without its Clear and Save buttons

#### Scenario: Relation form
- **WHEN** a logged-out curator opens an existing relation
- **THEN** the form shows the relation without Delete, Cancel, Save or the Chemical Intermediate option

#### Scenario: Annotation and comments dialogs
- **WHEN** a logged-out curator opens an annotation or comments dialog
- **THEN** no Save or Add button is shown
- **AND** the dismiss button reads "Close"

### Requirement: Read-only model toolbar when logged out
The system SHALL remove model-level edit affordances from the model toolbar while the curator is not logged in: no title edit pen, the model state chip is not clickable and shows no pen, and "Make a copy of this model" is hidden. Error and comment counts remain viewable.

#### Scenario: Model toolbar logged out
- **WHEN** a logged-out curator views the model toolbar
- **THEN** the title has no edit pen, the state chip cannot be clicked, and no copy-model button is shown

### Requirement: Read-only activity table when logged out
The system SHALL show the activity table in the side drawer without edit affordances while the curator is not logged in: no "Delete Activity" menu, no row menus, no add buttons, and term and evidence cells cannot be edited or cleared. Comment icons SHALL appear only where comments already exist.

#### Scenario: Activity table logged out
- **WHEN** a logged-out curator opens an activity in the side drawer
- **THEN** no control to delete, add, edit or clear anything is shown
- **AND** a comment icon appears only on rows that already have comments

### Requirement: Empty-model hint matches login state
The system SHALL show "This model is empty" on an empty model, followed by "Drag an Activity Unit from the palette on the left to create your first activity." when logged in or "Log in to start adding activities." when not.

#### Scenario: Empty model logged out
- **WHEN** a logged-out curator opens a model with no activities
- **THEN** the canvas shows "This model is empty" and "Log in to start adding activities."

### Requirement: Warning before editing another group's model
The system SHALL ask a logged-in curator to confirm before starting a gated edit on a model that has at least one group, none of which the curator belongs to. The dialog SHALL be titled "Warning: Editing another group's model", read "You are about to edit a model associated with a different group(s) (<group labels>). Do you want to continue or cancel?", and offer "Continue and edit anyway" and a highlighted "Cancel".

#### Scenario: Curator outside the model's groups
- **WHEN** a logged-in curator whose groups do not include any of the model's groups starts a gated edit
- **THEN** the warning dialog appears listing the model's group labels, comma-separated, falling back to the group id when a group has no label

#### Scenario: Continue
- **WHEN** the curator chooses "Continue and edit anyway"
- **THEN** the dialog closes and the edit they started proceeds

#### Scenario: Cancel
- **WHEN** the curator chooses "Cancel" or closes the dialog
- **THEN** the dialog closes and nothing happens

### Requirement: No warning when the edit is the curator's own
The system SHALL start a gated edit immediately, without the warning, when the model has no groups, when the curator belongs to at least one of the model's groups (matched by group id), or when the curator is not logged in.

#### Scenario: Member of the model's group
- **WHEN** the curator belongs to one of the model's groups and starts a gated edit
- **THEN** the edit proceeds with no dialog

#### Scenario: Model without groups
- **WHEN** the model has no groups and the curator starts a gated edit
- **THEN** the edit proceeds with no dialog

#### Scenario: Logged out
- **WHEN** a logged-out curator opens a gated form to view it
- **THEN** the form opens view-only with no dialog

### Requirement: Which edits the group warning gates
The system SHALL apply the group warning to these edit starts: dropping a Toolbox item on the canvas; opening the relation form by drawing a new relation or clicking an existing one; pasting a copied region; deleting the canvas selection; opening the Edit Title or Change State dialog; and, in the activity table, editing a term, adding a node, adding or editing evidence, editing a row through Search Annotations, editing an evidence, reference or with cell, and opening term or reference comments.

#### Scenario: Gated canvas edit
- **WHEN** a curator outside the model's groups drops a Toolbox item on the canvas
- **THEN** the warning appears before the activity form opens

#### Scenario: Gated table edit
- **WHEN** a curator outside the model's groups clicks to edit an evidence cell
- **THEN** the warning appears before the cell editor opens

### Requirement: Actions the group warning does not gate
The system SHALL NOT show the group warning for viewing or selecting, copying nodes or regions, "Make a copy of this model", layout, zoom and node positioning, deleting a single node or a whole activity (each has its own confirmation), opening the comments panel, or saving with Ctrl+S.

#### Scenario: Deleting one node
- **WHEN** a curator outside the model's groups deletes a single node from its hover icon
- **THEN** only the delete confirmation appears, not the group warning

### Requirement: Changes attributed to the curator's primary group
The system SHALL send the curator's primary group as the providing group with every model change and model copy, and SHALL attribute new evidence to the curator's ORCID URI and primary group.

#### Scenario: Saving a change
- **WHEN** a logged-in curator saves any change to the model
- **THEN** the request names the curator's primary group as the providing group

### Requirement: Application data loads before the editor
The system SHALL show a splash screen reading "Loading application data..." until the directory of curators and groups has finished loading, and SHALL show "Error loading data: <message>" there if it fails. The splash SHALL stay for a short moment after loading ends, then give way to the editor.

#### Scenario: Directory loads
- **WHEN** the page opens
- **THEN** the splash screen shows "Loading application data..."
- **AND** the editor appears shortly after the curator and group lists load

#### Scenario: Directory fails
- **WHEN** the curator or group list cannot be loaded
- **THEN** the splash screen shows "Error loading data: <message>" before the editor appears
