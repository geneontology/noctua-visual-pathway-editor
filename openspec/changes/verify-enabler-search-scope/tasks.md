# Tasks

## 1. Already done

- [x] 1.1 Term search scope for existing nodes is derived from the node's most specific categories (gene product over chemical, protein complex over cellular component) in inline term edits, the activity form rows, and the annotation dialog

## 2. Manual verification (browser, logged in, `npm run dev` on port 4208, existing model in the activity table)

- [ ] 2.1 Click the edit icon on an activity's gene-product enabler term cell, type "kinase" → results are gene products (UniProtKB, MGI, …), no CHEBI ids
- [ ] 2.2 On a protein-complex activity, edit a "has part" member's term cell and type a gene name → results are gene products, no CHEBI ids
- [ ] 2.3 Edit an existing chemical node's term cell, type "ATP" → results are CHEBI chemicals and no gene products appear
- [ ] 2.4 Edit an existing Cellular Component term cell, type "complex" → no protein-containing complex (GO:0032991 descendants) results
- [ ] 2.5 Open a chemical (molecule) activity's chemical field and type a gene name → no gene products appear
