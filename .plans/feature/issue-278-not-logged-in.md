# Task: Prevent edit actions when not logged in

**Status:** ACTIVE
**Issue:** #278
**Branch:** issue-278-not-logged-in

## Goal
When a user is not logged in, the app is view-only: edit forms open but expose no
action buttons, the "Tool menu" (Toolbox palette + node hover action icons) is
hidden, no canvas edit actions (delete/duplicate/link-create/stencil-drop) fire,
and the "Not Logged In" banner is made more prominent.

## Context
- **Related files:**
  - `src/app/PathwayViewer.tsx` — banner (188-193), renders `<StencilPalette />`, owns `isLoggedIn`
  - `src/features/pathway/components/StencilPalette.tsx` — the "Toolbox" palette
  - `src/features/gocam/components/forms/ActivityForm.tsx` — footer 384-408 (Clear/Save)
  - `src/features/relations/components/RelationForm.tsx` — footer 404-438 (Delete/Cancel/Save)
  - `src/features/pathway/graph/camCanvas.ts` — `readOnly` flag, validateMagnet/Connection, hover, `_handleDrop`
  - `src/features/pathway/graph/shapes.ts` — `hover()` on NodeCellList (284) & NodeCellMolecule (390)
  - `src/app/hooks/usePathwayCanvas.ts:11` — already sets `readOnly = !isLoggedIn`
- **Triggered by:** https://github.com/geneontology/noctua-visual-pathway-editor/issues/278 (pgaudet)
- **Auth signal:** `isLoggedIn = !!useAppSelector(selectAuthUser)` (from `@/features/auth/slices/authSlice`)

## Current State
- What works now:
  - Amber "Not Logged In: You can only view existing annotations. Log in to edit." banner shows (thin `bg-amber-50` bar).
  - `CamCanvas.readOnly` is set from `isLoggedIn` but is **never read** — dead flag.
- What's broken/missing:
  - Not-logged-in users still see Clear/Save (activity) and Delete/Cancel/Save (relation) buttons.
  - Toolbox palette always visible → drag-to-create possible.
  - Node hover shows edit/duplicate/delete icons; delete acts directly (via confirm), bypassing forms.
  - Link creation by dragging between nodes still possible.
  - Banner is easy to miss.

## Steps

### Phase 1: Forms open read-only
- [x] `ActivityForm.tsx` — gate the footer (384-408) behind `isLoggedIn`; body stays visible.
- [x] `RelationForm.tsx` — gate the footer (404-438) behind `isLoggedIn`.

### Phase 2: Hide the Tool menu
- [x] `PathwayViewer.tsx` — render `<StencilPalette />` only when `isLoggedIn`.
- [x] Node hover icons handled by Phase 4 (readOnly enforcement).

### Phase 3: Banner more visible
- [x] `PathwayViewer.tsx` (188-193) — stronger amber treatment (icon + border + larger/centered text). Kept exact "Not Logged In:" text so e2e assertions pass.

### Phase 4: Enforce readOnly on canvas
- [x] `camCanvas.ts` — captured `const self = this`; `validateMagnet: () => !self.readOnly`; `validateConnection` false when readOnly; `_handleDrop` early-return if `this.readOnly`; hover handlers call `element.hover(true, !this.readOnly)`.
- [x] `shapes.ts` — `hover(on, interactive = true)` on NodeCellList & NodeCellMolecule; gate the 3 action icons on `interactive`, keep wrapper highlight.

### Phase 5: Verify
- [x] `npm run type-check` clean; `eslint` on the 5 changed files clean (exit 0). `npm run lint` has 31 pre-existing errors, all on built `workbenches/**/public/assets/js/*.js` bundles — none on source.
- [ ] Manual/e2e: not-logged-in prominent banner, no Toolbox, no node hover action icons, no link drag, forms open with no action buttons — **not yet run in a browser.**
- [ ] Logged in: unchanged behavior — **not yet run.**

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** All 5 source edits done; type-check + targeted lint clean.
- **Next immediate action:** Decide on the two open items (CAM toolbar edit dialogs; e2e drift) with the user, then browser-verify.
- **Recent commands run:**
  - `gh issue view 278`
  - `npm run type-check` (clean)
  - `npx eslint <5 changed files>` (exit 0)
- **Uncommitted changes:** ActivityForm.tsx, RelationForm.tsx, PathwayViewer.tsx, camCanvas.ts, shapes.ts, + this plan
- **Environment state:** nothing running

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/components/forms/ActivityForm.tsx` | Gate footer behind `isLoggedIn` | Done |
| `src/features/relations/components/RelationForm.tsx` | Gate footer + hide "Chemical Intermediate" (own save path) | Done |
| `src/features/relations/components/ChemicalConnectorForm.tsx` | Gate Save footer | Done |
| `src/app/PathwayViewer.tsx` | Prominent banner + hide `<StencilPalette />` when logged out | Done |
| `src/features/pathway/graph/camCanvas.ts` | Enforce `readOnly` (magnet/connection/drop/hover) | Done |
| `src/features/pathway/graph/shapes.ts` | `hover(on, interactive)` gates action icons; adds read-only `info` view icon on both node types | Done |
| `public/assets/icons/info.svg` | New FA info-circle icon for the read-only node view affordance | Done |
| `src/features/gocam/components/CamToolbar.tsx` | Hide Copy Model when logged out | Done |
| `src/features/gocam/components/CamTitleForm.tsx` | Gate Save (Cancel→Close) | Done |
| `src/features/gocam/components/CamStateForm.tsx` | Gate Save (Cancel→Close) | Done |
| `src/features/gocam/components/CamCommentsForm.tsx` | Gate Save/Add/trash, readonly textareas | Done |
| `src/features/gocam/components/GroupGuardProvider.tsx` | Skip the "other group" warning when logged out (open view-only) | Done |
| `src/features/gocam/components/ActivityTable.tsx` | Hide "Delete Activity" menu | Done |
| `src/features/gocam/components/ActivityTableNode.tsx` | Gate row menu / add / edit / delete | Done |
| `src/features/gocam/components/EvidenceRow.tsx` | Gate cell edit/delete | Done |
| `src/features/gocam/components/forms/AnnotationForm.tsx` | Gate Save (Cancel→Close) | Done |

## Blockers
- None.

## Scope note (expanded during implementation)
Issue body lists 3 items but title says "Any edit actions should be prevented." User confirmed: (a) canvas fully read-only; (b) header dialogs "open, no Save". Swept ALL model-mutation surfaces (every `useUpdateGraphModelMutation` caller + `checkGroup` + edit dialog) so the whole right-drawer Activity Table (delete activity, row add/edit/delete, evidence edit/clear) and the Chemical Intermediate path are also locked down.

## Open Decisions / Follow-ups
1. **e2e now encodes OLD behavior — will FAIL, needs updating (not done — awaiting go-ahead):**
   - `e2e/edit-form.spec.ts` opens Title/Comments/State dialogs **logged out** and asserts Save/Add exist + a "Cancel" button. Post-#278 those are hidden and Cancel→"Close". Fix = pass a `barista_token` in that spec's setup (editing now requires login) OR assert absence logged-out.
   - `e2e/stencil-palette.spec.ts` + `e2e/fixture-smoke.spec.ts:39` reference `getByTestId('stencil-palette')` which doesn't exist in the component — already failing pre-change; also the Toolbox is now correctly hidden logged-out.
2. **Browser verification not yet run.**

## Notes
- **"Tool menu" = Toolbox palette + node hover action icons** (confirmed with user).
- **Fully enforce readOnly** confirmed — title says "Any edit actions should be prevented", body lists 3 items; delete/duplicate/link-create bypass the form footer, so the dead `readOnly` flag gets wired up.
- Node **dragging** (position) stays enabled — persists only to `localStorage`, never the model.
- `validateMagnet`/`validateConnection` are method-shorthand in the paper options where `this` = paper, so reference the CamCanvas instance via captured `self`.
- No new tests unless requested.

## Lessons Learned
- 

## Additional Context (Claude)
- Consider whether the read-only banner should also link to the login URL for one-click sign-in (out of scope unless requested).
