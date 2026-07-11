# Bugfix: GO protein complexes cannot be added as inputs (#270)

## Problem
`has input` on a molecular function lost the ability to search/add protein complexes
— only gene products show up. Old code searched a union of Gene Product + Protein
Complex closures (`category: [GoMolecularEntity, GoProteinContainingComplex]`).

## Root cause
The has-input term search is scoped by `getSearchClosures`, which collapses a
multi-type set to a **single** primary category (via `getPrimaryRootType`). Even when
the range is [Gene Product, Protein Complex] it picks one, so the search never unions
the two closures. The insert menu also passes only `targetType` (Gene Product).

## Fix (union search for has-input)
1. `insertMenuConfig.ts` — add optional `searchRootTypes?` to `InsertMenuItem`; set it
   to `[MOLECULAR_ENTITY, PROTEIN_CONTAINING_COMPLEX]` on the `has input` item.
2. `EntityRow` + `ActivityTableNode` insert handlers — pass `item.searchRootTypes` (fall
   back to `[targetType]`) as the new node's search root types.
3. `getSearchClosures` — made config-driven instead of a hardcoded pair. It maps each
   root type to its category and drops any category that another present category
   supersedes via `excludeClosureIds` (chemical excludes gene product, CC excludes
   complex). What remains is the most-specific category — usually one, but for a union
   range like has-input it's the two disjoint siblings, whose closures are searched
   together. `lookupApiSlice` ORs closure ids, so both surface. Node creation is
   unchanged: the selected term's class wins.

## Files
- src/features/gocam/data/nodeCategories.ts
- src/features/gocam/data/insertMenuConfig.ts
- src/features/gocam/components/forms/EntityRow.tsx
- src/features/gocam/components/ActivityTableNode.tsx
