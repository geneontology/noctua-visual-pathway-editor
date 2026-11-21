# Task: Apply simple text/rename/UI fixes from review notes

**Status:** ACTIVE
**Issue:** N/A (review notes in `downloads/notes`)
**Branch:** issue-220-update-codebase

## Goal
Apply the low-risk, mechanical text renames and small UI fixes called out in
`C:\work\go\noctua-visual-pathway-editor\downloads\notes`. Larger behavioral
changes from the same notes are listed under **Deferred** for a follow-up plan.

## Source
`downloads/notes`. Each item below quotes the relevant note.

---

## Phase 1 — Toolbox label renames
File: `src/features/pathway/data/stencilData.ts:21-46`

- [x] **"change 'Molecule' to 'Chemical'"** — rename stencil node label
      `'MOLECULE'` → `'CHEMICAL'` (id `'molecule'` stays; only the user-facing
      `label` changes). Stencil entry at line 41.
- [x] **"change 'Default' to 'Activity Unit'"** — rename stencil node label
      `'DEFAULT'` → `'ACTIVITY UNIT'` (id `'default'` stays). Line 25.

Notes:
- `ActivityType.MOLECULE` enum value and internal ids must stay — only the
  display string changes.
- The toolbox-group label (`label: 'Activity Type'`) is unaffected.

---

## Phase 2 — Causal Relation Form header
Files:
- `src/features/relations/components/ConnectorForm.tsx:26-43`
- `src/features/relations/components/RelationForm.tsx:249-313`

- [x] **Replace the Subject/Object two-line header** in `ConnectorForm.tsx`
      (lines 27-42) with a single header line:
      `Causal Relation Form: Connect <source> to <target>`
      Source/target labels reuse the same fallback chain already in the file
      (`enabledBy?.label ?? rootNode?.label ?? 'Unknown'`).
- [x] **"Remove text wrapping to fill all the way to the right"** — the
      italic helper paragraph in `RelationForm.tsx:279-282` has
      `max-w-[260px]`; drop the max-width cap (and let it use the row's
      remaining space).
- [x] **"Reduce font size by 1 or 2 points"** — the body uses `text-sm` in
      multiple places (e.g. `RelationForm.tsx:279, 305, 310, 335`,
      `ConnectorForm.tsx:26`). Step down those `text-sm` → `text-xs` for the
      relation form body and headers (keep button sizes alone). Also dropped
      `SectionRow` label `text-sm` → `text-xs` and the Chemical Intermediate
      label.

---

## Phase 3 — Evidence section: counts and icon
File: `src/features/gocam/components/forms/AnnotationForm.tsx`

- [x] **"remove numbers ('Evidence (1)' should be only 'Evidence')"** —
      change `title={\`Evidence (${evidences.length})\`}` at line 213 to
      `title="Evidence"`. Updated the `AnnotationForm.test.tsx`
      `evidenceSection` / `evidenceCount` helpers to no longer expect the
      `(N)` suffix.
- [x] **"replace 'x' by trashcan as everywhere else"** in the connector
      evidence rows. These two files use `FiX`; switch them to `FaTrash`
      (matching `AnnotationForm.tsx:4,277`):
      - `src/features/relations/components/RelationForm.tsx:36, 376`
      - `src/features/relations/components/ChemicalConnectorForm.tsx:3, 274`

---

## Phase 4 — EntityRow menu cleanup
File: `src/features/gocam/components/forms/EntityRow.tsx`

- [x] **"MF, BP and CC: remove 'Search annotation' option"** — **SCOPED to
      the Protein-containing complex form only** (`downloads/notes:30-38`
      lives under the `Protein-containing complex form:` header; the
      MF/BP/CC bullet is a *child* of that header, not a global rule). The
      Activity Unit form keeps Search Annotations on its MF/BP/CC rows.
      Implementation:
      - `EntityRow.tsx` keeps the
        `<Menu.Item onClick={handleSearchAnnotations}>Search Annotations</Menu.Item>`,
        gated by `node.aspect && onSearchAnnotations`. The parent
        `ActivityForm` decides whether to pass the callback at all.
      - `ActivityForm.tsx` consults
        `isSearchAnnotationsEnabledFor(activityType)` (new helper in
        `annotationRules.ts`). The picker, `handleSearchAnnotations`,
        `handlePickerApply`, `gpNode`, and `pickerState` all stay; the
        callback / picker are only wired when the form is the regular
        Activity Unit.
      - For protein-complex rows specifically, the new `+` menu (next
        bullet) only renders insert items — Search Annotations is
        structurally absent even when the parent form would pass the
        callback.
      - `AnnotationForm.tsx:178-182` Search Annotations button left alone
        per the plan.
- [x] **Chemical form: remove "Search annotation"** (`downloads/notes:46`
      under the `Chemical form` header) — same gate as above.
      `isSearchAnnotationsEnabledFor` returns `false` for
      `ActivityType.MOLECULE` so the Chemical form never wires the
      callback through to `EntityRow`, and the menu item stays hidden on
      every row of that form.
- [x] **"Remove 'Clear Values' on the protein complex"** — removed the
      `Clear Values` `Menu.Item`, the `handleClearValues` handler, and the
      `clearNodeValues` import from `EntityRow.tsx`. `clearNodeValues` is
      still exported from the slice (other consumers may use it).
- [x] **"Change 'Add' to 'Add Context'"** — renamed both `Menu.Sub.Item`
      labels in `EntityRow.tsx` and `ActivityTableNode.tsx`.
- [x] **"Change the 'dot-dot-dot' to '+' and add only 'has part'"** — when
      `node.category === RootTypes.PROTEIN_CONTAINING_COMPLEX`, `EntityRow`
      now renders a `FaPlus` ActionIcon that opens a flat dropdown of the
      insert menu items (the `has part` row is the only entry exposed by
      `canInsertEntity[PROTEIN_CONTAINING_COMPLEX]`). Other rows keep the
      original ellipsis menu.

---

## Phase 5 — Add ISO and Add IC evidence shortcuts
File: `src/features/gocam/data/camConstants.ts:14-23`

- [x] **"Add menu to 'Add ISO' (similar to ISS except evidence
      ECO:0000266 / GO_REF:0000024)"** — add an `iso` entry to
      `EVIDENCE_AUTO_POPULATE`:
      ```ts
      iso: {
        evidence: { id: 'ECO:0000266', label: 'sequence orthology evidence used in manual assertion' },
        reference: 'GO_REF:0000024',
      },
      ```
- [x] **"Add menu to 'Add IC' (ECO:0000305 / GO_REF:0000036)"** — add:
      ```ts
      ic: {
        evidence: { id: 'ECO:0000305', label: 'curator inference used in manual assertion' },
        reference: 'GO_REF:0000036',
      },
      ```
- [x] **"Needs to be added everywhere 'Add ISS' is present"** — wired the
      new variants through every ISS site:
      - `formModels.ts` already accepted them via
        `keyof typeof EVIDENCE_AUTO_POPULATE`.
      - `AnnotationForm.tsx`: added `addISOEvidence` / `addICEvidence`
        callbacks and matching `Add ISO` / `Add IC` buttons next to the
        existing `Add ISS` button (gated with `canAddISS`).
      - `EntityRow.tsx`: added `handleAddISOEvidence` /
        `handleAddICEvidence` and `<Menu.Item>` entries (gated with
        `canAddISS`).
      - `activityFormSlice.ts`: added `addISOEvidence` and `addICEvidence`
        reducers (mirror of `addISSEvidence`).

---

## Phase 6 — Chemical / Activity Unit "no evidence present"
File: `src/features/gocam/components/ActivityTableNode.tsx:265-269`

- [x] **"Remove 'no evidence present' next to the chemical (since that's
      not allowed)"** — `ActivityTableNode` skips the
      `no evidence present.` placeholder when the row's `activityType` prop
      equals `ActivityType.MOLECULE`. The prop is already threaded in from
      `ActivityTable`.

---

## Phase 7 — Layout menu label sync
File: `src/features/pathway/data/toolbarOptions.ts:1-13`

- [x] **"Layout menu: change labels to the ones currently on Noctua"** —
      synced label strings to the old Angular VPE
      (`old-noctua-visual-pathway-editor/src/@noctua.form/noctua-form-config.ts`
      lines 164-190 + `cam-graph.component.html`):
      - Detail: `Detailed` → `Default`, `Activity` → `Simple View`,
        `Simple` → `Preview`
      - Spacing: `Compact` → `Compact View`, `Loose` → `Expanded View`
      The `id:` values (`detailed | activity | simple`, `compact | relaxed`)
      are unchanged because they drive `camCanvas` layout logic.

---

## Deferred (not "simple") — track separately

These items from the notes need design/implementation work beyond a text
rename and should not ride in the same PR:

1. **Model states** — note line "Model states: should be" is incomplete.
   Need the target list before editing `MODEL_STATES` in
   `src/features/gocam/data/camConstants.ts:4`.
2. **"When adding new evidence: show any already existing evidence"** —
   needs to populate the new evidence row with prior values; touches
   `AnnotationForm.addEvidence` / `EntityRow.handleAddEvidence`.
3. **3-letter evidence codes (IDA, IMP, …) autocomplete** — "Confirm
   that this is working (now it's slow)". Investigate
   `src/features/search/components/Autocomplete.tsx` + the GOlr lookup
   slice; this is a perf/search-config issue, not a text change.
4. **Protein-containing complex form behavior**
   - "only allow GO terms (check with Jim tomorrow)"
   - "Edit box: does not display parts; should allow adding 'has part';
     should NOT allow part_of CC"
   These need changes in `activityTemplates.ts:59-83`,
   `insertMenuConfig.ts:62-73`, and probably `activityToFormTree` so the
   complex edit path hydrates `has_part` children.
5. **Chemical form width** — "Width of chemical box should be wider".
   Touches `EntityRow.tsx:222-235` (`baseTermWidth`) or a chemical-only
   variant.
6. **Chemical edit form labels** — "Change label to same as in creation
   ('Chemical Form' and 'Chemical', not 'Activity' and 'Function
   Description')". `ActivityFormDialog.getDialogTitle` already returns
   `Edit Chemical` / `Chemical Form` for MOLECULE, so the issue is the
   in-body section title in `ActivityForm.tsx:178-185` which currently
   uses `{ gp: 'Chemical', fd: 'Location (optional)' }` for MOLECULE.
   Looks already correct on creation; user may have hit an older edit
   path — needs verification.
7. **Activity Unit box: "Remove repetition in form"** — wording too vague
   to act on; ask user for an example.

---

## Recovery Checkpoint

- **Last completed action:** Phases 1–7 implemented; Search Annotations
  regression introduced in the first Phase 4 pass has been fixed (it had
  been over-removed because the indented bullet under
  `Protein-containing complex form:` was treated as global instead of
  form-scoped). The fix extracted
  `isSearchAnnotationsEnabledFor(activityType)` into `annotationRules.ts`
  and restored the row-level prop chain + picker in `ActivityForm`. Then
  the EntityRow test file was rewritten with a `@mantine/core` `Menu`
  mock that inlines dropdown items as `role="menuitem"`, so every menu
  condition (Search Annotations, Add Context, Evidence sub, Add ISS/ISO/
  IC, Remove Evidence, Clone Evidence, Fill with root term, Remove,
  Clear Values absent) is now an explicit assertion — 608/608 tests pass.
- **Lesson logged:** when a plan references source notes, sanity-check
  destructive bullets (deletions, removals) against the source. Indented
  notes get flattened during plan-writing and lose scope. The
  Phase 4 Search Annotations bullet was a child of
  `Protein-containing complex form:`, not a global instruction.
- **Next immediate action:** ready to commit. The user feedback memory
  forbids `Co-Authored-By: Claude` trailers.
- **Uncommitted changes:** see `Files Modified` table below.
- **Environment state:** working tree dirty on `issue-220-update-codebase`.

## Files Modified
| File                                                          | Action                                                  | Status |
| ------------------------------------------------------------- | ------------------------------------------------------- | ------ |
| `src/features/pathway/data/stencilData.ts`                    | Phase 1 label renames                                   | done   |
| `src/features/relations/components/ConnectorForm.tsx`         | Phase 2 header                                          | done   |
| `src/features/relations/components/RelationForm.tsx`          | Phase 2 text-xs + Phase 3 FaTrash                       | done   |
| `src/features/relations/components/SectionRow.tsx`            | Phase 2 text-xs                                         | done   |
| `src/features/relations/components/ChemicalConnectorForm.tsx` | Phase 3 FaTrash                                         | done   |
| `src/features/gocam/components/forms/AnnotationForm.tsx`      | Phase 3 Evidence header + Phase 5 ISO/IC buttons        | done   |
| `src/features/gocam/components/forms/EntityRow.tsx`           | Phase 4 menu cleanup (Search Annotations kept on Activity Unit form; gated by parent via `onSearchAnnotations` prop) + Phase 5 ISO/IC items + complex `+` menu | done   |
| `src/features/gocam/components/forms/NestedNodeGroups.tsx`    | Phase 4 `onSearchAnnotations` prop kept; forwarded to EntityRow | done   |
| `src/features/gocam/components/forms/ActivityForm.tsx`        | Phase 4: kept Search Annotations picker + `handleSearchAnnotations` / `handlePickerApply` / `gpNode` / `pickerState`; both `<GroupCard>` calls forward `onSearchAnnotations` only when `isSearchAnnotationsEnabledFor(activityType)` is true | done   |
| `src/features/gocam/components/ActivityTableNode.tsx`         | Phase 4 Add Context + Phase 6 evidence placeholder      | done   |
| `src/features/gocam/services/annotationRules.ts`              | Phase 4 fix: added `isSearchAnnotationsEnabledFor(activityType)` helper alongside the existing `canAddISSEvidence` | done   |
| `src/features/gocam/data/camConstants.ts`                     | Phase 5 iso/ic entries                                  | done   |
| `src/features/gocam/slices/activityFormSlice.ts`              | Phase 5 reducers                                        | done   |
| `src/features/pathway/data/toolbarOptions.ts`                 | Phase 7 layout labels                                   | done   |
| `src/@noctua.core/components/dialog/SimpleDialog.tsx`         | Widened `title` from `string` to `ReactNode` (powers connector-form rich title) | done   |
| `src/@noctua.core/components/dialog/DialogHeader.tsx`         | Widened `title` from `string` to `ReactNode`            | done   |
| `src/app/PathwayViewer.tsx`                                   | Connector dialog title uses `renderConnectorDialogTitle` with source/target labels | done   |
| `src/features/relations/services/connectorTitle.tsx`          | New: `formatConnectorDialogTitle` (plain) + `renderConnectorDialogTitle` (JSX, accents gene labels) | done   |
| `tests/features/gocam/components/AnnotationForm.test.tsx`     | Phase 3 helper update + Phase 5 ISO/IC tests            | done   |
| `tests/features/gocam/components/EntityRow.test.tsx`          | Phase 4 comprehensive menu-condition tests via `@mantine/core` `Menu` mock — covers Search Annotations gating (aspect + callback), Add Context, Evidence sub (Add Evidence / Add ISS/ISO/IC / Remove / Clone), Fill with root term, Remove, Clear Values absent, and the protein-complex `+` menu shape | done   |
| `tests/features/gocam/services/annotationRules.test.ts`       | Phase 4 fix: `isSearchAnnotationsEnabledFor` tests (Activity Unit = on; protein-complex / molecule = off; unknown = fail-open) | done   |
| `tests/features/gocam/slices/activityFormSlice.test.ts`       | Phase 5 ISO/IC reducer tests                            | done   |
| `tests/features/gocam/models/formModels.test.ts`              | Phase 5 ISO/IC variant tests                            | done   |
| `tests/features/relations/components/ConnectorForm.test.tsx`  | Phase 2 header tests (new file)                         | done   |
| `tests/features/relations/services/connectorTitle.test.tsx`   | New: 30-char truncation + JSX renderer tests for the connector dialog title | done   |
| `tests/features/pathway/data/stencilData.test.ts`             | Phase 1 label tests (new file)                          | done   |
| `tests/features/pathway/data/toolbarOptions.test.ts`          | Phase 7 label/id tests (new file)                       | done   |

## Notes
- Tests under `tests/features/gocam/` exercise `EntityRow`, the slice
  reducers, and form rendering — re-run `npm run test` after Phases 3-5.
- No commits should include `Co-Authored-By: Claude` trailers.
- **Reading the source notes**: `downloads/notes` uses header lines
  ending with `:` (e.g. `Protein-containing complex form:`,
  `Chemical form`, `Activity Unit box:`) as scope markers. Bullets that
  follow them apply *only to that form*. When extracting bullets into a
  plan, always carry the scope header with each bullet — flattening
  scope is how the Phase 4 Search Annotations regression happened.
