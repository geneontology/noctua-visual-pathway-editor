# Barista / Minerva model fixtures

Real m3Batch responses snapshotted from production. Imported by
`tests/fixtures/models.ts` and fed through `transformGraphData` to produce
realistic `GraphModel` instances. Filenames describe the **testing scenario**
each fixture best exercises, not the biology.

## Content-rich fixtures

| File | Indiv. | Facts | ECO codes | State | What it's good for |
| --- | --- | --- | --- | --- | --- |
| `small-baseline.json` | 74 | 37 | 4 | production | Default fixture; small + 10 common relations + title/taxon/contributor metadata. Use when one realistic model is enough or when testing metadata parsing. |
| `diverse-relations.json` | 160 | 72 | 9 | production | Maximum relation variety — 14 distinct edge predicates including indirectly/directly +/- regulates, causally_upstream_of_+_effect, small_molecule_inhibitor. Pick when the test cares about edge predicates or relation rendering. |
| `large-scale.json` | 376 | 170 | 12 | production | Biggest fixture. **Unique:** 52 `constitutively_upstream_of` (RO:0012009) edges — no other fixture has this relation. Use for scale / activity-rich tests AND constitutively-upstream coverage. |
| `indirect-regulation.json` | 64 | 32 | 3 | production | Small fixture exercising **indirectly_positively_regulates** (RO:0002407) + small_molecule_activator. Use for indirect-causation flows. |
| `direct-regulation-heavy.json` | 293 | 163 | 3 | production | 45 `directly_positively_regulates` edges — regulation-density stress. Also the most chemical-loaded fixture by node count (61/59/55 CHEBI). Doubles as a chemistry-heavy scenario. |
| `chemical-pathway.json` | 60 | 30 | 1 | production | Chemical biosynthesis pathway. **Uniform evidence** (only ECO:0000314 IDA). 7 each of has_input / has_output / part_of / enabled_by. Use for chemical biosynthesis OR single-evidence-type scenarios. |

## Edge-case fixtures

| File | Indiv. | Facts | State | What it's good for |
| --- | --- | --- | --- | --- |
| `empty-model.json` | 0 | 0 | development (modified-p: **true**) | Brand-new unsaved model. **Unique:** only fixture with `modified-p: true`. Use for empty-state UI, unsaved-draft indicators, "no activities yet" messaging. |
| `review-state.json` | 1 | 0 | **review** | **Unique:** only fixture in `review` state. Single chemical individual with no edges; produces exactly one activity post-transform. Use for state="review" badge/color tests AND for nearly-empty models. |

## Cross-fixture state coverage

`production` (6 fixtures), `development` (empty-model), `review` (review-state).
All three model states are now represented at least once — useful for state-color
and lifecycle UI assertions.

## Export naming

`tests/fixtures/models.ts` mirrors the filename:

| File | `*Raw` export | `*Model` export |
| --- | --- | --- |
| `small-baseline.json` | `smallBaselineRaw` | `smallBaselineModel` |
| `diverse-relations.json` | `diverseRelationsRaw` | `diverseRelationsModel` |
| `large-scale.json` | `largeScaleRaw` | `largeScaleModel` |
| `indirect-regulation.json` | `indirectRegulationRaw` | `indirectRegulationModel` |
| `direct-regulation-heavy.json` | `directRegulationHeavyRaw` | `directRegulationHeavyModel` |
| `chemical-pathway.json` | `chemicalPathwayRaw` | `chemicalPathwayModel` |
| `empty-model.json` | `emptyModelRaw` | `emptyModelModel` |
| `review-state.json` | `reviewStateRaw` | `reviewStateModel` |

## Coverage gaps to fill later

- **`with-violations.json`** — none of the current fixtures have SHEx violations
  populated. To exercise the violation rendering paths in `violationService.ts`
  and `CamErrors.tsx`, capture a model that Barista flagged invalid.
- **`state-closed.json` / `state-delete.json`** — `closed` and `delete` model
  states aren't represented. Useful for completing state-color coverage.
- **`with-not-qualifier.json`** — no fixture currently has NOT-qualifier
  (complement) edges. Useful for testing the IS NOT badge rendering.

## How to refresh

Open the model in Noctua / Barista, copy the m3Batch response from the Network
tab. **Strip the Barista envelope** if present — keep just the inner `.data`
object (the file should start with `"modified-p"` or `"id"`, not `"packet-id"`).
Overwrite the fixture and run `npx vitest run tests/fixtures/models.test.ts`
to verify the transform invariants still hold.

## How to consume

```ts
import { smallBaselineModel, diverseRelationsModel, largeScaleModel } from '@tests/fixtures/models'
// or the raw form for transform tests:
import { smallBaselineRaw, chemicalPathwayRaw, emptyModelRaw } from '@tests/fixtures/models'
```
