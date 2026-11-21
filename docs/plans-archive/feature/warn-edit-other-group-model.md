# Task: Warn when editing a model owned by another group

**Status:** COMPLETE
**Issue:** (port from old-noctua-visual-pathway-editor)
**Branch:** issue-220-update-codebase

## Goal
Faithfully port the old `CamService.checkGroup` behavior: before a user initiates an edit
on a CAM model whose group(s) they are not a member of, show a confirm dialog
("Warning: Editing another group's model" / "Continue and edit anyway" / "Cancel").
Proceed silently when the model has no group or the user belongs to one of its groups.
"No less, no more" — same logic + same dialog text, gating the same edit-initiation
categories. Implemented the React way (context + hook), not an Angular service port.

## Context
- **Old code:** `old-noctua-visual-pathway-editor/src/@noctua.form/services/cam.service.ts`
  `checkGroup(success)` / `isGroupMember()`. Gated at 3 funnels: inline entity editor open,
  create activity/connector, save model-level form.
- **Model groups:** `GraphModel.groups: Group[]` (from `providedBy` annotations) — `selectCamModel`.
- **User groups:** `selectAuthUser(state).groups: Group[]`. Match on `Group.id`.
- **Dialog:** reuse `@/@noctua.core/components/dialog/ConfirmDialog`.

## Design (React way)
- `GroupGuardProvider` (context) hosts ONE `ConfirmDialog`, exposes `checkGroup(onConfirm)`
  via `useGroupGuard()`. Logic mirrors old: `modelGroups.length === 0 || isGroupMember`
  -> run immediately; else open warning, run pending action on confirm.
- Mounted in `Layout` so it wraps `CamToolbar`, `Outlet` (PathwayViewer), and the right drawer.
- Gate at the *open* gesture for toolbar forms (the CAM forms render via `GlobalDialog`
  OUTSIDE `Layout`, so they can't consume the context — open-time gating is both correct
  and cleaner).

## Gated edit-initiation points (map to old 3 funnels)
- **Create on canvas (old gate B):** PathwayViewer `handleStencilDrop`, `handleDuplicateActivity`,
  `handleLinkCreated`, `handleLinkClick`.
- **Inline entity edit (old gate A):** ActivityTableNode term-edit (`editor.open`),
  `handleInsertNode`, `handleAddEvidence`; EvidenceRow `openEditor`.
- **Model metadata (old gate C):** CamToolbar `openTitleForm` / `openStateForm` / `openCommentsForm`.
- **NOT gated (no more):** view/select, Copy Model, zoom/layout/position, deletes
  (each already has its own confirm; old `checkGroup` had no delete call site).

## Steps
### Phase 1: Guard infra
- [x] Create `src/features/gocam/components/GroupGuardProvider.tsx` (provider + `useGroupGuard`)
- [x] Mount provider in `src/app/layout/Layout.tsx`

### Phase 2: Wire gates
- [x] CamToolbar — gate title/state/comments open handlers
- [x] PathwayViewer — gate stencil drop, duplicate, link created, link click
- [x] ActivityTableNode — gate term edit, add context, add evidence
- [x] EvidenceRow — gate openEditor

### Phase 3: Verify
- [x] `npm run type-check` — clean
- [x] `eslint` on changed files — clean
- [x] `npm run test` — 659 passed (no component test rendered these without the provider)

## Recovery Checkpoint
✅ TASK COMPLETE

## Summary
Ported the old `checkGroup` warning the React way. Added `GroupGuardProvider`
(context + `useGroupGuard()` hook) hosting one `ConfirmDialog`; mounted in `Layout`
so it reaches the toolbar, canvas, and right drawer. Gated the edit-initiation gestures
that map to the old three funnels (inline entity edits, canvas create/connect, model
metadata forms). Chemical-connector sub-form is reached only from the already-gated
connector dialog. Deletes/copy/view left ungated (old `checkGroup` had no such call site).

## Notes
- Membership: `model.groups.some(mg => user?.groups?.some(ug => ug.id === mg.id))`.
- Group names for message: `model.groups.map(g => g.label)`.
- Not-logged-in: faithful to old — `user?.groups` undefined -> not a member -> warning shows
  (edit UI is effectively unused when logged out).
