# Tasks

## 1. Already done (activity form and inline paths)

- [x] 1.1 With/from validation rule (split on "," and "|", allowed namespaces, case-insensitive) runs in the activity form for every evidence present, including the molecular function's enabled-by evidence, and blocks Save
- [x] 1.2 Inline With edit in the activity table runs the rule and shows an error notification instead of saving

## 2. Evidence dialog validation

- [ ] 2.1 In the evidence dialog's Save, run the with/from validation rule on each row's with/from; on the first error dispatch an error notification with the message and return without calling the submit handler or closing the dialog. Verify with `npm run type-check` and `npx eslint` on the touched file
- [ ] 2.2 Run `npx vitest run tests/features/gocam/components/AnnotationForm.test.tsx tests/features/gocam/services/formValidation.test.ts` and confirm no new failures

## 3. Manual verification (browser, logged in, `npm run dev` on port 4208)

- [ ] 3.1 Evidence dialog: in the activity table, open a molecular function row's ⋮ menu → "Add Evidence", fill an evidence code, reference `PMID:12345`, With/From `NCBIGene:7157`, click "Save" → error notification `Invalid database prefix: "NCBIGene" is not part of allowed entities`; dialog stays open with the values; no change in the table
- [ ] 3.2 Evidence dialog: change With/From to `SGD:S000001|TAIR:AT1G01010` and click "Save" → dialog closes and the evidence shows that with/from value
- [ ] 3.3 Activity form: open a new Activity Unit form, fill the gene product and Molecular Function with an evidence whose With/From is `NCBIGene:7157` → Save is disabled; click `Why is the "Save" button disabled?` → the "Validation Errors" dialog lists `With/from for "<MF row label>" on evidence(1): Invalid database prefix: "NCBIGene" is not part of allowed entities`
- [ ] 3.4 Activity form: change that With/From to `GO:0008150|NCBIGene:7157` → the error still names only `NCBIGene`; change it to `GO:0008150` → the error disappears; clear it → no with/from error
- [ ] 3.5 Inline: in the activity table click the edit icon on an existing evidence's With cell, enter `NCBIGene:7157`, click the green check → error notification with the same message; after reloading the model the With cell shows the old value
- [ ] 3.6 Inline: repeat 3.5 with `dictyBase:DDB_G0267178` → saved without error (dictyBase is allowed)
