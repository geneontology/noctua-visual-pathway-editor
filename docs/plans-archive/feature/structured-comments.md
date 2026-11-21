# Task: Structured CAM comments (option prefix + text)

**Status:** COMPLETE
**Issue:** #231
**Branch:** issue-231-comments

## Goal
Replace the single free-text comment box with structured comments: the user picks a
category from a fixed list, then types the comment. Each comment is stored as the
concatenated string `"<Option>: <text>"`. Multiple comments stay stored/displayed
separately in the order they were added.

## Context
- **Related files:**
  - `src/features/gocam/components/CamCommentsForm.tsx` — the only UI touched
  - `src/features/gocam/data/commentCategories.ts` — NEW data module for the options
  - `src/features/gocam/models/cam.ts` — `cam.comments: string[]` (UNCHANGED)
  - `src/features/gocam/services/activityOperations.ts` — save ops (UNCHANGED)
  - `src/features/gocam/services/graphServices.ts` — parse on load (UNCHANGED)
- **Triggered by:** user request on issue #231

## Current State
- What works now: `CamCommentsForm` keeps `comments: string[]`, renders one `<Textarea>`
  per comment with add/remove, saves filtered strings via `buildSaveModelAnnotationsOperations`.
- What's missing: no category/prefix; comments are free text only.

## Design Decisions
- **Storage stays `string[]`.** Each comment persists as `"<Option>: <text>"`. No model,
  parsing, or API/operation changes — the whole change lives in the form + new data module.
- **Options live in `src/features/gocam/data/commentCategories.ts`** (per user):
  - `General`
  - `Not suitable for annotation`
  - `Annotation dispute`
  - `Other`
- **Legacy comments** (added before this feature) whose text has no `": "`, OR whose
  prefix is not one of the known options → load with **blank option**, text kept **as-is**.
  On save, a blank option saves the **text unchanged** (no prefix prepended) so old
  comments round-trip without mutation.
- **Control:** Mantine `<Select>` for the category. The `<Textarea>` renders only after
  an option is selected (matches "after the user selects an option, show a text field"),
  and always renders for legacy blank-option rows (so their text is visible/editable).

## Steps

### Phase 1: Data module
- [x] Create `src/features/gocam/data/commentCategories.ts` exporting `COMMENT_CATEGORIES`
      + `parseComment` and `formatComment` helpers.

### Phase 2: Form rewrite
- [x] Change local state to `StructuredComment[]` (`{ option, text }`).
- [x] Initialize state by parsing `cam.comments`.
- [x] Render per row: `<Select>` + `<Textarea>` (shown once option chosen or text present) + remove button.
- [x] `Add Comment` pushes `{ option: '', text: '' }`.
- [x] Update remove-confirm to check `text.trim()`.
- [x] `handleSave`: filter non-empty text; map via `formatComment`; feed existing save op builder.

### Phase 3: Verify
- [x] `npm run type-check` + eslint clean.
- [ ] Manual: add each category, save; reopen and confirm round-trip; confirm legacy
      plain comment loads blank-option and saves unchanged. (user to verify in app)

## Recovery Checkpoint
- ✅ TASK COMPLETE — pending user manual verification in the running app.

## Files Modified
| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/data/commentCategories.ts` | create | done |
| `src/features/gocam/components/CamCommentsForm.tsx` | edit | done |

## Notes
- No test changes unless explicitly requested.
- No changes to model / graph parsing / save operations.
