# Code Review — Codebase, 2026-05-22

A fresh read of the codebase itself (not a diff, not git history). I did not consult any other review docs.

Scope: app shell, Redux/RTK Query plumbing, the `gocam` form pipeline (the largest and most complex feature), the `relations` decision tree and connector flow, the `search` autocomplete/JSONP layer, the shared dialog/popover/overlay primitives in `@noctua.core`, the Barista socket service, and the validation/violation pipeline. I did not read tests, the JointJS canvas internals, or the build/Vite config.

---

## 1. TL;DR

The codebase is in good shape for a project of this complexity: a feature-module layout, lint-enforced typed hooks, a coherent Mantine theme, and a recursive form tree that mirrors the Barista graph. The biggest opportunities for improvement live in three places: **the form sub-system has too many shapes for the same idea (evidence rows live in four different forms with four implementations)**, **the graph-transform pipeline has hidden coupling to the Redux store**, and **mutations have almost no error UX**.

Nothing is on fire. The recommendations below are prioritized by how often the underlying pattern is touched by future work.

---

## 2. Architecture and structure

### What works

- **Feature folders own their slice + components + services + models.** `features/gocam/`, `features/relations/`, `features/search/`, `features/auth/`, `features/users/` — each is self-contained and the path-alias (`@/*`) makes cross-feature imports legible.
- **Typed Redux hooks** (`useAppDispatch`, `useAppSelector`) re-exported from a single file with the lint rule pinning them in place. This is the right way to do it.
- **`combineSlices` + `apiService.reducerPath`** keeps store wiring small. `makeStore(preloadedState)` exists, which is what enables `renderWithProviders` in tests.
- **`@noctua.core` as the shared-primitives layer** — `dialog`, `drawer`, `toast`, `loading-overlay`, `popover`, `menu`, `cell`, `textarea`, `chip`. Each is small and each owns its own slice when it needs one. That last bit — colocating a slice with its presenting component — is a good local-cohesion choice; the alternative of a sprawling `store/` directory would scale worse.
- **Two RTK Query slices per concern** (`camApiSlice`, `lookupApiSlice`, `authApiSlice`, `metadataApiSlice`), all injected into the single `apiService` via `injectEndpoints`. Single cache, single middleware, clean tag invalidation.

### What is awkward

- **Mixed dialog ownership.** `App.tsx` mounts `<GlobalDialog componentMap={DIALOG_COMPONENTS} />` which renders one of `AnnotationForm`/`CamMetadataForm`/`CopyModelDialog`/`ChemicalConnectorForm` based on `dialogSlice.component`. But `PathwayViewer.tsx` *also* renders local `<SimpleDialog>` instances for the connector form, the activity form (via `ActivityFormDialog`), and a "Model Updated" `<Modal>`. And `useDeleteConfirmation` uses a hook-managed `<ConfirmDialog>`. Three different ownership models for dialogs:
  - Redux-driven global (callbacks passed via `customProps`, exempted from serializable check)
  - Local component state with `<SimpleDialog>`
  - Hook-managed state for confirms
  
  This reads like an in-progress migration. Pick one (probably the Redux-driven one, since it's already the system of record) and fold the rest in. The serializable-check exemption is already in place; the remaining `<SimpleDialog>` instances in `PathwayViewer` can move to `DialogComponent` entries.

- **`src/@noctua.core/`** vs. **`src/app/`** isn't crisply separated. `app/` has `hooks/usePathwayCanvas.ts`, `useDeleteConfirmation.ts`, `useBaristaModelWatch.ts`, `useUserContext.ts` — but `@noctua.core/hooks/` has `usePopover.ts`. The boundary seems to be "core primitives that don't know about CAMs" vs "app-aware hooks", but `useUserContext` is feature-aware. Document the boundary in `@noctua.core/README` (if any) or move feature-aware hooks under `features/`.

---

## 3. State management

### What works

- **`createSelector` is used in the right places.** `selectSelectedActivity`, `selectModelEvidence`, `selectModelReferences`, `selectModelWiths` — all derived data is memoized.
- **`makeSelectModelTerms` factory** for parameterized selectors. The call sites do `useMemo(makeSelectModelTerms, [])` so each consumer gets its own memo cache. This is correct and intentional for parameterized selectors.
- **`activityFormSlice` is well-designed.** A single recursive `TermNode` root, with reducers that walk to a `uid` and mutate in place (via Immer). The `initCreateForm`/`initEditForm`/`initDuplicateForm` separation is clean, and `initDuplicateForm` correctly `reIdTree`s so duplication has no identity overlap.

### Issues

- **`graphServices.ts:393-408` reaches into the store directly** via `import { store }` then `store.getState()` to look up contributors/groups by URI/ID. This happens inside `transformGraphData`, which is called by the RTK Query `queryFn` for `getGraphModel`. Three problems:
  1. **Circular concern.** A pure transform now depends on store state, so the same input can produce different outputs depending on when metadata loaded. If `metadata.contributors` is empty (loaded later), every contributor becomes `{ uri }` with no `label`/`name`.
  2. **Untestable in isolation.** Any test that exercises `transformGraphData` must boot the store.
  3. **Race condition.** If the graph fetch resolves before the metadata fetch, the model is built with bare-URI contributors and never re-resolves. The model is set into Redux and re-renders won't re-run the transform.
  
  Fix: lift contributor/group resolution out of `transformGraphData`. Either pass the lookup tables in as args, or do the resolution lazily in selectors (`selectActivityWithResolvedContributors` etc.) so the contributors update when metadata arrives.

- **`activityFormSlice` reducers walk the tree on every action.** `findTermNode`, `findRelationNode`, `findRelationByTargetUid`, `findParentOfRelation` are all O(n). For a 10-node activity that's a non-issue, but every keystroke in a `<TermAutocomplete>` dispatches `updateTerm` which walks the tree. If the form ever grows to dozens of nodes, switch to a `byUid` index alongside the tree.

- **`relationSlice` and `activityFormSlice` both own `EvidenceForm[]`** in slightly different shapes. Both have add/remove/update reducers. The decisions about where evidence lives are inconsistent: `RelationForm.tsx` reads/writes via Redux; `ChemicalConnectorForm.tsx` and `AnnotationForm.tsx` use local `useState`. There's no rule for when to use which.

- **`dialogSlice.customProps` carries callbacks** that escape the serializable check. This is honest and the comment in `store.ts` is good — but the `componentMap` in `App.tsx` types `React.ComponentType<any>`, so the receiving end has no static guarantees about which props are present. Consider per-component prop types: `Record<DialogComponent, ComponentType<SpecificProps>>` instead of `Partial<Record<DialogComponent, ComponentType<any>>>`.

---

## 4. The form system (the largest single feature)

Three layered concerns: the recursive tree model, the Barista operation builder, and the rendered form. All three have rough edges.

### `formModels.ts` — the recursive tree

Clean. `TermNode` → `RelationNode[]` → `TermNode`. Evidence is on the relation, not the node. `TermDescriptor`/`RelationDescriptor` are the template shapes (used by `activityTemplates.ts`); `TermNode`/`RelationNode` are the runtime shapes. The factories `createEvidenceForm()` and `createAutoPopulatedEvidence('iss'|'nd')` centralize evidence construction — good.

### `activityFormSlice.ts` — the reducers

Already covered in §3. One additional note: `updateEvidenceForm` does `field: keyof EvidenceForm` with runtime type-checking via `if (field === 'evidenceCode' && typeof value === 'object')`. A discriminated union for the action payload would let TypeScript catch field/value mismatches at compile time.

### `activityOperations.ts` — the Barista op builder

- **`buildCreateActivityOperations`** walks the term tree and emits operations in post-order (children first, then the edge to the parent). Uses `termVarIds: Map<uid, varId>` to thread variables through the operation list. Clean and idiomatic.
- **`buildEditActivityOperations`** is the interesting one. The strategy comment at lines 149-162 is excellent and the code follows it:
  1. Match nodes by UID across old/new.
  2. Type changed → `REMOVE_TYPE` + `ADD_TYPE` in-place.
  3. New nodes (no UID match) → `ADD`.
  4. Old nodes not in new → `REMOVE`.
  5. Edges diffed by `(source|target|predicate)` key.
  6. **Evidence is always wiped and rebuilt** — lines 293-311. This is the destructive bit. Even if the user only changed a term, all evidence individuals on every edge in the activity are deleted and re-added. Server-assigned UIDs and contributor history are lost. Worth diffing evidence by `(evidenceCode.id, reference, withFrom)` and only emitting ops for the diff.
- **Fallback to `buildFullReplaceOperations`** at line 193 triggers when *no* form node has a UID matching the old activity. The threshold "any single match" is forgiving, but if a user manages to clear and re-add the MF root, every other unchanged node also gets rebuilt. Probably fine.
- **`buildAddEvidenceToEdgeOperations`, `buildRemoveEvidenceOperations`, `buildEditIndividualTypeOperations`, `buildEditEvidenceAnnotationOperations`, `buildClearEvidenceAnnotationOperations`** — these all coexist with the main edit-diff path. They're presumably for finer-grained operations from menus or inline edits. The overlap means there are multiple "right" ways to update the model. Worth documenting which path is used when.

### `formValidation.ts`

- Simple recursive walk, returns a `ValidationError[]`. Good.
- `isValidReference` checks DB prefix is in `referenceAllowedDBs`. But `extractEvidence` in `graphServices.ts:202-203` joins multiple sources with `'| '`:
  ```js
  const sortedSources = [...evidenceNode.sources].sort((a, b) => (a > b ? -1 : 1))
  const reference = sortedSources.join('| ')
  ```
  When such a multi-source evidence reaches the edit form, `isValidReference` rejects it (`"PMID:123| PMID:456"` doesn't match any DB prefix). The edit form then shows a validation error on data that came from the server. Either parse multi-source references back into individual evidence rows on hydrate, or special-case `isValidReference` to handle the join character.
- `walkTerm` recurses inside `for (const rel of node.relations)` — fine, but note that if any node has a cyclic reference (shouldn't, but…) this stack-overflows silently.

### The rendered forms

Four forms render evidence rows with identical shape: `<TermAutocomplete autocompleteType=EVIDENCE_CODE>` + `<DatabaseField type=reference>` + `<DatabaseField type=with>` + remove button + "Add evidence" button.

- `ActivityForm.tsx` → `EntityRow.tsx` (lines 234-273)
- `AnnotationForm.tsx` (lines 220-272)
- `ChemicalConnectorForm.tsx` (lines 243-277)
- `RelationForm.tsx` (lines 330-364)

A note: `src/features/gocam/components/EvidenceRow.tsx` exists in the file tree but is *not imported* by the four forms above. It may be a stranded extraction attempt. Worth verifying and either using it everywhere or deleting it.

Strong candidate for unification:

```ts
<EvidenceList
  evidences={evidences}
  onAdd={addEvidence}
  onRemove={removeEvidenceAt}
  onChange={patchEvidence}
  initialEvidenceOptions={evidenceInitialOptions}
/>
```

Adopting this would also let the four forms standardize on the same remove-confirmation behavior (which currently differs: `AnnotationForm` confirms only for non-empty rows; `RelationForm` confirms via `ConfirmDialog` for the connector; `EntityRow` confirms only the "remove last" case).

---

## 5. The relations decision tree

### `decisionTree.ts` (service)

- **Heavy `any`.** `let branch: any = null`, `relationshipId as any`, `branch[directionId]?.relation`. The decision tree is genuinely complex (three connector types × N relationships × optional direction × optional directness), but losing all type safety means renaming a relationship ID surfaces as a runtime null. A discriminated union keyed on `connectorType` would catch this at the type level.
- **`reverseLookup` is O(relationships × directions × directnesses)** — fine because the tree is small, but it runs on every form mount with `existingEdgeId`. A one-time `Map<relationId, RelationshipInput>` built at module-load (or memoized) costs nothing and makes intent clearer.
- **`inferSourceType` / `inferTargetType`** use string-prefix matching on the relationship ID. Brittle: adding a new relationship type with a different naming convention silently breaks the inference. A `connectorType` field on each branch would be more robust.

### `useRelationFormConfig` hook

- Clean. Memoizes `connectorType`, `relationshipOptions`, `definitionMap`. The three `shouldShow*` flags are derived from `connectorType` + `selected.relationshipId`. Good.
- One subtlety: `shouldShowDirection` has an `|| selected.relationshipId === (ActivityRelationshipId.UNDETERMINED as string)` clause. The cast hints that `UNDETERMINED` exists on multiple enums and the `===` comparison is intentionally widening. Worth a comment.

### `RelationForm` save flow

- **Edit = delete + add as two separate `updateGraphModel` calls** (lines 152-171). If the delete succeeds and the add fails, the edge is gone and unsaved. Barista's `m3Batch` accepts a single array of operations — concatenate `buildConnectorDeleteOperations(...)` and `buildConnectorOperations(...)` and send once.
- **"Why is the Save button disabled?" button** has no click handler — pure decoration. Either wire it to an explanation tooltip or render it as plain text.

---

## 6. API layer (`apiService`, `camApiSlice`, `lookupApiSlice`)

### `apiService.ts`

- Single `createApi` instance with `apiService.reducerPath = 'apiService'`. Endpoints injected per feature. This is the recommended RTK Query pattern for large apps. Good.
- `baseQueryWithVersion` reads `apiVersion` from URL search params on every request. If the URL changes (navigation), the version follows. Fine, but slightly surprising — document this.

### `camApiSlice.ts`

- `getGraphModel` uses `queryFn` with a custom `baseQuery` call. Reasonable because Barista's URL shape (`?token=...&intention=query&use-reasoner=true&requests=...`) doesn't fit RTK Query's `query` helper cleanly.
- `updateGraphModel` calls `baristaSocketService.recordOwnPacket(...)` after the response — this is the dedup hook that prevents the socket service from notifying about your own changes. Good integration point.
- **`invalidatesTags: ['graph']`** on `updateGraphModel` invalidates *every* graph tag, refetching all models. With only one model open at a time, that's a no-op for other tags, but if a future "browse models" view ever opens multiple, this thrashes. Use `invalidatesTags: (_r, _e, _arg) => [{ type: 'graph', id: currentModelId }]` and thread the model ID in.

### `lookupApiSlice.ts`

- **JSONP** is necessary because GOlr is cross-origin without CORS. The `createJsonpScript` function is careful: tracks `called`, cleans up on success/error/timeout, removes the `window[callbackName]` and the script tag in `cleanup()`. The timeout path (`if (!called) setTimeout(0)`) handles the "script loaded but callback never invoked" case — that happens when the server returns HTML or a 404 page that loads as a script with no callback execution. Defensive and correct.
- **`escapeGOlrValue`** is implied to exist in `lookupServices` — I didn't read it, but the inputs reaching `q: escapedQuery + '*'` from user typing make this critical. A bug there is a Solr injection.
- **`searchAnnotations` requests 2000 rows.** Reasonable for the Search Annotations picker, but worth knowing. If the gene product has more, results are silently truncated.
- **`getPubmedInfo` uses native `fetch`** — different from the rest. Fine because PubMed esummary supports CORS. Worth a comment explaining the asymmetry.

---

## 7. UI primitives (`@noctua.core/components/`)

### `SimpleDialog` / `DialogHeader` / `ConfirmDialog` / `GlobalDialog`

- Clean composition. `SimpleDialog` is the height/scroll/header primitive; `ConfirmDialog` reuses it for the common destructive-confirm pattern; `GlobalDialog` is the Redux-driven router.
- `SimpleDialog`'s `bodyScroll: 'auto' | 'none'` switch is the right pattern: top-level forms own their own scrolling regions (`'none'`), simple read-only dialogs use the default auto-scroll wrapper.
- `modalSize.ts` exists but I didn't read it — assumed to centralize the Mantine size mapping.

### `AnchoredPopover.tsx`

- The most carefully-written file I saw. Comments explain:
  - Why a state-backed ref instead of `useRef` (Mantine `<Portal>` mounts async, parent doesn't re-render when child attaches).
  - Why `BACKDROP_Z = 250` and `POPOVER_Z = 260` (sandwiched between Mantine `<Modal>` z=200 and its nested `<Popover>` z=300).
  - Why ESC uses capture-phase (so it doesn't bubble to the parent dialog).
- **Behavior quirk on `closeOnEscape={false}`**: the capture-phase ESC handler always calls `e.stopPropagation()`, but the `if (closeOnEscape) onClose()` check is *after*. Net effect: Escape is swallowed (stops on the popover) but the popover doesn't close. The parent dialog also can't close on Escape because the event never reaches it. If `closeOnEscape={false}` is meant to "let parent handle Escape", swap the order or guard with `if (!closeOnEscape) return`.
- **Flip math** only re-runs the vertical decision when overflowing the bottom; horizontal positioning isn't re-evaluated after the flip. Currently fine because anchor width doesn't change, but if top-aligned placements are ever added, expand the logic.

### `Autocomplete.tsx` (the term picker)

- Rolls its own portal + fixed positioning via `useLayoutEffect`. Almost the same code as `AnchoredPopover`, slightly less capable (no `ResizeObserver`, no flip).
- **Keyboard navigation only walks `options.length`** (lines 132-153), but `displayOptions = showInitial ? initialOptions : options` (line 84). Arrow keys don't navigate prelookups. Likely a regression introduced when `initialOptions` was added.
- **`selectFromResult` returns a fresh object literal** on every call: `({ data: data || [], isLoading, isFetching })`. RTK Query memoizes on reference equality here, so the fresh object defeats memoization. Either memoize the empty-array fallback or use the default selector and handle `undefined` at the consumer.
- **Disabled rows still highlight on hover** — `onMouseEnter={() => setHighlightedIndex(index)}` runs regardless of `disabled`. Then `handleOptionSelect` is gated by `!disabled`. Visual inconsistency.
- **Two paths into `setOpen(true)`** — `useAutocomplete && setOpen(true)` on mousedown (anchor div) and on focus (textarea). Defensive overlap is fine.

### `DatabaseField.tsx`

- Two overlay surfaces: an inline filtered suggestion list (shown on focus/type) and an `<AnchoredPopover>`-rendered `ReferenceDropdown`/`WithDropdown` (opened by the right-section icon button). Both can be open simultaneously during the blur-timeout window. The `BLUR_CLOSE_DELAY_MS = 200` timer is a fallback; `onMouseDown={e => e.preventDefault()}` on each suggestion is the real blur-suppression. Belt-and-suspenders is fine here.
- The custom `seen` set in the filter loop:
  ```js
  for (const s of suggestions) {
    if (!s || seen.has(s)) continue
    if (q && !s.toLowerCase().includes(q)) continue
    seen.add(s)
    out.push(s)
  }
  ```
  De-dupes and case-insensitive substring matches. Wrapped in `useMemo`. Good.

### `FloatingTextarea.tsx`

- Uses CSS modules (`.module.css`) — the only such file I noticed in an otherwise Tailwind-dominated codebase. Likely needed because the floating-label state requires `:has`-style selectors Mantine doesn't expose. Worth a one-liner comment in the file explaining why it's not Tailwind.

### `LoadingOverlay` + middleware

- Counter-based overlay; middleware ties `show`/`hide` to RTK Query lifecycle for `getGraphModel`, `updateGraphModel`, `copyGraphModel`. The `messageForUpdate` heuristic — "if any op is REMOVE, say 'Deleting…'" — is clever but fragile: a `REMOVE` could be removing an evidence node during an edit, not deleting an activity. Probably acceptable as a heuristic but expect occasional "Deleting…" during saves.
- `HIDE_LINGER_MS = 1000` prevents flicker when responses are fast. Reasonable.

### `usePopover.ts`

- Tiny generic hook for anchor-based popovers. Used by `Toolbar` for the user/help menus. Clean.

---

## 8. Real-time sync (`baristaSocketService`)

- Module-singleton service with `connect`, `disconnect`, `watchModel`, `acknowledgeRefresh`, `recordOwnPacket`. The packet-id-based dedup is the right shape: when *we* save, we get back the packet ID via `recordOwnPacket`, and when the socket fires a `relay` event with that packet ID, we know it's our own write and skip the "external change" notification.
- The 500ms `DEDUP_DELAY_MS` `setTimeout` is the slack window — relay events may arrive before our `recordOwnPacket` call returns. Reasonable.
- **`dialogOpenForModel`** prevents stacking dialogs if multiple relay events arrive — only one notification per model until `acknowledgeRefresh` is called. Good.
- **`disconnect()`** is never called by the React code. `useBaristaModelWatch` only unsubscribes its own handler; the socket stays open. In an SPA, that's typically fine, but worth documenting.
- **`socket = io.connect(...)` returns `SocketIOClient.Socket`** — the type comes from an ambient `socket.io-client` declaration. If the version of socket.io-client is on a `Socket` type (v3+), this type may need to be updated.

---

## 9. The Barista graph transform (`graphServices.ts`)

The biggest single piece of complexity in the codebase. Reads as careful but has some subtle issues.

### `transformGraphData`

- Walks `data.individuals` → builds `GraphNode[]`. Walks `data.facts` → builds `Edge[]` (with `source`/`target` references resolved). Then calls `extractActivities` → `extractMolecules` → `extractActivityConnections`. Finally parses validation results and builds `validationErrors` via `violationService`.
- **Calls `store.getState()` directly** for contributor/group resolution (already flagged in §3).
- **`uid: uuidv4()` on edges** — edges from Barista don't have stable identifiers (facts are subject+predicate+object triples), so synthesizing a UID at parse time is reasonable. But the UID is unstable across refetches: if you fetch the model twice, the same edge has different UIDs. Anywhere we key on `edge.uid` (e.g. validation, activity grouping) is implicitly assuming a single graph instance. If `useGetGraphModelQuery` ever returns a cached refresh that pieces of the UI compare to, the UID swap will cause unnecessary churn. Consider deterministic UIDs (`${subject}|${predicate}|${object}`) so edge identity is stable across refetches.

### `extractActivities`

- DFS from each `enabled_by` source. Uses `activityBoundary` (other enabled-by sources + chemicals) as a stop-set.
- `exploreSubgraph` mutates a shared `visited` set per activity, plus shared `boundaryNodeIds`. There's a subtle case worth confirming: if two activities share a downstream node (a "joining" node reachable from both MFs through the same edge path), the first DFS claims it via `visited`, and the second DFS short-circuits at the same node. This is probably the intended behavior (each downstream node belongs to one activity), but it's order-dependent.
- **`isEdgeShapeAllowed` uses `canInsertEntity` (the insert-menu config) as a parse-time gate.** This double-duty couples display rules to data interpretation: if the menu config changes to allow a new edge type, existing models retroactively expose new activity nodes. Probably the intent, but document this.

### `extractActivityConnections`

- **Mutates input edges**: lines 184-187:
  ```js
  if (edge.id === Relations.HAS_INPUT) {
    edge.isReverseLink = true
    edge.reverseLinkLabel = 'input of'
  }
  ```
  Since the same `edge` reference is in both `model.edges` and `model.activityConnections`, this mutation is visible everywhere. Future readers expect functional transforms; mark this clearly or move the flag to a separate map keyed by edge uid.

### `extractEvidence`

- The multi-source join issue is in §4 (`formValidation`). Reproduced here for context:
  ```js
  const sortedSources = [...evidenceNode.sources].sort((a, b) => (a > b ? -1 : 1))
  const reference = sortedSources.join('| ')
  ```

---

## 10. Cross-cutting issues

### Error UX on mutations

Almost no mutations show error feedback to the user.

- `useDeleteConfirmation.confirmDelete`: `updateGraphModel(ops)` is fire-and-forget. No `.unwrap()`, no `.catch()`. If the delete 500s, the drawer closes and the activity is still there, with no toast or error state.
- `ActivityForm.handleSave`: `await updateGraphModel(operations)` with no error handling.
- `ChemicalConnectorForm.handleSave`: `await updateGraphModel(ops).unwrap()` throws on failure, but the surrounding callback doesn't `try/catch`. The dialog stays open with no message.
- `RelationForm.handleSave`: same shape.

The toast slice + `showToast` action is already wired. Pattern:
```ts
try {
  await updateGraphModel(ops).unwrap()
  dispatch(showToast({ message: 'Saved.', severity: 'success' }))
  onSaved?.()
} catch (err) {
  dispatch(showToast({ message: 'Save failed.', severity: 'error' }))
}
```

### Accessibility

- **Icon-only buttons lack `aria-label`** in many places: `EditableCell` edit/delete, evidence-row remove `<ActionIcon>` in the four evidence-rendering forms.
- **`RadioPillGroup`** uses a styled `<span>` for the visible radio dot and a `sr-only` `<input>`. The input is focusable but the visible dot has no `:focus-visible` ring — keyboard users get no focus indicator. Add `peer` on the input and `peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500` on the visible circle.
- **Custom autocomplete (`TermAutocomplete`)** has no `role="combobox"`, no `aria-autocomplete`, no `aria-activedescendant`, no `aria-controls`. Screen readers see "textarea, then floating list of divs". Mantine's `<Combobox>` primitive is the standard fix; switching to it would also clean up the manual positioning code.

### Magic numbers and offsets

- `Layout.tsx` uses raw `top: 50`, `top: 94`, `top: 120` to stack the toolbar/CamToolbar/content. These are coupled to the heights of those toolbars but not derived from them. If either toolbar's height changes, layout breaks.
- Z-index sprinkled across files: `z-50`/`z-40` (Layout), `z-[99997]` (LoadingOverlay), `z-[1300]` (Autocomplete and DatabaseField inline lists), `BACKDROP_Z=250`/`POPOVER_Z=260` (AnchoredPopover). Promote to `src/@noctua.core/data/zLayers.ts`.

### `!important` overrides on Mantine

The Mantine theme (`mantineTheme.ts`) sets sensible defaults — `Button` defaults to `size: 'xs'` with `textTransform: 'none'`, `ActionIcon` to subtle gray, `Modal` to no close button + zero padding. These cover most call sites. But `Toolbar.tsx` still has `!bg-green-600 !text-white !h-10 !text-left !normal-case !text-xs` and `CamErrors.tsx` has `!min-h-[26px] !border-gray-300 !text-xs !normal-case !text-primary-500 hover:!border-primary-500`. Each individual `!important` is fine; the pattern suggests there's a tier of "branded buttons" (login green, validation close) that would benefit from a `Button` variant or color tuple instead of per-call overrides.

### Storage hygiene

`PathwayViewer.handleUpdateLocations`:
```ts
localStorage.setItem(`activityLocations-${modelId}`, JSON.stringify(positions))
```
- No throttle: called on every drag-end (probably — depends on `CamCanvas`).
- No quota error handling: localStorage write can throw.
- No cleanup: stale `activityLocations-*` entries accumulate forever as the user opens different models.

---

## 11. Quick wins (low-risk, high-value)

1. **Move contributor/group resolution out of `transformGraphData`.** Resolve lazily in selectors instead of pulling from `store.getState()` at parse time. Fixes a real race condition.
2. **Wrap mutations in `try/catch` + `showToast`.** Five-line change per mutation site, four mutation sites.
3. **Concatenate the delete+add connector ops into a single `updateGraphModel` call** in `RelationForm.handleSave`. Atomicity matters.
4. **Diff evidence in `buildEditActivityOperations`** instead of wiping and rebuilding. Preserves server-assigned UIDs and history.
5. **Fix arrow-key navigation through `initialOptions` in `Autocomplete.tsx`**. Walk `displayOptions.length`, not `options.length`.
6. **Memoize the `selectFromResult` payload** in `useSearchTermsQuery` call.
7. **Add `aria-label` to icon-only buttons** in the four evidence-rendering forms and `EditableCell`.
8. **`zLayers.ts`** — name the magic z-indexes.

---

## 12. Medium-effort restructures (worth the runway)

1. **Extract `<EvidenceList>`** used by `ActivityForm`/`EntityRow`, `AnnotationForm`, `ChemicalConnectorForm`, `RelationForm`. Standardize the row shape, the add/remove confirmations, the "Add evidence" and "Add ISS" buttons.
2. **Unify dialog ownership.** Move `PathwayViewer`'s local `<SimpleDialog>` instances (connector form, activity form, model-updated modal) into the `GlobalDialog`/`dialogSlice` system.
3. **Type the decision tree.** Replace `branch: any` with a discriminated union keyed on `connectorType`.
4. **Switch `TermAutocomplete` to use `AnchoredPopover`** (or Mantine's `<Combobox>`). Drop the bespoke positioning code in `Autocomplete.tsx`.
5. **Decide where evidence state lives.** Pick Redux or local; apply uniformly.

---

## 13. What I did not review

- `src/features/pathway/graph/camCanvas.ts` and the JointJS layout code.
- Test files under `tests/`.
- The Vite config and the `workbenchInjectTmpl` plugin.
- The CSS module file for `FloatingTextarea`.
- `lookupServices.ts` (the JSONP response mapping logic and `escapeGOlrValue` — important to audit for Solr injection).
- `activityTemplates.ts`, `insertMenuConfig.ts`, `nodeCategories.ts` — the descriptor catalogs.
- `shapeTerms.ts` and the ShEx-violation labeling.
- E2E tests / Playwright setup.

Each of those would be its own pass.
