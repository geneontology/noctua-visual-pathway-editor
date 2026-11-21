# Proposal

## Why

The announcement banner, pinned strip, bell and notifications panel have only been exercised against a mocked feed in unit and e2e tests. The published feed is live, but the editor has never been checked rendering it end to end.

## What Changes

- No code or behavior changes. A browser walkthrough against the live feed confirms a newly published announcement appears in the editor, scheduling and app targeting filter it correctly, and dismissal survives a reload.
- The behavior being checked is already described in `openspec/specs/announcements/spec.md`.

Out of scope for this repo, tracked in the announcements repository instead: granting the announcement author write access, the publish workflow's own validation (a malformed commit leaving the last good feed serving), and switching the landing page, Standard Annotation Editor and Form editor to the new feed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a verify-only change (`skip_specs: true`).

## Impact

None on code. Needs write access to the announcements repository to publish test announcements, and a running dev server (a non-production build, so `testing: true` announcements show).
