# Proposal

## Why

The read-only mode for curators who are not logged in (#278) is implemented across the canvas, forms, dialogs, model toolbar and activity table, and type-check and lint pass, but neither the logged-out nor the logged-in path has been checked in a browser. Three existing e2e specs are also expected to fail because they still encode the behavior from before #278.

## What Changes

- No code or behavior changes. A browser walkthrough confirms that a logged-out curator can view but not change anything, and that a logged-in curator's editing is unchanged.
- The e2e specs that predate #278 are run so the expected failures are confirmed and handed to the user for a decision; they are not edited without the user's go-ahead.
- The behavior being checked is already described in `openspec/specs/access-control/spec.md`.

Out of scope: linking the not-logged-in notice to the login page, and any change to what a logged-in curator can do.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a verify-only change (`skip_specs: true`).

## Impact

None on code. Needs a running dev server, a valid Barista token for the logged-in pass, and a model with at least two activities and one causal relation.
