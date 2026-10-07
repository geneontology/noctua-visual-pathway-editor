# Task: #305 — find activity units with no causal relations

**Status:** ACTIVE
**Issue:** [#305](https://github.com/geneontology/noctua-visual-pathway-editor/issues/305)
**Branch:** `misc-fixes`

## Goal

A curator can pick **Select → No causal relations** and get every activity unit that has no causal
relation to another activity unit. These aren't allowed in a model.

## Context

- **Related files:**
  - `src/features/gocam/services/causalConnections.ts` — new; which activity units are flagged
  - `src/features/pathway/data/toolbarOptions.ts` — Select-menu presets
  - `src/app/PathwayViewer.tsx` — `handleSelectPreset`
  - `docs/ui-selection-and-copy-paste.md` — §2 Select menu
- **Triggered by:** #305. In the example model, DGAT1 and DGAT2 link only to the chemical
  triglyceride ("has output"), so **Unconnected nodes** (#290, any link) misses them.

## Decisions (user)

- Reported through the **Select menu**, not the errors panel.
- Links to chemicals don't count, **except** a chain through one chemical where both arrows run the
  same way as drawn, A → X → B: has output then input of, or has output then small molecule
  activator/inhibitor of. A → X ← B and A ← X → B don't count. (User widened this after the first
  commit, which counted only has output → input of.)
- Links between two chemicals are never valid, so they're ignored — no multi-chemical chains.
- Chemicals themselves are never flagged; they aren't activity units.
- Causal = the activity-to-activity relations in `Relations`: the causally-upstream family,
  regulates family (direct/indirect), constitutively upstream of, provides/removes input for.

## Steps

### Phase 1: Implement
- [x] `causalConnections.ts` — `activitiesWithoutCausalRelations(model)` → uids
- [x] `toolbarOptions.ts` — `'noCausal'` preset, "No causal relations", after Unconnected nodes
- [x] `PathwayViewer.tsx` — preset runs the service and `setSelection`s the result (empty clears,
      per #303); toast "No activities without causal relations in this model"
- [x] Docs §2 — new row + chemical-chain note; #303 wording (no match clears the selection; the
      "Invert is the exception" paragraph dropped); §3 — Enter on no match clears

### Phase 2: Verify
- [x] eslint on changed files — clean; type-check still 101 (PathwayViewer error moved 10 lines)
- [x] Scratch-only sanity check (not in repo) on the #305 example: DGAT1 + DGAT2 flagged;
      adding DGAT2 has_input TG (chain from DGAT1) flags nothing
- [x] `tests/features/pathway` + `tests/app`: 231/233. Fails: `toolbarOptions.test.ts` (id list
      lacks `'noCausal'` — expected; awaiting OK to update) and a `Layout.test.tsx` announcements
      test that passes alone (29/29) — flaky under load, unrelated
- [x] User: plain "regulates" (RO:0002211, not in `Relations`) being flagged is fine
- [x] Tests (user asked): `toolbarOptions.test.ts` id list + `'noCausal'`;
      `tests/features/gocam/services/causalConnections.test.ts` (new, 12) — #305 example, no links,
      chemicals never flagged, four causal relations, non-causal unit link, and the chemical chain
      (output → input connects; shared input, self-loop and small-molecule activator don't).
      21/21 pass; lint clean; type-check still 101
- [x] Direction rule (user follow-up): `causalConnections.ts` now pairs units whose links run into
      a chemical with units whose links run out of it ("has input" counts as out, since it's drawn
      as "input of"). Tests: activator test flipped to "connects", inhibitor added, A ← X → B and a
      chemical-to-chemical link stay flagged. Docs note rewritten
- [ ] Browser check by the user

## Recovery Checkpoint

- **Last completed action:** tests written and passing
- **Next immediate action:** user browser check, then commit when asked
