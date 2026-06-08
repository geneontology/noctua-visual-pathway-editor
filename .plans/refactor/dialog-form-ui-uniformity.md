# Task: Make fonts / backgrounds / chrome uniform across all CREATE & EDIT dialogs

**Status:** ACTIVE
**Issue:** #220 (update-codebase)
**Branch:** issue-220-update-codebase

## Goal
Every create/edit dialog (Activity Unit, Chemical, Protein Complex, Annotation/Evidence,
Causal Relation, Chemical Intermediate, CAM Title/State/Comments, Copy Model, Clone Evidence)
should share one visual language: identical header, footer/action bar, section-header,
evidence-row, button sizing, label typography, and body background. Today the **header** is
uniform (all go through `SimpleDialog` → `DialogHeader`); the **bodies and footers are
hand-rolled per form** and drift in 8+ ways. "Done" = the shared chrome is centralized in a
few primitives and every form consumes them, so they look the same.

> Investigation-only right now. **No code changed.** This file is the audit + plan.

## Context
- **Shared shell (already consistent):**
  - `src/@noctua.core/components/dialog/SimpleDialog.tsx` — Modal wrapper, optional built-in footer
  - `src/@noctua.core/components/dialog/DialogHeader.tsx` — `h-16 border-b-2 border-b-primary-500 bg-white px-4`, title `text-xl font-semibold tracking-tight text-gray-900`
  - `src/@noctua.core/components/dialog/ConfirmDialog.tsx`
  - `src/@noctua.core/components/dialog/modalSize.ts` — size tokens (xs 444 / sm 600 / md 900 / lg 1200 / cam 1200 / xl 1536)
  - `src/@noctua.core/components/dialog/GlobalDialog.tsx` + `dialogSlice.ts` — global dialog host; `App.tsx` `DIALOG_COMPONENTS` map
  - `src/@noctua.core/theme/mantineTheme.ts` — font = Roboto; Button default `size:'xs'`, `textTransform:'none'`; Modal `padding:0 radius:'md'`
- **The forms (the drift lives here):**
  - `src/features/gocam/components/forms/ActivityForm.tsx` (+ `dialogs/ActivityFormDialog.tsx`)
  - `src/features/gocam/components/forms/AnnotationForm.tsx` (`SectionHeader` local)
  - `src/features/relations/components/RelationForm.tsx` (+ `ConnectorForm.tsx` passthrough, `SectionRow.tsx`)
  - `src/features/relations/components/ChemicalConnectorForm.tsx`
  - `src/features/gocam/components/CamTitleForm.tsx`, `CamStateForm.tsx`, `CamCommentsForm.tsx`
  - `src/features/gocam/components/CopyModelDialog.tsx`
  - `src/features/gocam/components/forms/CloneEvidenceDialog.tsx`
  - `src/features/gocam/components/forms/EditorDropdown.tsx` (inline popover editor — related, not a modal)
- **Triggered by:** user report — "Fonts/dialogs and backgrounds should be uniform across all CREATE and EDIT menus; things are not uniform."

## Current State — what's uniform vs what drifts

### Uniform already ✓
- Font family (Roboto everywhere via `index.css` + theme).
- Dialog **header** (every dialog renders `DialogHeader` through `SimpleDialog`).
- `ConfirmDialog` matches the `SimpleDialog` built-in footer.

### Drift found (the work)

**1. Footer / action bar** — 6 different recipes:
| Form | bg | border | padding | layout | button size | labels | extras |
|------|----|--------|---------|--------|-------------|--------|--------|
| `SimpleDialog` built-in | `gray-50` | `gray-200` | `px-4 py-3` | end | theme xs | Cancel/Confirm | — |
| `ConfirmDialog` | `gray-50` | `gray-200` | `px-4 py-3` | end | theme xs | Cancel/Delete | — |
| `AnnotationForm` | `gray-50` | `gray-200` | `px-4 py-3` | end | theme xs | Cancel/Save | — |
| `ActivityForm` | **`gray-100`** | **`gray-300`** | **`px-3`, `h-[50px]`** | end | theme xs | **Clear**/Save | "Why disabled?" link (amber, underline) |
| `RelationForm` | **`gray-100`** | `gray-200` | `px-4 py-3` | **between** | xs | Cancel/Save | **`shadow-md`**, "Why disabled?" yellow button (no onClick), Delete on left |
| `ChemicalConnectorForm` | **`gray-100`** | `gray-200` | `px-4 py-3` | end | xs | **(no Cancel)**/Save | — |
| `CamTitle/State/Comments`, `CopyModel` | `gray-50` | `gray-200` | `px-4 py-3` | end | **`sm`** | Cancel/Save(Copy) | — |

Differences: footer bg `gray-50` vs `gray-100`; border `gray-200` vs `gray-300`; ActivityForm fixed `h-[50px]`+`px-3`; RelationForm `justify-between`+`shadow-md`; button size `xs` vs `sm`; "Clear" vs "Cancel"; ChemicalConnector has no Cancel.

**2. Section headers** — 7 different recipes:
- `AnnotationForm.SectionHeader`: `h-9 border-b border-primary-500/30 bg-white px-3`, `text-sm font-semibold text-primary-700`
- `RelationForm` via `SectionRow`: `border-b border-blue-800/70`, label `text-xs font-medium text-blue-800`
- `RelationForm` inline bars ("Suggested…", "Evidence"): `bg-slate-400/30 pl-3 text-xs leading-[30px] text-neutral-600`
- `ChemicalConnectorForm` section bars: same slate bar but **`text-sm`** (not `text-xs`)
- `CamCommentsForm` "Comments": `text-sm font-semibold uppercase tracking-wide text-gray-500`
- `CopyModelDialog` "Source/New Model": `text-xs font-semibold uppercase tracking-wide text-gray-500`
- `ActivityForm` GP/FD headers: `uppercase font-semibold text-gray-400`
- Colors used for the SAME concept: `primary-700`, `blue-800`, `neutral-600`, `gray-500`, `gray-400`. Sizes `text-xs`/`text-sm`/base. Some uppercase, some not. Backgrounds white / `slate-400/30` / none.

**3. Body background:**
- `ActivityForm` body `bg-slate-200`; FD cards `bg-slate-200`; GP rows none.
- `AnnotationForm` sections `bg-white`, evidence rows carded `bg-gray-50`.
- `RelationForm` / `ChemicalConnectorForm` / Cam* / Copy: white/transparent.
- So opening different create/edit dialogs shows grey-vs-white bodies.

**4. Evidence row pattern** (appears in AnnotationForm, RelationForm, ChemicalConnectorForm):
- `AnnotationForm`: each row carded (`rounded border border-gray-200 bg-gray-50 p-2`), widths 1/2·1/4·1/4, delete via **ellipsis Menu**, ISS/ISO/IC + Clear + Delete in menu.
- `RelationForm`: bare row, widths `grow`/`w-1/4 lg:w-[30%] max-w-[180px]`, delete via **FaTrash ActionIcon**.
- `ChemicalConnectorForm`: bare row, widths `w-[55%]`/`w-1/4`/`w-[20%]` with `p-4`, delete via **FaTrash ActionIcon**, no ISS helpers.
- Three layouts + two delete affordances for the same "evidence list" concept.

**5. "Add" buttons:**
- `AnnotationForm`: `size="compact-sm" variant="light" color="primary"` + `FaPlus` — "Add another evidence"
- `CamCommentsForm`: `size="compact-sm" variant="light" color="primary"` + `FaPlus` — "Add another comment"
- `RelationForm` / `ChemicalConnectorForm`: `variant="subtle" size="xs"` + `FiPlus` + `!text-xs !normal-case` — "Add Evidence"
- Two visual styles + two icon libs (`FaPlus` vs `FiPlus`) for the same action.

**6. Icon libraries mixed:** `react-icons/fa` (FaPlus, FaTrash, FaEllipsisV), `react-icons/fi` (FiPlus), `react-icons/fa6` (FaRegCircle*), `react-icons/md` (MdClose). "Plus" rendered as both `FaPlus` and `FiPlus`.

**7. Button size convention:** theme default is `xs`. Cam*/Copy override to `sm`; Relation/Chemical re-declare `xs`; some add redundant `!normal-case` (theme already sets it). No single rule.

**8. Dialog titles — create vs edit naming + size:**
- `ActivityFormDialog`: create = "Activity Unit Form" / "Chemical Form" / "Protein Complex Form"; edit = "Edit Activity Unit" / "Edit Chemical" / "Edit Protein Complex". → create uses **"… Form"** suffix, edit uses **"Edit …"** prefix. Inconsistent verb pattern.
- `useOpenAnnotationForm`: "Add Annotation" / "Add Evidence" / "Add {label}" / "Edit Evidence".
- Cam toolbar: "Edit Title", "Change State", "Comments" (no verb), "Copy Model".
- Sizes: forms mostly `lg` = **1200px** (Activity, Annotation, Connector, Chemical) which is very wide for a single-column form; Clone = `md` 900; Cam*/Copy = `sm`/`xs`. Worth a deliberate size scale.

## Proposed target (decisions to confirm before Phase 2)
Single source of truth in `src/@noctua.core/components/dialog/`:
- **`DialogFooter`** primitive: `flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3`; optional `left` slot for secondary actions (Delete / "why disabled"); standard Cancel(`variant="outline"`)/Save(`variant="filled"`) at theme `xs`. Replaces all 6 hand-rolled footers. (Pick canonical bg = `gray-50`, border = `gray-200`.)
- **`DialogSection`** / `SectionHeader` primitive: one recipe for the section bar (proposal: `bg-white border-b border-primary-500/30 px-3 h-9`, label `text-sm font-semibold text-primary-700`, optional right slot). Replaces `AnnotationForm.SectionHeader`, `SectionRow`, the slate bars, and the uppercase gray headers.
- **`EvidenceList`** shared component: one row layout + one delete affordance (proposal: ellipsis Menu, since it already carries ISS/ISO/IC/Clear) + one "Add evidence" button style. Used by AnnotationForm, RelationForm, ChemicalConnectorForm.
- **Body background:** pick one (proposal: `bg-white` body, `bg-gray-50` for carded sub-rows). Decide ActivityForm's `bg-slate-200` — keep (it's the dense tree table) or align.
- **Button rule:** rely on theme default `xs`; drop per-call `size="sm"` and redundant `!normal-case`/`!text-xs`.
- **Icons:** standardize plus/trash on one library (proposal: `react-icons/fa` → `FaPlus`/`FaTrash`).
- **Title convention:** pick one verb pattern, e.g. create = "Add {Thing}", edit = "Edit {Thing}". Normalize `ActivityFormDialog.getDialogTitle` and the Cam toolbar titles.
- **Size scale:** decide deliberate widths (e.g. simple = `sm`, evidence/relation = `md`, activity tree = `lg`); reconsider 1200px for single-column forms.

## Steps

### Phase 1: Audit & decisions (this file)
- [x] Inventory every create/edit dialog + how it's mounted (SimpleDialog vs PathwayViewer `<SimpleDialog>` vs GlobalDialog)
- [x] Catalog footer / section-header / body-bg / evidence-row / button / icon / title drift (tables above)
- [ ] Confirm target tokens with user (footer bg `gray-50` vs `gray-100`; body bg; title verb pattern; whether ActivityForm `slate-200` stays; size scale)

### Phase 2: Build shared primitives (no consumer changes yet)
- [ ] Add `DialogFooter` to `@noctua.core/components/dialog/`
- [ ] Add `DialogSection`/`SectionHeader` primitive
- [ ] Add `EvidenceList` (row + add + delete) — likely under `features/gocam/components/forms/`
- [ ] (Optional) extend `SimpleDialog` so `showActions` accepts a `footerLeft` slot, or have forms render `DialogFooter` directly

### Phase 3: Migrate forms onto primitives (one PR-sized commit per form, verify each)
- [ ] `AnnotationForm` → DialogSection + DialogFooter + EvidenceList
- [ ] `RelationForm` → DialogSection + DialogFooter (keep Delete/"why disabled" in footer-left) + EvidenceList
- [ ] `ChemicalConnectorForm` → DialogSection + DialogFooter (add the missing Cancel) + EvidenceList
- [ ] `CamTitleForm` / `CamStateForm` / `CamCommentsForm` / `CopyModelDialog` → DialogFooter (drop `size="sm"`); DialogSection for their labels
- [ ] `ActivityForm` → DialogFooter (decide "Clear" vs "Cancel"; keep error link in footer-left); decide on `slate-200` body
- [ ] `CloneEvidenceDialog` → DialogFooter
- [ ] Normalize dialog titles (`ActivityFormDialog.getDialogTitle`, `useOpenAnnotationForm`, `CamToolbar`)
- [ ] Standardize icons to one library

### Phase 4: Verify
- [ ] `npm run type-check`, `npm run lint`, `npm run test`
- [ ] Manual pass: open each create + edit dialog, confirm identical header/footer/section chrome (use the `verify`/`run` skill)

## Recovery Checkpoint
- **Last completed action:** Audited all dialog/form files; wrote this plan. No code changed.
- **Next immediate action:** Get user sign-off on Proposed-target decisions (footer bg, body bg, title verb pattern, ActivityForm slate-200, size scale), then start Phase 2.
- **Recent commands run:** read-only Grep/Read of dialog + form files.
- **Uncommitted changes:** none from this task (note: `FloatingTextarea.module.css` was already modified pre-task per git status; `insertMenuConfig.ts` + `EntityRow.tsx` modified by the prior context-ordering task).
- **Environment state:** nothing running.

## Failed Approaches
| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified
| File | Action | Status |
| ---- | ------ | ------ |
| `.plans/refactor/dialog-form-ui-uniformity.md` | create plan | done |

## Blockers
- Needs user decisions on canonical tokens (see Phase 1 last item) before implementation.

## Notes
- Header is the one thing already uniform — don't touch `DialogHeader`.
- `EditorDropdown` is an inline popover (not a modal); standardize its mini save/cancel icons
  (`FaRegCircleCheck`/`FaRegCircleXmark`) only if we unify icon usage — lower priority.
- Watch `store.ts` serializable-check exclusion for `dialog/openDialog` + `dialog.customProps`
  (callbacks pass through) — don't regress it when touching dialog wiring.
- Keep changes Tailwind-class-level; no new CSS files needed.

## Additional Context (Claude)
- Biggest visible offenders for "not uniform": (a) footer bg `gray-50` vs `gray-100`, (b) body
  `bg-slate-200` (ActivityForm) vs white elsewhere, (c) three different evidence-row layouts,
  (d) section-header color/size soup. Fixing footer + section-header + evidence-row primitives
  resolves ~80% of the perceived inconsistency.
- Lowest-risk highest-impact first step: `DialogFooter` (mechanical, touches every form, no logic).
- Centralizing also kills the redundant `!normal-case`/`!text-xs` overrides that fight the theme.
