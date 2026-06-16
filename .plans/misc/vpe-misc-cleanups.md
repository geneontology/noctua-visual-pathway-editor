# Task: VPE misc — gene-name length, top menus simplification, action menus

**Status:** ACTIVE
**Issue:** — (from `downloads/notes`, "Layout of VPE" + "Top menus" + "Nice to have")
**Branch:** issue-220-update-codebase

## Goal

Catch-all for the smaller items in `downloads/notes` that don't merit their own plan:

1. Allow more characters for gene names (lift any input length cap).
2. Simplify the top menus (vague — see "Top menu" reference in the notes).
3. "Form: more action menus" (Nice-to-have header) — vague enough that it needs scoping before implementation.

## Context

- **Related files (likely):**
  - Wherever gene-name input has a `maxLength` — grep needed.
  - `src/app/layout/Toolbar.tsx` and `src/features/gocam/components/CamToolbar.tsx` for top menus.
  - `src/features/gocam/components/forms/EntityRow.tsx` for "more action menus" (the ellipsis menu surface).
- **Triggered by:** `downloads/notes`:
  > allow more characters for gene names
  > Top menus: simplify - see details here: Top menu
  > Form: more action menus

## Steps

### Phase 1: Gene-name length

`Find the cap and remove it.`

- [ ] Grep for `maxLength`, `maxlength` across `src/`. Identify any input that displays/edits a gene name.
- [ ] Confirm with stakeholder what the new cap should be (or if it should be unbounded — `maxLength` removed entirely).
- [ ] Update the input(s). If the cap was added to prevent layout overflow, also widen the input column.
- [ ] If no `maxLength` is found, the constraint may be downstream — check truncation classes like `truncate` or `max-w-[Npx]` on gene-name display cells.

### Phase 2: Top menus simplification

The note references a "Top menu" spec that we don't have a copy of.

- [ ] Block on getting the spec. Once received, scope this into a proper plan and unblock.
- [ ] Until then, leave Toolbar / CamToolbar untouched.

### Phase 3: "Form: more action menus"

The note's "Nice to have" header line ("Form: more action menus") is too vague to implement without context. Possibilities:

- More options inside the existing ellipsis menu on EntityRow.
- Action menus on previously-menuless rows (e.g. CamMetadataForm).
- Form-level toolbar actions.

- [ ] Block on stakeholder clarification before any work here.

### Phase 4: Verify (Phase 1 only)

- [ ] `npm run type-check` clean.
- [ ] Manual: enter a long gene name → input accepts it; UI doesn't truncate visually (or truncates with overflow handling, intentionally).

## Recovery Checkpoint

- **Last completed action:** plan drafted from `downloads/notes` misc items.
- **Next immediate action:** Phase 1 — grep for `maxLength` and inspect.
- **Recent commands run:** none.
- **Uncommitted changes:** none.
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| (TBD by Phase 1 grep) | edit | pending |

## Blockers

- Phases 2 and 3 are blocked on stakeholder spec/clarification. Phase 1 is unblocked.

## Notes

- Don't try to interpret "simplify top menus" without the referenced "Top menu" doc — guessing leads to rework. Ask first.
- "More action menus" is ambiguous in the same way. The user's meeting notes probably reference a verbal discussion that wasn't transcribed; ask before scoping.
