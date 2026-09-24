import { describe, it, expect } from 'vitest'
import { buildPasteRegionOperations } from '@/features/gocam/services/activityOperations'
import { OperationEntity, OperationType } from '@/features/gocam/models/operations'
import type { Operation } from '@/features/gocam/models/operations'
import type { TermNode, EvidenceForm } from '@/features/gocam/models/formModels'

// ── Fixtures ────────────────────────────────────────────────────────

const term = (uid: string, id: string, relations: TermNode['relations'] = []): TermNode => ({
  uid,
  category: id,
  label: id,
  term: { id, label: id },
  aspect: null,
  rootTypes: [id],
  isComplement: false,
  canDelete: false,
  required: true,
  relations,
})

const evidence = (code = 'ECO:0000314'): EvidenceForm => ({
  uid: `ev-${code}`,
  evidenceCode: { id: code, label: code },
  reference: 'PMID:123',
  withFrom: '',
})

const MODEL_ID = 'gomodel:target'

const individualAdds = (ops: Operation[]) =>
  ops.filter(
    o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD
  )

const edgeAdds = (ops: Operation[]) =>
  ops.filter(o => o.entity === OperationEntity.EDGE && o.operation === OperationType.ADD)

const stores = (ops: Operation[]) =>
  ops.filter(o => o.entity === OperationEntity.MODEL && o.operation === OperationType.STORE)

/** Variable assigned to a node, by reading it back out of the emitted ops. */
const varForTerm = (ops: Operation[], termId: string): string | undefined => {
  const op = individualAdds(ops).find(o => {
    const expressions = o.arguments.expressions as { id?: string }[] | undefined
    return expressions?.some(e => e.id === termId)
  })
  return op?.arguments['assign-to-variable'] as string | undefined
}

// ── Tests ───────────────────────────────────────────────────────────

describe('buildPasteRegionOperations', () => {
  it('creates one individual per copied activity', () => {
    const ops = buildPasteRegionOperations(
      {
        activities: [{ root: term('a', 'GO:0003674') }, { root: term('b', 'GO:0016301') }],
        connections: [],
      },
      MODEL_ID
    )

    expect(individualAdds(ops)).toHaveLength(2)
    expect(varForTerm(ops, 'GO:0003674')).toBeTruthy()
    expect(varForTerm(ops, 'GO:0016301')).toBeTruthy()
  })

  it('ends with exactly one model store, so the whole region is one batch', () => {
    const ops = buildPasteRegionOperations(
      {
        activities: [{ root: term('a', 'GO:0003674') }, { root: term('b', 'GO:0016301') }],
        connections: [],
      },
      MODEL_ID
    )

    expect(stores(ops)).toHaveLength(1)
    expect(ops[ops.length - 1]).toEqual({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
      arguments: { 'model-id': MODEL_ID },
    })
  })

  it('targets the model it is pasting into, not the source', () => {
    const ops = buildPasteRegionOperations(
      { activities: [{ root: term('a', 'GO:0003674') }], connections: [] },
      MODEL_ID
    )

    expect(ops.every(o => o.arguments['model-id'] === MODEL_ID)).toBe(true)
  })

  describe('relations between pasted activities', () => {
    const region = {
      activities: [{ root: term('a', 'GO:0003674') }, { root: term('b', 'GO:0016301') }],
      connections: [
        {
          predicate: { id: 'RO:0002413', label: 'directly positively regulates' },
          sourceNodeUid: 'a',
          targetNodeUid: 'b',
          evidence: [],
        },
      ],
    }

    it('wires the relation to the batch variables of both new individuals', () => {
      const ops = buildPasteRegionOperations(region, MODEL_ID)

      const edges = edgeAdds(ops)
      expect(edges).toHaveLength(1)
      expect(edges[0].arguments).toMatchObject({
        subject: varForTerm(ops, 'GO:0003674'),
        object: varForTerm(ops, 'GO:0016301'),
        predicate: 'RO:0002413',
      })
    })

    it('queues both individuals before the relation that references them', () => {
      const ops = buildPasteRegionOperations(region, MODEL_ID)

      const edgeIndex = ops.findIndex(o => o.entity === OperationEntity.EDGE)
      const individualIndexes = ops
        .map((o, i) => (o.entity === OperationEntity.INDIVIDUAL ? i : -1))
        .filter(i => i !== -1)

      expect(individualIndexes.every(i => i < edgeIndex)).toBe(true)
    })

    it('drops a relation whose endpoint was never copied, rather than dangling', () => {
      const ops = buildPasteRegionOperations(
        {
          activities: [{ root: term('a', 'GO:0003674') }],
          connections: [
            {
              predicate: { id: 'RO:0002413', label: 'regulates' },
              sourceNodeUid: 'a',
              targetNodeUid: 'missing',
              evidence: [],
            },
          ],
        },
        MODEL_ID
      )

      expect(edgeAdds(ops)).toHaveLength(0)
    })

    it('wires a relation whose endpoint is a nested node, not an activity root', () => {
      const nested = term('a', 'GO:0003674', [
        {
          uid: 'rel-1',
          predicate: { id: 'RO:0002333', label: 'enabled by' },
          target: term('a-child', 'UniProtKB:P1'),
          evidence: [],
        },
      ])

      const ops = buildPasteRegionOperations(
        {
          activities: [{ root: nested }, { root: term('b', 'GO:0016301') }],
          connections: [
            {
              predicate: { id: 'RO:0002413', label: 'regulates' },
              sourceNodeUid: 'a-child',
              targetNodeUid: 'b',
              evidence: [],
            },
          ],
        },
        MODEL_ID
      )

      const interActivity = edgeAdds(ops).find(o => o.arguments.predicate === 'RO:0002413')
      expect(interActivity?.arguments.subject).toBe(varForTerm(ops, 'UniProtKB:P1'))
    })
  })

  describe('includeEvidence', () => {
    const region = {
      activities: [
        {
          root: term('a', 'GO:0003674', [
            {
              uid: 'rel-1',
              predicate: { id: 'RO:0002333', label: 'enabled by' },
              target: term('a-child', 'UniProtKB:P1'),
              evidence: [evidence()],
            },
          ]),
        },
        { root: term('b', 'GO:0016301') },
      ],
      connections: [
        {
          predicate: { id: 'RO:0002413', label: 'regulates' },
          sourceNodeUid: 'a',
          targetNodeUid: 'b',
          evidence: [evidence('ECO:0000315')],
        },
      ],
    }

    it('omits all evidence by default', () => {
      const ops = buildPasteRegionOperations(region, MODEL_ID)

      expect(varForTerm(ops, 'ECO:0000314')).toBeUndefined()
      expect(varForTerm(ops, 'ECO:0000315')).toBeUndefined()
    })

    it('includes activity and relation evidence when asked', () => {
      const ops = buildPasteRegionOperations(region, MODEL_ID, undefined, {
        includeEvidence: true,
      })

      expect(varForTerm(ops, 'ECO:0000314')).toBeTruthy()
      expect(varForTerm(ops, 'ECO:0000315')).toBeTruthy()
    })

    it('still creates the activities and relations when evidence is omitted', () => {
      const ops = buildPasteRegionOperations(region, MODEL_ID)

      // 2 activity roots + 1 nested child
      expect(individualAdds(ops)).toHaveLength(3)
      expect(edgeAdds(ops).some(o => o.arguments.predicate === 'RO:0002413')).toBe(true)
    })

    it('does not mutate the payload it was given', () => {
      const relation = region.activities[0].root.relations[0]
      const before = relation.evidence.length

      buildPasteRegionOperations(region, MODEL_ID, undefined, { includeEvidence: false })

      expect(relation.evidence.length).toBe(before)
    })
  })

  it('handles an empty region as a bare store', () => {
    const ops = buildPasteRegionOperations({ activities: [], connections: [] }, MODEL_ID)

    expect(individualAdds(ops)).toHaveLength(0)
    expect(stores(ops)).toHaveLength(1)
  })
})
