# Task: Form layout consistency + nested-CC label cleanup

**Status:** ACTIVE
**Issue:** — (from `downloads/notes`)
**Branch:** issue-220-update-codebase

## Goal

Cosmetic alignment across the form surface:

1. **Consistent fonts.** All text in the various forms (ActivityForm, AnnotationForm, RelationForm, ChemicalConnectorForm, CamMetadataForm) should use the same scale.
2. **Wider forms.** Bump form dialog widths so more of each row is visible.
3. **Fixed screen anchor.** Forms should open at a consistent spot — right or center, pick once.
4. **Nested CC labels.** Strip the redundant "CC/" prefix from CC insertion menu labels.

## Context

- **Related files:**
  - `src/@noctua.core/components/dialog/SimpleDialog.tsx` + `modalSize.ts` — current size tokens
  - `src/features/gocam/components/forms/ActivityForm.tsx`, `AnnotationForm.tsx`, `RelationForm.tsx`, `ChemicalConnectorForm.tsx`, `CamMetadataForm.tsx`
  - `src/@noctua.core/theme/mantineTheme.ts` (lines 49-55 — `fontSizes`)
  - `src/features/gocam/data/insertMenuConfig.ts` (lines 154, 167, 181 — three `'CC/Cell/Anatomy/Organism'` strings)
- **Triggered by:** `downloads/notes`:
  > all font size in the various forms should be the same
  > forms should be wider so that more information in the form can be read
  > (?) make forms always appear at the same place in the browser (right, or center)
  > Menu to add a nested CC: ... labels are consistent; keep, but remove 'CC'

## Current State (audit-needed for fonts/width/anchor)

Sampling the form files:

- ActivityForm section title: `text-sm font-semibold` (line 371, 398).
- RelationForm section labels: `text-xs leading-[30px]` (line 295, 326).
- ChemicalConnectorForm section labels: `text-xs leading-[30px]` (line 162, 238).
- AnnotationForm SectionHeader: `text-xs font-semibold text-primary-700` (line 38).

So section titles drift between `text-sm` and `text-xs`. Forms open at different sizes per `openDialog({ size })` call. Mantine `Modal` centers by default.

CC labels: three identical `'CC/Cell/Anatomy/Organism'` strings in `insertMenuConfig.ts`.

## Steps

### Phase 1: Font-size audit (read-only)

- [ ] Walk the five forms; record every Tailwind text token in use (section titles, row labels, button text, body copy, badges).
- [ ] Decide on a target scale. Recommend three tokens:
  - `text-sm` — section titles
  - `text-xs` — row labels, button text, body copy
  - `text-2xs` — badges / metadata only
- [ ] Replace inconsistencies. Don't churn — only touch tokens that don't match.

### Phase 2: Width

- [ ] Inventory `openDialog({ size: ... })` calls — list the size token each form opens with.
- [ ] Pick a wider default for the form set: bump `md` or introduce a `form` token in `modalSize.ts`. Avoid widening sizes that aren't form dialogs (CloneEvidenceDialog, ConfirmDialog).
- [ ] Verify no horizontal scrolling at the new size on a 1280px-wide window.

### Phase 3: Anchor (right vs center)

The note marks this `(?)` — confirm with stakeholder first.

- [ ] If center: nothing to change.
- [ ] If right: pass `<Modal classNames={{ inner: 'justify-end' }} />` (or equivalent) through `SimpleDialog`. Either as the form-dialog default or as an `anchor?: 'center' | 'right'` prop.

### Phase 4: Strip "CC/" from nested-CC labels

- [ ] In `insertMenuConfig.ts`, replace `'CC/Cell/Anatomy/Organism'` with `'Cell/Anatomy/Organism'` at lines 154, 167, 181.
- [ ] Grep `'CC/Cell/Anatomy/Organism'` across `src/` and `tests/`. Update any test assertions that use the old string.

### Phase 5: Verify

- [ ] `npm run type-check` clean.
- [ ] Manual: open every form — text reads at the chosen scale; dialogs at the chosen width; anchor consistent.
- [ ] Manual: CC row Add submenu → label reads "Cell/Anatomy/Organism" (no "CC/").

## Recovery Checkpoint

- **Last completed action:** plan drafted from `downloads/notes` "Layout of forms" + "Menu to add a nested CC" sections.
- **Next immediate action:** Phase 1 — font-size audit (read-only).
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
| (TBD by audit) | edit | pending |
| src/@noctua.core/components/dialog/modalSize.ts | edit (Phase 2) | pending |
| src/@noctua.core/components/dialog/SimpleDialog.tsx | edit (Phase 3, if right-anchor) | pending |
| src/features/gocam/data/insertMenuConfig.ts | edit (Phase 4) | pending |

## Blockers

- Anchor decision (right vs center) — Phase 3.

## Notes

- This is cosmetic. Don't pair with behavioral changes; easier to review and revert.
- Phase 4 is a trivial 3-line edit — land it first as a quick win while the font/width audit is in progress.
