# Task: Comments functionality improvements from curator review (#289)

**Status:** COMPLETE
**Issue:** [#289](https://github.com/geneontology/noctua-visual-pathway-editor/issues/289)
**Branch:** issue-289-comment-fix

## Goal

Apply the six comment improvements Swiss-Prot curators asked for: always-visible comment icons,
per-activity scoping of the Comments panel, a new `Evidence dispute` category, the
`Annotation dispute` → `GO term annotation dispute` rename, the comment text pasted into every
GitHub ticket, and a go-ontology ticket link for `Ontology term pending`.

## Context

- **Related files:**
  - `src/@noctua.core/components/cell/EditableCell.tsx` — comment/edit/delete icons on table cells
  - `src/@noctua.core/components/drawer/drawerSlice.ts` — right panel tab state
  - `src/app/PathwayViewer.tsx` — `handleShowComments` (graph comment icon)
  - `src/features/gocam/components/CamToolbar.tsx` — `openCommentsPanel` (toolbar comment button)
  - `src/features/gocam/components/CommentsPanel.tsx` — the panel itself
  - `src/features/gocam/components/IndividualCommentsForm.tsx` — node + evidence comment dialog
  - `src/features/gocam/components/DisputeTicketButton.tsx` — GitHub icon button (now
    `CommentTicketButton.tsx`)
  - `src/features/gocam/data/commentCategories.ts` — category lists, parse/format, badge colors
  - `src/features/gocam/data/annotationDispute.ts` — pre-filled go-annotation issue URL
  - `src/features/pathway/graph/shapes.ts` / `camCanvas.ts` — graph node comment icon + click event
- **Triggered by:** issue #289 (Pascale, on behalf of Swiss-Prot curators + Job)

## Current State

What works now:

- Comments live on individuals (GO term / input nodes), on evidence individuals (reference
  comments), on edges, and on the model; all stored as `"Category: text"` strings.
- The graph activity node has an always-grey comment icon + count at its bottom left; clicking it
  opens the Comments panel and selects the activity.
- `Annotation dispute` comments on an individual get a GitHub button that opens a pre-filled
  go-annotation issue (title = model URL, body = gene / GO term / contributing curators).

What's broken/missing (one bullet per issue checkbox):

1. In the activity table, an empty comment icon is `opacity-0` until the cell is hovered — too
   subtle.
2. The graph node's comment icon opens the **whole model's** comment list; it should show only the
   comments of the activity unit it was clicked from.
3. No `Evidence dispute` category on Evidence/Reference comments, and no ticket link for it.
4. The GO-term category is named `Annotation dispute`, not `GO term annotation dispute`.
5. The GitHub ticket body carries gene / GO term / curators, but **not the comment text**.
6. `Ontology term pending` comments have no GitHub button to the go-ontology tracker.

## Decisions

- **Item 1 covers the comment icons only** (user call). The pencil and trash keep their current
  hover behaviour; only the comment icon becomes permanently visible — grey with no comments, green
  with a count, exactly as it renders today once hovered.
- **Item 2:** while scoped, the panel shows just that activity's section plus a "Show all comments"
  control; the Model-comments block is hidden (it isn't part of the activity unit). The toolbar
  comment button always opens the unscoped, full list.
- **Item 4:** stored comments are **not rewritten**. `Annotation dispute` stays a recognised legacy
  prefix and is displayed/badged as `GO term annotation dispute`; only the new label is offered in
  the dropdown, so a legacy comment re-saved from the dialog picks up the new prefix.
- **Item 5:** the comment *text* (without its category prefix) is appended to the issue body below
  the bullet list, for all three ticket types.
- **Item 6:** `Ontology term pending` opens a pre-filled issue on `geneontology/go-ontology`, same
  body shape as the disputes.

## Steps

### Phase 1: Category + ticket data layer

- [x] `commentCategories.ts`: `ANNOTATION_DISPUTE_CATEGORY = 'GO term annotation dispute'`; add
      `LEGACY_ANNOTATION_DISPUTE_CATEGORY = 'Annotation dispute'`, keep it in
      `ALL_COMMENT_CATEGORIES` and map it to the new label in `parseComment` so old comments still
      parse and badge correctly.
- [x] `commentCategories.ts`: add `EVIDENCE_DISPUTE_CATEGORY = 'Evidence dispute'` to
      `REFERENCE_COMMENT_CATEGORIES`, export `ONTOLOGY_TERM_PENDING_CATEGORY`, and give the new /
      renamed labels badge classes (dispute red for evidence dispute, keep purple for ontology
      pending).
- [x] `annotationDispute.ts`: take an optional `comment` and append it to the body; add
      `buildEvidenceDisputeUrl` (go-annotation, adds evidence code + reference) and
      `buildOntologyTermPendingUrl` (go-ontology). Factor the shared body/query building so the
      three builders can't diverge.
- [x] Add one resolver — `commentTicket(category, context)` returning `{ href, label, color }` or
      `null` — so the panel and the dialog can't drift apart on which category gets a button.

### Phase 2: Always-visible comment icon (item 1)

- [x] `EditableCell.tsx`: drop the `opacity-0 / pointer-events-none / group-hover` classes from the
      comment button's zero-count branch; keep grey-when-empty, green-with-badge otherwise.

### Phase 3: Scoped Comments panel (item 2)

- [x] `drawerSlice.ts`: add `commentsActivityScope: string | null` with a `setCommentsScope` action
      and `selectCommentsActivityScope` selector.
- [x] `PathwayViewer.handleShowComments`: dispatch `setCommentsScope(activityId)` alongside the
      existing select + open.
- [x] `CamToolbar.openCommentsPanel`: dispatch `setCommentsScope(null)` so the toolbar button always
      shows everything.
- [x] `CommentsPanel`: when scoped, filter to that activity, hide the Model section, title the
      header with the activity label, show a "Show all comments" button that clears the scope, and
      scope the header count. Unscoped rendering unchanged.

### Phase 4: Ticket buttons (items 3, 5, 6)

- [x] `DisputeTicketButton.tsx`: generalise to a GitHub ticket button taking `href`, tooltip
      `label`, `ariaLabel`, and `color`.
- [x] `IndividualCommentsForm`: resolve the activity when the individual is an **evidence**
      individual (today's lookup only scans `activity.nodes`, so an evidence comment finds no
      activity and no context) — walk `activity.edges[].evidence[]`, and carry the edge's statement
      plus the evidence code/reference for the ticket body. Then render the per-category button via
      the Phase 1 resolver, passing the row's comment text.
- [x] `CommentsPanel`: use the same resolver for node subjects (GO term dispute, ontology term
      pending) and for evidence subjects (evidence dispute), passing each comment's text.

### Phase 5: Verify

- [x] `npm run type-check`, `npm run lint`, `npm run test`
- [x] Update the specs the rename / new categories break: `commentCategories.test.ts`,
      `annotationDispute.test.ts`, `CommentsPanel.test.tsx`, `IndividualCommentsForm.test.tsx`, plus
      `EditableCell.test.tsx` / `CamToolbar.test.tsx` if they assert icon visibility or the
      comment-panel dispatch.
- [x] New coverage for the new behaviour: renamed/new categories, the legacy prefix, all three
      ticket builders + the resolver, the scoped panel, the always-visible comment icon, the
      toolbar clearing the scope, and the evidence-individual context.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- ✅ TASK COMPLETE
- **Last completed action:** all five phases done; `tsc --noEmit` clean, ESLint clean on the
  changed files, 885/885 tests passing.
- **Next immediate action:** none — review the diff and commit.
- **Recent commands run:**
  - `gh issue view 289 --repo geneontology/noctua-visual-pathway-editor`
  - `npx tsc --noEmit`
  - `npx eslint src tests`
  - `npx vitest run`
- **Uncommitted changes:** the 9 source files + 8 spec files in Files Modified, the new
  `src/features/gocam/services/commentSubjects.ts`, and this plan. Nothing committed yet.
- **Environment state:** nothing running.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/data/commentCategories.ts` | rename + 2 categories + legacy alias | done |
| `src/features/gocam/data/annotationDispute.ts` | comment in body + 2 builders + resolver | done |
| `src/@noctua.core/components/cell/EditableCell.tsx` | always-visible comment icon | done |
| `src/@noctua.core/components/drawer/drawerSlice.ts` | comments scope state | done |
| `src/app/PathwayViewer.tsx` | set scope from graph icon | done |
| `src/features/gocam/components/CamToolbar.tsx` | clear scope from toolbar | done |
| `src/features/gocam/components/CommentsPanel.tsx` | scoped view + ticket buttons | done |
| `src/features/gocam/components/IndividualCommentsForm.tsx` | evidence context + ticket buttons | done |
| `src/features/gocam/services/commentSubjects.ts` | new — shared subject labels + lookup | done |
| `src/features/gocam/components/DisputeTicketButton.tsx` | renamed to `CommentTicketButton.tsx`, generalised | done |

## Blockers

- None. (`npm run format` is broken in this checkout — `prettier-plugin-tailwindcss` looks for a
  `tailwind.config.js` that doesn't exist under Tailwind v4's CSS config, and fails on every file,
  including untouched ones. Pre-existing, unrelated to this task; changed files were indented by
  hand to match.)

## Notes

- The category string is a stored prefix, so renaming it is a data-compatibility change, not a
  label change — hence the legacy alias rather than a straight rename.
- `cam.nodes` holds every individual including evidence individuals, which is why the dialog can
  load an evidence comment today; only the *activity* lookup misses it.
- Ticket titles keep the existing `<Type> <model URL>` convention so the trackers stay greppable by
  model.

## Additional Context (Claude)

- The graph node's comment icon is drawn in `shapes.ts` (`commentIcon` / `commentCount`, always
  visible, grey) and fires `element:comment:pointerdown` → `camCanvas.onCommentClick` →
  `PathwayViewer.handleShowComments`. That is the "bottom left" icon item 2 refers to.
- Scope belongs in `drawerSlice` rather than `camSlice`: it's a property of how the panel was
  opened, not of the model or the selection. `selectedActivityId` keeps doing its own job (graph
  highlight), so a scoped panel still highlights the node.
- Risk worth watching: an evidence-dispute ticket wants the annotated GO term, but for an evidence
  individual that term is the *edge target* — and for an `enabled by` edge the target is the gene
  product, not a GO term. Putting the edge's own statement (`relation → object`) in the body keeps
  the ticket honest instead of mislabelling a gene product as a GO term.

## Summary

All six issue checkboxes are implemented.

1. **Always-visible comment icons** — `EditableCell`'s comment button lost its `opacity-0 /
   group-hover` branch. Grey with no comments, green with a count. Per the user's call this covers
   the comment icons only; the pencil and trash stay hover-only.
2. **Per-activity scoping** — new `drawer.commentsActivityScope`, set by the graph node's comment
   icon (`PathwayViewer.handleShowComments`) and cleared by the toolbar button. Scoped, the panel
   shows only that unit's section, hides the model comments, names the activity in the header,
   counts only that unit, and offers "Show all comments". A stale scope falls back to the full list.
3. **`Evidence dispute`** — new reference category with a go-annotation ticket whose body names the
   statement (`relation → object`) and the evidence (`code · reference`) rather than a GO term.
4. **`GO term annotation dispute`** — renamed, with `Annotation dispute` kept as a legacy prefix
   that parses and displays under the new name. Ticket titles follow the new label.
5. **Comment in the ticket** — all three builders paste the comment text below the bullet list.
6. **`Ontology term pending` → go-ontology** — its own pre-filled ticket and GitHub button.

Two things worth flagging beyond the checkboxes:

- **A real bug fixed en route.** `IndividualCommentsForm` looked the activity up with
  `activity.nodes.some(...)`, which never matches an evidence individual — so an evidence comment
  had no gene/statement context at all. `findCommentSubject` now searches edges too, which is what
  makes item 3's ticket body possible.
- **Duplication removed.** The subject-label helpers were copied between the panel and the dialog;
  they now live in `services/commentSubjects.ts`, and both build ticket context through one
  `commentTicket` resolver, so the panel and the dialog cannot offer different buttons for the
  same comment.

Tests: 885 passing (up from 853). 10 specs were repaired for the rename / pasted comment / new
slice field; the rest is new coverage.

## Follow-up

- Legacy `Annotation dispute` prefixes stay in stored models until a curator re-saves that
  individual's comments; nothing rewrites model data in bulk. Worth confirming with Pascale that
  this is the wanted behaviour rather than a migration.
- The evidence-dispute body names the statement instead of a GO term because an `enabled by` edge
  targets the gene product. If curators would rather see the activity's MF term there, that's a
  one-line change in `CommentsPanel` / `IndividualCommentsForm`.
