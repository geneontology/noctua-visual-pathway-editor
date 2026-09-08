import type { Activity, ActivityType, GraphNode } from '../models/cam'
import { RootTypes } from '../models/cam'

/**
 * Local search over everything a model's activities carry: every term (GP, MF,
 * BP, CC, chemicals…), term ids, evidence references (PMIDs), evidence codes
 * and with/from strings. This is "which activities mention X on this canvas" —
 * a filter over the model, not a GOlr lookup.
 */

export interface ActivitySearchHit {
  uid: string
  /** Gene product (or root term) label — how the activity is named on canvas. */
  primary: string
  type: ActivityType
  /** What matched, e.g. "mitotic cell cycle", "PMID:12345". */
  matchText: string
  /** Where it matched, e.g. "BP", "reference" — omitted when the name matched. */
  matchField: string | null
}

/** Short aspect tag for a node, from its root types. */
function aspectOf(node: GraphNode): string {
  const roots = node.rootTypes ?? []
  if (roots.includes(RootTypes.MOLECULAR_FUNCTION)) return 'MF'
  if (roots.includes(RootTypes.BIOLOGICAL_PROCESS)) return 'BP'
  if (roots.includes(RootTypes.PROTEIN_CONTAINING_COMPLEX)) return 'complex'
  if (
    roots.includes(RootTypes.CELLULAR_COMPONENT) ||
    roots.includes(RootTypes.CELLULAR_ANATOMICAL)
  ) {
    return 'CC'
  }
  if (roots.includes(RootTypes.MOLECULAR_ENTITY) || roots.includes(RootTypes.CHEMICAL_ENTITY)) {
    return 'GP'
  }
  return 'term'
}

interface Candidate {
  text: string
  field: string | null
}

/** Every searchable string an activity carries, with where it came from. */
function candidatesOf(activity: Activity): Candidate[] {
  const primary = activity.enabledBy?.label ?? activity.rootNode?.label ?? ''
  const candidates: Candidate[] = [{ text: primary, field: null }]

  const nodes = [activity.rootNode, ...activity.nodes]
  const seen = new Set<string>()
  for (const node of nodes) {
    if (!node || seen.has(node.uid)) continue
    seen.add(node.uid)
    const aspect = aspectOf(node)
    if (node.label && node.label !== primary) {
      candidates.push({ text: node.label, field: aspect })
    }
    // Term ids are searchable too — "GO:0016301" or "UniProtKB:P24941".
    if (node.id) candidates.push({ text: node.id, field: aspect })
  }

  for (const edge of activity.edges) {
    for (const evidence of edge.evidence ?? []) {
      if (evidence.reference) candidates.push({ text: evidence.reference, field: 'reference' })
      if (evidence.with) candidates.push({ text: evidence.with, field: 'with' })
      if (evidence.evidenceCode?.label) {
        candidates.push({ text: evidence.evidenceCode.label, field: 'evidence' })
      }
      if (evidence.evidenceCode?.id) {
        candidates.push({ text: evidence.evidenceCode.id, field: 'evidence' })
      }
    }
  }

  return candidates
}

/**
 * Activities matching `query` anywhere in their content. Every matching
 * activity is returned (two activities enabled by the same GP both appear),
 * each annotated with the first field that matched so the UI can say why.
 */
export function searchActivities(activities: Activity[], query: string): ActivitySearchHit[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  const hits: ActivitySearchHit[] = []
  for (const activity of activities) {
    const match = candidatesOf(activity).find(candidate =>
      candidate.text.toLowerCase().includes(needle)
    )
    if (!match) continue

    hits.push({
      uid: activity.uid,
      primary: activity.enabledBy?.label ?? activity.rootNode?.label ?? 'Unknown',
      type: activity.type,
      matchText: match.text,
      matchField: match.field,
    })
  }
  return hits
}
