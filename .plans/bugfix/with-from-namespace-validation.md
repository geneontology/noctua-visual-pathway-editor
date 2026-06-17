# Task: Validate with/from namespaces (reject TAIR/Dicty etc.) — restore the missing error

**Status:** ACTIVE
**Issue:** TAIR with/from report (user); related: #253 (CLOSED — "allow or remove DBs that can't support IBA")
**Branch:** issue-vep-updates-after

## Goal

A with/from value whose namespace is not in the allowed list (e.g. `TAIR:…`, `dictyBase:…`) must be rejected with an error message before submission — matching how the reference field already validates, and matching the canonical allow-list. This restores the error that "used to" appear and addresses #253 (TAIR/Dicty can't support IBA).

## Context

- **Related files:**
  - `src/features/gocam/services/formValidation.ts:83-90` — **gap**: with/from is only checked for a `:` (format), never for an allowed namespace
  - `src/features/gocam/services/formValidation.ts:12-19` — `isValidReference()` — the **correct** pattern (checks prefix ∈ `referenceAllowedDBs`)
  - `src/features/gocam/data/allowedDatabases.ts` — `withFromAllowedDBs` (matches the canonical YAML; TAIR & dictyBase intentionally absent)
  - `src/features/gocam/components/forms/WithDropdown.tsx` / `DatabaseField.tsx` — entry UI (no validation on save)
  - `src/features/gocam/components/forms/AnnotationForm.tsx` (form path) and `src/features/gocam/components/EvidenceRow.tsx` + `EditorDropdown.tsx` (inline path) — both submit with/from
- **Canonical allow-list:** https://github.com/geneontology/noctua/blob/master/metadata/with-from-allowed-namespaces.yaml — verified to match `withFromAllowedDBs` (AGI_LocusCode, CHEBI, ComplexPortal, EC, EcoCyc, FB, GO, InterPro, MGI, PANTHER, PomBase, PR, RGD, RHEA, RNAcentral, SGD, UniProtKB, WB, Xenbase, ZFIN). TAIR and dictyBase are **not** allowed.
- **Triggered by:** User: "TAIR is not in the allowed values, but the annotation seems accepted (this used to give an error message)."

## Current State

`validateActivityForm` validates the reference prefix against `referenceAllowedDBs`, but for with/from it only checks for a colon:

```ts
if (ev.withFrom && !ev.withFrom.includes(':')) {
  errors.push({ uid, field: 'withFrom', message: `Use DB:accession format …` })
}
```

So `TAIR:AT1G01010` passes (it has a colon) and is sent to Barista. No client gate stops it.

with/from is **multi-value**: groups separated by `,`, entities within a group by `|` (see `WithDropdown.parseWithValue`). Validation must check each entity's prefix.

## Steps

### Phase 1: Add namespace validation
- [ ] In `formValidation.ts`, add an `isValidWithFrom`-style check mirroring `isValidReference`, but iterating the multi-value structure: split on `,` then `|`, and for each non-empty entity confirm `prefix ∈ withFromAllowedDBs`.
- [ ] Emit a clear error naming the offending namespace, e.g. `With/from "TAIR:…" uses a namespace that is not allowed for IBA support` (field `withFrom`, with `uid`/evidence position like the existing messages).
- [ ] Keep the existing colon/format check (or fold it into the new one).

### Phase 2: Cover both entry points
- [ ] Confirm the **form path** (`AnnotationForm`/`ActivityForm`) runs `validateActivityForm` and blocks submit on the new error (it does for references — verify with/from now blocks too).
- [ ] Check the **inline path** (`EvidenceRow` → `EditorDropdown` → `buildEditEvidenceAnnotationOperations`). If it bypasses `validateActivityForm`, add the same namespace check there (or refactor the check into a shared helper both call) so inline edits can't sneak a TAIR value through.

### Phase 3: Verify (manual, user)
- [ ] `TAIR:AT1G01010` → error, submit blocked (both form and inline).
- [ ] `SGD:S000001` (allowed) → no error.
- [ ] Multi-value `GO:0008150|TAIR:AT1G01010` → flags only the TAIR entity.
- [ ] dictyBase value → error.
- [ ] Empty with/from → no error (optional field).

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Plan written; gap confirmed at `formValidation.ts:83-90`; allow-list verified against canonical YAML.
- **Next immediate action:** Add the with/from namespace check in `formValidation.ts`.
- **Uncommitted changes:** none yet.

## Files Modified (planned)

| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/services/formValidation.ts` | Add with/from namespace validation (multi-value aware) | Pending |
| inline edit path (`EvidenceRow.tsx`/`EditorDropdown.tsx` or shared helper) | Ensure inline edits run the same check | Pending (verify first) |

## Notes
- #253 is CLOSED but its intent ("remove DBs that can't support IBA") is satisfied by rejecting the non-allowed namespaces — no separate allow-the-DBs work.
- Decide whether AGI_LocusCode is the intended Arabidopsis namespace (it's in the allow-list) so curators have a valid alternative to TAIR — worth noting in the error message or docs.
