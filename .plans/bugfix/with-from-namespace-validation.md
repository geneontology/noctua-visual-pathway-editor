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

### Phase 1: Add namespace validation — DONE
- [x] In `formValidation.ts`, added `validateWithFrom(input)` — ported verbatim from the old VPE `DataUtils.validateDatabaseIdentifiers`: split on `[,|]`, and for each non-empty entry check `DB:accession` format + that the (case-insensitive) prefix is in `withFromAllowedDBs`. Returns the old messages (`Invalid database prefix: "TAIR" is not part of allowed entities`, etc.).
- [x] Replaced the old colon-only check in `walkTerm` with `validateWithFrom`, wrapped as `With/from for "<label>" on evidence(<n>): <error>` (field `withFrom`, with `uid`/position like the existing messages). Runs in `validateActivityForm`, so the form blocks submit on it.

### Phase 2: Cover both entry points — DONE
- [x] **Form path** (`ActivityForm`): `validateActivityForm` runs on every form change and `handleSave` blocks on `hasErrors` — with/from now blocks too.
- [x] **Inline path** (`EvidenceRow` → `EditorDropdown`): exported `validateWithFrom` and guarded the inline `with` save — invalid value shows an error toast and is not submitted. (Note: `WithDropdown`'s DB `<Select>` only offers allowed DBs, so the only way TAIR/Dicty persists is legacy data being re-saved; both the form and inline now catch that.)

### Phase 2b: MF (first row) evidence was being skipped — DONE
- [x] **Root cause:** the MF's evidence lives on the `enabled_by` relation, whose target (the gene product) is `skipEvidenceCheck: true` (`activityTemplates.ts`). `walkTerm` gated the *entire* evidence block on `!skipEvidenceCheck`, so the MF's reference/with-from were never validated ("the first MF not getting checked").
- [x] **Fix:** in `walkTerm`, `skipEvidenceCheck` now only skips the *"evidence is required"* rule; the per-evidence field checks (reference format, with/from namespace) run for any relation whose target has a term. Empty evidence forms trigger nothing, so no false positives on GP/complex/chemical nodes. Updated 2 `ActivityTable.test.ts` assertions that still encoded the pre-#264 has_input order (missed earlier). Full gocam suite: 382/382 green.

### Phase 3: Verify (manual, user)
- [ ] `TAIR:AT1G01010` → error, submit blocked (both form and inline).
- [ ] `SGD:S000001` (allowed) → no error.
- [ ] Multi-value `GO:0008150|TAIR:AT1G01010` → flags only the TAIR entity.
- [ ] dictyBase value → error.
- [ ] Empty with/from → no error (optional field).

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Ported old `validateDatabaseIdentifiers` into `formValidation.ts` as `validateWithFrom`; wired form-path (walkTerm) + inline-path (`EvidenceRow` with-save) guards. type-check + lint clean.
- **Next immediate action:** User runs Phase 3 manual checks.
- **Uncommitted changes:** `formValidation.ts`, `EvidenceRow.tsx`.

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `src/features/gocam/services/formValidation.ts` | Added/exported `validateWithFrom` (multi-value, case-insensitive, allowed-namespace); replaced colon-only check | Done |
| `src/features/gocam/components/EvidenceRow.tsx` | Inline `with` save validates via `validateWithFrom`; error toast, no submit | Done |

## Notes
- #253 is CLOSED but its intent ("remove DBs that can't support IBA") is satisfied by rejecting the non-allowed namespaces — no separate allow-the-DBs work.
- Decide whether AGI_LocusCode is the intended Arabidopsis namespace (it's in the allow-list) so curators have a valid alternative to TAIR — worth noting in the error message or docs.
