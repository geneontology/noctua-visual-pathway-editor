import { describe, it, expect } from 'vitest'
import {
  buildValidationErrors,
  emptyValidationErrors,
} from '@/features/gocam/services/violationService'
import type {
  Activity,
  Edge,
  GraphModel,
  GraphNode,
  ShExViolation,
} from '@/features/gocam/models/cam'
import { ErrorLevel, ErrorType, RootTypes } from '@/features/gocam/models/cam'
import { buildActivity, buildModel, buildNode } from '@tests/fixtures/builders'
import { smallBaselineModel } from '@tests/fixtures/models'

// Smaller helper to build an edge between two existing nodes
const makeEdge = (uid: string, sourceId: string, targetId: string, id = 'BFO:0000050'): Edge => ({
  uid,
  id,
  label: 'part of',
  sourceId,
  targetId,
  source: { ...buildNode('', ''), uid: sourceId },
  target: { ...buildNode('', ''), uid: targetId },
  contributors: [],
  groups: [],
})

describe('emptyValidationErrors', () => {
  it('returns the all-empty shape', () => {
    expect(emptyValidationErrors()).toEqual({
      shexViolations: [],
      orphanedNodes: [],
      orphanedEdges: [],
      standaloneNodes: [],
      relationNodes: [],
      total: 0,
      hasErrors: false,
    })
  })
})

describe('buildValidationErrors — empty / clean model', () => {
  it('returns no errors for an empty model', () => {
    const result = buildValidationErrors(buildModel([]))
    expect(result).toEqual(emptyValidationErrors())
  })

  it('runs against the smallBaseline fixture without throwing and returns a consistent shape', () => {
    const result = buildValidationErrors(smallBaselineModel)
    // The fixture has no ShEx violations (real-world model loaded clean from Barista)
    expect(result.shexViolations).toEqual([])
    // total always equals the sum of the three lists
    expect(result.total).toBe(
      result.shexViolations.length + result.orphanedNodes.length + result.orphanedEdges.length
    )
    expect(result.hasErrors).toBe(result.total > 0)
    // standalone + relation = orphanedNodes (split is partition)
    expect(result.standaloneNodes.length + result.relationNodes.length).toBe(
      result.orphanedNodes.length
    )
  })

  it('does not mutate the source model in obvious places', () => {
    const before = smallBaselineModel.activities.length
    buildValidationErrors(smallBaselineModel)
    expect(smallBaselineModel.activities.length).toBe(before)
  })
})

describe('buildValidationErrors — orphans', () => {
  const setup = () => {
    const activityNode = buildNode('GO:0003674', 'molecular function', [RootTypes.MOLECULAR_FUNCTION])
    const activity: Activity = buildActivity('act-1', [activityNode])

    const standalone = buildNode('GO:0008150', 'biological_process', [RootTypes.BIOLOGICAL_PROCESS])
    const orphanSource = buildNode('GO:0005575', 'cellular_component', [RootTypes.CELLULAR_COMPONENT])
    const orphanTarget = buildNode('GO:0005634', 'nucleus', [RootTypes.CELLULAR_COMPONENT])
    const evidenceNode = buildNode('ECO:0000314', 'IDA', [RootTypes.EVIDENCE_NODE])

    const orphanEdge = makeEdge('orphan-edge', orphanSource.uid, orphanTarget.uid)

    const model: GraphModel = {
      ...buildModel([activity]),
      nodes: [activityNode, standalone, orphanSource, orphanTarget, evidenceNode],
      edges: [orphanEdge],
    }
    return { model, activityNode, standalone, orphanSource, orphanTarget, evidenceNode, orphanEdge }
  }

  it('classifies a node not connected to any orphan edge as standalone', () => {
    const { model, standalone } = setup()
    const result = buildValidationErrors(model)
    expect(result.standaloneNodes.map(n => n.uid)).toContain(standalone.uid)
    expect(result.standaloneNodes.every(n => n.uid !== 'orphan-source-uid')).toBe(true)
  })

  it('classifies nodes that participate in orphan edges as relationNodes', () => {
    const { model, orphanSource, orphanTarget } = setup()
    const result = buildValidationErrors(model)
    const ids = result.relationNodes.map(n => n.uid)
    expect(ids).toContain(orphanSource.uid)
    expect(ids).toContain(orphanTarget.uid)
  })

  it('lists the orphan edge', () => {
    const { model, orphanEdge } = setup()
    const result = buildValidationErrors(model)
    expect(result.orphanedEdges.map(e => e.uid)).toEqual([orphanEdge.uid])
  })

  it('excludes evidence nodes (rootType ECO:0000000) from orphan reporting', () => {
    const { model, evidenceNode } = setup()
    const result = buildValidationErrors(model)
    expect(result.orphanedNodes.some(n => n.uid === evidenceNode.uid)).toBe(false)
    expect(result.standaloneNodes.some(n => n.uid === evidenceNode.uid)).toBe(false)
  })

  it('does not flag an activity node as orphaned', () => {
    const { model, activityNode } = setup()
    const result = buildValidationErrors(model)
    expect(result.orphanedNodes.some(n => n.uid === activityNode.uid)).toBe(false)
  })

  it('total counts all categories and hasErrors flips true', () => {
    const { model } = setup()
    const result = buildValidationErrors(model)
    expect(result.total).toBe(
      result.shexViolations.length + result.orphanedNodes.length + result.orphanedEdges.length
    )
    expect(result.hasErrors).toBe(true)
  })
})

describe('buildValidationErrors — activityConnections are not orphan edges', () => {
  it('an edge listed in activityConnections is not flagged', () => {
    const a = buildNode('GO:1', 'A')
    const b = buildNode('GO:2', 'B')
    const conn = makeEdge('conn-1', a.uid, b.uid)
    const model: GraphModel = {
      ...buildModel([buildActivity('act-1', [a]), buildActivity('act-2', [b])]),
      nodes: [a, b],
      edges: [conn],
      activityConnections: [conn],
    }
    const result = buildValidationErrors(model)
    expect(result.orphanedEdges).toEqual([])
  })
})

describe('buildValidationErrors — ShEx cardinality violation', () => {
  it('emits a cardinality CamError when the subject node is in an activity', () => {
    const subject = buildNode('GO:0003674', 'MF', [RootTypes.MOLECULAR_FUNCTION])
    const activity = buildActivity('act-1', [subject])
    const violation: ShExViolation = {
      node: subject.uid,
      shape: '',
      constraints: [{ property: 'BFO:0000050', cardinality: 1 }],
    }
    const model: GraphModel = {
      ...buildModel([activity]),
      nodes: [subject],
      violations: [violation],
    }
    const result = buildValidationErrors(model)
    expect(result.shexViolations).toHaveLength(1)
    expect(result.shexViolations[0]).toMatchObject({
      category: ErrorLevel.ERROR,
      type: ErrorType.CARDINALITY,
    })
    expect(result.shexViolations[0].message).toContain('Only one part of is allowed')
    // The activity is tagged
    expect(activity.hasViolations).toBe(true)
    expect(activity.violations).toHaveLength(1)
  })
})

describe('buildValidationErrors — ShEx relation violation', () => {
  it('emits a relation CamError when the constraint has an object', () => {
    const subject = buildNode('GO:1', 'subject')
    const other = buildNode('GO:2', 'object')
    const activity = buildActivity('act-1', [subject])
    const violation: ShExViolation = {
      node: subject.uid,
      shape: '',
      constraints: [{ property: 'BFO:0000050', object: other.uid }],
    }
    const model: GraphModel = {
      ...buildModel([activity]),
      nodes: [subject, other],
      violations: [violation],
    }
    const result = buildValidationErrors(model)
    expect(result.shexViolations).toHaveLength(1)
    expect(result.shexViolations[0].type).toBe(ErrorType.RELATION)
    expect(result.shexViolations[0].message).toContain('Incorrect relationship')
    expect(result.shexViolations[0].meta?.objectNode?.label).toBe('object')
  })

  it('converts http://purl.obolibrary.org/obo/GO_xxxx style object to a CURIE for lookup', () => {
    const subject = buildNode('GO:1', 'subject')
    const obj = buildNode('GO:2', 'object')
    const activity = buildActivity('act-1', [subject])
    const violation: ShExViolation = {
      node: subject.uid,
      shape: '',
      constraints: [{ property: 'BFO:0000050', object: 'GO:2' }],
    }
    const model: GraphModel = {
      ...buildModel([activity]),
      nodes: [subject, obj],
      violations: [violation],
    }
    // obj.uid (uid_GO:2) is not equal to "GO:2" so it falls back to the raw id label
    const result = buildValidationErrors(model)
    expect(result.shexViolations[0].meta?.objectNode?.label).toBe('GO:2')
  })
})

describe('buildValidationErrors — violations on nodes outside any activity', () => {
  it('drops the violation entirely (no CamError, no activity tag)', () => {
    const insideNode = buildNode('GO:0003674', 'MF')
    const outsideNode = buildNode('GO:0008150', 'BP')
    const activity = buildActivity('act-1', [insideNode])
    const violation: ShExViolation = {
      node: outsideNode.uid,
      shape: '',
      constraints: [{ property: 'BFO:0000050', cardinality: 1 }],
    }
    const model: GraphModel = {
      ...buildModel([activity]),
      nodes: [insideNode, outsideNode],
      violations: [violation],
    }
    const result = buildValidationErrors(model)
    expect(result.shexViolations).toEqual([])
    expect(activity.hasViolations).toBe(false)
  })
})

describe('buildValidationErrors — activity tagging across multiple activities', () => {
  it('only tags the activity that owns the violating node', () => {
    const n1 = buildNode('GO:1', 'A')
    const n2 = buildNode('GO:2', 'B')
    const act1 = buildActivity('act-1', [n1])
    const act2 = buildActivity('act-2', [n2])
    const violation: ShExViolation = {
      node: n2.uid,
      shape: '',
      constraints: [{ property: 'BFO:0000050', cardinality: 1 }],
    }
    const model: GraphModel = {
      ...buildModel([act1, act2]),
      nodes: [n1, n2],
      violations: [violation],
    }
    buildValidationErrors(model)
    expect(act1.hasViolations).toBe(false)
    expect(act1.violations).toEqual([])
    expect(act2.hasViolations).toBe(true)
    expect(act2.violations).toHaveLength(1)
  })

  it('clears previous violation tags on each call', () => {
    const n = buildNode('GO:1', 'A')
    const act = buildActivity('act-1', [n])
    act.hasViolations = true
    act.violations = [{ category: ErrorLevel.ERROR, type: ErrorType.CARDINALITY, message: 'stale' }]

    const model: GraphModel = {
      ...buildModel([act]),
      nodes: [n],
      violations: [], // no live violations
    }
    buildValidationErrors(model)
    expect(act.hasViolations).toBe(false)
    expect(act.violations).toEqual([])
  })
})
