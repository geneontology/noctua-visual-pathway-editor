import { describe, it, expect } from 'vitest'
import {
  buildConnectorOperations,
  buildConnectorDeleteOperations,
  buildChemicalParticipantOperations,
  isReverseLinkConnector,
  getDefaultConnectorEvidence,
} from '@/features/relations/services/connectorServices'
import {
  ActivityType,
  type Activity,
  type Edge,
  type GraphNode,
  type UserContext,
} from '@/features/gocam/models/cam'
import {
  OperationEntity,
  OperationType,
  AnnotationKey,
} from '@/features/gocam/models/operations'
import { Relations } from '@/@noctua.core/models/relations'
import type { EvidenceForm } from '@/features/gocam/models/formModels'
import { buildActivity, buildEdgeWithEvidence, buildNode } from '@tests/fixtures/builders'

const MODEL_ID = 'gomodel:test'
const USER: UserContext = {
  orcid: 'https://orcid.org/0000-0000-0000-0000',
  groupUrl: 'http://geneontology.org/groups/Test',
}

const makeActivity = (uid: string, type: ActivityType = ActivityType.ACTIVITY): Activity => {
  const root = { ...buildNode(`${uid}_id`, `${uid}_label`), uid: `${uid}_root_uid` }
  return { ...buildActivity(uid, [root]), type }
}

const evidence = (overrides: Partial<EvidenceForm> = {}): EvidenceForm => ({
  uid: 'ev-1',
  evidenceCode: { id: 'ECO:0000314', label: 'IDA' },
  reference: 'PMID:1234',
  withFrom: '',
  ...overrides,
})

describe('isReverseLinkConnector', () => {
  it('returns true only when relation is has_input AND source is a MOLECULE', () => {
    const molecule = makeActivity('m', ActivityType.MOLECULE)
    const normal = makeActivity('n', ActivityType.ACTIVITY)
    expect(isReverseLinkConnector(Relations.HAS_INPUT, molecule)).toBe(true)
    expect(isReverseLinkConnector(Relations.HAS_INPUT, normal)).toBe(false)
    expect(isReverseLinkConnector(Relations.PART_OF, molecule)).toBe(false)
  })

  it('returns false when relationId is null or undefined', () => {
    const molecule = makeActivity('m', ActivityType.MOLECULE)
    expect(isReverseLinkConnector(null, molecule)).toBe(false)
    expect(isReverseLinkConnector(undefined, molecule)).toBe(false)
  })
})

describe('buildConnectorOperations', () => {
  it('emits one EDGE add + one MODEL store when no evidence provided', () => {
    const src = makeActivity('a')
    const tgt = makeActivity('b')
    const ops = buildConnectorOperations(src, tgt, Relations.PART_OF, [], MODEL_ID)
    expect(ops).toHaveLength(2)
    expect(ops[0]).toMatchObject({
      entity: OperationEntity.EDGE,
      operation: OperationType.ADD,
      arguments: {
        subject: 'a_root_uid',
        object: 'b_root_uid',
        predicate: Relations.PART_OF,
        'model-id': MODEL_ID,
      },
    })
    expect(ops.at(-1)).toMatchObject({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
    })
  })

  it('skips evidence rows that have no evidenceCode.id', () => {
    const ops = buildConnectorOperations(
      makeActivity('a'),
      makeActivity('b'),
      Relations.PART_OF,
      [evidence({ evidenceCode: { id: '', label: '' } })],
      MODEL_ID
    )
    // No INDIVIDUAL adds, no edge ADD_ANNOTATION, just EDGE add + MODEL store
    expect(ops.filter(o => o.entity === OperationEntity.INDIVIDUAL)).toHaveLength(0)
  })

  it('emits INDIVIDUAL add + INDIVIDUAL annotation + EDGE annotation per valid evidence', () => {
    const ops = buildConnectorOperations(
      makeActivity('a'),
      makeActivity('b'),
      Relations.PART_OF,
      [evidence()],
      MODEL_ID
    )
    const individualAdds = ops.filter(
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD
    )
    const individualAnns = ops.filter(
      o =>
        o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD_ANNOTATION
    )
    const edgeAnns = ops.filter(
      o => o.entity === OperationEntity.EDGE && o.operation === OperationType.ADD_ANNOTATION
    )
    expect(individualAdds).toHaveLength(1)
    expect(individualAnns).toHaveLength(1)
    expect(edgeAnns).toHaveLength(1)
  })

  it('includes orcid + groupUrl annotations on the evidence when userContext is provided', () => {
    const ops = buildConnectorOperations(
      makeActivity('a'),
      makeActivity('b'),
      Relations.PART_OF,
      [evidence()],
      MODEL_ID,
      USER
    )
    const annOp = ops.find(
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD_ANNOTATION
    )!
    const values = annOp.arguments.values as { key: AnnotationKey; value: string }[]
    expect(values.some(v => v.key === AnnotationKey.CONTRIBUTOR && v.value === USER.orcid)).toBe(true)
    expect(values.some(v => v.key === AnnotationKey.PROVIDED_BY && v.value === USER.groupUrl)).toBe(true)
  })

  it('skips the per-evidence ADD_ANNOTATION step if nothing to annotate (no ref/with/user)', () => {
    const ops = buildConnectorOperations(
      makeActivity('a'),
      makeActivity('b'),
      Relations.PART_OF,
      [evidence({ reference: '', withFrom: '' })],
      MODEL_ID
      // no userContext
    )
    const individualAnns = ops.filter(
      o =>
        o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD_ANNOTATION
    )
    expect(individualAnns).toHaveLength(0)
  })

  it('reverses subject/object for has_input on a MOLECULE source (reverseLink case)', () => {
    const molecule = makeActivity('chem', ActivityType.MOLECULE)
    const downstream = makeActivity('downstream')
    const ops = buildConnectorOperations(
      molecule,
      downstream,
      Relations.HAS_INPUT,
      [],
      MODEL_ID
    )
    expect(ops[0].arguments.subject).toBe('downstream_root_uid')
    expect(ops[0].arguments.object).toBe('chem_root_uid')
  })

  it('does not reverse for relations other than has_input', () => {
    const molecule = makeActivity('chem', ActivityType.MOLECULE)
    const downstream = makeActivity('downstream')
    const ops = buildConnectorOperations(molecule, downstream, Relations.PART_OF, [], MODEL_ID)
    expect(ops[0].arguments.subject).toBe('chem_root_uid')
    expect(ops[0].arguments.object).toBe('downstream_root_uid')
  })
})

describe('getDefaultConnectorEvidence', () => {
  // An activity whose molecular-function node carries the given uid, so an
  // enabled_by edge can target it via sourceId.
  const activityWithMf = (uid: string, type: ActivityType = ActivityType.ACTIVITY): Activity => {
    const mf: GraphNode = { ...buildNode('GO:0003674', 'molecular_function'), uid: `${uid}_mf` }
    return { ...buildActivity(uid, [mf]), type, molecularFunction: mf }
  }

  const moleculeActivity = (uid: string): Activity => ({
    ...buildActivity(uid, [buildNode('CHEBI:1', 'chemical')]),
    type: ActivityType.MOLECULE,
  })

  // enabled_by edge sourced from the given MF uid, carrying the given evidence.
  const enabledByEdge = (
    mfUid: string,
    evidenceCodes: { id: string; label: string }[]
  ): Edge => ({
    ...buildEdgeWithEvidence(Relations.ENABLED_BY, evidenceCodes),
    sourceId: mfUid,
  })

  it('seeds from the source activity enabled_by edge evidence', () => {
    const src = activityWithMf('a')
    const tgt = activityWithMf('b')
    const edges = [enabledByEdge('a_mf', [{ id: 'ECO:0000314', label: 'IDA' }])]

    const forms = getDefaultConnectorEvidence(src, tgt, edges)
    expect(forms).toHaveLength(1)
    expect(forms[0]).toMatchObject({
      evidenceCode: { id: 'ECO:0000314', label: 'IDA' },
      reference: 'PMID:1',
      withFrom: '',
    })
  })

  it('copies every evidence row on the enabled_by edge', () => {
    const src = activityWithMf('a')
    const tgt = activityWithMf('b')
    const edges = [
      enabledByEdge('a_mf', [
        { id: 'ECO:0000314', label: 'IDA' },
        { id: 'ECO:0000353', label: 'IPI' },
      ]),
    ]

    const forms = getDefaultConnectorEvidence(src, tgt, edges)
    expect(forms.map(f => f.evidenceCode.id)).toEqual(['ECO:0000314', 'ECO:0000353'])
  })

  it('returns [] when the source activity has no enabled_by edge', () => {
    const src = activityWithMf('a')
    const tgt = activityWithMf('b')
    // an enabled_by edge exists, but only for a different activity's MF
    const edges = [enabledByEdge('b_mf', [{ id: 'ECO:0000314', label: 'IDA' }])]

    expect(getDefaultConnectorEvidence(src, tgt, edges)).toEqual([])
  })

  it('returns [] when the enabled_by edge carries no evidence', () => {
    const src = activityWithMf('a')
    const tgt = activityWithMf('b')

    expect(getDefaultConnectorEvidence(src, tgt, [enabledByEdge('a_mf', [])])).toEqual([])
  })

  it('ignores non-enabled_by edges that share the MF source id', () => {
    const src = activityWithMf('a')
    const tgt = activityWithMf('b')
    const otherEdge: Edge = {
      ...buildEdgeWithEvidence(Relations.HAS_INPUT, [{ id: 'ECO:0000314', label: 'IDA' }]),
      sourceId: 'a_mf',
    }

    expect(getDefaultConnectorEvidence(src, tgt, [otherEdge])).toEqual([])
  })

  it('pulls from the target activity when the source is a molecule', () => {
    const molecule = moleculeActivity('chem')
    const downstream = activityWithMf('downstream')
    const edges = [enabledByEdge('downstream_mf', [{ id: 'ECO:0000314', label: 'IDA' }])]

    const forms = getDefaultConnectorEvidence(molecule, downstream, edges)
    expect(forms).toHaveLength(1)
    expect(forms[0].evidenceCode.id).toBe('ECO:0000314')
  })

  it('returns [] when the chosen activity has no molecular function node', () => {
    const molecule = moleculeActivity('chem')
    const targetMolecule = moleculeActivity('chem2')

    expect(getDefaultConnectorEvidence(molecule, targetMolecule, [])).toEqual([])
  })

  it('preserves the source evidence uid and maps with → withFrom', () => {
    const src = activityWithMf('a')
    const tgt = activityWithMf('b')
    const edge = enabledByEdge('a_mf', [{ id: 'ECO:0000314', label: 'IDA' }])
    edge.evidence![0].with = 'UniProtKB:P12345'

    const forms = getDefaultConnectorEvidence(src, tgt, [edge])
    expect(forms[0].uid).toBe(`ev_${Relations.ENABLED_BY}_0`)
    expect(forms[0].withFrom).toBe('UniProtKB:P12345')
  })
})

describe('buildConnectorDeleteOperations', () => {
  it('emits one EDGE remove + one MODEL store', () => {
    const ops = buildConnectorDeleteOperations('src-uid', 'tgt-uid', Relations.PART_OF, MODEL_ID)
    expect(ops).toHaveLength(2)
    expect(ops[0]).toMatchObject({
      entity: OperationEntity.EDGE,
      operation: OperationType.REMOVE,
      arguments: {
        subject: 'src-uid',
        object: 'tgt-uid',
        predicate: Relations.PART_OF,
        'model-id': MODEL_ID,
      },
    })
    expect(ops[1]).toMatchObject({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
    })
  })
})

describe('buildChemicalParticipantOperations', () => {
  const subjectMf: GraphNode = { ...buildNode('GO:1', 'mf-subject'), uid: 'mf-subject-uid' }
  const objectMf: GraphNode = { ...buildNode('GO:2', 'mf-object'), uid: 'mf-object-uid' }

  it('returns an empty array when no chemicals are provided', () => {
    expect(buildChemicalParticipantOperations(subjectMf, objectMf, [], MODEL_ID)).toEqual([])
  })

  it('emits 3 ops per chemical: INDIVIDUAL add + has_output edge + has_input edge', () => {
    const chemicals = [{ id: 'CHEBI:1', label: 'glucose' }]
    const ops = buildChemicalParticipantOperations(subjectMf, objectMf, chemicals, MODEL_ID)
    // 3 ops per chemical + 1 MODEL store
    expect(ops).toHaveLength(4)
    expect(ops[0].entity).toBe(OperationEntity.INDIVIDUAL)
    expect(ops[1]).toMatchObject({
      entity: OperationEntity.EDGE,
      operation: OperationType.ADD,
      arguments: { subject: subjectMf.uid, predicate: Relations.HAS_OUTPUT },
    })
    expect(ops[2]).toMatchObject({
      entity: OperationEntity.EDGE,
      operation: OperationType.ADD,
      arguments: { subject: objectMf.uid, predicate: Relations.HAS_INPUT },
    })
    expect(ops[3]).toMatchObject({ entity: OperationEntity.MODEL, operation: OperationType.STORE })
  })

  it('uses the same chemical variable id for both edges (subject + object reference the same individual)', () => {
    const chemicals = [{ id: 'CHEBI:1', label: 'glucose' }]
    const ops = buildChemicalParticipantOperations(subjectMf, objectMf, chemicals, MODEL_ID)
    const chemVarId = ops[0].arguments['assign-to-variable']
    expect(ops[1].arguments.object).toBe(chemVarId)
    expect(ops[2].arguments.object).toBe(chemVarId)
  })

  it('scales linearly with the number of chemicals + 1 MODEL store at the end', () => {
    const chemicals = [
      { id: 'CHEBI:1', label: 'a' },
      { id: 'CHEBI:2', label: 'b' },
      { id: 'CHEBI:3', label: 'c' },
    ]
    const ops = buildChemicalParticipantOperations(subjectMf, objectMf, chemicals, MODEL_ID)
    expect(ops).toHaveLength(chemicals.length * 3 + 1)
    expect(ops.at(-1)?.operation).toBe(OperationType.STORE)
  })
})
