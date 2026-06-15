# Issue #257 — Protein-Containing Complex `has part`

GH: https://github.com/geneontology/noctua-visual-pathway-editor/issues/257

## Problem
A protein-containing complex (GO:0032991) is a GO descendant of cellular component
(GO:0005575), so Minerva tags it with BOTH root types, with CC listed first. Three
places resolved a node's category by "first root type that matches" → a complex
resolved to CC instead of complex. CC's shape allows only `part of`, so:

1. **Graph + Activity table**: `has part` edges (complex → gene products) were filtered
   out of the activity, so the parts never displayed. (fixed first pass)
2. **Complex form edit menu**: the complex row showed the ellipsis menu offering
   `part of` instead of a `+` button offering only `has part`.
3. **Existing parts** weren't loaded into the edit form (depended on #1).

## Root cause (3 duplicated sites)
- `graphServices.ts` `getSubjectType` / `SUBJECT_TYPE_PRIORITY`
- `activityTemplates.ts` `inferCategory` (edit-mode Activity → form tree)
- `ActivityTableNode.tsx` `node.rootTypes[0]` + target-type resolution

## Fix
Single shared `getPrimaryRootType(rootTypes)` in `nodeCategories.ts`, most-specific-first
(complex before CC, gene product before chemical). Use it in all three sites.

## Status
- [x] graphServices priority reorder (initial fix) → then consolidated to shared helper
- [x] getPrimaryRootType helper in nodeCategories.ts
- [x] inferCategory uses helper (edit-mode complex → PCC → `+`/`has part` + parts load)
- [x] ActivityTableNode uses helper (table `+` offers `has part`)
- [x] tests — graphServices.test.ts (4), getPrimaryRootType in nodeCategories.test.ts (7),
      complex edit-mode in activityTemplates.test.ts (3)
