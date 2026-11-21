# Tasks

## 1. Already done (for context)

- [x] 1.1 `has input` placed in its own display group ordered between the molecular function and `part of` (BP), with weight 5; `happens during` left last
- [x] 1.2 Activity table, activity box and create form all order rows from the same shared configuration; ordering assertions in the existing form-utility tests updated

## 2. Connector colour for has-input rows

- [ ] 2.1 Add the has-input display group to the create-form row connector colour map using the same green as the molecular-function rows; verify `npx tsc -p tsconfig.app.json --noEmit` no longer reports the missing-property error for `EntityRow.tsx` (other pre-existing errors are out of scope)
- [ ] 2.2 Run `npx vitest run tests/features/gocam` and verify it passes as before

## 3. Manual browser check

- [ ] 3.1 Drag "ACTIVITY UNIT" onto the canvas, open the Molecular Function row's ellipsis menu → "Add Context" → "has input", then add "happens during" the same way; verify the form shows Molecular Function, then the "has input (Gene Product/Protein Complex)" row, then "(MF) part of (BP)", "(MF) occurs in (CC)", then the happens-during row, and that the has-input row's tree connector line is green like the other function rows
- [ ] 3.2 Add a second "has input" in the same form; verify both has-input rows sit together directly under the Molecular Function
- [ ] 3.3 Fill and save the activity with values in every row, set the canvas layout to "Default", and verify the activity box lists the molecular function, then "—has input", then "—part of", "—occurs in", and "—happens during" last
- [ ] 3.4 Double-click the saved activity; verify the drawer's Function Description section lists has input directly under the molecular function, before part of and occurs in
- [ ] 3.5 Open an existing activity with no has input; verify its order (molecular function, part of, occurs in) is unchanged
