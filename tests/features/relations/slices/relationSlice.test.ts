import { describe, it, expect } from 'vitest'
import relationReducer, {
  updateSelection,
  resetSelection,
  addConnectorEvidence,
  removeConnectorEvidence,
  updateConnectorEvidence,
  setConnectorEvidences,
  selectRelationSelected,
  selectRelation,
  selectConnectorEvidences,
} from '@/features/relations/slices/relationSlice'
import {
  ActivityRelationshipId,
  ActivityMoleculeRelationshipId,
  MoleculeActivityRelationshipId,
  EffectDirectionId,
  DirectnessId,
  RelationId,
} from '@/features/relations/models/decisionTree'
import { ActivityType } from '@/features/gocam/models/cam'
import type { EvidenceForm } from '@/features/gocam/models/formModels'

const initial = relationReducer(undefined, { type: '@@INIT' })

describe('relationSlice initial state', () => {
  it('seeds activity↔activity defaults from the decision tree', () => {
    expect(initial.selected).toEqual({
      sourceType: ActivityType.ACTIVITY,
      targetType: ActivityType.ACTIVITY,
      relationshipId: ActivityRelationshipId.REGULATION,
      directionId: EffectDirectionId.POSITIVE,
      directnessId: DirectnessId.DIRECT,
    })
  })

  it('resolves the initial relation to directly_positively_regulates', () => {
    expect(initial.relation).toBe(RelationId.DIRECTLY_POSITIVELY_REGULATES)
  })

  it('starts with exactly one (empty) connector evidence', () => {
    expect(initial.connectorEvidences).toHaveLength(1)
    expect(initial.connectorEvidences[0].evidenceCode).toEqual({ id: '', label: '' })
  })
})

describe('relationSlice updateSelection', () => {
  it('flipping direction to NEGATIVE recomputes the relation', () => {
    const next = relationReducer(initial, updateSelection({ directionId: EffectDirectionId.NEGATIVE }))
    expect(next.selected.directionId).toBe(EffectDirectionId.NEGATIVE)
    expect(next.relation).toBe(RelationId.DIRECTLY_NEGATIVELY_REGULATES)
  })

  it('flipping directness to INDIRECT recomputes the relation', () => {
    const next = relationReducer(initial, updateSelection({ directnessId: DirectnessId.INDIRECT }))
    expect(next.relation).toBe(RelationId.INDIRECTLY_POSITIVELY_REGULATES)
  })

  it('switching relationshipId to UNDETERMINED yields a causally_upstream relation', () => {
    const next = relationReducer(
      initial,
      updateSelection({ relationshipId: ActivityRelationshipId.UNDETERMINED })
    )
    expect(next.relation).toBe(RelationId.CAUSALLY_UPSTREAM_OF_POSITIVE_EFFECT)
  })

  it('preserves connector evidences', () => {
    const next = relationReducer(initial, updateSelection({ directionId: EffectDirectionId.NEGATIVE }))
    expect(next.connectorEvidences).toBe(initial.connectorEvidences)
  })

  it('partial payload merges into existing selection', () => {
    const after1 = relationReducer(
      initial,
      updateSelection({ directionId: EffectDirectionId.NEGATIVE })
    )
    const after2 = relationReducer(after1, updateSelection({ directnessId: DirectnessId.INDIRECT }))
    expect(after2.selected.directionId).toBe(EffectDirectionId.NEGATIVE)
    expect(after2.selected.directnessId).toBe(DirectnessId.INDIRECT)
    expect(after2.relation).toBe(RelationId.INDIRECTLY_NEGATIVELY_REGULATES)
  })
})

describe('relationSlice resetSelection', () => {
  it('reset to activity→molecule applies product defaults', () => {
    const next = relationReducer(
      initial,
      resetSelection({ sourceType: ActivityType.ACTIVITY, targetType: ActivityType.MOLECULE })
    )
    expect(next.selected).toEqual({
      sourceType: ActivityType.ACTIVITY,
      targetType: ActivityType.MOLECULE,
      relationshipId: ActivityMoleculeRelationshipId.PRODUCT,
    })
    expect(next.relation).toBe(RelationId.PRODUCT)
  })

  it('reset to molecule→activity applies regulates+positive defaults', () => {
    const next = relationReducer(
      initial,
      resetSelection({ sourceType: ActivityType.MOLECULE, targetType: ActivityType.ACTIVITY })
    )
    expect(next.selected).toEqual({
      sourceType: ActivityType.MOLECULE,
      targetType: ActivityType.ACTIVITY,
      relationshipId: MoleculeActivityRelationshipId.REGULATES,
      directionId: EffectDirectionId.POSITIVE,
    })
    expect(next.relation).toBe(RelationId.SMALL_MOLECULE_ACTIVATOR)
  })

  it('reset replaces connector evidences with a single fresh evidence', () => {
    const withMany = relationReducer(initial, addConnectorEvidence())
    const after = relationReducer(withMany, addConnectorEvidence())
    expect(after.connectorEvidences).toHaveLength(3)

    const reset = relationReducer(
      after,
      resetSelection({ sourceType: ActivityType.ACTIVITY, targetType: ActivityType.ACTIVITY })
    )
    expect(reset.connectorEvidences).toHaveLength(1)
    expect(reset.connectorEvidences[0].evidenceCode).toEqual({ id: '', label: '' })
  })
})

describe('relationSlice connector evidence reducers', () => {
  it('addConnectorEvidence appends a fresh evidence', () => {
    const next = relationReducer(initial, addConnectorEvidence())
    expect(next.connectorEvidences).toHaveLength(2)
    expect(next.connectorEvidences[1].evidenceCode).toEqual({ id: '', label: '' })
  })

  it('removeConnectorEvidence drops the indexed entry when more than one exists', () => {
    const two = relationReducer(initial, addConnectorEvidence())
    const firstUid = two.connectorEvidences[0].uid
    const next = relationReducer(two, removeConnectorEvidence(0))
    expect(next.connectorEvidences).toHaveLength(1)
    expect(next.connectorEvidences[0].uid).not.toBe(firstUid)
  })

  it('removeConnectorEvidence on the last item replaces it with a fresh evidence', () => {
    // initial has length 1
    const next = relationReducer(initial, removeConnectorEvidence(0))
    expect(next.connectorEvidences).toHaveLength(1)
    expect(next.connectorEvidences[0].uid).not.toBe(initial.connectorEvidences[0].uid)
    expect(next.connectorEvidences[0].evidenceCode).toEqual({ id: '', label: '' })
  })

  it('updateConnectorEvidence sets the evidence code (assigns the whole GOlrResponse via current cast)', () => {
    const golr = {
      id: 'ECO:0000314',
      label: 'IDA',
      link: '',
      description: '',
      isObsolete: false,
      replacedBy: '',
      rootTypes: [],
      xref: '',
      notAnnotatable: false,
      neighborhoodGraphJson: '',
    }
    const next = relationReducer(
      initial,
      updateConnectorEvidence({ evidenceIndex: 0, field: 'evidenceCode', value: golr })
    )
    // The reducer's `as GOlrResponse as { id, label }` cast does not narrow the runtime value,
    // so the whole object is stored. id/label are what consumers actually read.
    const stored = next.connectorEvidences[0].evidenceCode
    expect(stored.id).toBe('ECO:0000314')
    expect(stored.label).toBe('IDA')
  })

  it('updateConnectorEvidence sets reference and withFrom strings', () => {
    let s = relationReducer(
      initial,
      updateConnectorEvidence({ evidenceIndex: 0, field: 'reference', value: 'PMID:1' })
    )
    s = relationReducer(
      s,
      updateConnectorEvidence({ evidenceIndex: 0, field: 'withFrom', value: 'UniProtKB:P12345' })
    )
    expect(s.connectorEvidences[0].reference).toBe('PMID:1')
    expect(s.connectorEvidences[0].withFrom).toBe('UniProtKB:P12345')
  })

  it('updateConnectorEvidence at an out-of-range index is a no-op', () => {
    const next = relationReducer(
      initial,
      updateConnectorEvidence({ evidenceIndex: 5, field: 'reference', value: 'PMID:1' })
    )
    expect(next.connectorEvidences[0].reference).toBe('')
  })

  it('setConnectorEvidences replaces the list when non-empty', () => {
    const replacement: EvidenceForm[] = [
      { uid: 'a', evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:1', withFrom: '' },
      { uid: 'b', evidenceCode: { id: 'ECO:0000353', label: 'IPI' }, reference: 'PMID:2', withFrom: '' },
    ]
    const next = relationReducer(initial, setConnectorEvidences(replacement))
    expect(next.connectorEvidences).toEqual(replacement)
  })

  it('setConnectorEvidences([]) substitutes a single fresh evidence', () => {
    const next = relationReducer(initial, setConnectorEvidences([]))
    expect(next.connectorEvidences).toHaveLength(1)
    expect(next.connectorEvidences[0].evidenceCode).toEqual({ id: '', label: '' })
  })
})

describe('relationSlice selectors', () => {
  it('selectRelationSelected reads selected', () => {
    expect(selectRelationSelected({ relation: initial })).toBe(initial.selected)
  })

  it('selectRelation reads relation', () => {
    expect(selectRelation({ relation: initial })).toBe(initial.relation)
  })

  it('selectConnectorEvidences reads connectorEvidences', () => {
    expect(selectConnectorEvidences({ relation: initial })).toBe(initial.connectorEvidences)
  })
})
