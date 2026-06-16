import { describe, it, expect } from 'vitest'
import type { GraphModel } from '@/features/gocam/models/cam'
import {
  smallBaselineModel,
  diverseRelationsModel,
  largeScaleModel,
  indirectRegulationModel,
  directRegulationHeavyModel,
  chemicalPathwayModel,
  emptyModelModel,
  reviewStateModel,
} from '@tests/fixtures/models'

const collectRelationIds = (m: GraphModel): Set<string> => {
  const ids = new Set<string>()
  for (const e of m.edges) ids.add(e.id)
  return ids
}

const countEdgesWithEvidence = (m: GraphModel): number =>
  m.edges.reduce((n, e) => n + (e.evidence && e.evidence.length > 0 ? 1 : 0), 0)

interface FixtureCase {
  name: string
  model: GraphModel
  expectedRelations: string[]
}

const cases: FixtureCase[] = [
  {
    name: 'smallBaseline',
    model: smallBaselineModel,
    expectedRelations: [
      'BFO:0000050', 'BFO:0000051', 'BFO:0000066', 'RO:0001025',
      'RO:0002233', 'RO:0002234', 'RO:0002333', 'RO:0002629',
      'RO:0002630', 'RO:0012005',
    ],
  },
  {
    name: 'diverseRelations',
    model: diverseRelationsModel,
    expectedRelations: [
      'BFO:0000050', 'BFO:0000051', 'BFO:0000066', 'RO:0001025',
      'RO:0002233', 'RO:0002234', 'RO:0002304', 'RO:0002333',
      'RO:0002407', 'RO:0002409', 'RO:0002629', 'RO:0002630',
      'RO:0012005', 'RO:0012006',
    ],
  },
  {
    name: 'largeScale',
    model: largeScaleModel,
    expectedRelations: [
      'BFO:0000050', 'BFO:0000051', 'BFO:0000066', 'RO:0002333',
      'RO:0002409', 'RO:0002413', 'RO:0002629', 'RO:0002630',
      'RO:0012009',
    ],
  },
  {
    name: 'indirectRegulation',
    model: indirectRegulationModel,
    expectedRelations: [
      'BFO:0000050', 'BFO:0000066', 'RO:0001025', 'RO:0002233',
      'RO:0002234', 'RO:0002333', 'RO:0002407', 'RO:0012005',
    ],
  },
  {
    name: 'directRegulationHeavy',
    model: directRegulationHeavyModel,
    expectedRelations: [
      'BFO:0000050', 'BFO:0000066', 'RO:0002233', 'RO:0002234',
      'RO:0002333', 'RO:0002413', 'RO:0002629', 'RO:0002630',
    ],
  },
  {
    name: 'chemicalPathway',
    model: chemicalPathwayModel,
    expectedRelations: [
      'BFO:0000050', 'BFO:0000066', 'RO:0002233', 'RO:0002234',
      'RO:0002333', 'RO:0012005',
    ],
  },
]

describe.each(cases)('fixture: $name', ({ model, expectedRelations }) => {
  it('has a non-empty id and at least one activity', () => {
    expect(model.id).toBeTruthy()
    expect(model.activities.length).toBeGreaterThan(0)
  })

  it('every activity has a non-null rootNode with uid and id', () => {
    // Note: `label` may be undefined when the Barista response omits it
    // (observed in largeScale for GO:0140378). UI must handle this.
    for (const a of model.activities) {
      expect(a.rootNode).toBeTruthy()
      expect(a.rootNode.uid).toBeTruthy()
      expect(a.rootNode.id).toBeTruthy()
    }
  })

  it('every edge resolves source and target to real nodes', () => {
    for (const e of model.edges) {
      expect(e.source).toBeTruthy()
      expect(e.target).toBeTruthy()
      expect(e.source.uid).toBe(e.sourceId)
      expect(e.target.uid).toBe(e.targetId)
    }
  })

  it('at least one edge carries evidence', () => {
    expect(countEdgesWithEvidence(model)).toBeGreaterThan(0)
  })

  it('all documented relation CURIEs survive the transform', () => {
    const present = collectRelationIds(model)
    for (const rel of expectedRelations) {
      expect(present.has(rel)).toBe(true)
    }
  })

  it('parses model-level state and id', () => {
    expect(model.state).toBeTruthy()
    expect(model.id).toMatch(/^gomodel:/)
  })
})

// Specific anchors — values from the raw JSON, would catch transform regressions.

describe('smallBaseline specific metadata', () => {
  it('parses the title and taxon from top-level annotations', () => {
    expect(smallBaselineModel.title).toContain('OPN1MW3')
    expect(smallBaselineModel.taxon).toBe('NCBITaxon:9606')
  })

  it('parses model-level contributors', () => {
    expect(smallBaselineModel.contributors.length).toBeGreaterThan(0)
  })
})

describe('relative model sizes', () => {
  it('largeScale has more activities than smallBaseline and diverseRelations', () => {
    expect(largeScaleModel.activities.length).toBeGreaterThan(smallBaselineModel.activities.length)
    expect(largeScaleModel.activities.length).toBeGreaterThan(diverseRelationsModel.activities.length)
  })
})

// Edge-case fixtures — separate assertions because the standard "has at least one
// activity / one evidence-bearing edge" checks don't apply.

describe('emptyModel — brand-new empty model', () => {
  it('has a valid gomodel: id', () => {
    expect(emptyModelModel.id).toMatch(/^gomodel:/)
  })

  it('has no activities, no edges, no nodes', () => {
    expect(emptyModelModel.activities).toHaveLength(0)
    expect(emptyModelModel.edges).toHaveLength(0)
    expect(emptyModelModel.nodes).toHaveLength(0)
  })

  it('carries the development state and the modified flag', () => {
    expect(emptyModelModel.state).toBe('development')
    expect(emptyModelModel.modified).toBe(true)
  })
})

describe('reviewState — single-individual model in review state', () => {
  it('has a valid gomodel: id', () => {
    expect(reviewStateModel.id).toMatch(/^gomodel:/)
  })

  it('carries the review state', () => {
    expect(reviewStateModel.state).toBe('review')
  })

  it('has no edges (no facts in source)', () => {
    expect(reviewStateModel.edges).toHaveLength(0)
  })

  it('produces a single activity from the lone individual', () => {
    expect(reviewStateModel.activities).toHaveLength(1)
  })

  it('that single activity has no edges', () => {
    expect(reviewStateModel.activities[0].edges).toHaveLength(0)
  })
})

describe('cross-fixture state coverage', () => {
  it('production / development / review states are all represented', () => {
    expect(smallBaselineModel.state).toBe('production')
    expect(emptyModelModel.state).toBe('development')
    expect(reviewStateModel.state).toBe('review')
  })
})
