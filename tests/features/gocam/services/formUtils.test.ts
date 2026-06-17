import { describe, it, expect } from 'vitest'
import {
  sortRelationsByWeight,
  flattenNode,
  buildGroupedRows,
  rebaseTreeLevels,
  findTargetUidByRelation,
  getAspectBorderClass,
  orderActivityEdgesForDisplay,
} from '@/features/gocam/services/formUtils'
import type {
  FlatRow,
  GroupedRow,
  RelationNode,
  TermNode,
} from '@/features/gocam/models/formModels'
import { Aspect, RootTypes } from '@/features/gocam/models/cam'
import type { Edge, GraphNode } from '@/features/gocam/models/cam'
import { Relations } from '@/@noctua.core/models/relations'
import { DisplayGroup } from '@/features/gocam/data/insertMenuConfig'
import { buildActivity, buildNode } from '@tests/fixtures/builders'

// ── Helpers ─────────────────────────────────────────────────────────

const makeNode = (overrides: Partial<TermNode> = {}): TermNode => ({
  uid: 'n',
  category: RootTypes.MOLECULAR_FUNCTION,
  label: 'molecular function',
  term: null,
  aspect: null,
  rootTypes: [],
  isComplement: false,
  canDelete: false,
  required: false,
  relations: [],
  ...overrides,
})

const makeRelation = (
  predicateId: string,
  target: TermNode,
  uid = `rel-${predicateId}-${target.uid}`
): RelationNode => ({
  uid,
  predicate: { id: predicateId, label: predicateId },
  target,
  evidence: [],
})

// ── sortRelationsByWeight ───────────────────────────────────────────

describe('sortRelationsByWeight', () => {
  it('sorts MF children by configured insert weight (PART_OF=10, OCCURS_IN=20)', () => {
    const bp = makeNode({ uid: 'bp', category: RootTypes.BIOLOGICAL_PROCESS })
    const cc = makeNode({ uid: 'cc', category: RootTypes.CELLULAR_COMPONENT })
    const partOf = makeRelation(Relations.PART_OF, bp, 'rel-part')
    const occursIn = makeRelation(Relations.OCCURS_IN, cc, 'rel-occurs')

    // Pre-sorted opposite of expected output
    const sorted = sortRelationsByWeight(RootTypes.MOLECULAR_FUNCTION, [occursIn, partOf])
    expect(sorted.map(r => r.uid)).toEqual(['rel-part', 'rel-occurs'])
  })

  it('is stable for relations with the same weight', () => {
    const gp1 = makeNode({ uid: 'gp1', category: RootTypes.MOLECULAR_ENTITY })
    const gp2 = makeNode({ uid: 'gp2', category: RootTypes.MOLECULAR_ENTITY })
    const a = makeRelation(Relations.ENABLED_BY, gp1, 'a')
    const b = makeRelation(Relations.ENABLED_BY, gp2, 'b')
    expect(sortRelationsByWeight(RootTypes.MOLECULAR_FUNCTION, [a, b]).map(r => r.uid)).toEqual([
      'a',
      'b',
    ])
    expect(sortRelationsByWeight(RootTypes.MOLECULAR_FUNCTION, [b, a]).map(r => r.uid)).toEqual([
      'b',
      'a',
    ])
  })

  it('unknown (predicate, target) pairs sort to the bottom (weight = Infinity)', () => {
    const known = makeNode({ uid: 'bp', category: RootTypes.BIOLOGICAL_PROCESS })
    const mystery = makeNode({ uid: 'm', category: 'GO:9999999' })
    const knownRel = makeRelation(Relations.PART_OF, known, 'known')
    const unknownRel = makeRelation('RO:9999999', mystery, 'unknown')
    expect(
      sortRelationsByWeight(RootTypes.MOLECULAR_FUNCTION, [unknownRel, knownRel]).map(r => r.uid)
    ).toEqual(['known', 'unknown'])
  })

  it('returns a new array — input is not mutated', () => {
    const bp = makeNode({ uid: 'bp', category: RootTypes.BIOLOGICAL_PROCESS })
    const cc = makeNode({ uid: 'cc', category: RootTypes.CELLULAR_COMPONENT })
    const input = [
      makeRelation(Relations.OCCURS_IN, cc, 'occurs'),
      makeRelation(Relations.PART_OF, bp, 'part'),
    ]
    const snapshot = input.map(r => r.uid)
    const sorted = sortRelationsByWeight(RootTypes.MOLECULAR_FUNCTION, input)
    expect(input.map(r => r.uid)).toEqual(snapshot)
    expect(sorted).not.toBe(input)
  })
})

// ── flattenNode ─────────────────────────────────────────────────────

describe('flattenNode', () => {
  it('emits one row per node, depth-first, sorted by weight', () => {
    const gp = makeNode({ uid: 'gp', category: RootTypes.MOLECULAR_ENTITY })
    const bp = makeNode({ uid: 'bp', category: RootTypes.BIOLOGICAL_PROCESS })
    const cc = makeNode({ uid: 'cc', category: RootTypes.CELLULAR_COMPONENT })
    const root = makeNode({
      uid: 'mf',
      category: RootTypes.MOLECULAR_FUNCTION,
      relations: [
        makeRelation(Relations.OCCURS_IN, cc, 'r-occurs'), // weight 20
        makeRelation(Relations.PART_OF, bp, 'r-part'), // weight 10
        makeRelation(Relations.ENABLED_BY, gp, 'r-eb'), // weight 2
      ],
    })

    const rows: FlatRow[] = []
    flattenNode(root, null, null, 1, rows)

    expect(rows.map(r => r.termNode.uid)).toEqual(['mf', 'gp', 'bp', 'cc'])
    expect(rows[0]).toMatchObject({ relation: null, parentTermUid: null, treeLevel: 1 })
    // Children get parentTermUid = root and treeLevel = 2
    for (const child of rows.slice(1)) {
      expect(child.parentTermUid).toBe('mf')
      expect(child.treeLevel).toBe(2)
    }
  })

  it('threads relation onto each child row', () => {
    const gp = makeNode({ uid: 'gp', category: RootTypes.MOLECULAR_ENTITY })
    const eb = makeRelation(Relations.ENABLED_BY, gp, 'r-eb')
    const root = makeNode({ uid: 'mf', relations: [eb] })

    const rows: FlatRow[] = []
    flattenNode(root, null, null, 1, rows)

    expect(rows[1].relation).toBe(eb)
  })
})

// ── buildGroupedRows ────────────────────────────────────────────────

describe('buildGroupedRows', () => {
  it('produces one row per visible node, tagged with displayGroup + weight', () => {
    const gp = makeNode({ uid: 'gp', category: RootTypes.MOLECULAR_ENTITY })
    const bp = makeNode({ uid: 'bp', category: RootTypes.BIOLOGICAL_PROCESS })
    const root = makeNode({
      uid: 'mf',
      category: RootTypes.MOLECULAR_FUNCTION,
      relations: [
        makeRelation(Relations.PART_OF, bp, 'r-part'),
        makeRelation(Relations.ENABLED_BY, gp, 'r-eb'),
      ],
    })

    const rows = buildGroupedRows(root)
    const byUid = new Map(rows.map(r => [r.termNode.uid, r]))

    expect(byUid.get('mf')).toMatchObject({ treeLevel: 1, weight: 0, displayGroup: DisplayGroup.MF })
    expect(byUid.get('gp')).toMatchObject({ treeLevel: 2, displayGroup: DisplayGroup.GP })
    expect(byUid.get('bp')).toMatchObject({ treeLevel: 2, displayGroup: DisplayGroup.BP, weight: 10 })
  })

  it('omits invisible nodes but still descends into their relations', () => {
    const visibleChild = makeNode({ uid: 'gp', category: RootTypes.MOLECULAR_ENTITY })
    const hiddenParent = makeNode({
      uid: 'hidden',
      category: RootTypes.MOLECULAR_FUNCTION,
      visible: false,
      relations: [makeRelation(Relations.ENABLED_BY, visibleChild)],
    })

    const rows = buildGroupedRows(hiddenParent)
    expect(rows.map(r => r.termNode.uid)).toEqual(['gp'])
  })

  it('treeLevel starts at 1 for the root', () => {
    const rows = buildGroupedRows(makeNode({ uid: 'r' }))
    expect(rows[0].treeLevel).toBe(1)
  })
})

// ── rebaseTreeLevels ────────────────────────────────────────────────

describe('rebaseTreeLevels', () => {
  it('shifts the shallowest row to level 1, preserving relative depth', () => {
    const rows: GroupedRow[] = [
      { termNode: makeNode({ uid: 'a' }), relation: null, parentTermUid: null, treeLevel: 3, displayGroup: DisplayGroup.MF, weight: 0 },
      { termNode: makeNode({ uid: 'b' }), relation: null, parentTermUid: 'a', treeLevel: 5, displayGroup: DisplayGroup.GP, weight: 2 },
    ]
    const out = rebaseTreeLevels(rows)
    expect(out.map(r => r.treeLevel)).toEqual([1, 3])
  })

  it('returns the input untouched for an empty list', () => {
    const empty: GroupedRow[] = []
    expect(rebaseTreeLevels(empty)).toBe(empty)
  })
})

// ── findTargetUidByRelation ─────────────────────────────────────────

describe('findTargetUidByRelation', () => {
  it('finds a direct child relation', () => {
    const child = makeNode({ uid: 'c' })
    const root = makeNode({ uid: 'r', relations: [makeRelation(Relations.ENABLED_BY, child, 'rel')] })
    expect(findTargetUidByRelation(root, 'rel')).toBe('c')
  })

  it('finds a deeply nested relation', () => {
    const leaf = makeNode({ uid: 'leaf' })
    const mid = makeNode({ uid: 'mid', relations: [makeRelation(Relations.PART_OF, leaf, 'rel-deep')] })
    const root = makeNode({ uid: 'r', relations: [makeRelation(Relations.ENABLED_BY, mid, 'rel-mid')] })
    expect(findTargetUidByRelation(root, 'rel-deep')).toBe('leaf')
  })

  it('returns null if no relation matches', () => {
    const child = makeNode({ uid: 'c' })
    const root = makeNode({ uid: 'r', relations: [makeRelation(Relations.ENABLED_BY, child, 'rel')] })
    expect(findTargetUidByRelation(root, 'missing')).toBeNull()
  })
})

// ── getAspectBorderClass ────────────────────────────────────────────

describe('getAspectBorderClass', () => {
  it('returns the green class for MF aspect', () => {
    expect(getAspectBorderClass(makeNode({ aspect: Aspect.MOLECULAR_FUNCTION }))).toBe(
      'border-l-4 border-l-green-400'
    )
  })

  it('returns the orange class for BP aspect', () => {
    expect(getAspectBorderClass(makeNode({ aspect: Aspect.BIOLOGICAL_PROCESS }))).toBe(
      'border-l-4 border-l-orange-300'
    )
  })

  it('returns the purple class for CC aspect', () => {
    expect(getAspectBorderClass(makeNode({ aspect: Aspect.CELLULAR_COMPONENT }))).toBe(
      'border-l-4 border-l-purple-300'
    )
  })

  it('returns an empty string for null aspect', () => {
    expect(getAspectBorderClass(makeNode({ aspect: null }))).toBe('')
  })
})

// ── orderActivityEdgesForDisplay ────────────────────────────────────

const edge = (predicateId: string, label: string, source: GraphNode, target: GraphNode): Edge => ({
  uid: `e_${source.uid}_${predicateId}_${target.uid}`,
  id: predicateId,
  label,
  sourceId: source.uid,
  targetId: target.uid,
  source,
  target,
  contributors: [],
  groups: [],
  evidence: [],
})

describe('orderActivityEdgesForDisplay', () => {
  const mf = buildNode('mf', 'molecular function', [RootTypes.MOLECULAR_FUNCTION])
  const gp = buildNode('gp', 'gene product', [RootTypes.MOLECULAR_ENTITY])
  const cx = buildNode('cx', 'lipid tube complex', [RootTypes.PROTEIN_CONTAINING_COMPLEX])
  const bp = buildNode('bp', 'biological process', [RootTypes.BIOLOGICAL_PROCESS])
  const cc = buildNode('cc', 'cellular component', [RootTypes.CELLULAR_COMPONENT])
  const inp = buildNode('inp', 'input', [RootTypes.MOLECULAR_ENTITY])

  // Raw edges deliberately scrambled — sorting must impose display order.
  const buildScrambled = () =>
    buildActivity('act', [mf, gp, cx, bp, cc, inp], [
      edge(Relations.HAS_INPUT, 'has input', mf, inp), // fd (MF_INPUT), weight 5, depth 2 — renders first, just below MF
      edge(Relations.PART_OF, 'part of', gp, cx), // gp, weight 3, depth 3
      edge(Relations.OCCURS_IN, 'occurs in', mf, cc), // fd, weight 20, depth 2
      edge(Relations.ENABLED_BY, 'enabled by', mf, gp), // gp, weight 2, depth 2
      edge(Relations.PART_OF, 'part of', mf, bp), // fd, weight 10, depth 2
    ])

  it('splits GP-card edges from function-description edges', () => {
    const { gpEdges, fdEdges } = orderActivityEdgesForDisplay(buildScrambled())
    expect(gpEdges.map(r => r.edge.target.uid)).toEqual([gp.uid, cx.uid])
    expect(fdEdges.map(r => r.edge.target.uid)).toEqual([inp.uid, bp.uid, cc.uid])
  })

  it('orders FD edges has_input first (just below MF), then part_of(10) → occurs_in(20)', () => {
    const { fdEdges } = orderActivityEdgesForDisplay(buildScrambled())
    expect(fdEdges.map(r => r.edge.id)).toEqual([
      Relations.HAS_INPUT,
      Relations.PART_OF,
      Relations.OCCURS_IN,
    ])
  })

  it('places "GP part_of complex" in the GP card, not at the bottom (the bug)', () => {
    const { gpEdges, fdEdges } = orderActivityEdgesForDisplay(buildScrambled())
    expect(gpEdges.some(r => r.edge.target.uid === cx.uid)).toBe(true)
    expect(fdEdges.some(r => r.edge.target.uid === cx.uid)).toBe(false)
  })

  it('prefixes one em-dash per level: section roots 0, direct children 1', () => {
    const { gpEdges, fdEdges } = orderActivityEdgesForDisplay(buildScrambled())
    // GP card anchored at the gene product (depth 2): enabled_by row 0 dashes,
    // GP part_of complex (depth 3) one dash.
    expect(gpEdges.map(r => r.depthPrefix)).toEqual(['', '—'])
    // FD card anchored at the MF (depth 1): all direct children one dash.
    expect(fdEdges.map(r => r.depthPrefix)).toEqual(['—', '—', '—'])
  })

  it('indents grandchildren with two dashes (CC part_of anatomy under occurs_in CC)', () => {
    const an = buildNode('an', 'anatomy', [RootTypes.ANATOMICAL_ENTITY])
    const activity = buildActivity('act', [mf, cc, an], [
      edge(Relations.PART_OF, 'part of', cc, an), // CC group, depth 3
      edge(Relations.OCCURS_IN, 'occurs in', mf, cc), // CC group, depth 2
    ])
    const { fdEdges } = orderActivityEdgesForDisplay(activity)
    expect(fdEdges.map(r => [r.edge.target.uid, r.depthPrefix])).toEqual([
      [cc.uid, '—'],
      [an.uid, '——'],
    ])
  })

  it('does not mutate the activity edges array', () => {
    const activity = buildScrambled()
    const before = activity.edges.map(e => e.uid)
    orderActivityEdgesForDisplay(activity)
    expect(activity.edges.map(e => e.uid)).toEqual(before)
  })

  it('returns empty cards for an activity with no edges', () => {
    const activity = buildActivity('act', [mf], [])
    expect(orderActivityEdgesForDisplay(activity)).toEqual({ gpEdges: [], fdEdges: [] })
  })
})
