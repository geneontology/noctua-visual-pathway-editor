import { describe, it, expect } from 'vitest'
import {
  sortRelationsByWeight,
  flattenNode,
  buildGroupedRows,
  rebaseTreeLevels,
  findTargetUidByRelation,
  getAspectBorderClass,
} from '@/features/gocam/services/formUtils'
import type {
  FlatRow,
  GroupedRow,
  RelationNode,
  TermNode,
} from '@/features/gocam/models/formModels'
import { Aspect, RootTypes } from '@/features/gocam/models/cam'
import { Relations } from '@/@noctua.core/models/relations'
import { DisplayGroup } from '@/features/gocam/data/insertMenuConfig'

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
