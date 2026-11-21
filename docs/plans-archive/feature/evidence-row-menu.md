# Task: Move evidence-row actions into a per-row ⋮ menu (and shorten ISS/ISO/IC labels)

**Status:** COMPLETE
**Issue:** #220 (branch context)
**Branch:** issue-220-update-codebase

## Goal

In the evidence popup (`AnnotationForm`), remove all Evidence-section header buttons and the
per-row trash icon, and give every evidence row a single `⋮` menu (styled like the Activity
Row menu) with: **Add evidence · ISS · ISO · IC · Clear Values · Delete**. ISS/ISO/IC
**replace the current row's** values. On all other forms (only `EntityRow`), shorten the
existing menu labels `Add ISS Evidence → ISS`, `Add ISO Evidence → ISO`,
`Add IC Evidence → IC` (rename only, no structural change).

## Context

- **Related files:**
  - `src/features/gocam/components/forms/AnnotationForm.tsx` (the evidence popup)
  - `src/features/gocam/components/forms/EntityRow.tsx` (the Activity Row menu — reference + rename)
  - `src/features/gocam/models/formModels.ts` — reuse `createAutoPopulatedEvidence('iss'|'iso'|'ic')`
  - `src/features/gocam/services/annotationRules.ts` — `canAddISSEvidence` gate (unchanged)
  - `src/features/gocam/slices/activityFormSlice.ts` — `addISSEvidence/addISOEvidence/addICEvidence` reducers (unchanged; still used by EntityRow)
  - Tests: `tests/features/gocam/components/AnnotationForm.test.tsx`, `tests/features/gocam/components/EntityRow.test.tsx`
- **Triggered by:** User request — consolidate the evidence buttons into a per-row menu
  that mirrors the Activity Row, and rename the add-evidence variants everywhere else.

## Current State

- **What works now:**
  - `AnnotationForm` Evidence section header has 4 buttons: `Add evidence`, `Add ISS`,
    `Add ISO`, `Add IC` (last three gated by `canAddISS`). Each evidence row has a red trash
    `ActionIcon` (disabled when only one row).
  - In `AnnotationForm`, `Add ISS/ISO/IC` **append** a new auto-filled row.
  - `EntityRow` term-row `⋮` menu has an Evidence submenu reading `Add ISS Evidence`,
    `Add ISO Evidence`, `Add IC Evidence` (gated by `canAddISS`).
- **What's missing/changing:**
  - No per-row menu in the popup; no "Clear Values" action anywhere.
  - ISS/ISO/IC in the popup must switch from append to **replace the current row**.

## Decisions (confirmed with user)

- Popup menu items, in order: **Add evidence · ISS · ISO · IC · Clear Values · Delete**.
- ISS/ISO/IC **replace the current row** (not append) — matches how the Activity form's
  slice swaps a relation's evidence for a single auto-filled row.
- ISS/ISO/IC stay gated by `canAddISS` (`canAddISSEvidence(aspect, activityType)`).
- Remove **all** Evidence-section header buttons (including `Add evidence`) and the per-row
  trash icon. `Add evidence` now lives inside each row's menu.
- Keep ≥1 evidence row alive: **Delete disabled when only one row remains** (losing the last
  row would orphan the menu / the "Add evidence" entry).
- `EntityRow` and any other form: **rename only**, no per-row menu there.

## Steps

### Phase 1: AnnotationForm — per-row menu
- [ ] Imports: add `Menu` to `@mantine/core`; add `FaEllipsisV` from `react-icons/fa`;
      drop `FaPlus` and `FaTrash` (only used by removed buttons/trash). Keep `Button`
      (still used by Term section + footer).
- [ ] Evidence `SectionHeader`: remove the entire `right={...}` button block →
      `<SectionHeader title="Evidence" />`.
- [ ] Add handlers:
      - `fillRow(uid, variant)` → `const {evidenceCode, reference, withFrom} = createAutoPopulatedEvidence(variant); patchEvidence(uid, {evidenceCode, reference, withFrom})`.
      - `clearRow(uid)` → `patchEvidence(uid, {evidenceCode: {id:'', label:''}, reference:'', withFrom:''})`.
- [ ] Remove now-unused append callbacks `addISSEvidence`, `addISOEvidence`,
      `addICEvidence`, and the dead `handleFillISSEvidence`. Keep `addEvidence`,
      `patchEvidence`, `requestRemoveEvidenceAt`, `confirmRemoveEvidenceAt`.
- [ ] Replace the trailing trash `ActionIcon` on each row with a `Menu` (styled like
      `EntityRow`: `shadow="md" position="bottom-end" withinPortal`, target
      `ActionIcon variant="light" color="primary" radius="xl" size="md"` + `FaEllipsisV`):
      ```tsx
      <Menu.Dropdown>
        <Menu.Item onClick={addEvidence}>Add evidence</Menu.Item>
        {canAddISS && <Menu.Item onClick={() => fillRow(ev.uid, 'iss')}>ISS</Menu.Item>}
        {canAddISS && <Menu.Item onClick={() => fillRow(ev.uid, 'iso')}>ISO</Menu.Item>}
        {canAddISS && <Menu.Item onClick={() => fillRow(ev.uid, 'ic')}>IC</Menu.Item>}
        <Menu.Item onClick={() => clearRow(ev.uid)}>Clear Values</Menu.Item>
        <Menu.Item color="red" disabled={evidences.length === 1}
          onClick={() => requestRemoveEvidenceAt(i)}>Delete</Menu.Item>
      </Menu.Dropdown>
      ```
- [ ] Leave Term section buttons, footer, `SearchAnnotations`, and `ConfirmDialog` untouched.

### Phase 2: EntityRow — rename labels
- [ ] `Add ISS Evidence` → `ISS`, `Add ISO Evidence` → `ISO`, `Add IC Evidence` → `IC`
      (lines ~368/371/374). Handlers + gating unchanged; `Add Evidence` / `Remove Evidence`
      / `Clone Evidence` unchanged. No `activityFormSlice.ts` changes.

### Phase 3: Tests
- [ ] `AnnotationForm.test.tsx`: header buttons gone — drive interactions through the row
      `⋮` menu. Assert items `Add evidence / ISS / ISO / IC / Clear Values / Delete`.
      ISS/ISO/IC now **replace** the row (same row's code/ref become the auto-fill values,
      not a newly appended row). Add a `Clear Values` case. `canAddISS=false` → ISS/ISO/IC
      menu items absent.
- [ ] `EntityRow.test.tsx`: expected menu-item names `Add ISS/ISO/IC Evidence` → `ISS/ISO/IC`
      (lines ~327–341, ~461).

### Phase 4: Verify
- [ ] `npm run type-check` (catches stale imports/handlers).
- [ ] `npx vitest run tests/features/gocam/components/AnnotationForm.test.tsx tests/features/gocam/components/EntityRow.test.tsx`.
- [ ] `npm run dev` (port 4208) — manual: header has no buttons; each row has one `⋮`;
      ISS fills the current row (ECO:0000250 + GO_REF:0000024), ISO/IC fill their variants;
      Clear Values empties the row; Add evidence appends a blank row; Delete removes a row
      and is disabled on the last row; chemical/molecule popup (no aspect) hides ISS/ISO/IC;
      Activity form Evidence submenu reads `ISS / ISO / IC`.

## Recovery Checkpoint

> ✅ TASK COMPLETE

- **Last completed action:** Implemented all 4 phases; lint + type-check + tests green.
- **Next immediate action:** none (awaiting user review / commit when requested).
- **Recent commands run:**
  - `npx vitest run tests/features/gocam/components/AnnotationForm.test.tsx tests/features/gocam/components/EntityRow.test.tsx` → 65 passed
  - `npm run type-check` → 0 errors
  - `npx eslint <4 changed files>` → clean
- **Uncommitted changes:** AnnotationForm.tsx, EntityRow.tsx, AnnotationForm.test.tsx, EntityRow.test.tsx
- **Environment state:** nothing running

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/components/forms/AnnotationForm.tsx` | per-row ⋮ menu; remove header buttons + trash; fillRow/clearRow | done |
| `src/features/gocam/components/forms/EntityRow.tsx` | rename ISS/ISO/IC labels | done |
| `tests/features/gocam/components/AnnotationForm.test.tsx` | rewrite for menu + replace semantics | done |
| `tests/features/gocam/components/EntityRow.test.tsx` | rename expected labels | done |

## Summary

- **AnnotationForm:** Evidence-section header buttons and per-row trash icon removed. Each
  evidence row has a single `⋮` menu (styled like the Activity Row): **ISS · ISO · IC ·
  Clear Values · Delete**. ISS/ISO/IC replace the current row via the new `fillRow` (reuses
  `createAutoPopulatedEvidence` + `patchEvidence`); `clearRow` empties the row; Delete reuses
  `requestRemoveEvidenceAt` (disabled on the last row). Dead `handleFillISSEvidence` + the
  append callbacks removed; imports cleaned (`Menu`, `FaEllipsisV` in; `FaTrash` out, `FaPlus`
  kept for the add button).
  - **Add-evidence follow-up (AnnotationForm only):** "Add evidence" is *not* in the row
    menu. A button pinned at the bottom of the Evidence section adds a row; its label is
    **"Add evidence"** when there are none and **"Add another evidence"** when ≥1 exists
    (`evidences.length === 0 ? … : …`). In practice the form always seeds ≥1 row, so the
    label is normally "Add another evidence".
- **EntityRow:** Evidence-submenu labels shortened to `ISS` / `ISO` / `IC` (rename only).
- **Tests:** 65 passing. Mirrored EntityRow's `@mantine/core` Menu mock into the
  AnnotationForm test so menu items render inline; covered fill/clear/per-row-isolation, the
  `canAddISS=false` gate, and the confirm-on-delete flow. Both touched test files also made
  lint-clean (replaced forbidden `import()` type annotation with a top-level type import).

## Blockers
- None currently

## Notes
- Reuse `createAutoPopulatedEvidence` (formModels.ts) and existing `patchEvidence` /
  `requestRemoveEvidenceAt` — no new factories needed.
- Append→replace is the one behavioral change in the popup; existing tests assume append and
  must be updated.
- Only `EntityRow` and `AnnotationForm` reference ISS/ISO/IC (confirmed by grep) — "all other
  forms" = `EntityRow` only.

## Lessons Learned
- (fill during/after)

## Additional Context (Claude)
- A shared `<EvidenceList>` (popup + EntityRow + RelationForm + ChemicalConnectorForm) is
  flagged in `docs/code-review-codebase-2026-05-22.md` as a future refactor; out of scope
  here, but this per-row menu nudges the popup toward that shape.
