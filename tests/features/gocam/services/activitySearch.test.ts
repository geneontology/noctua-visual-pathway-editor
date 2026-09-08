import { describe, it, expect } from 'vitest'
import { searchActivities } from '@/features/gocam/services/activitySearch'
import type { Activity, Edge, GraphNode } from '@/features/gocam/models/cam'
import { ActivityType, RootTypes } from '@/features/gocam/models/cam'
import { buildActivity, buildNode } from '@tests/fixtures/builders'

// ── Fixtures ────────────────────────────────────────────────────────

const node = (uid: string, id: string, label: string, rootTypes: string[] = []): GraphNode => ({
  ...buildNode(id, label, rootTypes),
  uid,
})

const evidenceEdge = (uid: string, reference: string, withFrom = ''): Edge => ({
  uid: `edge-${uid}`,
  id: 'RO:0002333',
  label: 'enabled by',
  sourceId: 'src',
  targetId: 'tgt',
  source: node('src', 'GO:1', 'src'),
  target: node('tgt', 'GO:2', 'tgt'),
  contributors: [],
  groups: [],
  comments: [],
  evidence: [
    {
      uid: `ev-${uid}`,
      evidenceCode: { id: 'ECO:0000314', label: 'direct assay evidence' },
      reference,
      referenceUrl: '',
      with: withFrom,
      groups: [],
      contributors: [],
    },
  ],
})

/** An activity: GP label, an MF node, a BP node, one evidenced edge. */
const activity = (
  uid: string,
  gp: string,
  { bp, reference }: { bp?: string; reference?: string } = {}
): Activity => {
  const gpNode = node(`${uid}-gp`, `UniProtKB:${uid}`, gp, [RootTypes.MOLECULAR_ENTITY])
  const nodes = [
    gpNode,
    node(`${uid}-mf`, 'GO:0016301', 'kinase activity', [RootTypes.MOLECULAR_FUNCTION]),
  ]
  if (bp) nodes.push(node(`${uid}-bp`, 'GO:0000278', bp, [RootTypes.BIOLOGICAL_PROCESS]))

  return {
    ...buildActivity(uid, nodes, reference ? [evidenceEdge(uid, reference)] : []),
    type: ActivityType.ACTIVITY,
    rootNode: nodes[1],
    enabledBy: gpNode,
  }
}

// ── Tests ───────────────────────────────────────────────────────────

describe('searchActivities', () => {
  it('returns nothing for an empty query', () => {
    expect(searchActivities([activity('a', 'CDK2')], '  ')).toEqual([])
  })

  it('matches the gene product with no field annotation — the name IS the row', () => {
    const hits = searchActivities([activity('a', 'CDK2 Hsap')], 'cdk2')

    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatchObject({ uid: 'a', primary: 'CDK2 Hsap', matchField: null })
  })

  it('matches a BP term and says which aspect matched', () => {
    const hits = searchActivities(
      [activity('a', 'CDK2', { bp: 'mitotic cell cycle' }), activity('b', 'GRB2')],
      'mitotic'
    )

    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatchObject({
      uid: 'a',
      matchField: 'BP',
      matchText: 'mitotic cell cycle',
    })
  })

  it('matches a PMID reference', () => {
    const hits = searchActivities(
      [activity('a', 'CDK2', { reference: 'PMID:12345' }), activity('b', 'GRB2')],
      '12345'
    )

    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatchObject({ uid: 'a', matchField: 'reference', matchText: 'PMID:12345' })
  })

  it('matches a term id', () => {
    const hits = searchActivities([activity('a', 'CDK2')], 'GO:0016301')

    expect(hits).toHaveLength(1)
    expect(hits[0].matchField).toBe('MF')
  })

  it('matches an evidence code label', () => {
    const hits = searchActivities([activity('a', 'CDK2', { reference: 'PMID:1' })], 'direct assay')

    expect(hits[0]).toMatchObject({ matchField: 'evidence' })
  })

  it('returns every activity sharing the same gene product', () => {
    const hits = searchActivities(
      [activity('a1', 'CDK2 Hsap'), activity('a2', 'CDK2 Hsap'), activity('b', 'GRB2')],
      'cdk2'
    )

    expect(hits.map(hit => hit.uid)).toEqual(['a1', 'a2'])
  })

  it('reports one hit per activity even when several fields match', () => {
    const hits = searchActivities(
      [activity('a', 'kinase protein', { bp: 'kinase signalling' })],
      'kinase'
    )

    expect(hits).toHaveLength(1)
  })
})
