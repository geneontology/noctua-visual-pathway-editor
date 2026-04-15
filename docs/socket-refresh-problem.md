# Socket Refresh: Current Status & Issues

## What's Working

When a model is changed, the Barista server broadcasts a notification to all connected clients via socket.io.

---

## Current Save Flow (without socket.io)

1. User clicks save
2. Client sends a save request to the server
3. Server responds with the result
4. Client then sends a separate "get latest model" request to the server
5. Server responds with the latest model
6. UI updates with the latest model, dialog closes, save flow completes

---

## Expected Behavior

### Scenario 1: Multiple windows/tabs open

1. User edits the model in Window A
2. Window A saves, gets the response, then requests the latest model (existing flow)
3. Server also broadcasts a socket notification to all clients
4. Window B receives the socket notification
5. Window B prompts the user: "This model has been updated. Please refresh."
6. User clicks "Refresh" and Window B loads the latest model

### Scenario 2: Single window/tab open

1. User edits the model in Window A
2. Window A saves, gets the response, then requests the latest model (existing flow)
3. No refresh prompt is needed — the user already has the latest data

---

## What's Actually Happening

### Scenario 2 (the problem): Single window/tab open

1. User edits the model in Window A
2. Client sends the save request to the server
3. Server processes the change and simultaneously:
   - **a)** Sends the API response back to Window A
   - **b)** Broadcasts a socket notification to all clients (including Window A)
4. Window A receives the API response → requests the latest model → starts updating
5. Window A also receives the socket notification → triggers another full reload
6. The socket-triggered reload races with the save flow, disrupting UI state (e.g., dialog won't close because the model it references gets replaced mid-save)

---

## Race Condition

After the server processes a change, Window A receives **two** signals at roughly the same time:
- The **API response** from its own save request (which triggers a "get latest model" request)
- The **socket notification** (which also triggers a full model reload)

We do not know which arrives first. If the socket notification triggers a reload before the save flow completes (dialog close, form reset, etc.), it disrupts the UI.

---

## Root Cause

The server broadcasts socket notifications to **all** connected clients — including the client that initiated the change. The client has no reliable way to distinguish between:

- **"I made this change"** — no action needed, the save flow already handles the update
- **"Someone else made this change"** — the user should be prompted to refresh
