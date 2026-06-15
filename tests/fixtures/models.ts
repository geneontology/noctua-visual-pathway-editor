/**
 * Real Barista API responses snapshotted under `tests/fixtures/raw/models/`.
 * Use the `*Raw` exports as input to `transformGraphData` tests; use the transformed
 * `*Model` exports anywhere a realistic `GraphModel` is needed.
 *
 * Each fixture is named for the testing scenario it best exercises.
 * Profile numbers refer to the raw m3Batch document (individuals + facts), not the
 * post-transform Activity count.
 *
 * ── Content-rich fixtures ───────────────────────────────────────────
 *
 *   smallBaseline           74 indiv / 37 facts / 4 ECO codes / state=production
 *     Common 10-relation set (part_of, has_part, occurs_in, located_in, has_input,
 *     has_output, enabled_by, directly_+/-_regulates, small_molecule_activator).
 *     Default pick when one realistic model is enough. Has model-level title +
 *     taxon + contributor — also useful for metadata-parse assertions.
 *
 *   diverseRelations       160 indiv / 72 facts / 9 ECO codes / state=production
 *     14 distinct relations — most variety of any fixture. Adds
 *     causally_upstream_of_+_effect, indirectly_+/-_regulates,
 *     small_molecule_inhibitor on top of the smallBaseline set. Use for tests that
 *     care about edge predicates, decision-tree paths, or relation rendering.
 *
 *   largeScale             376 indiv / 170 facts / 12 ECO codes / state=production
 *     Biggest fixture. UNIQUE: 52 `constitutively_upstream_of` (RO:0012009) edges —
 *     no other fixture has this relation. Also has provides_input_for. Use for
 *     scale / activity-rich tests AND constitutively-upstream coverage.
 *
 *   indirectRegulation      64 indiv / 32 facts / 3 ECO codes / state=production
 *     Small fixture with indirectly_positively_regulates (RO:0002407) and
 *     small_molecule_activator. Use for indirect-causation flows.
 *
 *   directRegulationHeavy  293 indiv / 163 facts / 3 ECO codes / state=production
 *     45 directly_positively_regulates edges — regulation-density stress.
 *     Also the most chemical-heavy fixture by node count (61 CHEBI:24431, 59 GP).
 *     35 has_input edges. Use for regulation flows OR chemistry-loaded scenarios.
 *
 *   chemicalPathway         60 indiv / 30 facts / 1 ECO code / state=production
 *     Chemical biosynthesis pathway. UNIFORM evidence (only ECO:0000314 IDA).
 *     7 each of has_input, has_output, part_of, enabled_by. Use for chemical
 *     biosynthesis tests OR scenarios with a single evidence type.
 *
 * ── Edge-case / state fixtures ──────────────────────────────────────
 *
 *   emptyModel               0 indiv / 0 facts / state=development / modified-p=true
 *     Brand-new unsaved model. Use for empty-state UI rendering, unsaved-draft
 *     indicators, "no activities yet" messaging.
 *
 *   reviewState              1 indiv / 0 facts / state=review
 *     UNIQUE: only fixture in `review` state. Single chemical individual, no
 *     activities, draft-y title. Use for state="review" badge/color tests AND
 *     for testing models with sub-activity content (no edges).
 *
 * ── Coverage gap ────────────────────────────────────────────────────
 *
 * None of the current fixtures have SHEx violations populated. To exercise
 * the violation rendering paths in `violationService.ts` / `CamErrors.tsx`,
 * capture a model that Barista flagged invalid and drop it as `with-violations.json`.
 */
import { transformGraphData } from '@/features/gocam/services/graphServices'
import smallBaselineRawJson from './raw/models/small-baseline.json'
import diverseRelationsRawJson from './raw/models/diverse-relations.json'
import largeScaleRawJson from './raw/models/large-scale.json'
import indirectRegulationRawJson from './raw/models/indirect-regulation.json'
import directRegulationHeavyRawJson from './raw/models/direct-regulation-heavy.json'
import chemicalPathwayRawJson from './raw/models/chemical-pathway.json'
import emptyModelRawJson from './raw/models/empty-model.json'
import reviewStateRawJson from './raw/models/review-state.json'

export const smallBaselineRaw = smallBaselineRawJson
export const diverseRelationsRaw = diverseRelationsRawJson
export const largeScaleRaw = largeScaleRawJson
export const indirectRegulationRaw = indirectRegulationRawJson
export const directRegulationHeavyRaw = directRegulationHeavyRawJson
export const chemicalPathwayRaw = chemicalPathwayRawJson
export const emptyModelRaw = emptyModelRawJson
export const reviewStateRaw = reviewStateRawJson

export const smallBaselineModel = transformGraphData(smallBaselineRawJson)
export const diverseRelationsModel = transformGraphData(diverseRelationsRawJson)
export const largeScaleModel = transformGraphData(largeScaleRawJson)
export const indirectRegulationModel = transformGraphData(indirectRegulationRawJson)
export const directRegulationHeavyModel = transformGraphData(directRegulationHeavyRawJson)
export const chemicalPathwayModel = transformGraphData(chemicalPathwayRawJson)
export const emptyModelModel = transformGraphData(emptyModelRawJson)
export const reviewStateModel = transformGraphData(reviewStateRawJson)
