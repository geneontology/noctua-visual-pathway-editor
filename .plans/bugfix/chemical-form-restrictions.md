# Task: Lock down the Chemical (Molecule) activity form + add closure exclusions

**Status:** ACTIVE
**Issue:** — (from `downloads/notes`, "Bugs or functionality that case annotation errors")
**Branch:** issue-220-update-codebase

## Goal

Two coupled changes:

1. **Chemical form menu cleanup.** When the user opens a Chemical (Molecule) activity, hide Search Annotations / Add ISS Evidence / Fill with root term — none apply to chemicals.
2. **Closure exclusions on GOlr term search.** Today the closure filter in `lookupApiSlice.searchTerms` is just `isa_closure:"<id>"`. The old Angular code carried a `suffix: "OR NOT …"` clause on each category to exclude overlapping subtrees. That suffix is **missing** in the current code, so:
   - Chemical search returns Gene Products too (because `CHEBI:33695` Gene Product is a descendant of `CHEBI:24431` Chemical Entity).
   - Cellular Component search returns Protein Complexes too (because `GO:0032991` Protein-Containing Complex is a descendant of `GO:0005575` Cellular Component).
   Restore the exclusion pattern.

## Context

- **Related files:**
  - `src/features/search/slices/lookupApiSlice.ts` (lines 62-119 — `searchTerms` builds the closure filter at lines 67-70; **no exclusion clause today**)
  - `src/features/gocam/data/nodeCategories.ts` (lines 53-58 `cellularComponent`, 69-75 `chemicalEntity`, 77-83 `proteinContainingComplex` — currently only `searchClosureIds`, no exclusions)
  - `src/features/gocam/models/cam.ts` (lines 14-30 — `RootTypes`: `CHEMICAL_ENTITY = 'CHEBI:24431'`, `MOLECULAR_ENTITY = 'CHEBI:33695'`, `CELLULAR_COMPONENT = 'GO:0005575'`, `PROTEIN_CONTAINING_COMPLEX = 'GO:0032991'`)
  - `src/features/gocam/components/forms/EntityRow.tsx` (lines 287-333 — the Menu.Items to hide; lines 219-228 — where `node.rootTypes` is passed to `TermAutocomplete`)
  - `src/features/gocam/components/forms/ActivityForm.tsx` (lines 178-185 — `sectionTitles` switches on `ActivityType.MOLECULE`)
  - `src/features/gocam/data/activityTemplates.ts` (lines 46-57 — `moleculeActivity` is rooted on `chemCat`)
- **Old Angular reference (paraphrased from the user):**
  ```ts
  GoChemicalEntity = {
    category: 'CHEBI:24431',
    categoryType: 'isa_closure',
    suffix: `OR NOT ${GoMolecularEntity.categoryType}:"${GoMolecularEntity.category}"`,
    // → OR NOT isa_closure:"CHEBI:33695"
  }
  // And for CC / protein complex:
  // suffix: `OR NOT ${GoProteinContainingComplex.categoryType}:"${GoProteinContainingComplex.category}"`
  // → OR NOT isa_closure:"GO:0032991"
  ```
  Combined with the closure clause, the old filter for a chemical search was:
  ```
  isa_closure:"CHEBI:24431" OR NOT isa_closure:"CHEBI:33695"
  ```
- **Triggered by:** "Chemical" sub-list in `downloads/notes`:
  > Remove 'Search Annotation', Remove 'Add ISS evidence', Remove fill with root, Only allow ChEBI terms and only use ChEBI for autofill.

  Plus a directly-given clarification: implement the closure exclusion the way the old code did, and apply the same pattern for CC vs. protein complex.

## Current State

- `lookupApiSlice.ts:67-70` builds `closureFilter = closureIds.map(id => \`isa_closure:"${id}"\`).join(' OR ')`. No `OR NOT …` suffix. **Not fixed.**
- The Chemical/Molecule form's `EntityRow` rows unconditionally expose Search Annotations / Add ISS / Fill with root when `node.aspect && relation`. The chemical root has `aspect: null` so the gate hides them on the root — but the `LOCATED_IN → CC` child has `aspect=CELLULAR_COMPONENT` and shows them.
- Note: the existing `searchAnnotations` endpoint (lines 169-243) already excludes protein complexes from CC annotation searches via the separate-fq AND-NOT idiom `'-isa_partof_closure:"GO:0032991"'` (line 183). That's the right Solr shape for an exclusion; mirror it for `searchTerms` rather than literally inlining `OR NOT` if it turns out the old Angular code's `OR NOT` was bugged. Confirm semantics during Phase 3.

## Steps

### Phase 1: Plumb `activityType` to `EntityRow`

- [ ] `EntityRow` doesn't currently know the form's `activityType`. Read it via `useAppSelector(selectFormType)` inside the component. (No prop drilling needed — `selectFormType` already exists.)
- [ ] If [[row-menu-rules-by-relation]] lands first, the `parentCategory` plumbing is already in place — this plan only adds the `activityType` read on top.

### Phase 2: Hide three menu items in Molecule mode

In `EntityRow.tsx`:

- [ ] Compute `const isMoleculeForm = activityType === ActivityType.MOLECULE`.
- [ ] Wrap the "Search Annotations" Menu.Item (line 288) in `!isMoleculeForm && …`.
- [ ] Wrap "Add ISS Evidence" (line 332 today, or the new location inside the Evidence submenu after [[row-menu-rules-by-relation]] lands) in `!isMoleculeForm && …`.
- [ ] Wrap "Fill with root term" (line 329) in `!isMoleculeForm && …`.
- [ ] Leave the Evidence submenu intact — chemicals still bear evidence.

### Phase 3: Add `excludeClosureIds` to node categories

Extend `nodeCategories.ts` so each category can declare a set of subtrees to exclude. This is the structured equivalent of the old `suffix` field.

- [ ] Add `excludeClosureIds?: string[]` to the shape of each category (no type file to change — these are plain object literals, but make a TS type to keep them honest).
- [ ] Populate three of them:
  ```ts
  chemicalEntity.excludeClosureIds = [RootTypes.MOLECULAR_ENTITY]       // CHEBI:24431 minus CHEBI:33695
  cellularComponent.excludeClosureIds = [RootTypes.PROTEIN_CONTAINING_COMPLEX] // GO:0005575 minus GO:0032991
  // (Optionally) molecularEntity.excludeClosureIds = [RootTypes.PROTEIN_CONTAINING_COMPLEX]
  //   — gene-product search shouldn't surface protein complexes. Confirm with stakeholder; the user mentioned this case as "for CCC" which most likely meant CC, but the same logic applies to GP→ProteinComplex.
  ```
- [ ] Confirm category list with stakeholder before populating. The two definite ones are `chemicalEntity` and `cellularComponent`.

### Phase 4: Thread `excludeClosureIds` through the autocomplete

`TermAutocomplete` currently takes `rootTypeIds: string[]`. Add a matching `excludeRootTypeIds?: string[]` prop and propagate.

- [ ] `EntityRow.tsx:223` passes `rootTypeIds={node.rootTypes}`. Add `excludeRootTypeIds={...}` sourced from `getNodeCategory(node.category)?.excludeClosureIds`. Or move both onto a single `closureSpec` object — but two props mirrors the existing API more cleanly.
- [ ] In `Autocomplete.tsx`, forward `excludeRootTypeIds` to `useSearchTermsQuery({ searchText, closureIds, excludeClosureIds })`.

### Phase 5: Apply the exclusion in the GOlr query

`lookupApiSlice.ts:67-70` becomes:

```ts
const closureFilter =
  closureIds && closureIds.length > 0
    ? closureIds.map(id => `isa_closure:"${id}"`).join(' OR ')
    : null

const excludeFilters = (excludeClosureIds ?? []).map(id => `-isa_closure:"${id}"`)

// …

fq: [
  'document_category:"ontology_class"',
  ...(closureFilter ? [closureFilter] : []),
  ...excludeFilters,
]
```

- [ ] This uses the separate-fq AND-NOT idiom that the existing `searchAnnotations` endpoint already uses (line 183). It is the cleaner Solr shape and gives the user-intended result (Chemical AND NOT Gene Product, CC AND NOT Protein Complex).
- [ ] **Decision point:** if stakeholder explicitly wants the literal `OR NOT` from old code (perhaps because real-world Solr query plans were measured and that form was preferred), inline it instead:
  ```ts
  const closureFilter = [
    ...closureIds.map(id => `isa_closure:"${id}"`),
    ...(excludeClosureIds ?? []).map(id => `NOT isa_closure:"${id}"`),
  ].join(' OR ')
  ```
  Note this literal form may return a *broader* set than intended (matches CC documents ∪ all non-protein-complex documents), so verify against expected behavior. Recommend the AND-NOT form unless told otherwise.

### Phase 6: Verify

- [ ] `npm run type-check` clean.
- [ ] `npm run lint` clean.
- [ ] Manual: open a Chemical/Molecule activity → root row's ellipsis menu has no Search Annotations / Add ISS / Fill with root.
- [ ] Manual + devtools network tab: type into the Chemical root autocomplete → request `fq` contains `isa_closure:"CHEBI:24431"` AND `-isa_closure:"CHEBI:33695"` (or the inline `OR NOT` variant if that decision was made).
- [ ] Manual + devtools: type into a CC row autocomplete (in any form) → request `fq` contains `isa_closure:"GO:0005575"` AND `-isa_closure:"GO:0032991"`. Protein-complex terms (e.g. "ribosome") no longer appear in results.
- [ ] Manual: a normal MF activity still shows all three menu items as before.

## Recovery Checkpoint

- **Last completed action:** Phases 1-5 implemented. `npm run type-check` clean.
  - `formModels.ts`: `NodeCategory.excludeClosureIds?`, `TermNode.excludeRootTypes?`.
  - `nodeCategories.ts`: `chemicalEntity.excludeClosureIds=[MOLECULAR_ENTITY]`, `cellularComponent.excludeClosureIds=[PROTEIN_CONTAINING_COMPLEX]`. `getNodeCategory` return type widened to `(AnyCategory & NodeCategory) | undefined`.
  - `activityTemplates.ts`: `hydrateTemplate` and `activityToFormTree` populate `excludeRootTypes`.
  - `Autocomplete.tsx`: accepts `excludeRootTypeIds`, forwards to query.
  - `lookupApiSlice.ts`: `searchTerms` query type now accepts `excludeClosureIds?`; closure filter builds as `closureClauses + ' OR NOT '.join(excludeClauses)`.
  - `EntityRow.tsx`: reads `activityType` via `selectFormType`; gates Search Annotations / Fill with root / Add ISS Evidence on `!isMoleculeForm`; passes `excludeRootTypeIds` to `TermAutocomplete`.
- **Next immediate action:** Phase 6 — manual verification in dev server (network tab for `fq` content; menu behavior in Molecule form).
- **Recent commands run:** `npm run type-check` (clean).
- **Uncommitted changes:** all six files above.
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| src/features/gocam/components/forms/EntityRow.tsx | edit | pending |
| src/features/gocam/data/nodeCategories.ts | edit (add `excludeClosureIds`) | pending |
| src/features/search/components/Autocomplete.tsx | edit (forward `excludeClosureIds`) | pending |
| src/features/search/slices/lookupApiSlice.ts | edit (apply exclusion in `fq`) | pending |
| src/features/gocam/slices/activityFormSlice.ts | edit (comment only) | pending |

## Blockers

- Phase 5 decision: AND-NOT (recommended, mirrors existing `searchAnnotations`) vs literal `OR NOT` (matches old Angular code structurally but is semantically broader). Confirm before landing.
- Phase 3 scope: is `excludeClosureIds` needed on `molecularEntity` (gene product → exclude protein complex) too? User's "for CCC" comment is ambiguous between CC (cellular component) and CCC (some other shorthand). Best guess: CC. Confirm.

## Notes

- This is a real correctness bug, not just a UX cleanup: today's term searches surface entries from the wrong taxonomic branch (GPs in chemical search, protein complexes in CC search). The Chemical-form menu cleanup is the trigger, but the closure-exclusion mechanism is a broader fix that also affects every CC autocomplete in every form.
- The exclusion belongs on the category, not on the form. So once `excludeClosureIds` lands in `nodeCategories.ts`, every consumer of `getNodeCategory(...)`/`searchClosureIds` automatically benefits.
- Land [[row-menu-rules-by-relation]] first so Phase 2's gates apply to the post-reorg menu shape rather than to the soon-to-be-moved Menu.Items.
