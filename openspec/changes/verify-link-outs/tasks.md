# Tasks

## 1. Already done

- [x] 1.1 Link-out rules (ECO, PMID, GO_REF, gene-product/complex prefixes to AmiGO gene_product, other prefixes from the GO db-xref registry, unknown prefix as plain text) applied to activity table term ids, evidence codes, each reference source, and term search result ids

## 2. Manual verification (browser, `npm run dev` on port 4208, open a model in the activity table)

- [ ] 2.1 Click a UniProtKB enabler id → opens `https://amigo.geneontology.org/amigo/gene_product/UniProtKB:<acc>` in a new tab; repeat for an MGI/SGD/FB/WB enabler if the model has one → same AmiGO gene_product page for that CURIE
- [ ] 2.2 Click a GO term id (MF/BP/CC row) → AmiGO term page for that GO id; click a CHEBI id (chemical row or has input) → EBI ChEBI page for that id
- [ ] 2.3 Click a `PMID:` reference → `https://www.ncbi.nlm.nih.gov/pubmed/<acc>`; click a `GO_REF:` reference → `https://geneontology.org/GO_REF/<acc>` and the page resolves
- [ ] 2.4 Click the ECO id in parentheses next to an evidence code → Evidence Ontology term page for that ECO id
- [ ] 2.5 On an evidence whose reference has two sources (e.g. `PMID:… | GO_REF:…`) → the Reference cell shows both separated by ", " and each opens its own page
- [ ] 2.6 If the model has a ComplexPortal or PR enabler/part, click its id → the AmiGO gene_product page loads for that CURIE (report any that do not resolve)
- [ ] 2.7 In a term search (e.g. type "kinase" in a Molecular Function field), click a result's id → its link opens in a new tab and the result is not selected
