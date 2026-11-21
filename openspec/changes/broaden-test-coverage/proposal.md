# Proposal

## Why

The unit suite is now broad: 95 files and 1404 tests, all passing. A few modules with real logic still have no direct tests: the GOlr search query builder, the relation and chemical-connector forms, the activity-table row, and the shared comment-subject labels. A regression in any of them would only be caught by e2e runs or by curators. This change closes the gaps that carry real correctness risk and confirms the e2e suite still passes against the current fixtures.

## What Changes

Already landed (kept here for context only):
- Pure-function and data tests: annotation rules, lookup services, chemical-connector utils, connector services, node categories, activity templates, state colors.
- Hook and service tests: `useRelationFormConfig`, `useModelUrls`, `activityOperations`, `graphServices`.
- Component tests: `EntityRow`, `CamToolbar`, the comment forms and panel, `ConnectorForm` (with the relation form stubbed).

Remaining, as new test files only:
- `lookupApiSlice`: assert the GOlr URL that `searchTerms` builds, including the closure filter and the `excludeClosureIds` exclusion clauses, by capturing the JSONP request.
- `RelationForm`: decision-tree driven fields, the evidence list, and the save path.
- `ChemicalConnectorForm`: participant categorization as rendered, the evidence list, and save.
- `ActivityTableNode`: what a row shows (term, evidence, comment icon, delete and edit gating) for logged-in and logged-out users.
- `commentSubjects`: activity, individual, statement, and evidence labels, plus finding a comment subject by individual or evidence uid.
- Run the Playwright e2e suite and fix any spec that has drifted from the current UI.

Out of scope: production code changes; snapshot or visual-regression testing; trivial pass-through components (`RadioPillGroup`, `SectionRow`, `Chip`, theme files) that parent tests already exercise; raising coverage as a goal in itself.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Tests only, with no behavior change (`skip_specs: true`).

## Impact

- New files under `tests/` only, plus any e2e spec updates under `e2e/` needed to match the current UI.
- Shared helpers in `tests/fixtures/builders.ts` and `tests/test-utils.tsx` may gain small optional arguments; existing callers stay unchanged.
- No change to `src/`, dependencies, or runtime behavior.
