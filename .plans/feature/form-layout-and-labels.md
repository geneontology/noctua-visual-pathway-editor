# Task: Form layout consistency + nested-CC label cleanup

**Status:** COMPLETE (Phase 3 deferred per user direction)
**Issue:** — (from `downloads/notes`)
**Branch:** issue-220-update-codebase

## Goal

Four cosmetic items from the notes:

1. Consistent font size across forms.
2. Wider form dialogs.
3. Fixed screen anchor (right vs center) — `(?)` in notes.
4. Strip "CC/" prefix from nested-CC menu labels.

## Resolved decisions

- **Phase 1+2:** All form text normalized to `text-sm`; primary form dialogs bumped from `md` (900px) to `lg` (1200px).
- **Phase 3 (anchor):** Deferred per user — still uncertain right vs center.

## Steps

### Phase 1: Normalize section/body text to `text-sm` ✅

Per the audit, `text-xs` was the dominant size for section headers and helper copy. User picked promotion to `text-sm` for the whole form surface.

- [x] `AnnotationForm.tsx` — SectionHeader title.
- [x] `RelationForm.tsx` — section labels (Suggested / Evidence / Chemical Intermediate), helper text, resolved-label span.
- [x] `ChemicalConnectorForm.tsx` — three section labels + two "no participants" info messages.
- [x] `ConnectorForm.tsx` — subject/object header strip.
- [x] `SectionRow.tsx` — label column.
- [x] `RadioPillGroup.tsx` — option labels + descriptions.
- [x] `CamMetadataForm.tsx` — three section headers (Model Information / Comments / Model Details), "No comments yet", model-details grid.
- [x] `ActivityForm.tsx` — protein-complex amber callout + "Why is the Save button disabled?" link.
- Left alone (intentional micro-text / badges / non-form surfaces): `ActivityForm.tsx:104` "IS NOT" badge (`text-[8px]`); `EntityRow.tsx:307` insert-menu sub-label (visual hierarchy under `item.label`); `DatabaseField.tsx` autocomplete dropdown rows; `SearchAnnotations.tsx` results table micro-headers; `AllowedDatabasesPopover.tsx` chip badges; `WithDropdown.tsx` / `ReferenceDropdown.tsx` popover content.

### Phase 2: Bump form dialog widths from `md` → `lg` ✅

`md = 900px` → `lg = 1200px` (per `modalSize.ts`). Applied to the four edit-form surfaces; the two metadata-style dialogs (CamMetadata, CopyModel) stay `sm`.

- [x] `useOpenAnnotationForm.ts` — AnnotationForm dialog.
- [x] `RelationForm.tsx` — ChemicalConnectorForm dialog open.
- [x] `PathwayViewer.tsx` — ConnectorForm SimpleDialog.
- [x] `ActivityFormDialog.tsx` — Activity form SimpleDialog.
- `CamMetadataForm` + `CopyModelDialog` left at `sm`.

### Phase 3: Anchor (right vs center) — DEFERRED

- [ ] Decide right vs center, then wire `<SimpleDialog classNames={{ inner: 'justify-end' }} />` (or equivalent) if right.

### Phase 4: Strip "CC/" prefix from nested-CC labels ✅

- [x] `insertMenuConfig.ts` — three `rangeLabel: 'CC/Cell/Anatomy/Organism'` → `'Cell/Anatomy/Organism'`.
- [x] Grep'd `'CC/Cell/Anatomy/Organism'` across `tests/` — no test asserts on the old string.

### Phase 5: Verify

- [x] `npm run type-check` clean.
- [x] Touched tests pass — AnnotationForm (21/21), formUtils (18/18), insertMenuConfig (5/5).
- [ ] Manual: open every form dialog (Annotation, ChemicalConnector, Connector, Activity), confirm text reads at the chosen scale and dialogs are at the wider size.
- [ ] Manual: CC row Add submenu reads "Cell/Anatomy/Organism" (no `CC/`).

## Recovery Checkpoint

- **Last completed action:** Phases 1, 2, 4 implemented; type-check + tests green. Phase 3 deferred.
- **Next immediate action:** manual verification, or move on to another plan.
- **Recent commands run:** `npm run type-check`, `npx vitest run tests/features/gocam/components/AnnotationForm.test.tsx tests/features/gocam/services/formUtils.test.ts tests/features/gocam/data/insertMenuConfig.test.ts`.
- **Uncommitted changes:** files listed below.
- **Environment state:** none.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Promote everything to `text-xs` (drop down to smallest). | Stakeholder preferred `text-sm` — promotes up for readability rather than down for density. | 2026-05-25 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| src/features/gocam/data/insertMenuConfig.ts | edit (Phase 4) | done |
| src/features/gocam/hooks/useOpenAnnotationForm.ts | edit (Phase 2) | done |
| src/features/relations/components/RelationForm.tsx | edit (Phase 1 + 2) | done |
| src/features/relations/components/ChemicalConnectorForm.tsx | edit (Phase 1) | done |
| src/features/relations/components/ConnectorForm.tsx | edit (Phase 1) | done |
| src/features/relations/components/SectionRow.tsx | edit (Phase 1) | done |
| src/features/relations/components/RadioPillGroup.tsx | edit (Phase 1) | done |
| src/features/gocam/components/CamMetadataForm.tsx | edit (Phase 1) | done |
| src/features/gocam/components/forms/AnnotationForm.tsx | edit (Phase 1) | done |
| src/features/gocam/components/forms/ActivityForm.tsx | edit (Phase 1) | done |
| src/features/gocam/components/dialogs/ActivityFormDialog.tsx | edit (Phase 2) | done |
| src/app/PathwayViewer.tsx | edit (Phase 2) | done |

## Blockers

- Phase 3 needs an anchor decision.

## Notes

- The `md` → `lg` bump is a 1200px modal — on smaller laptop screens that's near-full-width, which is the desired behavior for the form-editing surfaces. Metadata-style dialogs (CamMetadata, CopyModel) stay `sm` (600px) because they have less content.
- Promoting to `text-sm` may slightly increase form heights; if anything overflows ungracefully, revisit specific outliers rather than reverting the global change.
