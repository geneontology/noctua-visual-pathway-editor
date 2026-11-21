# Tasks

## 1. GOlr search query (`lookupApiSlice`)

- [ ] 1.1 Create `tests/features/search/slices/lookupApiSlice.test.ts`. Dispatch `searchTerms` with `closureIds` only and capture the JSONP script URL by spying on `document.body.appendChild`. Assert the `q` text and the closure filter, then call the `json.wrf` callback with `tests/fixtures/raw/golr/search-mf.json` and assert the mapped results. Verify with `npx vitest run tests/features/search/slices/lookupApiSlice.test.ts`.
- [ ] 1.2 In the same file, dispatch `searchTerms` with `excludeClosureIds` and assert that each excluded id appears as an exclusion clause in the URL. Resolve with `search-chemical-with-exclude.json` and assert that every result is a CHEBI term. Verify with the same command.

## 2. Comment subject labels (`commentSubjects`)

- [ ] 2.1 Create `tests/features/gocam/services/commentSubjects.test.ts` covering:
  - `activityLabel` fallbacks: gene product, then function, then root term, then `Activity`.
  - `individualLabel`: `label (id)`, a missing label or id, and a null input.
  - `statementLabel` as `relation → object`.
  - `evidenceLabel` as `code · reference`, falling back to `Reference`.
  - `findCommentSubject` for a node uid, an evidence uid (returns its edge and evidence), an unknown uid, and a null model.

  Use the builders in `tests/fixtures/builders.ts`. Verify with `npx vitest run tests/features/gocam/services/commentSubjects.test.ts`.

## 3. Activity table row (`ActivityTableNode`)

- [ ] 3.1 Create `tests/features/gocam/components/ActivityTableNode.test.tsx`. Render inside `MantineProvider` and `GroupGuardProvider` with `renderWithProviders` and a model from the fixtures, and mock `camApiSlice`. Assert that the term label and id link render, and that the evidence columns appear when the row has evidence. Verify with `npx vitest run tests/features/gocam/components/ActivityTableNode.test.tsx`.
- [ ] 3.2 In the same file, cover the term cell's comment icon:
  - Logged in, with no comments: `Add comment`.
  - With comments: `Comments (N)`.
  - Logged out, with no comments: no icon.
  - Clicking the icon opens `INDIVIDUAL_COMMENTS_FORM` with the node uid and the individual categories, checked through the dialog slice state.

  Verify with the same command.
- [ ] 3.3 In the same file, cover the delete and edit gating: no delete affordance when logged out, and none for nodes that may not be deleted. Assert through visible affordances, not menu portals. Verify with the same command.

## 4. Relation form (`RelationForm`)

- [ ] 4.1 Create `tests/features/relations/components/RelationForm.test.tsx`. Stub `Autocomplete` and `DatabaseField`, mock `camApiSlice`, and preload the `relation` slice. For each connector type, assert which relationship, effect, and directness options render. Verify with `npx vitest run tests/features/relations/components/RelationForm.test.tsx`.
- [ ] 4.2 In the same file, add an evidence row through the stubbed fields, save, and assert the operations sent to the mocked mutation: the relation id and the attached evidence. Also assert that a logged-out user sees no save. Verify with the same command.

## 5. Chemical connector form (`ChemicalConnectorForm`)

- [ ] 5.1 Create `tests/features/relations/components/ChemicalConnectorForm.test.tsx`. Use source and target activities with chemical participants, and assert that the rendered participant groups match `categorizeParticipants`. Verify with `npx vitest run tests/features/relations/components/ChemicalConnectorForm.test.tsx`.
- [ ] 5.2 In the same file, toggle a participant, save, and assert that the participant operations sent to the mocked mutation match `buildChemicalParticipantOperations` for that selection. Verify with the same command.

## 6. Integration checks

- [ ] 6.1 Run `npm run test:e2e` (Playwright starts `npm run dev` itself). Verify every spec passes. If a spec fails because the UI has moved on, update that spec under `e2e/` to the current wording and flow, without changing `src/`.
- [ ] 6.2 Run `npx vitest run`, `npm run type-check`, and `npx eslint tests e2e`. Verify the unit suite stays fully green (1404 tests before this change, plus the new ones), type-check is clean, and lint reports no errors.
