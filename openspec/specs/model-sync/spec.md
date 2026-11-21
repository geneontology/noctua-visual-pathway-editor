# model-sync Specification

## Purpose
Keep the open model current and the editor consistent while it changes: load the model, reload it after the curator's own changes, tell the curator when someone else changes it, and block the screen while a load, save or copy is in flight so actions cannot pile up.

## Requirements

### Requirement: Model chosen by address
The system SHALL open the model named by the `model_id` query parameter, and SHALL show "No model ID provided" in place of the editor when the parameter is missing.

#### Scenario: No model id
- **WHEN** the editor opens without a `model_id` parameter
- **THEN** the page shows "No model ID provided"

### Requirement: Model load states
The system SHALL show "Loading..." over the canvas while the model is first loading and "Error loading graph data" over the canvas when the model cannot be loaded.

#### Scenario: Load fails
- **WHEN** Barista returns an error for the model
- **THEN** the canvas shows "Error loading graph data"

### Requirement: Reload after the curator's own change
The system SHALL reload the open model from Barista after every change the curator sends, so the canvas, model toolbar and side drawer reflect what the server stored.

#### Scenario: Saving an activity
- **WHEN** the curator saves an activity form
- **THEN** the model is fetched again and the canvas shows the stored result

### Requirement: Watch the open model for remote changes
The system SHALL listen to Barista's live change feed while a model is open, whether or not the curator is logged in, and SHALL consider only change notices for the open model.

#### Scenario: Change to another model
- **WHEN** Barista announces a change to a model other than the one open
- **THEN** the editor does nothing

### Requirement: Own changes are not reported as remote
The system SHALL recognise a change notice as the curator's own when its packet id matches the packet id of a response to a change this tab sent, and SHALL ignore it.

#### Scenario: Curator saves
- **WHEN** the curator saves a change and Barista's response arrives before its change notice
- **THEN** no "Model Updated" dialog appears

### Requirement: Grace period for a late own response
The system SHALL wait 500 ms before treating a change notice with an unrecognised packet id as remote, and SHALL ignore it if a response with that packet id arrives within that time.

#### Scenario: Notice arrives before the response
- **WHEN** a change notice for the curator's own save arrives before the save's response
- **AND** the response arrives within 500 ms
- **THEN** no "Model Updated" dialog appears

#### Scenario: Genuine remote change
- **WHEN** another curator changes the open model
- **THEN** the "Model Updated" dialog appears about 500 ms after the notice

### Requirement: Notices without a packet id
The system SHALL treat a change notice for the open model that has no packet id, or the packet id "unknown", as a remote change immediately.

#### Scenario: Notice without packet id
- **WHEN** a change notice for the open model carries no packet id
- **THEN** the "Model Updated" dialog appears without waiting

### Requirement: Model Updated dialog
The system SHALL tell the curator about a remote change with a dialog titled "Model Updated" reading "This model has been modified. Please refresh to get the latest version." with a single "Refresh" button. The dialog SHALL have no close button and SHALL NOT close on Escape or a click outside it.

#### Scenario: Remote change while editing
- **WHEN** a remote change to the open model is detected
- **THEN** the "Model Updated" dialog appears
- **AND** pressing Escape or clicking outside it leaves it open

### Requirement: Refresh loads the latest model
The system SHALL reload the open model from Barista and close the "Model Updated" dialog when the curator clicks "Refresh".

#### Scenario: Refresh
- **WHEN** the curator clicks "Refresh"
- **THEN** the dialog closes and the latest version of the model is loaded

### Requirement: One notification at a time
The system SHALL show at most one "Model Updated" dialog per model; further remote changes while it is open SHALL NOT open another, and a later remote change after Refresh SHALL show it again.

#### Scenario: Several remote changes
- **WHEN** three remote changes arrive while the dialog is open
- **THEN** only one dialog is shown
- **AND** one Refresh brings in all three changes

### Requirement: Canvas shortcuts paused during a remote-change notice
The system SHALL disable canvas keyboard shortcuts while the "Model Updated" dialog is open.

#### Scenario: Pressing Delete under the dialog
- **WHEN** the "Model Updated" dialog is open and the curator presses Delete with nodes selected
- **THEN** nothing is deleted

### Requirement: Loading overlay during model operations
The system SHALL cover the whole screen with a semi-transparent overlay, a spinner and a message while the model is loading, a change is being saved, or the model is being copied. Messages SHALL be "Loading Model Activities..." for a load, "Deleting..." for a change that removes anything, "Saving..." for any other change, and "Copying Model..." for a copy.

#### Scenario: Deleting an activity
- **WHEN** the curator confirms deleting an activity
- **THEN** the overlay appears with "Deleting..."

#### Scenario: Copying a model
- **WHEN** the curator copies the model
- **THEN** the overlay appears with "Copying Model..."

### Requirement: Overlay blocks interaction
The system SHALL stack the loading overlay above every other element, including open dialogs, so no pointer interaction reaches the editor while it shows.

#### Scenario: Double-clicking Save
- **WHEN** the curator clicks Save in a form and clicks Save again while the overlay shows
- **THEN** the second click does not reach the button and only one change is sent

### Requirement: Overlay stays until every operation finishes
The system SHALL keep the overlay up while any tracked load, save or copy is still in flight, showing the message of the most recently started one, and SHALL remove it only when all have finished.

#### Scenario: Save followed by reload
- **WHEN** a save completes and the model reload it triggers starts
- **THEN** the overlay stays up and its message changes to "Loading Model Activities..."

### Requirement: Overlay lingers after completion
The system SHALL keep the overlay up for one second after each tracked operation finishes, whether it succeeded or failed, so the editor can settle before interaction resumes.

#### Scenario: Failed save
- **WHEN** a save fails
- **THEN** the overlay clears about one second later and does not stay stuck

### Requirement: Explicit save shortcut
The system SHALL store the open model on Barista when a logged-in curator presses Ctrl+S (Cmd+S on macOS) with focus outside a text field while no activity form, relation form or "Model Updated" dialog is open, showing "Model saved" on success or "Could not save the model" on failure. The browser's own save dialog SHALL be suppressed.

#### Scenario: Ctrl+S
- **WHEN** a logged-in curator presses Ctrl+S on the canvas
- **THEN** the model is stored and the toast "Model saved" appears
