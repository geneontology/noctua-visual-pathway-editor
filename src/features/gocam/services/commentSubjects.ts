/**
 * Labels for the things a comment can sit on, and the lookup that finds one by
 * uid (#231, #289). Shared by the Comments panel and the comment dialog so the
 * two describe the same subject — on screen and in a GitHub ticket — the same way.
 */

import type { Activity, Edge, Evidence, GraphModel } from '../models/cam'

/** The activity a comment belongs to, named by its enabling gene product. */
export function activityLabel(activity: Activity): string {
  return (
    activity.enabledBy?.label ??
    activity.molecularFunction?.label ??
    activity.rootNode.label ??
    'Activity'
  )
}

/** An individual as "label (id)", falling back to whichever of the two we have. */
export function individualLabel(node?: { id?: string; label?: string } | null): string {
  if (!node) return ''
  if (node.label && node.id) return `${node.label} (${node.id})`
  return node.label || node.id || 'Individual'
}

function nodeShort(node?: { id?: string; label?: string }): string {
  return node?.label || node?.id || '?'
}

/**
 * The statement a reference belongs to, as relation → object (e.g.
 * "enabled by → ABCA14 Sscr"). The subject is dropped — it's already the
 * activity the section is under — to keep the line short (#231).
 */
export function statementLabel(edge: Edge): string {
  return `${edge.label || edge.id} → ${nodeShort(edge.target)}`
}

/** Evidence code + reference, e.g. "IDA · PMID:25415977". */
export function evidenceLabel(ev: Evidence): string {
  return [ev.evidenceCode?.label, ev.reference].filter(Boolean).join(' · ') || 'Reference'
}

/**
 * Where an individual sits in the model: the activity it belongs to and, when
 * it's an evidence individual rather than a node, the statement it supports.
 * Evidence individuals hang off an activity's edges, not its `nodes`, so both
 * have to be searched (#289).
 */
export interface CommentSubjectLocation {
  activity: Activity
  edge: Edge | null
  evidence: Evidence | null
}

export function findCommentSubject(
  model: GraphModel | null | undefined,
  individualUid: string
): CommentSubjectLocation | null {
  if (!model) return null
  for (const activity of model.activities) {
    if (activity.nodes.some(n => n.uid === individualUid)) {
      return { activity, edge: null, evidence: null }
    }
    for (const edge of activity.edges) {
      const evidence = (edge.evidence ?? []).find(ev => ev.uid === individualUid)
      if (evidence) return { activity, edge, evidence }
    }
  }
  return null
}
