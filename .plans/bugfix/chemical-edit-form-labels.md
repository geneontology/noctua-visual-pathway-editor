# Chemical Edit Form — labels + evidence placeholder (#256)

Match the Chemical EDIT drawer (`ActivityTable`) to the CREATE form labels and
drop the evidence placeholder that doesn't apply to chemicals.

GitHub: geneontology/noctua-visual-pathway-editor#256 (parent #254)

## Background

The "Edit Chemical Form" in the issue is the right-drawer `ActivityTable`
view, not the modal `ActivityForm`. A molecule activity has
`enabledBy: null` + `molecularFunction: null` (see `graphServices.ts:132`),
so the chemical is the `rootNode` and renders in the **FD** tree. That makes
the drawer show:
- top header `activityLabel` → `'Activity'` fallback
- FD section header → hardcoded `'Function Description'`
- `ActivityTableNode` evidence placeholder `no evidence present.`

The placeholder is already gated by `activityType !== ActivityType.MOLECULE`
in `ActivityTableNode.tsx:270`, but the FD-section node in `ActivityTable`
never received `activityType`, so it was `undefined` at runtime (and a latent
TS2741 the no-op root `tsc --noEmit` never caught).

Create form for reference: dialog title `Chemical Form`
(`ActivityFormDialog.getDialogTitle`), chemical section `Chemical`
(`ActivityForm` sectionTitles).

## Approach (revised)

Per reviewer: the read-only `ActivityTable` must mirror the editable
`ActivityForm` for a molecule — same sections, only one is read-only. The
form (via `insertMenuConfig` grouping + `moleculeActivity` template) shows:
- **Chemical** section — the chemical entity, `showEvidence: false`
- **Location (optional)** section — the `located in` CC child(ren)

`ActivityTable` previously built one edge-tree with the chemical as FD root
(+ location nested). Now it splits the molecule into the two sections.

## Steps — all in `src/features/gocam/components/ActivityTable.tsx`

- [x] 1. `buildDisplayTree`: molecule special-case — chemical → `gpTree`
      (treeLevel 1, `showEvidence:false`, `showMenu:true`, no children);
      its `located in` CC children → `fdTree`. Regular/complex paths
      untouched (early return before the `enabled_by` logic).
- [x] 2. Labels: `gpLabel` = `'Chemical'` (already), `fdLabel` =
      `'Location (optional)'` for MOLECULE; top header `activityLabel` =
      `'Chemical Form'` (mirrors the dialog title).
- [x] 3. Pass `activityType={activity.type}` to the FD-section
      `ActivityTableNode` (no "no evidence present" on molecule rows; also
      fixes the latent TS2741). Chemical row shows no evidence column at all
      via `showEvidence:false`.

## Verify

- `npx tsc -p tsconfig.app.json --noEmit` no longer reports the
  `ActivityTable.tsx(266,...)` TS2741 (other pre-existing errors are out of
  scope).
- `npm run format` clean on the file.
- `npm run test` — existing suite still green (no ActivityTable spec exists;
  do not add one unless asked).

## Recovery Checkpoint

- **Last completed action:** revised to the two-section molecule split in
  `ActivityTable.tsx` (Chemical + Location (optional)); `tsc -p
  tsconfig.app.json` clean for this file; `npm run test` = 624 passed / 1
  failed (unchanged from baseline).
- **The 1 failure** is pre-existing and unrelated: `CamCommentsForm.test.tsx`
  uses `getByLabelText('Add comment')` but the component renders that as
  button *text* (line 105), not an aria-label — part of the in-progress
  comments-form work (`FloatingTextarea.module.css` already dirty at start),
  no code path to `ActivityTable`.
- **Note:** `npm run format` / `prettier --check` can't run in this env —
  `prettier-plugin-tailwindcss` (v3) looks for `tailwind.config.js`, which
  doesn't exist under Tailwind v4. Global tooling issue, not this change.
- **Next immediate action:** done; awaiting user before committing.
- **Uncommitted changes:** this task → `ActivityTable.tsx` + this plan file.
  Pre-existing (not mine): `EntityRow.tsx`, `insertMenuConfig.ts`,
  `FloatingTextarea.module.css`.
- **Environment state:** branch `issue-220-update-codebase`.
