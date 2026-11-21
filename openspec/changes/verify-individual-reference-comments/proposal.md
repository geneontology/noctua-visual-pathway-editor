# Proposal

## Why

Comments on individual terms and on references (#231) are implemented and covered by unit tests, but the curator-facing round trip against a live model was never checked in the browser. This change records that manual QA so the work can be signed off.

## What Changes

- No code or behavior changes. A browser walkthrough confirms that individual and reference comments can be added, edited, and removed, survive a reload, show the right categories and badges, and appear in the Comments panel.
- The behavior being checked is already described in `openspec/specs/model-comments/spec.md`.

Out of scope: model-level comments, the GitHub ticket buttons (#289), and comments stored on statements, which the editor does not show.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a verify-only change (`skip_specs: true`).

## Impact

None on code. It needs a running dev server, a logged-in session (`?barista_token=`), and a model the curator is allowed to edit.
