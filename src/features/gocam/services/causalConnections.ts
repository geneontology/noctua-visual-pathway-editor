import type { Activity, GraphModel } from '../models/cam'
import { ActivityType } from '../models/cam'
import { Relations } from '@/@noctua.core/models/relations'

/** Relations between two activity units that make a causal connection. */
const CAUSAL_RELATIONS = new Set<string>([
  Relations.CAUSALLY_UPSTREAM_OF,
  Relations.CAUSALLY_UPSTREAM_OF_OR_WITHIN,
  Relations.CAUSALLY_UPSTREAM_OF_POSITIVE_EFFECT,
  Relations.CAUSALLY_UPSTREAM_OF_NEGATIVE_EFFECT,
  Relations.CAUSALLY_UPSTREAM_OF_OR_WITHIN_POSITIVE_EFFECT,
  Relations.CAUSALLY_UPSTREAM_OF_OR_WITHIN_NEGATIVE_EFFECT,
  Relations.CONSTITUTIVELY_UPSTREAM_OF,
  Relations.POSITIVELY_REGULATES,
  Relations.NEGATIVELY_REGULATES,
  Relations.DIRECTLY_POSITIVELY_REGULATES,
  Relations.DIRECTLY_NEGATIVELY_REGULATES,
  Relations.INDIRECTLY_POSITIVELY_REGULATES,
  Relations.INDIRECTLY_NEGATIVELY_REGULATES,
  Relations.PROVIDES_INPUT_FOR,
  Relations.REMOVES_INPUT_FOR,
])

const isActivityUnit = (activity: Activity) => activity.type !== ActivityType.MOLECULE

/**
 * Activity units with no causal relation to another activity unit — not
 * allowed in a model (#305). One chemical in between counts when the links run
 * the same way through it, as drawn on the canvas: A → X → B, e.g. A has output
 * X and X is input of B, or X is a small molecule activator/inhibitor of B.
 * Links between two chemicals are never valid, so they're ignored. Chemicals
 * are never returned; they aren't activity units.
 */
export function activitiesWithoutCausalRelations(model: GraphModel): string[] {
  const activityOf = new Map<string, Activity>()
  for (const activity of model.activities) {
    for (const node of activity.nodes) activityOf.set(node.uid, activity)
  }

  const connected = new Set<string>()
  // Chemical uid → the activity units whose links run into it / out of it.
  const into = new Map<string, string[]>()
  const outOf = new Map<string, string[]>()
  const add = (map: Map<string, string[]>, chemical: string, unit: string) =>
    map.set(chemical, [...(map.get(chemical) ?? []), unit])

  for (const edge of model.activityConnections) {
    const source = activityOf.get(edge.sourceId)
    const target = activityOf.get(edge.targetId)
    if (!source || !target) continue

    if (isActivityUnit(source) && isActivityUnit(target)) {
      if (CAUSAL_RELATIONS.has(edge.id)) {
        connected.add(source.uid)
        connected.add(target.uid)
      }
    } else if (isActivityUnit(source)) {
      // "has input" is drawn from the chemical to the unit, as "input of".
      if (edge.id === Relations.HAS_INPUT) add(outOf, target.uid, source.uid)
      else add(into, target.uid, source.uid)
    } else if (isActivityUnit(target)) {
      add(outOf, source.uid, target.uid)
    }
  }

  for (const [chemical, upstream] of into) {
    for (const from of upstream) {
      for (const to of outOf.get(chemical) ?? []) {
        if (from === to) continue
        connected.add(from)
        connected.add(to)
      }
    }
  }

  return model.activities
    .filter(activity => isActivityUnit(activity) && !connected.has(activity.uid))
    .map(activity => activity.uid)
}
