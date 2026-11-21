# Tasks

## 1. Already done

- [x] 1.1 "Search Annotations" is the first row-menu item on activity table rows with a GO aspect when the activity has an enabler and is not a chemical or protein-complex activity; it opens "Edit <term label>" pre-filled with the current term and evidence, and Save swaps the term (if changed) and reconciles evidence in one update
- [x] 1.2 The picker preselects the row's current term when it is among the results (activity table, activity form, annotation dialog)

## 2. Manual verification (browser, logged in, `npm run dev` on port 4208)

- [ ] 2.1 In the activity table of an existing Activity Unit with a UniProtKB enabler, open the Molecular Function row's ⋮ menu → "Search Annotations" is the first item; click it → a dialog "Edit <MF label>" opens with the current term and all current evidence rows
- [ ] 2.2 In that dialog click "Search Annotations" → the picker opens on top; if the current MF is among the gene product's annotations it is already selected and its evidence is listed
- [ ] 2.3 Pick a different term, tick one evidence, click "Done" → the dialog shows the new term and that one evidence; click "Save" → the table row shows the new term and evidence; reload the model and confirm they persisted
- [ ] 2.4 Repeat 2.1–2.3 on a Biological Process and a Cellular Component row → same behavior (CC picker lists no protein-containing complex terms)
- [ ] 2.5 Open the row menu on a protein-complex activity and on a chemical activity in the activity table → "Search Annotations" is not offered
