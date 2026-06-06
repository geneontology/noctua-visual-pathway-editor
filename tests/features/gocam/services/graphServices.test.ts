import { describe, it, expect } from 'vitest'
import { extractActivities } from '@/features/gocam/services/graphServices'
import { RootTypes } from '@/features/gocam/models/cam'
import type { Edge, GraphNode } from '@/features/gocam/models/cam'
import { Relations } from '@/@noctua.core/models/relations'
import { buildNode } from '@tests/fixtures/builders'
import { smallBaselineModel } from '@tests/fixtures/models'

// Minimal edge factory — extractActivities only reads id/sourceId/targetId/source/target.
const edge = (id: string, source: GraphNode, target: GraphNode): Edge => ({
  uid: `edge_${source.uid}_${id}_${target.uid}`,
  id,
  label: id,
  sourceId: source.uid,
  targetId: target.uid,
  source,
  target,
  contributors: [],
  groups: [],
  evidence: [],
})

describe('extractActivities — protein-containing complex `has part`', () => {
  // A complex (GO:0032991) is a GO descendant of cellular component (GO:0005575),
  // so Minerva tags it with BOTH root types. This regression test pins that the
  // complex resolves to the complex shape — which allows `has part` — rather than
  // to CC, which would filter the gene-product parts out of the activity.
  const mf = buildNode('GO:0003674', 'molecular_function', [RootTypes.MOLECULAR_FUNCTION])
  const complex = buildNode('GO:0017071', 'complex', [
    RootTypes.CELLULAR_COMPONENT,
    RootTypes.PROTEIN_CONTAINING_COMPLEX,
  ])
  const gp1 = buildNode('UniProtKB:Q16281', 'GP1', [
    RootTypes.MOLECULAR_ENTITY,
    RootTypes.CHEMICAL_ENTITY,
  ])
  const gp2 = buildNode('UniProtKB:Q9NQW8', 'GP2', [
    RootTypes.MOLECULAR_ENTITY,
    RootTypes.CHEMICAL_ENTITY,
  ])

  const nodes = [mf, complex, gp1, gp2]
  const edges = [
    edge(Relations.ENABLED_BY, mf, complex),
    edge(Relations.HAS_PART, complex, gp1),
    edge(Relations.HAS_PART, complex, gp2),
  ]

  it('collects the gene-product parts into the activity', () => {
    const [activity] = extractActivities(nodes, edges)

    expect(activity).toBeTruthy()
    expect(activity.enabledBy?.uid).toBe(complex.uid)

    const partUids = activity.nodes.map(n => n.uid)
    expect(partUids).toContain(gp1.uid)
    expect(partUids).toContain(gp2.uid)
  })

  it('keeps both `has part` edges in the activity', () => {
    const [activity] = extractActivities(nodes, edges)
    const hasPartEdges = activity.edges.filter(e => e.id === Relations.HAS_PART)

    expect(hasPartEdges).toHaveLength(2)
    expect(hasPartEdges.every(e => e.sourceId === complex.uid)).toBe(true)
    expect(hasPartEdges.map(e => e.targetId).sort()).toEqual([gp1.uid, gp2.uid].sort())
  })
})

describe('smallBaseline fixture — complex `has part` survives transform', () => {
  // smallBaseline: MF enabled_by complex (GO:0017071) has_part two gene products.
  const complexActivity = smallBaselineModel.activities.find(a =>
    a.enabledBy?.rootTypes.includes(RootTypes.PROTEIN_CONTAINING_COMPLEX)
  )

  it('produces an activity enabled by a protein-containing complex', () => {
    expect(complexActivity).toBeTruthy()
    // The complex carries both CC and complex root types in the source data.
    expect(complexActivity!.enabledBy!.rootTypes).toEqual(
      expect.arrayContaining([RootTypes.CELLULAR_COMPONENT, RootTypes.PROTEIN_CONTAINING_COMPLEX])
    )
  })

  it('includes the `has part` edges and their gene-product part nodes', () => {
    const hasPartEdges = complexActivity!.edges.filter(e => e.id === Relations.HAS_PART)
    expect(hasPartEdges.length).toBeGreaterThanOrEqual(2)

    const nodeUids = new Set(complexActivity!.nodes.map(n => n.uid))
    for (const e of hasPartEdges) {
      expect(e.sourceId).toBe(complexActivity!.enabledBy!.uid)
      expect(nodeUids.has(e.targetId)).toBe(true)
      expect(e.target.rootTypes).toContain(RootTypes.MOLECULAR_ENTITY)
    }
  })
})
