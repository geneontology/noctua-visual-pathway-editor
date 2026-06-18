import { describe, it, expect } from 'vitest'
import { buildDisplayTree } from '@/features/gocam/components/ActivityTable'
import { RootTypes } from '@/features/gocam/models/cam'
import type { Edge, GraphNode } from '@/features/gocam/models/cam'
import { Relations } from '@/@noctua.core/models/relations'
import { buildActivity, buildNode } from '@tests/fixtures/builders'

// ── Helpers ─────────────────────────────────────────────────────────

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

// ── buildDisplayTree — sibling ordering ─────────────────────────────
//
// The table builds its rows from edges in raw server order; without sorting
// "occurs in" (weight 20) could render before "part of" (weight 10). The fix
// sorts siblings by canInsertEntity weight, matching the ActivityForm.

describe('buildDisplayTree — child ordering', () => {
  const mf = buildNode('mf', 'molecular function', [RootTypes.MOLECULAR_FUNCTION])
  const gp = buildNode('gp', 'gene product', [RootTypes.MOLECULAR_ENTITY])
  const bp = buildNode('bp', 'biological process', [RootTypes.BIOLOGICAL_PROCESS])
  const cc = buildNode('cc', 'cellular component', [RootTypes.CELLULAR_COMPONENT])
  const inp = buildNode('inp', 'input', [RootTypes.MOLECULAR_ENTITY])
  const phase = buildNode('phase', 'phase', [RootTypes.BIOLOGICAL_PHASE])

  // MF children deliberately in non-canonical server order — occurs_in (20)
  // before part_of (10), happens_during (40) before has_input (5).
  const buildScrambled = () =>
    buildActivity('act', [mf, gp, bp, cc, inp, phase], [
      edge(Relations.OCCURS_IN, 'occurs in', mf, cc), // weight 20
      edge(Relations.HAPPENS_DURING, 'happens during', mf, phase), // weight 40
      edge(Relations.PART_OF, 'part of', mf, bp), // weight 10
      edge(Relations.HAS_INPUT, 'has input', mf, inp), // weight 5
      edge(Relations.ENABLED_BY, 'enabled by', mf, gp), // weight 2 → GP tree
    ])

  it('orders MF children by insert weight: has_input(5) → part_of(10) → occurs_in(20) → happens_during(40)', () => {
    const { fdTree } = buildDisplayTree(buildScrambled())
    expect(fdTree[0].node.uid).toBe(mf.uid)
    expect(fdTree[0].children.map(c => c.edge?.id)).toEqual([
      Relations.HAS_INPUT,
      Relations.PART_OF,
      Relations.OCCURS_IN,
      Relations.HAPPENS_DURING,
    ])
  })

  it('places "part of" before "occurs in" even when the server returns occurs_in first (the bug)', () => {
    const { fdTree } = buildDisplayTree(buildScrambled())
    const ids = fdTree[0].children.map(c => c.edge?.id)
    expect(ids.indexOf(Relations.PART_OF)).toBeLessThan(ids.indexOf(Relations.OCCURS_IN))
  })

  it('splits the enabled_by gene product into the GP tree, not the FD children', () => {
    const { gpTree, fdTree } = buildDisplayTree(buildScrambled())
    expect(gpTree[0].node.uid).toBe(gp.uid)
    expect(fdTree[0].children.some(c => c.edge?.id === Relations.ENABLED_BY)).toBe(false)
  })

  it('is stable for equal-weight siblings — two has_input edges keep server order', () => {
    const inp1 = buildNode('inp1', 'ATP', [RootTypes.MOLECULAR_ENTITY])
    const inp2 = buildNode('inp2', 'GTP', [RootTypes.MOLECULAR_ENTITY])
    const activity = buildActivity('act', [mf, bp, inp1, inp2], [
      edge(Relations.HAS_INPUT, 'has input', mf, inp2), // server order: inp2 first
      edge(Relations.PART_OF, 'part of', mf, bp),
      edge(Relations.HAS_INPUT, 'has input', mf, inp1),
    ])

    const { fdTree } = buildDisplayTree(activity)
    // has_input(5) first (the two keep their original server order), then part_of(10).
    expect(fdTree[0].children.map(c => c.edge?.targetId)).toEqual([inp2.uid, inp1.uid, bp.uid])
  })

  it('does not mutate the activity edges array', () => {
    const activity = buildScrambled()
    const before = activity.edges.map(e => e.uid)
    buildDisplayTree(activity)
    expect(activity.edges.map(e => e.uid)).toEqual(before)
  })
})
