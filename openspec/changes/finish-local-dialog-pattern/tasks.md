# Tasks

## 1. Already done

- [x] 1.1 Search Annotations picker is a controlled, locally rendered dialog in the annotation dialog and the activity form; its global-slot entry and opener hook are removed
- [x] 1.2 Annotation dialog receives its submit callback directly through the dialog's props; the module-level callback hand-off is removed
- [x] 1.3 Activity form dialog renders through the shared dialog wrapper; the dialog size map comment no longer mentions the previous UI library

## 2. Remaining code

- [ ] 2.1 Replace the raw modal around the activity form's "Validation Errors" dialog with the shared dialog wrapper (title "Validation Errors", small size), keeping the error list and the footer "Close" button. Verify with `npm run type-check`, `npx eslint src/features/gocam/components/forms/ActivityForm.tsx`, and `npx vitest run tests/features/gocam/components/ActivityForm.test.tsx` (no new failures)
- [ ] 2.2 Confirm by search that no file under `src/` references `pendingOnSubmit`, `pendingOnApply`, `consumeAnnotationFormOnSubmit`, `consumeSearchAnnotationsOnApply`, `SEARCH_ANNOTATIONS`, or `useOpenSearchAnnotations`

## 3. Manual verification (browser, logged in, `npm run dev` on port 4208)

- [ ] 3.1 Activity table → MF row ⋮ → Add Context → "part of" → in the dialog click "Search Annotations", pick a term and one evidence, click "Done" → the picker closes and the dialog shows the picked term and evidence
- [ ] 3.2 Same dialog: type a reference in an evidence row, click "Search Annotations", then "Cancel" → the picker closes and the dialog still shows the typed reference
- [ ] 3.3 Open the picker again and press Escape → only the picker closes; open it again and click the backdrop → only the picker closes
- [ ] 3.4 Activity form (new Activity Unit with a gene product) → MF row ⋮ → "Search Annotations" → pick a term and evidence → "Done" → the MF row shows the picked term and evidence; the form is still open
- [ ] 3.5 Activity form with a validation error → click `Why is the "Save" button disabled?` → "Validation Errors" dialog lists the errors; "Close", Escape, and backdrop click each close only that dialog
- [ ] 3.6 Open the activity form dialog from the activity table and close it with its header close button → it closes cleanly
