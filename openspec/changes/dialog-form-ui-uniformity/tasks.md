# Tasks

## 1. Decisions and shared pieces

- [x] 1.1 Audit every create/edit dialog's header, footer, section headings, evidence rows, buttons, icons and body background (see design.md Context)
- [x] 1.2 Shared section-heading style adopted by the activity form, term-and-evidence dialog, causal relation form, chemical connector form and Copy Model dialog
- [ ] 1.3 Confirm design.md decisions 1, 3 and 6 (footer tokens, evidence-row layout, white activity-form body) with the stakeholder; record any change in design.md before continuing
- [ ] 1.4 Add a shared dialog footer to `src/@noctua.core/components/dialog/` (right-aligned actions, optional left slot) and use it for the shared dialog wrapper's built-in footer and the confirm dialog; verify `npm run type-check` shows no new errors, `npx vitest run tests/@noctua.core` passes, and a delete confirmation (e.g. "Delete Activity" from the activity drawer menu) looks unchanged in the browser
- [ ] 1.5 Add a shared evidence-row container (card, column widths, action slot) and a shared add-evidence button style; verify `npm run lint` passes on the new files

## 2. Migrate the activity-editing dialogs

- [ ] 2.1 Activity form: shared footer with the `Why is the "Save" button disabled?` link in the left slot and "Clear" / "Save" on the right; white body. Verify in the browser: drag "ACTIVITY UNIT" onto the canvas, leave Molecular Function empty, and check the footer bar matches the Edit Title dialog's, the link still opens "Validation Errors" listing `"Molecular Function" is required`, and "Clear" still resets the form
- [ ] 2.2 Term-and-evidence dialog: shared footer and shared evidence-row container (row menu kept as the action). Verify in the browser: double-click an activity, open the molecular function row's ellipsis menu → "Add Context" → "has input", click "Add another evidence", and check the rows render as cards, the row menu items and confirmation are unchanged, and "Cancel" / "Save" behave as before
- [ ] 2.3 Edit Title, Change State and Copy Model dialogs: shared footer. Verify in the browser: click the title pen icon, the state chip and the copy icon in turn; each footer looks identical to the term-and-evidence dialog's and "Save" enablement is unchanged (a blank title still disables it)
- [ ] 2.4 Run `npx vitest run tests/features/gocam` and `npm run type-check`; verify no new failures compared with before the change

## 3. Migrate the connector forms

- [ ] 3.1 Causal relation form: shared footer (Delete and the disabled-reason button in the left slot, no drop shadow), shared evidence-row container keeping its trash icon, shared add-evidence button. Verify in the browser: draw a connection between two activities and check the footer matches the other dialogs and evidence rows add and delete exactly as before
- [ ] 3.2 Chemical connector form: shared footer (still "Save" only), shared evidence-row container keeping its trash icon, shared add-evidence button. Verify in the browser: connect an activity to a chemical and check evidence rows line up with the causal relation form's and "Save" enablement is unchanged
- [ ] 3.3 Replace the second icon set's plus with the main set's in both connector forms; verify `grep -rn "FiPlus" src` returns nothing and `npx vitest run tests/features/relations` passes

## 4. Final check

- [ ] 4.1 Open, one after another, the Activity Unit, Protein Complex and Chemical forms, an "Add has input" dialog, the causal relation form, the chemical connector form, Edit Title, Change State and Copy Model; verify all share the same header, section headings, footer bar, button size and white body, and that no label or enabled/disabled state differs from before
- [ ] 4.2 Run `npm run lint` and `npm run test`; verify no new failures
