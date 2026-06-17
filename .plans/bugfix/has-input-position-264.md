# Task: Move "has input" back to directly below the MF in the activity box (#264)

**Status:** ACTIVE
**Issue:** #264
**Branch:** issue-vep-updates-after

## Goal

In the activity unit box, the `has input` (RO:0002233) row renders just below the Molecular Function — as it did in the old UI — instead of at the bottom (after part_of / occurs_in).

## Context

- **Related files:**
  - `src/features/gocam/data/insertMenuConfig.ts:132-141` — `has input` entry: `weight: 30`, `displayGroup: DisplayGroup.MF_EXTRA`
  - `src/features/gocam/data/insertMenuConfig.ts:10-26` — `DisplayGroup` enum + `GROUP_ORDER` (`MF:0, BP:10, CC:20, MF_EXTRA:30`)
  - `src/features/gocam/data/insertMenuConfig.ts:230-258` — `getInsertWeight`, `getDisplayGroup`
  - `src/features/gocam/components/ActivityTable.tsx:35-174` — `buildDisplayTree`/`buildChildren` (sorts child edges by insert weight; groups for display)
  - `src/features/gocam/services/formUtils.ts` — `orderActivityEdgesForDisplay` (graph-node rendering uses the same weight/group config — keep consistent)
- **Triggered by:** Issue #264 (pgaudet).

## Current State

`has input` sits in `DisplayGroup.MF_EXTRA`, whose `GROUP_ORDER` is `30` — the highest — so it renders after `part of` (BP, 10) and `occurs in` (CC, 20). The reporter wants it immediately after the MF row. (`happens during` is also MF_EXTRA; the report only concerns `has input`, so leave `happens during` at the bottom.)

## Steps

### Phase 1: Reorder has_input — DONE
- [x] Added `DisplayGroup.MF_INPUT` (`GROUP_ORDER` `5`, between MF=0 and BP=10) and moved `has input` to it; lowered its `weight` 30 → `5`. `happens during` stays in `MF_EXTRA` (bottom).
- [x] No `ROOT_GROUP_BY_CATEGORY` change needed (has_input is an edge; its group comes from the `canInsertEntity` match).

### Phase 2: Keep box, graph, and form consistent — DONE
- [x] Verified all three read the shared `insertMenuConfig`:
  - **Box** (`ActivityTable.buildChildren`): orders MF children by `getInsertWeight` only → weight 5 < part_of 10 → has_input first.
  - **Graph node** (`orderActivityEdgesForDisplay`): sorts by `GROUP_ORDER` → MF_INPUT 5 < BP 10 → has_input first in fdEdges (below MF).
  - **Form** (`ActivityForm` bucket): groups by `GROUP_ORDER`; FD cards have no headers so the MF_INPUT card renders directly after the MF row, before BP/CC.
- [x] Updated two `formUtils.test.ts` assertions that encoded the old (bug) order. `npm run type-check` + `vitest formUtils.test.ts` (25/25) pass.

### Phase 3: Verify (manual, user)
- [ ] Activity box order: MF → **has input** → part of (BP) → occurs in (CC) → happens during.
- [ ] Graph node rendering matches.
- [ ] Activities without has_input are unaffected; multiple has_input rows stay grouped together right under MF.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Added `MF_INPUT` group (order 5), moved `has input` there, weight 30 → 5; updated 2 stale test assertions. type-check + formUtils tests pass.
- **Next immediate action:** User runs Phase 3 manual verification.
- **Uncommitted changes:** `src/features/gocam/data/insertMenuConfig.ts`, `tests/features/gocam/services/formUtils.test.ts`.

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/data/insertMenuConfig.ts` | New `MF_INPUT` group (order 5); `has input` moved there, weight → 5 | Done |
| `tests/features/gocam/services/formUtils.test.ts` | Update 2 assertions that encoded the old has_input-last order | Done |

## Notes
- This is a pure display-ordering change (no data/model change). Same config drives the insert menu — verify the menu order still reads sensibly (cosmetic).
