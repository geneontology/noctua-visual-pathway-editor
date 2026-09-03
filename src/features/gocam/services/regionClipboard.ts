import type { Activity, Edge, Entity, GraphModel } from '../models/cam'
import type { ActivityFormType, EvidenceForm, TermNode } from '../models/formModels'
import { activityToFormTree } from '../data/activityTemplates'
import { activityClipboardLabel, activityFormTypeOf } from './activityClipboard'

/**
 * Copy/paste of a whole selected region — several activities plus the relations
 * between them (#114 follow-on).
 *
 * Unlike the single-activity payload in `activityClipboard.ts`, this lives in
 * `localStorage` rather than the system clipboard. Reading the system clipboard
 * needs a permission Firefox never grants to web content, which is why the
 * menu-driven paste there falls back to "press Ctrl+V instead"; `localStorage`
 * needs no permission and is still shared across tabs of the same origin, so
 * cross-model paste keeps working. The payload is structured data nobody would
 * want in a text editor anyway.
 */
export const REGION_CLIPBOARD_KEY = 'noctua-region-clipboard'
export const REGION_CLIPBOARD_KIND = 'noctua-region/v1'

export interface RegionActivityEntry {
  activityType: ActivityFormType
  /** Source activity label — user-facing messaging only. */
  label: string
  /** Root node uid in the source model. Correlates connections to this activity. */
  rootNodeUid: string
  /** Root term id, used to match server-assigned uids back after a paste. */
  rootTermId: string | null
  /** Offset from the region's top-left corner, in graph units. */
  offset: { x: number; y: number }
  root: TermNode
}

export interface RegionConnectionEntry {
  predicate: Entity
  /** Node uids in the source model — NOT necessarily the activity roots. */
  sourceNodeUid: string
  targetNodeUid: string
  evidence: EvidenceForm[]
}

export interface RegionClipboardPayload {
  kind: typeof REGION_CLIPBOARD_KIND
  /** ISO timestamp, surfaced in the paste dialog so a stale paste is obvious. */
  copiedAt: string
  sourceModelId: string | null
  activities: RegionActivityEntry[]
  connections: RegionConnectionEntry[]
}

/**
 * Build a region payload from the current selection.
 *
 * `positions` comes from the canvas; offsets are stored relative to the
 * region's top-left so a paste can rebuild the relative layout wherever it
 * lands. Connections are kept only when BOTH endpoints belong to a selected
 * activity — a relation to something outside the region has nothing to attach to.
 */
export function buildRegionPayload(
  model: GraphModel,
  selectedUids: string[],
  positions: Record<string, { x: number; y: number }>
): RegionClipboardPayload | null {
  const selected = new Set(selectedUids)
  const activities = model.activities.filter(a => selected.has(a.uid))
  if (activities.length === 0) return null

  // Any node of a selected activity maps back to that activity, because a
  // relation's endpoint need not be the activity's root node.
  const nodeToActivity = new Map<string, string>()
  for (const activity of activities) {
    for (const node of activity.nodes) nodeToActivity.set(node.uid, activity.uid)
    nodeToActivity.set(activity.rootNode.uid, activity.uid)
  }

  const origin = regionOrigin(activities, positions)

  return {
    kind: REGION_CLIPBOARD_KIND,
    copiedAt: new Date().toISOString(),
    sourceModelId: model.id ?? null,
    activities: activities.map(activity => {
      const pos = positions[activity.uid]
      return {
        activityType: activityFormTypeOf(activity.type),
        label: activityClipboardLabel(activity),
        rootNodeUid: activity.rootNode.uid,
        rootTermId: activity.rootNode.id ?? null,
        offset: pos ? { x: pos.x - origin.x, y: pos.y - origin.y } : { x: 0, y: 0 },
        root: activityToFormTree(activity),
      }
    }),
    connections: (model.activityConnections ?? [])
      .filter(
        edge =>
          nodeToActivity.has(edge.sourceId) &&
          nodeToActivity.has(edge.targetId) &&
          nodeToActivity.get(edge.sourceId) !== nodeToActivity.get(edge.targetId)
      )
      .map(toConnectionEntry),
  }
}

/** Top-left of the region, so offsets are relative rather than absolute. */
function regionOrigin(
  activities: Activity[],
  positions: Record<string, { x: number; y: number }>
): { x: number; y: number } {
  const points = activities.map(a => positions[a.uid]).filter(Boolean)
  if (points.length === 0) return { x: 0, y: 0 }
  return {
    x: Math.min(...points.map(p => p.x)),
    y: Math.min(...points.map(p => p.y)),
  }
}

/**
 * `sourceId`/`targetId` are the real direction of the statement. `isReverseLink`
 * on the edge only flips how the canvas *draws* `has input`, so it is ignored
 * here — pasting must reproduce the statement, not the drawing.
 */
function toConnectionEntry(edge: Edge): RegionConnectionEntry {
  return {
    predicate: { id: edge.id, label: edge.label },
    sourceNodeUid: edge.sourceId,
    targetNodeUid: edge.targetId,
    evidence: (edge.evidence ?? []).map(ev => ({
      uid: ev.uid,
      evidenceCode: { id: ev.evidenceCode.id, label: ev.evidenceCode.label },
      reference: ev.reference || '',
      withFrom: ev.with || '',
    })),
  }
}

/** Returns null for anything that isn't one of our region payloads. */
export function parseRegion(text: string | null): RegionClipboardPayload | null {
  const trimmed = text?.trim()
  if (!trimmed || !trimmed.startsWith('{')) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return null
  }

  const payload = parsed as Partial<RegionClipboardPayload> | null
  if (!payload || payload.kind !== REGION_CLIPBOARD_KIND) return null
  if (!Array.isArray(payload.activities) || payload.activities.length === 0) return null
  if (!Array.isArray(payload.connections)) return null
  if (payload.activities.some(entry => !entry?.root || !Array.isArray(entry.root.relations))) {
    return null
  }

  return payload as RegionClipboardPayload
}

export function writeRegion(payload: RegionClipboardPayload): boolean {
  try {
    localStorage.setItem(REGION_CLIPBOARD_KEY, JSON.stringify(payload))
    return true
  } catch {
    // Private mode or a full quota — the copy just doesn't stick.
    return false
  }
}

export function readRegion(): RegionClipboardPayload | null {
  try {
    return parseRegion(localStorage.getItem(REGION_CLIPBOARD_KEY))
  } catch {
    return null
  }
}

export function clearRegion() {
  try {
    localStorage.removeItem(REGION_CLIPBOARD_KEY)
  } catch {
    // Nothing to do — a stale payload is harmless, the paste dialog dates it.
  }
}
