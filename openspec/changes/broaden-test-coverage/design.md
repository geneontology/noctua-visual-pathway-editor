# Design

## Context

See proposal.md for scope. The remaining targets differ from the pure-function tests already landed. `lookupApiSlice` talks to GOlr through a module-private JSONP helper that appends a `<script>` tag. The three components pull in RTK Query mutations, Mantine menus and portals, the term autocomplete, and the database field. `tests/setup.ts` already stubs `matchMedia`, `ResizeObserver`, and `scrollIntoView` for jsdom.

## Goals / Non-Goals

**Goals:**
- Each new test asserts behavior a curator would notice, such as the search query sent, which fields show, or the operations a save sends. It does not assert markup structure.
- The tests reuse the existing mocking conventions so the suite stays uniform.

**Non-Goals:**
- Driving Mantine dropdowns through their portals in jsdom.
- Exporting private helpers or otherwise changing `src/` to make code testable.

## Decisions

- **Capture JSONP at the DOM boundary.** Spy on `document.body.appendChild`, where the helper appends its script. Read the appended script's `src`, then call the `json.wrf` callback named in that URL on `window` with a GOlr fixture from `tests/fixtures/raw/golr/`. This exercises the real query builder without exporting it. Alternative rejected: mocking `fetch`, because the endpoint never calls it.
- **Mock the save mutation, not the network.** Mock `useUpdateGraphModelMutation` the way the 7 existing specs mock `@/features/gocam/slices/camApiSlice`, and assert the operations passed to it. Alternative rejected: MSW. It would be a new dependency for no extra signal.
- **Stub heavy children.** Stub `Autocomplete` and `DatabaseField` as the 4 and 3 existing specs do, so the form tests focus on the form's own logic. Where a value must come from them, the stub calls `onChange` directly.
- **Assert menu gating through its inputs.** Mantine `Menu` and `Select` dropdowns are unreliable in jsdom. Assert on the visible affordances and the props or dispatches that drive them. Leave menu clicks to e2e, as the `EntityRow` spec does.
- **Build state with fixtures.** Use `renderWithProviders` with `preloadedState` built from `tests/fixtures/builders.ts` and `tests/fixtures/models.ts`. Wrap in `MantineProvider` as the existing component specs do.

## Risks / Trade-offs

- [The JSONP spy depends on how the helper appends the script] → If the helper changes, the test fails loudly at the URL assertion rather than passing silently. That is acceptable for a test whose purpose is pinning the query.
- [Stubbing children can hide integration bugs between the form and the autocomplete] → The existing e2e specs cover that seam. Task 6.1 re-runs them.
