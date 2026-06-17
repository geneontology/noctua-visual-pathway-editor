# Task: Fix broken external link-outs — gene_product, PMID, GO_REF (#266)

**Status:** ACTIVE (code done, pending manual verify)
**Issue:** #266
**Branch:** issue-vep-updates-after

## Goal

External links from the activity unit box and evidence rows resolve to the correct destinations again, matching what the old Angular VPE produced.

## Decision (user)

Started from the old AmiGO-linker behavior (xref-per-prefix), then switched the two targets the #266 reporter called out, since the centralized resolver made it a one-file change:
- **Gene products / complexes -> AmiGO gene_product page** (`https://amigo.geneontology.org/amigo/gene_product/<CURIE>`), via a gene-product prefix allow-list in the resolver (UniProtKB, MGI, SGD, FB, RGD, ZFIN, WB, PomBase, Xenbase, TAIR, AGI_LocusCode, dictyBase, ComplexPortal, PR, RNAcentral, Ensembl, RefSeq, NCBIGene, HGNC, ...).
- **GO_REF -> `https://geneontology.org/GO_REF/<acc>`** (modern URL; the old `references.cgi#` URL is dead).

Everything else stays the old per-prefix xref behavior: GO -> amigo/term, CHEBI -> EBI, PMID -> `www.ncbi.nlm.nih.gov/pubmed/`, ECO -> Evidence Ontology, other source DBs -> their site, unknown prefix -> no link. Implemented with the "easier" allow-list approach (no call-site changes; all routing lives in `goLinker.ts`).

## Context

- `src/features/gocam/components/ActivityTableNode.tsx` — gene/term link (was always `/term/`)
- `src/features/gocam/services/graphServices.ts` — `referenceUrl` (was the raw CURIE)
- `src/features/gocam/components/EvidenceRow.tsx` — evidence-code link + reference link
- `src/features/search/services/lookupServices.ts` — `getTermURL()` (search-result links)
- Old behavior source: `old-noctua-visual-pathway-editor` `lookup.service.ts getTermURL` + `graph.service.ts` (`amigo2` `linker.url`); xref data = `amigo2/amigo2.js` `amigo.data.xrefs`.

## Steps

### Phase 1: Self-contained linker module — DONE
- [x] `src/@noctua.core/services/goLinker/goXrefs.ts` — GO db-xref `prefix -> url_syntax` map (213 prefixes; the exact data the old AmiGO linker used). Standalone data, no other deps.
- [x] `src/@noctua.core/services/goLinker/goLinker.ts` — `getEntityUrl(id)`: ECO -> Evidence Ontology; PMID -> PubMed; GO_REF -> geneontology.org GO_REF; gene-product/complex prefix -> AmiGO gene_product; else xref-template lookup by lowercased prefix (`[example_id]` -> accession), `null` if unknown. Isolated so it doesn't touch main constants/services.

### Phase 2: Wire callers to the resolver — DONE
- [x] `graphServices.ts` — `referenceUrl: getEntityUrl(reference) ?? ''`.
- [x] `ActivityTableNode.tsx` — gene/term link via `getEntityUrl(node.id)`; plain text when unresolved.
- [x] `EvidenceRow.tsx` — evidence-code link via `getEntityUrl`; reference cell splits the (possibly multi-source `'| '`-joined) `reference` and links each source via `getEntityUrl`.
- [x] `lookupServices.ts` `getTermURL` — delegates to `getEntityUrl`; removed now-unused `ENVIRONMENT` import.
- [x] `npm run type-check` + `eslint` on touched files pass clean.

### Phase 3: Verify (manual, user)
- [ ] Gene product (UniProtKB) -> `https://amigo.geneontology.org/amigo/gene_product/UniProtKB:<acc>`; MOD genes (MGI/SGD/FB/...) -> AmiGO gene_product too.
- [ ] GO term -> `amigo/term/...`; CHEBI -> EBI chebi page.
- [ ] PMID -> `www.ncbi.nlm.nih.gov/pubmed/<acc>`; GO_REF -> `https://geneontology.org/GO_REF/<acc>`.
- [ ] ECO evidence code -> Evidence Ontology.
- [ ] Multi-source reference (`PMID:... | GO_REF:...`) -> each source links independently.
- [ ] Confirm AmiGO gene_product pages resolve for the MOD/complex prefixes used in your models (reporter to sanity-check ComplexPortal/PR if present).

## Recovery Checkpoint

- **Last completed action:** Built isolated `goLinker` module (data + resolver) and wired 4 call sites; type-check + lint clean.
- **Next immediate action:** User runs Phase 3 manual checks.
- **Uncommitted changes:** `goLinker/goXrefs.ts`, `goLinker/goLinker.ts` (new); `lookupServices.ts`, `graphServices.ts`, `ActivityTableNode.tsx`, `EvidenceRow.tsx`.

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/@noctua.core/services/goLinker/goXrefs.ts` | New — GO db-xref url_syntax map (213 prefixes) | Done |
| `src/@noctua.core/services/goLinker/goLinker.ts` | New — `getEntityUrl` resolver | Done |
| `src/features/search/services/lookupServices.ts` | `getTermURL` delegates to `getEntityUrl`; drop `ENVIRONMENT` import | Done |
| `src/features/gocam/services/graphServices.ts` | `referenceUrl` via resolver | Done |
| `src/features/gocam/components/ActivityTableNode.tsx` | Gene/term link via resolver | Done |
| `src/features/gocam/components/EvidenceRow.tsx` | Evidence-code + per-source reference links via resolver | Done |

## Notes
- Module is fully self-contained under `@noctua.core/services/goLinker/`; nothing else depends on the xref table, so it can change without affecting the rest of the app. `ENVIRONMENT` constants untouched.
- `Evidence.referenceUrl` remains on the model but `EvidenceRow` now resolves per-source at render (handles multi-source); the field is harmless if unused elsewhere.
