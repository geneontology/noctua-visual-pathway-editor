# Bugfix: inconsistent part label in Protein Complex create form (#275)

## Problem
In the Create form for a Protein Complex, the complex was seeded with one default
gene-product part. That default row was labelled from its category (`Gene Product`),
while every part added afterwards via the `+` menu was labelled
`(Protein Complex) has part (GP)` — so the first part looked different from the rest.

## Solution (agreed with reporter on the issue)
Remove the single default gene product. The complex now starts with no parts and every
part is added the same way via the row's `+` menu, so they all render with the same
`(Protein Complex) has part (GP)` label.

## Change
- `activityTemplates.ts` — `proteinComplexActivity`: the enabled_by ProteinComplex
  target now has `relations: []` (was one default `has_part → gene product`).
- `activityTemplates.test.ts` — updated the assertion: the complex starts with zero
  parts instead of one default has_part GP child.

## Files
- src/features/gocam/data/activityTemplates.ts
- tests/features/gocam/data/activityTemplates.test.ts
