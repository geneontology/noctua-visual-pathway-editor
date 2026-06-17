# Task: Fix broken external link-outs — gene_product, PMID, GO_REF (#266)

**Status:** ACTIVE
**Issue:** #266
**Branch:** issue-vep-updates-after

## Goal

External links from the activity unit box and evidence rows resolve to the correct destinations:
1. Gene products → `https://amigo.geneontology.org/amigo/gene_product/UniProtKB:O43187` (not `/term/`).
2. PMIDs → a real PubMed URL (not a relative `pmid:nnnnn`).
3. GO_REFs → `https://geneontology.org/GO_REF/0000024` (not the app-relative URL).
4. (Bonus, not in report) ECO evidence codes → Evidence Ontology, not AmiGO `/term/`.

## Context

- **Related files:**
  - `src/features/gocam/components/ActivityTableNode.tsx:250-257` — gene/term link: `${ENVIRONMENT.amigoTermUrl}${node.id}` (always `/term/`)
  - `src/features/gocam/services/graphServices.ts:194` — `referenceUrl: reference` (stores raw CURIE → broken PMID/GO_REF links)
  - `src/features/gocam/components/EvidenceRow.tsx:96-118` — renders `ev.referenceUrl` and the evidence-code link (`amigoTermUrl + ECO id`)
  - `src/features/search/services/lookupServices.ts:177-190` — existing `getTermURL()` (handles ECO + PMID, **no** GO_REF, **no** gene_product) — partial precedent to consolidate
  - `src/@noctua.core/data/constants.ts` — `ENVIRONMENT.amigoTermUrl`, `pubmedUrl`, `evidenceOntologyUrl` (no `goRefUrl` yet)
  - `src/features/gocam/data/allowedDatabases.ts` — DB prefix lists (use to classify gene-product prefixes)
- **Triggered by:** Issue #266 (pgaudet).

## Current State

URL building is scattered and prefix-blind:
- Activity node always uses `/term/` regardless of whether the id is a GO term or a gene-product CURIE.
- `graphServices.ts:194` precomputes `referenceUrl` as the raw CURIE; `EvidenceRow` renders it as an `href`, so `PMID:123` / `GO_REF:0000024` become relative links resolved against the workbench base URL.
- A correct-ish `getTermURL()` exists in `lookupServices.ts` but is unused by `graphServices`, and lacks GO_REF + gene_product handling.

## Steps

### Phase 1: Central CURIE→URL resolver
- [ ] Add `goRefUrl: 'https://geneontology.org/GO_REF/'` to `ENVIRONMENT` in `constants.ts`.
- [ ] Create one resolver (extend `getTermURL` in `lookupServices.ts`, or a small `urlServices.ts`) — `getEntityUrl(curie)`:
  - prefix `ECO` → `evidenceOntologyUrl + curie`
  - prefix `PMID` → `pubmedUrl + accession`
  - prefix `GO_REF` → `goRefUrl + accession` (note: `GO_REF:0000024` → `…/GO_REF/0000024`, colon→slash)
  - prefix ∈ gene-product DB set (UniProtKB, SGD, MGI, FB, RGD, ZFIN, WB, PomBase, Xenbase, …) → `${amigoBase}gene_product/${curie}`
  - default (GO, CHEBI, etc.) → `amigoTermUrl + curie`
  - Source the gene-product prefix set from `allowedDatabases.ts` (reuse an existing list if one fits; otherwise define a `geneProductDBs` constant there).

### Phase 2: Wire callers to the resolver
- [ ] `graphServices.ts:194` — set `referenceUrl` via `getEntityUrl(reference)` (or drop the precomputed field and resolve at render in `EvidenceRow` — pick one source of truth).
- [ ] `ActivityTableNode.tsx:250-257` — build the gene/term href via `getEntityUrl(node.id)`.
- [ ] `EvidenceRow.tsx:96-118` — evidence-code link via `getEntityUrl(ev.evidenceCode.id)` (fixes ECO bonus); reference link already uses `referenceUrl`.

### Phase 3: Verify (manual, user)
- [ ] Gene product link → `…/amigo/gene_product/UniProtKB:…`.
- [ ] GO/CHEBI term link → still `…/amigo/term/…`.
- [ ] PMID → opens PubMed; GO_REF → opens `geneontology.org/GO_REF/…`.
- [ ] ECO evidence code → Evidence Ontology.
- [ ] Edge case to confirm with curator: protein complex (`ComplexPortal:CPX-…`) — gene_product vs term page.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Plan written; broken sites confirmed (`ActivityTableNode.tsx:251`, `graphServices.ts:194`).
- **Next immediate action:** Add `goRefUrl` constant + central resolver.
- **Uncommitted changes:** none yet.

## Files Modified (planned)

| File | Action | Status |
| ---- | ------ | ------ |
| `src/@noctua.core/data/constants.ts` | Add `goRefUrl` | Pending |
| `src/features/search/services/lookupServices.ts` (or new `urlServices.ts`) | Central `getEntityUrl` resolver | Pending |
| `src/features/gocam/services/graphServices.ts` | `referenceUrl` via resolver | Pending |
| `src/features/gocam/components/ActivityTableNode.tsx` | Gene/term link via resolver | Pending |
| `src/features/gocam/components/EvidenceRow.tsx` | Evidence-code link via resolver | Pending |

## Notes
- One resolver, many callers — avoid re-scattering URL logic.
- `amigoTermUrl` currently ends in `term/`; derive a base (strip `term/`) for the `gene_product/` variant, or add a sibling constant.
