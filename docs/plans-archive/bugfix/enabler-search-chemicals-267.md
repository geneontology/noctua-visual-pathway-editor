# Task: Editing a gene-product enabler searches CHEBI chemicals instead of gene products (#267)

**Status:** ACTIVE
**Issue:** #267
**Branch:** issue-vep-updates-after

## Goal

When a curator inline-edits an activity's enabler (gene product) or a protein-complex part, the autocomplete must return gene products — not CHEBI chemicals. Editing a chemical must keep working.

## Context

- **Related files:**
  - `src/features/gocam/components/forms/EditorDropdown.tsx:86-89` — **bug site**: derives `excludeRootTypes`
  - `src/features/gocam/components/ActivityTableNode.tsx:358` — passes `termRootTypes={node.rootTypes}` into `EditorDropdown`
  - `src/features/gocam/data/nodeCategories.ts` — `getPrimaryRootType`, `getNodeCategory`, `CATEGORY_PRIORITY`, `molecularEntity`/`chemicalEntity` definitions
  - `src/features/gocam/data/activityTemplates.ts:185` — the **correct** pattern (`activityToFormTree` sets `excludeRootTypes` from the *primary* category)
  - `src/features/search/components/Autocomplete.tsx` / `src/features/search/slices/lookupApiSlice.ts:68-75` — forwards exclusions into the GOlr `fq`
- **Triggered by:** Issue #267 (pgaudet). Regression introduced when closure-exclusion filtering was added.

## Current State

**Root cause (corrected):** The *include* closure — not the exclude — is the real culprit.
The term search sends `closureIds` as `isa_closure:"<id>"` clauses OR-joined
(`lookupApiSlice.ts:68-75`). When editing an **existing** node, `node.rootTypes` is the
**raw multi-type set from Minerva** (`graphServices.ts:260`). A gene product is
`[CHEBI:33695 (MOLECULAR_ENTITY), CHEBI:24431 (CHEMICAL_ENTITY), …]`, so the include
becomes `isa_closure:"CHEBI:33695" OR isa_closure:"CHEBI:24431"` → chemicals leak in.

The legacy Angular app always searched with a **single primary category**
(`entity-definition.ts`): GP = `isa_closure:"CHEBI:33695"` (no suffix); Chemical =
`isa_closure:"CHEBI:24431" OR NOT isa_closure:"CHEBI:33695"`. The new exclude mechanism
already reproduces the `OR NOT` suffix — but only if the include set is the *primary*
type. New/inserted nodes already work because they set `rootTypes = category.searchClosureIds`
(`activityTemplates.ts:94`, `EntityRow.tsx:215`); only the *edit-existing* path passed
the raw set.

**Fix:** add `getSearchClosures(rootTypes)` to `nodeCategories.ts` — resolves include
(`searchClosureIds`) **and** exclude (`excludeClosureIds`) from the primary category,
falling back to the raw set for unknown types. Apply it in every place that feeds a
node's `rootTypes` into the term autocomplete: `EditorDropdown` (inline edit, #267),
`EntityRow` (form table), and `AnnotationForm` (consolidated off the old flatten pattern;
was not broken in practice since it only receives single types).

## Steps

### Phase 1: Fix the closure derivation (include + exclude)
- [x] Add `getSearchClosures(rootTypes)` to `nodeCategories.ts` (primary-category include + exclude, raw fallback).
- [x] `EditorDropdown.tsx`: derive `{ closureIds, excludeClosureIds }` via `getSearchClosures`; pass `closureIds` as `rootTypeIds` (was raw `termRootTypes`).
- [x] `EntityRow.tsx`: same — `rootTypeIds`/`excludeRootTypeIds` from `getSearchClosures(node.rootTypes)`.
- [x] `AnnotationForm.tsx`: replace the per-rt `flatMap` flatten with `getSearchClosures`; pass derived `closureIds`.
- [x] `npm run type-check` + `eslint` on changed files pass.

### Phase 2: Verify (manual, user)
- [ ] Inline-edit a gene-product enabler → autocomplete returns gene products (UniProtKB etc.), not CHEBI.
- [ ] Inline-edit a protein-complex part → returns gene products.
- [ ] Inline-edit a chemical → still returns chemicals only (no gene products leaking in).
- [ ] Confirm CC inline edit still hides protein-containing complex, and Molecule/Chemical still hide information biomacromolecule (the exclusion's original purpose).

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Corrected root cause (include set, not exclude). Added `getSearchClosures` and applied it in `EditorDropdown`, `EntityRow`, `AnnotationForm`. type-check + lint pass.
- **Next immediate action:** Phase 2 manual verification (user).
- **Uncommitted changes:** `nodeCategories.ts`, `EditorDropdown.tsx`, `EntityRow.tsx`, `AnnotationForm.tsx`.

## Files Modified (planned)

| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/data/nodeCategories.ts` | Add `getSearchClosures` (primary-category include + exclude) | Done |
| `src/features/gocam/components/forms/EditorDropdown.tsx` | Use `getSearchClosures`; pass primary `closureIds` as `rootTypeIds` | Done |
| `src/features/gocam/components/forms/EntityRow.tsx` | Use `getSearchClosures(node.rootTypes)` for term search | Done |
| `src/features/gocam/components/forms/AnnotationForm.tsx` | Replace flatten with `getSearchClosures` | Done |

## Notes
- `Autocomplete`/`lookupApiSlice` are correct — they faithfully forward whatever exclusions they're given. Fix belongs upstream in `EditorDropdown`.
