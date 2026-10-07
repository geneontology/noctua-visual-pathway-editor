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
 * allowed in a model (#305). Links to chemicals don't count, except a chain
 * through one: A has output X and X is input of B connects A and B.
 * Chemicals are never returned; they aren't activity units.
 */
export function activitiesWithoutCausalRelations(model: GraphModel): string[] {
  const activityOf = new Map<string, Activity>()
  for (const activity of model.activities) {
    for (const node of activity.nodes) activityOf.set(node.uid, activity)
  }

  const connected = new Set<string>()
  // Chemical uid → the activity units that output it / take it as input.
  const outputs = new Map<string, string[]>()
  const inputs = new Map<string, string[]>()

  for (const edge of model.activityConnections) {
    const source = activityOf.get(edge.sourceId)
    const target = activityOf.get(edge.targetId)
    if (!source || !target || !isActivityUnit(source)) continue

    if (isActivityUnit(target)) {
      if (CAUSAL_RELATIONS.has(edge.id)) {
        connected.add(source.uid)
        connected.add(target.uid)
      }
    } else if (edge.id === Relations.HAS_OUTPUT) {
      outputs.set(target.uid, [...(outputs.get(target.uid) ?? []), source.uid])
    } else if (edge.id === Relations.HAS_INPUT) {
      inputs.set(target.uid, [...(inputs.get(target.uid) ?? []), source.uid])
    }
  }

  for (const [chemical, producers] of outputs) {
    for (const producer of producers) {
      for (const consumer of inputs.get(chemical) ?? []) {
        if (producer === consumer) continue
        connected.add(producer)
        connected.add(consumer)
      }
    }
  }

  return model.activities
    .filter(activity => isActivityUnit(activity) && !connected.has(activity.uid))
    .map(activity => activity.uid)
}
