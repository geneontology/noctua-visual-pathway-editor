import { describe, it, expect } from 'vitest'
import {
  buildCreateActivityOperations,
  buildEditActivityOperations,
  buildDeleteActivityOperations,
  buildAddNodeOperations,
  buildDeleteNodeOperations,
  buildSaveModelAnnotationsOperations,
  buildSaveEdgeCommentsOperations,
  buildAddEvidenceToEdgeOperations,
  buildRemoveEvidenceOperations,
  buildEditIndividualTypeOperations,
  buildEditEvidenceAnnotationOperations,
  buildClearEvidenceAnnotationOperations,
} from '@/features/gocam/services/activityOperations'
import {
  OperationEntity,
  OperationType,
  AnnotationKey,
  ExpressionType,
} from '@/features/gocam/models/operations'
import type { Operation } from '@/features/gocam/models/operations'
import type { TermNode, EvidenceForm } from '@/features/gocam/models/formModels'
import type { Activity, Edge, GraphNode, UserContext } from '@/features/gocam/models/cam'
import { ActivityType } from '@/features/gocam/models/cam'

const MODEL_ID = 'gomodel:test'

// ── Local test helpers ─────────────────────────────────────────────

const makeTerm = (
  uid: string,
  termId: string | null,
  label = '',
  relations: TermNode['relations'] = [],
  opts: Partial<TermNode> = {}
): TermNode => ({
  uid,
  category: 'GO:0003674',
  label,
  term: termId ? { id: termId, label } : null,
  aspect: null,
  rootTypes: [],
  isComplement: false,
  canDelete: true,
  required: false,
  relations,
  ...opts,
})

const makeEvidenceForm = (overrides: Partial<EvidenceForm> = {}): EvidenceForm => ({
  uid: 'evf-1',
  evidenceCode: { id: 'ECO:0000314', label: 'IDA' },
  reference: 'PMID:1',
  withFrom: '',
  ...overrides,
})

const makeRelation = (
  uid: string,
  predicateId: string,
  target: TermNode,
  evidence: EvidenceForm[] = []
) => ({ uid, predicate: { id: predicateId, label: '' }, target, evidence })

const makeNode = (uid: string, id: string, label = ''): GraphNode => ({
  uid,
  id,
  label,
  rootTypes: [],
  isComplement: false,
  contributors: [],
  groups: [],
  sources: [],
})

const makeEdge = (
  sourceUid: string,
  targetUid: string,
  predicateId: string,
  evidence: { uid: string; evidenceCode: { id: string; label: string } }[] = [],
  comments: string[] = []
): Edge => ({
  uid: `edge_${sourceUid}_${targetUid}`,
  id: predicateId,
  label: '',
  sourceId: sourceUid,
  targetId: targetUid,
  source: makeNode(sourceUid, ''),
  target: makeNode(targetUid, ''),
  contributors: [],
  groups: [],
  comments,
  evidence: evidence.map(ev => ({
    uid: ev.uid,
    evidenceCode: ev.evidenceCode,
    reference: '',
    referenceUrl: '',
    with: '',
    groups: [],
    contributors: [],
  })),
})

const makeActivity = (nodes: GraphNode[], edges: Edge[] = []): Activity => ({
  uid: 'activity-1',
  type: ActivityType.ACTIVITY,
  rootNode: nodes[0],
  molecularFunction: null,
  enabledBy: null,
  date: null,
  nodes,
  edges,
  hasViolations: false,
  violations: [],
})

const USER_CTX: UserContext = {
  orcid: 'https://orcid.org/0000-0000-0000-0001',
  groupUrl: 'https://group.example/g1',
}

const findOp = (ops: Operation[], pred: (op: Operation) => boolean) => {
  const op = ops.find(pred)
  if (!op) throw new Error('No matching operation found')
  return op
}

const lastOp = (ops: Operation[]) => ops[ops.length - 1]

describe('buildSaveModelAnnotationsOperations', () => {
  it('removes prior + adds new for title/state/comments + ends with STORE', () => {
    const ops = buildSaveModelAnnotationsOperations(
      MODEL_ID,
      { title: 'old', state: 'development', comments: ['c1'] },
      { title: 'new', state: 'production', comments: ['c1', 'c2'] }
    )
    // Last op is always STORE
    expect(ops.at(-1)).toMatchObject({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
    })
    // Three remove ops + one title add + one state add + two comment adds
    const removes = ops.filter(o => o.operation === OperationType.REMOVE_ANNOTATION)
    const adds = ops.filter(o => o.operation === OperationType.ADD_ANNOTATION)
    expect(removes).toHaveLength(3) // old title + old state + 1 old comment
    expect(adds).toHaveLength(4) // new title + new state + 2 new comments
  })

  it('skips remove ops when prior values are missing (empty / undefined)', () => {
    const ops = buildSaveModelAnnotationsOperations(
      MODEL_ID,
      { title: '', state: undefined, comments: undefined },
      { title: 'New Title', state: 'production', comments: [] }
    )
    const removes = ops.filter(o => o.operation === OperationType.REMOVE_ANNOTATION)
    expect(removes).toHaveLength(0)
  })

  it('handles "comments cleared" — old had comments, new has empty array', () => {
    const ops = buildSaveModelAnnotationsOperations(
      MODEL_ID,
      { title: 't', state: 'production', comments: ['a', 'b'] },
      { title: 't', state: 'production', comments: [] }
    )
    const commentRemoves = ops.filter(
      o =>
        o.operation === OperationType.REMOVE_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.COMMENT
    )
    const commentAdds = ops.filter(
      o =>
        o.operation === OperationType.ADD_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.COMMENT
    )
    expect(commentRemoves).toHaveLength(2)
    expect(commentAdds).toHaveLength(0)
  })

  it('tags every operation with the model-id', () => {
    const ops = buildSaveModelAnnotationsOperations(
      MODEL_ID,
      { title: 'a', state: 'b', comments: ['c'] },
      { title: 'A', state: 'B', comments: ['C'] }
    )
    for (const op of ops) {
      expect(op.arguments['model-id']).toBe(MODEL_ID)
    }
  })

  it('always emits the title and state ADD_ANNOTATION ops, even when unchanged', () => {
    // Field-level diffing isn't done here — the builder always re-emits title/state.
    // (The expectation is that the upstream callers only invoke this when something changed.)
    const ops = buildSaveModelAnnotationsOperations(
      MODEL_ID,
      { title: 'same', state: 'production', comments: [] },
      { title: 'same', state: 'production', comments: [] }
    )
    const titleAdd = ops.find(
      o =>
        o.operation === OperationType.ADD_ANNOTATION &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.TITLE
    )
    const stateAdd = ops.find(
      o =>
        o.operation === OperationType.ADD_ANNOTATION &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.STATE
    )
    expect(titleAdd).toBeTruthy()
    expect(stateAdd).toBeTruthy()
  })
})

// ── buildCreateActivityOperations ──────────────────────────────────

describe('buildCreateActivityOperations', () => {
  it('emits a single ADD individual + STORE for a root-only tree', () => {
    const root = makeTerm('root-1', 'GO:0003674', 'mf')
    const ops = buildCreateActivityOperations(root, MODEL_ID)

    const individuals = ops.filter(
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD
    )
    expect(individuals).toHaveLength(1)
    expect(individuals[0].arguments['model-id']).toBe(MODEL_ID)
    expect(individuals[0].arguments['assign-to-variable']).toBeTruthy()
    expect(individuals[0].arguments.expressions).toEqual([
      { type: ExpressionType.CLASS, id: 'GO:0003674' },
    ])

    expect(lastOp(ops)).toEqual({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
      arguments: { 'model-id': MODEL_ID },
    })
  })

  it('emits only the trailing STORE when the root has no term', () => {
    // walkTerm bails on a termless root, so no INDIVIDUAL/EDGE ops are emitted;
    // the unconditional STORE at the bottom of the builder still runs.
    const root = makeTerm('root-1', null)
    const ops = buildCreateActivityOperations(root, MODEL_ID)
    expect(ops).toHaveLength(1)
    expect(ops[0]).toEqual({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
      arguments: { 'model-id': MODEL_ID },
    })
  })

  it('walks relations: ADD individual + ADD edge per child', () => {
    const child = makeTerm('c-1', 'GO:0008150', 'bp')
    const root = makeTerm('root-1', 'GO:0003674', 'mf', [
      makeRelation('rel-1', 'BFO:0000050', child),
    ])
    const ops = buildCreateActivityOperations(root, MODEL_ID)

    const individuals = ops.filter(
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD
    )
    const edges = ops.filter(o => o.entity === OperationEntity.EDGE && o.operation === OperationType.ADD)

    expect(individuals).toHaveLength(2)
    expect(edges).toHaveLength(1)
    expect(edges[0].arguments.predicate).toBe('BFO:0000050')
    expect(lastOp(ops).operation).toBe(OperationType.STORE)
  })

  it('emits a COMPLEMENT expression when isComplement is set', () => {
    const root = makeTerm('root-1', 'GO:0003674', 'mf', [], { isComplement: true })
    const ops = buildCreateActivityOperations(root, MODEL_ID)

    const addIndividual = findOp(
      ops,
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD
    )
    expect(addIndividual.arguments.expressions).toEqual([
      {
        type: ExpressionType.COMPLEMENT,
        filler: { type: ExpressionType.CLASS, id: 'GO:0003674' },
      },
    ])
  })

  it('skips evidence rows that have no evidenceCode.id', () => {
    const child = makeTerm('c-1', 'GO:0008150', 'bp')
    const evidence: EvidenceForm[] = [
      makeEvidenceForm({ uid: 'ok', evidenceCode: { id: 'ECO:0000314', label: 'IDA' } }),
      makeEvidenceForm({ uid: 'skip', evidenceCode: { id: '', label: '' } }),
    ]
    const root = makeTerm('root-1', 'GO:0003674', 'mf', [
      makeRelation('rel-1', 'BFO:0000050', child, evidence),
    ])
    const ops = buildCreateActivityOperations(root, MODEL_ID)

    const eviIndividuals = ops.filter(
      o =>
        o.entity === OperationEntity.INDIVIDUAL &&
        o.operation === OperationType.ADD &&
        Array.isArray((o.arguments.expressions as Array<{ id: string }>)) &&
        (o.arguments.expressions as Array<{ id: string }>)[0].id.startsWith('ECO:')
    )
    expect(eviIndividuals).toHaveLength(1)
  })

  it('adds source + with annotations on the evidence individual when present', () => {
    const child = makeTerm('c-1', 'GO:0008150', 'bp')
    const root = makeTerm('root-1', 'GO:0003674', 'mf', [
      makeRelation('rel-1', 'BFO:0000050', child, [
        makeEvidenceForm({ reference: 'PMID:42', withFrom: 'UniProtKB:P0' }),
      ]),
    ])
    const ops = buildCreateActivityOperations(root, MODEL_ID)
    const evidenceAnnotation = findOp(
      ops,
      o =>
        o.entity === OperationEntity.INDIVIDUAL &&
        o.operation === OperationType.ADD_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>).some(v => v.key === AnnotationKey.SOURCE)
    )
    const values = evidenceAnnotation.arguments.values as Array<{ key: AnnotationKey; value: string }>
    expect(values.find(v => v.key === AnnotationKey.SOURCE)?.value).toBe('PMID:42')
    expect(values.find(v => v.key === AnnotationKey.WITH)?.value).toBe('UniProtKB:P0')
  })

  it('adds contributor + providedBy annotations when userContext is given', () => {
    const child = makeTerm('c-1', 'GO:0008150', 'bp')
    const root = makeTerm('root-1', 'GO:0003674', 'mf', [
      makeRelation('rel-1', 'BFO:0000050', child, [makeEvidenceForm()]),
    ])
    const ops = buildCreateActivityOperations(root, MODEL_ID, USER_CTX)
    const annotation = findOp(
      ops,
      o =>
        o.operation === OperationType.ADD_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>).some(
          v => v.key === AnnotationKey.CONTRIBUTOR
        )
    )
    const values = annotation.arguments.values as Array<{ key: AnnotationKey; value: string }>
    expect(values.find(v => v.key === AnnotationKey.CONTRIBUTOR)?.value).toBe(USER_CTX.orcid)
    expect(values.find(v => v.key === AnnotationKey.PROVIDED_BY)?.value).toBe(USER_CTX.groupUrl)
  })

  it('emits an evidence edge ADD_ANNOTATION linking subject→object→predicate to the evidence var', () => {
    const child = makeTerm('c-1', 'GO:0008150', 'bp')
    const root = makeTerm('root-1', 'GO:0003674', 'mf', [
      makeRelation('rel-1', 'BFO:0000050', child, [makeEvidenceForm()]),
    ])
    const ops = buildCreateActivityOperations(root, MODEL_ID)
    const evidenceEdge = findOp(
      ops,
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.ADD_ANNOTATION
    )
    expect(evidenceEdge.arguments.predicate).toBe('BFO:0000050')
    const values = evidenceEdge.arguments.values as Array<{ key: AnnotationKey; value: string }>
    expect(values[0].key).toBe(AnnotationKey.EVIDENCE)
    expect(values[0].value).toBeTruthy()
  })
})

// ── buildEditActivityOperations ────────────────────────────────────

describe('buildEditActivityOperations', () => {
  it('emits ADD individual ops for nodes whose UID is not in the existing activity (no server UIDs)', () => {
    // All form node UIDs are new -> triggers full-replace path
    const root = makeTerm('new-root', 'GO:0003674', 'mf')
    const existing = makeActivity([makeNode('old-root', 'GO:0003674')])
    const ops = buildEditActivityOperations(root, existing, MODEL_ID)

    // Should have the existing-node REMOVE
    const removes = ops.filter(
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.REMOVE
    )
    expect(removes).toHaveLength(1)
    expect(removes[0].arguments.individual).toBe('old-root')

    // And an ADD for the new root
    const adds = ops.filter(
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD
    )
    expect(adds).toHaveLength(1)

    expect(lastOp(ops).operation).toBe(OperationType.STORE)
  })

  it('emits REMOVE_TYPE + ADD_TYPE when an in-place node has a new term id', () => {
    // Form node shares uid with old node, but term changed -> in-place type swap
    const root = makeTerm('shared-uid', 'GO:0008150', 'bp-new')
    const existing = makeActivity([makeNode('shared-uid', 'GO:0003674', 'mf-old')])
    const ops = buildEditActivityOperations(root, existing, MODEL_ID)

    const removeType = findOp(
      ops,
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.REMOVE_TYPE
    )
    const addType = findOp(
      ops,
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD_TYPE
    )
    expect(removeType.arguments.individual).toBe('shared-uid')
    expect(addType.arguments.individual).toBe('shared-uid')
    expect((removeType.arguments.expressions as Array<{ id: string }>)[0].id).toBe('GO:0003674')
    expect((addType.arguments.expressions as Array<{ id: string }>)[0].id).toBe('GO:0008150')
  })

  it('omits REMOVE_TYPE/ADD_TYPE when the existing node has the same term id', () => {
    const root = makeTerm('shared-uid', 'GO:0003674', 'mf')
    const existing = makeActivity([makeNode('shared-uid', 'GO:0003674', 'mf')])
    const ops = buildEditActivityOperations(root, existing, MODEL_ID)
    expect(ops.some(o => o.operation === OperationType.REMOVE_TYPE)).toBe(false)
    expect(ops.some(o => o.operation === OperationType.ADD_TYPE)).toBe(false)
  })

  it('REMOVEs edges that exist in the old activity but not in the new form tree', () => {
    const root = makeTerm('shared-uid', 'GO:0003674', 'mf')
    const oldEdge = makeEdge('shared-uid', 'gone', 'BFO:0000050')
    const existing = makeActivity(
      [makeNode('shared-uid', 'GO:0003674'), makeNode('gone', 'GO:0008150')],
      [oldEdge]
    )
    const ops = buildEditActivityOperations(root, existing, MODEL_ID)

    const removedEdges = ops.filter(
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.REMOVE
    )
    expect(removedEdges).toHaveLength(1)
    expect(removedEdges[0].arguments.subject).toBe('shared-uid')
    expect(removedEdges[0].arguments.object).toBe('gone')
  })

  it('REMOVEs existing nodes that are no longer in the form tree', () => {
    const root = makeTerm('shared-uid', 'GO:0003674', 'mf')
    const existing = makeActivity([
      makeNode('shared-uid', 'GO:0003674'),
      makeNode('orphan-uid', 'GO:0008150'),
    ])
    const ops = buildEditActivityOperations(root, existing, MODEL_ID)
    const removed = ops.filter(
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.REMOVE
    )
    expect(removed.map(o => o.arguments.individual)).toContain('orphan-uid')
  })

  it('replaces evidence on retained edges (remove old evidence individuals + add new)', () => {
    const child = makeTerm('child-uid', 'GO:0008150', 'bp')
    const root = makeTerm('root-uid', 'GO:0003674', 'mf', [
      makeRelation('rel-1', 'BFO:0000050', child, [makeEvidenceForm()]),
    ])
    const oldEdge = makeEdge('root-uid', 'child-uid', 'BFO:0000050', [
      { uid: 'old-ev-uid', evidenceCode: { id: 'ECO:0000353', label: 'IPI' } },
    ])
    const existing = makeActivity(
      [makeNode('root-uid', 'GO:0003674'), makeNode('child-uid', 'GO:0008150')],
      [oldEdge]
    )
    const ops = buildEditActivityOperations(root, existing, MODEL_ID)

    const oldEvidenceRemoves = ops.filter(
      o =>
        o.entity === OperationEntity.INDIVIDUAL &&
        o.operation === OperationType.REMOVE &&
        o.arguments.individual === 'old-ev-uid'
    )
    expect(oldEvidenceRemoves).toHaveLength(1)
  })

  it('always tags ops with the model-id', () => {
    const root = makeTerm('shared-uid', 'GO:0008150', 'bp')
    const existing = makeActivity([makeNode('shared-uid', 'GO:0003674')])
    const ops = buildEditActivityOperations(root, existing, MODEL_ID)
    for (const op of ops) expect(op.arguments['model-id']).toBe(MODEL_ID)
  })

  it('ends with a STORE operation', () => {
    const root = makeTerm('shared-uid', 'GO:0003674', 'mf')
    const existing = makeActivity([makeNode('shared-uid', 'GO:0003674')])
    const ops = buildEditActivityOperations(root, existing, MODEL_ID)
    expect(lastOp(ops).operation).toBe(OperationType.STORE)
  })
})

// ── buildDeleteActivityOperations ──────────────────────────────────

describe('buildDeleteActivityOperations', () => {
  it('removes every edge then every node then STOREs', () => {
    const e1 = makeEdge('n1', 'n2', 'BFO:0000050')
    const e2 = makeEdge('n2', 'n3', 'BFO:0000051')
    const activity = makeActivity(
      [makeNode('n1', 'GO:1'), makeNode('n2', 'GO:2'), makeNode('n3', 'GO:3')],
      [e1, e2]
    )
    const ops = buildDeleteActivityOperations(activity, MODEL_ID)

    const edgeRemoves = ops.filter(
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.REMOVE
    )
    const nodeRemoves = ops.filter(
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.REMOVE
    )
    expect(edgeRemoves).toHaveLength(2)
    expect(nodeRemoves).toHaveLength(3)
    expect(lastOp(ops)).toEqual({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
      arguments: { 'model-id': MODEL_ID },
    })
  })

  it('handles an empty activity (no edges, no nodes) — emits only STORE', () => {
    const empty = makeActivity([])
    const ops = buildDeleteActivityOperations(empty, MODEL_ID)
    expect(ops).toHaveLength(1)
    expect(ops[0].operation).toBe(OperationType.STORE)
  })

  it('emits edge REMOVEs before node REMOVEs', () => {
    const activity = makeActivity(
      [makeNode('n1', 'GO:1'), makeNode('n2', 'GO:2')],
      [makeEdge('n1', 'n2', 'BFO:0000050')]
    )
    const ops = buildDeleteActivityOperations(activity, MODEL_ID)
    const firstNodeRemove = ops.findIndex(
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.REMOVE
    )
    const firstEdgeRemove = ops.findIndex(
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.REMOVE
    )
    expect(firstEdgeRemove).toBeLessThan(firstNodeRemove)
  })
})

// ── buildAddNodeOperations ─────────────────────────────────────────

describe('buildAddNodeOperations', () => {
  it('emits ADD individual + ADD edge + STORE in that order', () => {
    const ops = buildAddNodeOperations('parent-uid', 'BFO:0000050', 'GO:0008150', MODEL_ID)
    expect(ops[0].entity).toBe(OperationEntity.INDIVIDUAL)
    expect(ops[0].operation).toBe(OperationType.ADD)
    expect(ops[1].entity).toBe(OperationEntity.EDGE)
    expect(ops[1].operation).toBe(OperationType.ADD)
    expect(lastOp(ops).operation).toBe(OperationType.STORE)
  })

  it('uses details.termId when supplied (otherwise falls back to typeId)', () => {
    const ops = buildAddNodeOperations(
      'parent-uid',
      'BFO:0000050',
      'GO:0008150',
      MODEL_ID,
      undefined,
      { termId: 'GO:9999999' }
    )
    const add = findOp(ops, o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD)
    expect((add.arguments.expressions as Array<{ id: string }>)[0].id).toBe('GO:9999999')
  })

  it('falls back to typeId when details.termId is not provided', () => {
    const ops = buildAddNodeOperations('parent-uid', 'BFO:0000050', 'GO:0008150', MODEL_ID)
    const add = findOp(ops, o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD)
    expect((add.arguments.expressions as Array<{ id: string }>)[0].id).toBe('GO:0008150')
  })

  it('emits a contributor+providedBy ADD_ANNOTATION on the new individual when userContext is provided', () => {
    const ops = buildAddNodeOperations('parent-uid', 'BFO:0000050', 'GO:0008150', MODEL_ID, USER_CTX)
    const annotation = findOp(
      ops,
      o =>
        o.entity === OperationEntity.INDIVIDUAL &&
        o.operation === OperationType.ADD_ANNOTATION
    )
    const values = annotation.arguments.values as Array<{ key: AnnotationKey; value: string }>
    expect(values.find(v => v.key === AnnotationKey.CONTRIBUTOR)?.value).toBe(USER_CTX.orcid)
    expect(values.find(v => v.key === AnnotationKey.PROVIDED_BY)?.value).toBe(USER_CTX.groupUrl)
  })

  it('emits evidence operations when details.evidences contains valid rows', () => {
    const ops = buildAddNodeOperations(
      'parent-uid',
      'BFO:0000050',
      'GO:0008150',
      MODEL_ID,
      undefined,
      { evidences: [makeEvidenceForm()] }
    )
    const evidenceEdgeAnnotation = ops.filter(
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.ADD_ANNOTATION
    )
    expect(evidenceEdgeAnnotation).toHaveLength(1)
  })

  it('uses the parent uid (not a new var id) as the edge subject', () => {
    const ops = buildAddNodeOperations('parent-uid', 'BFO:0000050', 'GO:0008150', MODEL_ID)
    const edgeAdd = findOp(ops, o => o.entity === OperationEntity.EDGE && o.operation === OperationType.ADD)
    expect(edgeAdd.arguments.subject).toBe('parent-uid')
    expect(edgeAdd.arguments.predicate).toBe('BFO:0000050')
  })
})

// ── buildDeleteNodeOperations ──────────────────────────────────────

describe('buildDeleteNodeOperations', () => {
  it('removes every edge then the node then STOREs', () => {
    const ops = buildDeleteNodeOperations(
      'target-uid',
      [
        { sourceId: 'parent', targetId: 'target-uid', predicateId: 'BFO:0000050' },
        { sourceId: 'target-uid', targetId: 'child', predicateId: 'BFO:0000051' },
      ],
      MODEL_ID
    )
    expect(ops[0].entity).toBe(OperationEntity.EDGE)
    expect(ops[1].entity).toBe(OperationEntity.EDGE)
    expect(ops[2].entity).toBe(OperationEntity.INDIVIDUAL)
    expect(ops[2].operation).toBe(OperationType.REMOVE)
    expect(ops[2].arguments.individual).toBe('target-uid')
    expect(lastOp(ops).operation).toBe(OperationType.STORE)
  })

  it('handles no incident edges (just REMOVE individual + STORE)', () => {
    const ops = buildDeleteNodeOperations('lonely-uid', [], MODEL_ID)
    expect(ops).toHaveLength(2)
    expect(ops[0].operation).toBe(OperationType.REMOVE)
    expect(ops[0].arguments.individual).toBe('lonely-uid')
    expect(ops[1].operation).toBe(OperationType.STORE)
  })

  it('passes predicateId through to the edge REMOVE', () => {
    const ops = buildDeleteNodeOperations(
      'tgt',
      [{ sourceId: 's', targetId: 'tgt', predicateId: 'BFO:0000050' }],
      MODEL_ID
    )
    expect(ops[0].arguments.predicate).toBe('BFO:0000050')
  })
})

// ── buildAddEvidenceToEdgeOperations ───────────────────────────────

describe('buildAddEvidenceToEdgeOperations', () => {
  it('adds the evidence individual + the edge annotation + STORE', () => {
    const ops = buildAddEvidenceToEdgeOperations(
      'sub',
      'obj',
      'BFO:0000050',
      makeEvidenceForm(),
      MODEL_ID
    )
    const evIndividual = findOp(
      ops,
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD
    )
    expect((evIndividual.arguments.expressions as Array<{ id: string }>)[0].id).toBe('ECO:0000314')

    const edgeAnnotation = findOp(
      ops,
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.ADD_ANNOTATION
    )
    expect(edgeAnnotation.arguments.subject).toBe('sub')
    expect(edgeAnnotation.arguments.object).toBe('obj')
    expect(edgeAnnotation.arguments.predicate).toBe('BFO:0000050')

    expect(lastOp(ops).operation).toBe(OperationType.STORE)
  })

  it('skips an evidence row with no evidenceCode.id (no individual emitted)', () => {
    const ops = buildAddEvidenceToEdgeOperations(
      'sub',
      'obj',
      'BFO:0000050',
      makeEvidenceForm({ evidenceCode: { id: '', label: '' } }),
      MODEL_ID
    )
    // Only the trailing STORE survives
    expect(ops).toHaveLength(1)
    expect(ops[0].operation).toBe(OperationType.STORE)
  })

  it('emits source + withFrom on the evidence individual when set', () => {
    const ops = buildAddEvidenceToEdgeOperations(
      'sub',
      'obj',
      'BFO:0000050',
      makeEvidenceForm({ reference: 'PMID:7', withFrom: 'UniProtKB:Z' }),
      MODEL_ID
    )
    const annotation = findOp(
      ops,
      o =>
        o.entity === OperationEntity.INDIVIDUAL &&
        o.operation === OperationType.ADD_ANNOTATION
    )
    const values = annotation.arguments.values as Array<{ key: AnnotationKey; value: string }>
    expect(values.find(v => v.key === AnnotationKey.SOURCE)?.value).toBe('PMID:7')
    expect(values.find(v => v.key === AnnotationKey.WITH)?.value).toBe('UniProtKB:Z')
  })
})

// ── buildRemoveEvidenceOperations ──────────────────────────────────

describe('buildRemoveEvidenceOperations', () => {
  it('returns exactly two ops: REMOVE individual + STORE', () => {
    const ops = buildRemoveEvidenceOperations('ev-uid', MODEL_ID)
    expect(ops).toHaveLength(2)
    expect(ops[0]).toEqual({
      entity: OperationEntity.INDIVIDUAL,
      operation: OperationType.REMOVE,
      arguments: { individual: 'ev-uid', 'model-id': MODEL_ID },
    })
    expect(ops[1]).toEqual({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
      arguments: { 'model-id': MODEL_ID },
    })
  })
})

// ── buildEditIndividualTypeOperations ──────────────────────────────

describe('buildEditIndividualTypeOperations', () => {
  it('emits REMOVE_TYPE then ADD_TYPE then STORE', () => {
    const ops = buildEditIndividualTypeOperations('ind-uid', 'GO:OLD', 'GO:NEW', MODEL_ID)
    expect(ops).toHaveLength(3)
    expect(ops[0]).toMatchObject({
      entity: OperationEntity.INDIVIDUAL,
      operation: OperationType.REMOVE_TYPE,
      arguments: {
        individual: 'ind-uid',
        expressions: [{ type: ExpressionType.CLASS, id: 'GO:OLD' }],
        'model-id': MODEL_ID,
      },
    })
    expect(ops[1]).toMatchObject({
      entity: OperationEntity.INDIVIDUAL,
      operation: OperationType.ADD_TYPE,
      arguments: {
        individual: 'ind-uid',
        expressions: [{ type: ExpressionType.CLASS, id: 'GO:NEW' }],
        'model-id': MODEL_ID,
      },
    })
    expect(ops[2].operation).toBe(OperationType.STORE)
  })
})

// ── buildEditEvidenceAnnotationOperations ──────────────────────────

describe('buildEditEvidenceAnnotationOperations', () => {
  it('emits REMOVE_ANNOTATION then ADD_ANNOTATION for the given key + STORE', () => {
    const ops = buildEditEvidenceAnnotationOperations(
      'ev-uid',
      AnnotationKey.SOURCE,
      'PMID:old',
      'PMID:new',
      MODEL_ID
    )
    expect(ops[0]).toMatchObject({
      entity: OperationEntity.INDIVIDUAL,
      operation: OperationType.REMOVE_ANNOTATION,
      arguments: {
        individual: 'ev-uid',
        values: [{ key: AnnotationKey.SOURCE, value: 'PMID:old' }],
      },
    })
    expect(ops[1]).toMatchObject({
      entity: OperationEntity.INDIVIDUAL,
      operation: OperationType.ADD_ANNOTATION,
      arguments: {
        individual: 'ev-uid',
        values: [{ key: AnnotationKey.SOURCE, value: 'PMID:new' }],
      },
    })
    expect(lastOp(ops).operation).toBe(OperationType.STORE)
  })

  it('also emits contributor remove/add cycle when userContext is given', () => {
    const ops = buildEditEvidenceAnnotationOperations(
      'ev-uid',
      AnnotationKey.WITH,
      'X',
      'Y',
      MODEL_ID,
      USER_CTX
    )
    const contributorRemove = findOp(
      ops,
      o =>
        o.operation === OperationType.REMOVE_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.CONTRIBUTOR
    )
    expect(contributorRemove).toBeTruthy()

    const contributorAdd = findOp(
      ops,
      o =>
        o.operation === OperationType.ADD_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>).some(
          v => v.key === AnnotationKey.CONTRIBUTOR
        )
    )
    const values = contributorAdd.arguments.values as Array<{ key: AnnotationKey; value: string }>
    expect(values.find(v => v.key === AnnotationKey.PROVIDED_BY)?.value).toBe(USER_CTX.groupUrl)
  })

  it('omits the contributor add/remove pair when userContext is undefined', () => {
    const ops = buildEditEvidenceAnnotationOperations(
      'ev-uid',
      AnnotationKey.SOURCE,
      'a',
      'b',
      MODEL_ID
    )
    const contributorOps = ops.filter(
      o =>
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>).some(
          v => v.key === AnnotationKey.CONTRIBUTOR
        )
    )
    expect(contributorOps).toHaveLength(0)
  })
})

// ── buildClearEvidenceAnnotationOperations ─────────────────────────

describe('buildClearEvidenceAnnotationOperations', () => {
  it('returns [] when oldValue is empty', () => {
    expect(
      buildClearEvidenceAnnotationOperations('ev-uid', AnnotationKey.SOURCE, '', MODEL_ID)
    ).toEqual([])
  })

  it('emits only the REMOVE_ANNOTATION + STORE when no userContext', () => {
    const ops = buildClearEvidenceAnnotationOperations(
      'ev-uid',
      AnnotationKey.WITH,
      'UniProtKB:X',
      MODEL_ID
    )
    expect(ops).toHaveLength(2)
    expect(ops[0]).toMatchObject({
      operation: OperationType.REMOVE_ANNOTATION,
      arguments: {
        individual: 'ev-uid',
        values: [{ key: AnnotationKey.WITH, value: 'UniProtKB:X' }],
      },
    })
    expect(ops[1].operation).toBe(OperationType.STORE)
  })

  it('emits contributor remove + (contributor + providedBy) add when userContext is given', () => {
    const ops = buildClearEvidenceAnnotationOperations(
      'ev-uid',
      AnnotationKey.SOURCE,
      'PMID:9',
      MODEL_ID,
      USER_CTX
    )
    expect(ops).toHaveLength(4) // value REMOVE + contributor REMOVE + contributor+providedBy ADD + STORE

    const contribAdd = findOp(
      ops,
      o =>
        o.operation === OperationType.ADD_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>).some(
          v => v.key === AnnotationKey.PROVIDED_BY
        )
    )
    const values = contribAdd.arguments.values as Array<{ key: AnnotationKey; value: string }>
    expect(values.find(v => v.key === AnnotationKey.CONTRIBUTOR)?.value).toBe(USER_CTX.orcid)
    expect(values.find(v => v.key === AnnotationKey.PROVIDED_BY)?.value).toBe(USER_CTX.groupUrl)
  })
})

describe('buildSaveEdgeCommentsOperations', () => {
  it('emits one REMOVE per existing comment then one ADD per new, ending with MODEL/STORE', () => {
    const edge = makeEdge('mf', 'gp', 'enabled_by', [], ['old1', 'old2'])

    const ops = buildSaveEdgeCommentsOperations(edge, MODEL_ID, ['new1', 'new2', 'new3'])

    const removes = ops.filter(
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.REMOVE_ANNOTATION
    )
    const adds = ops.filter(
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.ADD_ANNOTATION
    )
    expect(removes).toHaveLength(2)
    expect(adds).toHaveLength(3)
    expect(lastOp(ops)).toEqual({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
      arguments: { 'model-id': MODEL_ID },
    })
  })

  it('uses the edge subject/object/predicate on each op', () => {
    const edge = makeEdge('mf', 'gp', 'enabled_by', [], ['old'])

    const ops = buildSaveEdgeCommentsOperations(edge, MODEL_ID, ['new'])

    const remove = findOp(
      ops,
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.REMOVE_ANNOTATION
    )
    expect(remove.arguments.subject).toBe('mf')
    expect(remove.arguments.object).toBe('gp')
    expect(remove.arguments.predicate).toBe('enabled_by')
    expect(remove.arguments.values).toEqual([{ key: AnnotationKey.COMMENT, value: 'old' }])

    const add = findOp(
      ops,
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.ADD_ANNOTATION
    )
    expect(add.arguments.values).toEqual([{ key: AnnotationKey.COMMENT, value: 'new' }])
  })

  it('emits no removes when edge has no existing comments', () => {
    const edge = makeEdge('mf', 'gp', 'enabled_by', [], [])

    const ops = buildSaveEdgeCommentsOperations(edge, MODEL_ID, ['hello'])

    const removes = ops.filter(o => o.operation === OperationType.REMOVE_ANNOTATION)
    const adds = ops.filter(o => o.operation === OperationType.ADD_ANNOTATION)
    expect(removes).toHaveLength(0)
    expect(adds).toHaveLength(1)
  })

  it('with empty new comments only removes existing', () => {
    const edge = makeEdge('mf', 'gp', 'enabled_by', [], ['keep-me-out'])

    const ops = buildSaveEdgeCommentsOperations(edge, MODEL_ID, [])
    const removes = ops.filter(o => o.operation === OperationType.REMOVE_ANNOTATION)
    const adds = ops.filter(o => o.operation === OperationType.ADD_ANNOTATION)
    expect(removes).toHaveLength(1)
    expect(adds).toHaveLength(0)
  })

  it('handles both empty arrays (just STORE)', () => {
    const edge = makeEdge('mf', 'gp', 'enabled_by', [], [])
    const ops = buildSaveEdgeCommentsOperations(edge, MODEL_ID, [])
    expect(ops).toHaveLength(1)
    expect(ops[0]).toEqual({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
      arguments: { 'model-id': MODEL_ID },
    })
  })
})
