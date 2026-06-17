import type { TermNode, RelationNode, FlatRow, GroupedRow } from '../models/formModels'
import type { Activity, Edge } from '../models/cam'
import { Aspect } from '../models/cam'
import { getInsertWeight, getDisplayGroup, GROUP_ORDER, DisplayGroup } from '../data/insertMenuConfig'
import { getPrimaryRootType } from '../data/nodeCategories'

/**
 * Sort a parent's relations by the weight configured in canInsertEntity.
 * Mirrors the old graph editor's `sort(compareTripleWeight)` before tree-build.
 */
export function sortRelationsByWeight(
  parentCategory: string,
  relations: RelationNode[]
): RelationNode[] {
  return [...relations].sort(
    (a, b) =>
      getInsertWeight(parentCategory, a.predicate.id, a.target.category) -
      getInsertWeight(parentCategory, b.predicate.id, b.target.category)
  )
}

export interface OrderedEdgeRow {
  edge: Edge
  /** Em-dash prefix ("—", "——"…) denoting tree depth, prepended to the relation label */
  depthPrefix: string
}

export interface OrderedActivityEdges {
  /** GP-group rows (gene product, "GP part_of complex") — render ABOVE the MF */
  gpEdges: OrderedEdgeRow[]
  /** Everything else (part_of BP, occurs_in CC, has_input…) — render BELOW the MF */
  fdEdges: OrderedEdgeRow[]
}

/**
 * Order an activity's edges for flat display (the graph node boxes) the same way
 * the ActivityForm / ActivityTable order their rows: grouped by displayGroup
 * (GROUP_ORDER), then by tree depth, then by the weight configured in
 * canInsertEntity. Edges are also split into the GP card (gene product and its
 * "part_of complex" rows) and the function-description rows, since the GP card
 * renders above the molecular function. Without this the graph renders edges in
 * raw server order, so e.g. a "GP part_of complex" edge sinks to the bottom.
 */
export function orderActivityEdgesForDisplay(activity: Activity): OrderedActivityEdges {
  const edges = activity.edges ?? []

  // Depth of each node from the root (root = 1), following sourceId → target.
  const childEdges = new Map<string, Edge[]>()
  for (const e of edges) {
    const list = childEdges.get(e.sourceId) ?? []
    list.push(e)
    childEdges.set(e.sourceId, list)
  }
  const depth = new Map<string, number>()
  const rootUid = activity.rootNode?.uid
  if (rootUid) {
    const stack: Array<[string, number]> = [[rootUid, 1]]
    const seen = new Set<string>()
    while (stack.length) {
      const [uid, d] = stack.pop()!
      if (seen.has(uid)) continue
      seen.add(uid)
      depth.set(uid, d)
      for (const e of childEdges.get(uid) ?? []) {
        if (!seen.has(e.targetId)) stack.push([e.targetId, d + 1])
      }
    }
  }

  // Incoming edge per node (tree: one parent each) so a nested edge can inherit
  // its parent's section.
  const incomingEdge = new Map<string, Edge>()
  for (const e of edges) incomingEdge.set(e.targetId, e)

  // Only top-level edges (off the activity root) anchor a section; nested edges
  // inherit their parent's group so a subtree stays in one section — e.g. a
  // `has input` GP's `part of (complex)` must not jump into the GP card above the MF.
  const groupCache = new Map<string, DisplayGroup>()
  const groupOf = (e: Edge, seen: Set<string> = new Set()): DisplayGroup => {
    const cached = groupCache.get(e.targetId)
    if (cached) return cached
    if (seen.has(e.targetId)) return DisplayGroup.MF // cycle guard
    seen.add(e.targetId)

    let group: DisplayGroup
    if (e.sourceId === rootUid) {
      const sourceCat = getPrimaryRootType(e.source?.rootTypes ?? []) ?? ''
      const targetCat = getPrimaryRootType(e.target?.rootTypes ?? []) ?? ''
      group = getDisplayGroup(sourceCat, e.id, targetCat) ?? DisplayGroup.MF
    } else {
      const parentEdge = incomingEdge.get(e.sourceId)
      group = parentEdge ? groupOf(parentEdge, seen) : DisplayGroup.MF
    }
    groupCache.set(e.targetId, group)
    return group
  }

  const keyFor = (e: Edge) => {
    const sourceCat = getPrimaryRootType(e.source?.rootTypes ?? []) ?? ''
    const targetCat = getPrimaryRootType(e.target?.rootTypes ?? []) ?? ''
    return {
      group: GROUP_ORDER[groupOf(e)] ?? 99,
      level: depth.get(e.targetId) ?? Number.POSITIVE_INFINITY,
      weight: getInsertWeight(sourceCat, e.id, targetCat),
    }
  }

  const sorted = [...edges].sort((a, b) => {
    const ka = keyFor(a)
    const kb = keyFor(b)
    return ka.group - kb.group || ka.level - kb.level || ka.weight - kb.weight
  })

  // Em-dash prefix denotes depth, mirroring the old graph (pad('—', treeLevel - 2)).
  // The GP card is anchored at the gene product (depth 2) and the FD card at the
  // MF (depth 1), so each section's direct children get one dash, grandchildren two.
  const prefix = (e: Edge, sectionRootDepth: number) => {
    const level = depth.get(e.targetId) ?? sectionRootDepth + 1
    return '—'.repeat(Math.max(0, level - sectionRootDepth))
  }

  return {
    gpEdges: sorted
      .filter(e => groupOf(e) === DisplayGroup.GP)
      .map(edge => ({ edge, depthPrefix: prefix(edge, 2) })),
    fdEdges: sorted
      .filter(e => groupOf(e) !== DisplayGroup.GP)
      .map(edge => ({ edge, depthPrefix: prefix(edge, 1) })),
  }
}

/** Recursively flatten a TermNode tree into renderable rows, sorted by weight */
export function flattenNode(
  node: TermNode,
  relation: RelationNode | null,
  parentTermUid: string | null,
  treeLevel: number,
  rows: FlatRow[]
): void {
  rows.push({ termNode: node, relation, parentTermUid, treeLevel })
  const sorted = sortRelationsByWeight(node.category, node.relations)
  for (const rel of sorted) {
    flattenNode(rel.target, rel, node.uid, treeLevel + 1, rows)
  }
}

/**
 * Walk the whole TermNode tree producing one GroupedRow per visible node,
 * tagged with its displayGroup, weight, and tree depth (treeLevel: root=1).
 */
export function buildGroupedRows(root: TermNode): GroupedRow[] {
  const rows: GroupedRow[] = []

  function walk(
    node: TermNode,
    parent: TermNode | null,
    relation: RelationNode | null,
    treeLevel: number,
    parentGroup: DisplayGroup | null
  ) {
    // Only the root and its direct relations anchor a section (enabled_by → GP,
    // has_input → MF_INPUT, …). Nested nodes inherit their parent's group so a
    // subtree never splits across sections — otherwise a `has input` GP's
    // `part of (complex)` would re-derive to GP and jump into the Gene Product card.
    const dg =
      parent && parent !== root
        ? (parentGroup ?? DisplayGroup.MF)
        : (getDisplayGroup(parent?.category ?? null, relation?.predicate.id ?? null, node.category) ??
          DisplayGroup.MF)

    if (node.visible !== false) {
      const weight =
        parent && relation
          ? getInsertWeight(parent.category, relation.predicate.id, node.category)
          : 0
      rows.push({
        termNode: node,
        relation,
        parentTermUid: parent?.uid ?? null,
        treeLevel,
        displayGroup: dg,
        weight,
      })
    }
    const sortedChildren = sortRelationsByWeight(node.category, node.relations)
    for (const rel of sortedChildren) {
      walk(rel.target, node, rel, treeLevel + 1, dg)
    }
  }

  walk(root, null, null, 1, null)
  return rows
}

/** Rebase a group's rows so the shallowest is treeLevel 1 (cards reset depth) */
export function rebaseTreeLevels(rows: GroupedRow[]): GroupedRow[] {
  if (rows.length === 0) return rows
  const minLevel = Math.min(...rows.map(r => r.treeLevel))
  return rows.map(r => ({ ...r, treeLevel: r.treeLevel - minLevel + 1 }))
}

/** Find the target TermNode uid for a given relation uid */
export function findTargetUidByRelation(root: TermNode, relationUid: string): string | null {
  for (const rel of root.relations) {
    if (rel.uid === relationUid) return rel.target.uid
    const found = findTargetUidByRelation(rel.target, relationUid)
    if (found) return found
  }
  return null
}

/** Map activity type to left-border Tailwind class */
export function getAspectBorderClass(node: TermNode): string {
  switch (node.aspect) {
    case Aspect.MOLECULAR_FUNCTION:
      return 'border-l-4 border-l-green-400'
    case Aspect.BIOLOGICAL_PROCESS:
      return 'border-l-4 border-l-orange-300'
    case Aspect.CELLULAR_COMPONENT:
      return 'border-l-4 border-l-purple-300'
    default:
      return ''
  }
}
