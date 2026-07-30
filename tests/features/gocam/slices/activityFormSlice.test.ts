import { describe, it, expect, beforeEach } from 'vitest'
import activityFormSlice, {
  initCreateForm,
  initEditForm,
  loadActivity,
  updateTerm,
  updateRelationPredicate,
  toggleComplement,
  addEvidenceForm,
  removeEvidenceForm,
  updateEvidenceForm,
  setNodeEvidences,
  setRelationEvidences,
  addRelationForm,
  removeRelationForm,
  fillRootTerm,
  fillUnknownEnabler,
  addISSEvidence,
  addISOEvidence,
  addICEvidence,
  clearNodeValues,
  setErrors,
  resetForm,
  selectActivityForm,
  selectFormRoot,
  selectFormMode,
  selectFormType,
  selectFormErrors,
  selectExistingActivityUid,
} from '@/features/gocam/slices/activityFormSlice'
import type { ActivityFormState, TermNode, EvidenceForm } from '@/features/gocam/models/formModels'
import { FormMode } from '@/features/gocam/models/formModels'
import { ActivityType, Aspect, RootTypes } from '@/features/gocam/models/cam'
import type { Activity, GraphNode } from '@/features/gocam/models/cam'
import { buildActivity, buildNode } from '@tests/fixtures/builders'

const reducer = activityFormSlice.reducer
const initial = reducer(undefined, { type: '@@INIT' })

// Walk the form tree, depth-first
const walk = (node: TermNode, visit: (n: TermNode) => void) => {
  visit(node)
  for (const rel of node.relations) walk(rel.target, visit)
}

const findByCategory = (root: TermNode, category: string): TermNode | null => {
  let hit: TermNode | null = null
  walk(root, n => {
    if (!hit && n.category === category) hit = n
  })
  return hit
}

const findRelationByPredicate = (root: TermNode, predicateId: string) => {
  for (const rel of root.relations) {
    if (rel.predicate.id === predicateId) return rel
    const deeper = findRelationByPredicate(rel.target, predicateId)
    if (deeper) return deeper
  }
  return null
}

describe('activityFormSlice initial state', () => {
  it('has no root, CREATE mode, not dirty, no errors', () => {
    expect(initial).toEqual<ActivityFormState>({
      activityType: null,
      mode: FormMode.CREATE,
      existingActivityUid: null,
      root: null,
      isDirty: false,
      errors: [],
    })
  })
})

describe('initCreateForm', () => {
  it('hydrates the default activity template', () => {
    const next = reducer(initial, initCreateForm('activity'))
    expect(next.activityType).toBe('activity')
    expect(next.mode).toBe(FormMode.CREATE)
    expect(next.existingActivityUid).toBeNull()
    expect(next.isDirty).toBe(false)
    expect(next.root?.category).toBe(RootTypes.MOLECULAR_FUNCTION)
    expect(next.root?.required).toBe(true)
    // Default template has enabled_by, part_of, occurs_in relations
    const predicates = next.root!.relations.map(r => r.predicate.id)
    expect(predicates).toContain('RO:0002333') // ENABLED_BY
    expect(predicates).toContain('BFO:0000050') // PART_OF
    expect(predicates).toContain('BFO:0000066') // OCCURS_IN
  })

  it('hydrates the molecule template (CHEMICAL_ENTITY root)', () => {
    const next = reducer(initial, initCreateForm('molecule'))
    expect(next.activityType).toBe('molecule')
    expect(next.root?.category).toBe(RootTypes.CHEMICAL_ENTITY)
  })

  it('hydrates the proteinComplex template', () => {
    const next = reducer(initial, initCreateForm('proteinComplex'))
    expect(next.activityType).toBe('proteinComplex')
    expect(next.root?.category).toBe(RootTypes.MOLECULAR_FUNCTION)
    expect(next.root?.visible).toBe(true)
  })

  it('clears dirty + errors from prior state', () => {
    const seeded: ActivityFormState = {
      ...initial,
      isDirty: true,
      errors: [{ uid: 'x', field: 'f', message: 'old' }],
      existingActivityUid: 'stale',
    }
    const next = reducer(seeded, initCreateForm('activity'))
    expect(next.isDirty).toBe(false)
    expect(next.errors).toEqual([])
    expect(next.existingActivityUid).toBeNull()
  })
})

describe('initEditForm', () => {
  it('marks EDIT mode and stores the activity uid', () => {
    const mf: GraphNode = {
      ...buildNode('GO:0003674', 'molecular function'),
      rootTypes: [RootTypes.MOLECULAR_FUNCTION],
    }
    const activity: Activity = buildActivity('act-1', [mf])

    const next = reducer(initial, initEditForm({ activity, activityType: 'activity' }))
    expect(next.mode).toBe(FormMode.EDIT)
    expect(next.existingActivityUid).toBe('act-1')
    expect(next.activityType).toBe('activity')
    expect(next.root?.uid).toBe(mf.uid)
  })
})

describe('loadActivity', () => {
  it('infers "molecule" from ActivityType.MOLECULE', () => {
    const node: GraphNode = {
      ...buildNode('CHEBI:1', 'a molecule'),
      rootTypes: [RootTypes.CHEMICAL_ENTITY],
    }
    const activity: Activity = { ...buildActivity('act-mol', [node]), type: ActivityType.MOLECULE }
    const next = reducer(initial, loadActivity(activity))
    expect(next.activityType).toBe('molecule')
    expect(next.mode).toBe(FormMode.EDIT)
  })

  it('infers "proteinComplex" from ActivityType.PROTEIN_COMPLEX', () => {
    const node: GraphNode = {
      ...buildNode('GO:0003674', 'mf'),
      rootTypes: [RootTypes.MOLECULAR_FUNCTION],
    }
    const activity: Activity = {
      ...buildActivity('act-cx', [node]),
      type: ActivityType.PROTEIN_COMPLEX,
    }
    expect(reducer(initial, loadActivity(activity)).activityType).toBe('proteinComplex')
  })

  it('infers "activity" for all other ActivityType values', () => {
    const node: GraphNode = {
      ...buildNode('GO:0003674', 'mf'),
      rootTypes: [RootTypes.MOLECULAR_FUNCTION],
    }
    const activity: Activity = buildActivity('act-act', [node])
    expect(reducer(initial, loadActivity(activity)).activityType).toBe('activity')
  })
})

describe('mutating reducers on a hydrated form', () => {
  let state: ActivityFormState

  beforeEach(() => {
    state = reducer(initial, initCreateForm('activity'))
  })

  it('updateTerm sets a term on a node and flips isDirty', () => {
    const root = state.root!
    const golr = {
      id: 'GO:0001',
      label: 'something',
      link: '',
      description: '',
      isObsolete: false,
      replacedBy: '',
      rootTypes: [],
      xref: '',
      notAnnotatable: false,
      neighborhoodGraphJson: '',
    }
    const next = reducer(state, updateTerm({ uid: root.uid, term: golr }))
    expect(next.root!.term).toEqual(golr)
    expect(next.isDirty).toBe(true)
  })

  it('updateTerm with unknown uid is a no-op', () => {
    const next = reducer(state, updateTerm({ uid: 'no-such-uid', term: null }))
    expect(next.isDirty).toBe(false)
  })

  it('toggleComplement flips the flag', () => {
    const rootUid = state.root!.uid
    const after = reducer(state, toggleComplement({ uid: rootUid }))
    expect(after.root!.isComplement).toBe(true)
    const back = reducer(after, toggleComplement({ uid: rootUid }))
    expect(back.root!.isComplement).toBe(false)
  })

  it('updateRelationPredicate replaces the predicate on a relation', () => {
    const rel = state.root!.relations[0]
    const newPredicate = { id: 'RO:0002092', label: 'happens during' }
    const next = reducer(
      state,
      updateRelationPredicate({ uid: rel.uid, predicate: newPredicate })
    )
    expect(next.root!.relations[0].predicate).toEqual(newPredicate)
    expect(next.isDirty).toBe(true)
  })

  it('addEvidenceForm appends a fresh evidence to a relation', () => {
    const rel = state.root!.relations[0]
    const before = rel.evidence.length
    const next = reducer(state, addEvidenceForm({ relationUid: rel.uid }))
    expect(next.root!.relations[0].evidence).toHaveLength(before + 1)
    expect(next.isDirty).toBe(true)
  })

  it('removeEvidenceForm drops the specified evidence', () => {
    const rel = state.root!.relations[0]
    const evUid = rel.evidence[0].uid
    const next = reducer(state, removeEvidenceForm({ relationUid: rel.uid, evidenceUid: evUid }))
    expect(next.root!.relations[0].evidence.some(e => e.uid === evUid)).toBe(false)
    expect(next.isDirty).toBe(true)
  })

  it('updateEvidenceForm sets evidenceCode (object)', () => {
    const rel = state.root!.relations[0]
    const ev = rel.evidence[0]
    const next = reducer(
      state,
      updateEvidenceForm({
        relationUid: rel.uid,
        evidenceUid: ev.uid,
        field: 'evidenceCode',
        value: { id: 'ECO:0000314', label: 'IDA' },
      })
    )
    const updated = next.root!.relations[0].evidence[0]
    expect(updated.evidenceCode).toEqual({ id: 'ECO:0000314', label: 'IDA' })
  })

  it('updateEvidenceForm sets reference (string)', () => {
    const rel = state.root!.relations[0]
    const ev = rel.evidence[0]
    const next = reducer(
      state,
      updateEvidenceForm({
        relationUid: rel.uid,
        evidenceUid: ev.uid,
        field: 'reference',
        value: 'PMID:42',
      })
    )
    expect(next.root!.relations[0].evidence[0].reference).toBe('PMID:42')
  })

  it('updateEvidenceForm sets withFrom (string)', () => {
    const rel = state.root!.relations[0]
    const ev = rel.evidence[0]
    const next = reducer(
      state,
      updateEvidenceForm({
        relationUid: rel.uid,
        evidenceUid: ev.uid,
        field: 'withFrom',
        value: 'UniProtKB:P12345',
      })
    )
    expect(next.root!.relations[0].evidence[0].withFrom).toBe('UniProtKB:P12345')
  })

  it('updateEvidenceForm ignores mismatched field/value types', () => {
    const rel = state.root!.relations[0]
    const ev = rel.evidence[0]
    // reference field with object value — should be ignored
    const next = reducer(
      state,
      updateEvidenceForm({
        relationUid: rel.uid,
        evidenceUid: ev.uid,
        field: 'reference',
        value: { id: 'x', label: 'y' },
      })
    )
    expect(next.root!.relations[0].evidence[0].reference).toBe(ev.reference)
  })

  it('setNodeEvidences sets evidence on the relation whose target matches uid', () => {
    // The "enabled by (GP)" target sits under the MF root.
    const gpTarget = findByCategory(state.root!, RootTypes.MOLECULAR_ENTITY)!
    const evidences: EvidenceForm[] = [
      { uid: 'e1', evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:1', withFrom: '' },
    ]
    const next = reducer(state, setNodeEvidences({ uid: gpTarget.uid, evidences }))
    const enabledBy = findRelationByPredicate(next.root!, 'RO:0002333')!
    expect(enabledBy.evidence).toEqual(evidences)
    expect(next.isDirty).toBe(true)
  })

  it('setRelationEvidences sets evidence on a relation by relation uid', () => {
    const rel = state.root!.relations[0]
    const evidences: EvidenceForm[] = [
      { uid: 'e1', evidenceCode: { id: 'ECO:0000353', label: 'IPI' }, reference: 'PMID:2', withFrom: '' },
    ]
    const next = reducer(state, setRelationEvidences({ relationUid: rel.uid, evidences }))
    expect(next.root!.relations[0].evidence).toEqual(evidences)
  })

  it('addRelationForm pushes a new relation under the parent', () => {
    const rootUid = state.root!.uid
    const before = state.root!.relations.length
    const next = reducer(
      state,
      addRelationForm({
        parentTermUid: rootUid,
        predicate: { id: 'RO:0002233', label: 'has input' },
        nodeType: RootTypes.MOLECULAR_ENTITY,
        label: 'has input (GP)',
        rootTypes: [RootTypes.MOLECULAR_ENTITY],
        aspect: null,
      })
    )
    expect(next.root!.relations).toHaveLength(before + 1)
    const added = next.root!.relations[before]
    expect(added.predicate.id).toBe('RO:0002233')
    expect(added.target.category).toBe(RootTypes.MOLECULAR_ENTITY)
    expect(added.target.canDelete).toBe(true)
    expect(added.evidence).toHaveLength(1)
    expect(next.isDirty).toBe(true)
  })

  it('removeRelationForm removes the relation from the parent', () => {
    const rootUid = state.root!.uid
    const targetRel = state.root!.relations[0]
    const next = reducer(
      state,
      removeRelationForm({ parentTermUid: rootUid, relationUid: targetRel.uid })
    )
    expect(next.root!.relations.some(r => r.uid === targetRel.uid)).toBe(false)
    expect(next.isDirty).toBe(true)
  })

  it('fillRootTerm sets the BP root + ND evidence on the part_of relation', () => {
    const partOfRel = findRelationByPredicate(state.root!, 'BFO:0000050')!
    const bpNode = partOfRel.target
    expect(bpNode.aspect).toBe(Aspect.BIOLOGICAL_PROCESS)

    const next = reducer(
      state,
      fillRootTerm({ termUid: bpNode.uid, relationUid: partOfRel.uid })
    )
    const updatedRel = findRelationByPredicate(next.root!, 'BFO:0000050')!
    expect(updatedRel.target.term?.id).toBe(RootTypes.BIOLOGICAL_PROCESS)
    expect(updatedRel.target.term?.label).toBe('biological_process')
    expect(updatedRel.evidence).toHaveLength(1)
    expect(updatedRel.evidence[0].evidenceCode.id).toBe('ECO:0000307')
    expect(updatedRel.evidence[0].reference).toBe('GO_REF:0000015')
    expect(next.isDirty).toBe(true)
  })

  it('fillRootTerm is a no-op for a node whose aspect has no ROOT_NODES entry', () => {
    // GP target has aspect=null → no rootEntry match
    const gpRel = findRelationByPredicate(state.root!, 'RO:0002333')! // ENABLED_BY
    const gpNode = gpRel.target
    expect(gpNode.aspect).toBeNull()

    const next = reducer(
      state,
      fillRootTerm({ termUid: gpNode.uid, relationUid: gpRel.uid })
    )
    const stillRel = findRelationByPredicate(next.root!, 'RO:0002333')!
    expect(stillRel.target.term).toBeNull()
    expect(next.isDirty).toBe(false)
  })

  it('fillUnknownEnabler sets the generic protein (PR:000000001) on the enabler node', () => {
    // The enabler is the ENABLED_BY target (a Gene Product, aspect null).
    const gpNode = findRelationByPredicate(state.root!, 'RO:0002333')!.target
    expect(gpNode.term).toBeNull()

    const next = reducer(state, fillUnknownEnabler({ termUid: gpNode.uid }))
    const updated = findRelationByPredicate(next.root!, 'RO:0002333')!.target
    expect(updated.term).toEqual({ id: 'PR:000000001', label: 'protein' })
    expect(next.isDirty).toBe(true)
  })

  it('fillUnknownEnabler with an unknown uid is a no-op', () => {
    const next = reducer(state, fillUnknownEnabler({ termUid: 'no-such-uid' }))
    expect(next.isDirty).toBe(false)
    expect(next).toBe(state)
  })

  it('addISSEvidence replaces the relation evidence with a single ISS + GO_REF row', () => {
    // Seed an extra evidence row first so we can prove the reducer replaces, not appends.
    const rel = state.root!.relations[0]
    const seeded = reducer(state, addEvidenceForm({ relationUid: rel.uid }))
    expect(seeded.root!.relations[0].evidence.length).toBeGreaterThan(1)

    const next = reducer(seeded, addISSEvidence({ relationUid: rel.uid }))
    const replaced = next.root!.relations[0].evidence
    expect(replaced).toHaveLength(1)
    expect(replaced[0].evidenceCode.id).toBe('ECO:0000250')
    expect(replaced[0].reference).toBe('GO_REF:0000024')
    expect(replaced[0].withFrom).toBe('')
    expect(next.isDirty).toBe(true)
  })

  it('addISSEvidence is a no-op when relationUid does not match', () => {
    const next = reducer(state, addISSEvidence({ relationUid: 'no-such-relation' }))
    expect(next).toBe(state)
  })

  it('addISOEvidence replaces the relation evidence with a single ISO + GO_REF row', () => {
    const rel = state.root!.relations[0]
    const seeded = reducer(state, addEvidenceForm({ relationUid: rel.uid }))
    expect(seeded.root!.relations[0].evidence.length).toBeGreaterThan(1)

    const next = reducer(seeded, addISOEvidence({ relationUid: rel.uid }))
    const replaced = next.root!.relations[0].evidence
    expect(replaced).toHaveLength(1)
    expect(replaced[0].evidenceCode.id).toBe('ECO:0000266')
    expect(replaced[0].reference).toBe('GO_REF:0000024')
    expect(replaced[0].withFrom).toBe('')
    expect(next.isDirty).toBe(true)
  })

  it('addISOEvidence is a no-op when relationUid does not match', () => {
    const next = reducer(state, addISOEvidence({ relationUid: 'no-such-relation' }))
    expect(next).toBe(state)
  })

  it('addICEvidence replaces the relation evidence with a single IC + GO_REF row', () => {
    const rel = state.root!.relations[0]
    const seeded = reducer(state, addEvidenceForm({ relationUid: rel.uid }))
    expect(seeded.root!.relations[0].evidence.length).toBeGreaterThan(1)

    const next = reducer(seeded, addICEvidence({ relationUid: rel.uid }))
    const replaced = next.root!.relations[0].evidence
    expect(replaced).toHaveLength(1)
    expect(replaced[0].evidenceCode.id).toBe('ECO:0000305')
    expect(replaced[0].reference).toBe('GO_REF:0000036')
    expect(replaced[0].withFrom).toBe('')
    expect(next.isDirty).toBe(true)
  })

  it('addICEvidence is a no-op when relationUid does not match', () => {
    const next = reducer(state, addICEvidence({ relationUid: 'no-such-relation' }))
    expect(next).toBe(state)
  })

  it('clearNodeValues nulls the term, clears complement, and resets evidence', () => {
    // Seed the node with a value, complement, and bad evidence first
    const rel = state.root!.relations[0]
    const node = rel.target
    let seeded = reducer(
      state,
      updateTerm({
        uid: node.uid,
        term: {
          id: 'X:1',
          label: 'whatever',
          link: '',
          description: '',
          isObsolete: false,
          replacedBy: '',
          rootTypes: [],
          xref: '',
          notAnnotatable: false,
          neighborhoodGraphJson: '',
        },
      })
    )
    seeded = reducer(seeded, toggleComplement({ uid: node.uid }))

    const cleared = reducer(seeded, clearNodeValues({ termUid: node.uid, relationUid: rel.uid }))
    const clearedRel = cleared.root!.relations[0]
    expect(clearedRel.target.term).toBeNull()
    expect(clearedRel.target.isComplement).toBe(false)
    expect(clearedRel.evidence).toHaveLength(1)
    expect(clearedRel.evidence[0].evidenceCode).toEqual({ id: '', label: '' })
    expect(cleared.isDirty).toBe(true)
  })

  it('setErrors replaces the errors array', () => {
    const errors = [{ uid: 'u', field: 'f', message: 'oops' }]
    const next = reducer(state, setErrors(errors))
    expect(next.errors).toEqual(errors)
  })

  it('resetForm restores the initial state', () => {
    const next = reducer(state, resetForm())
    expect(next).toEqual(initial)
  })
})

describe('activityFormSlice selectors', () => {
  it('expose slice subfields from RootState shape', () => {
    const root: TermNode = {
      uid: 'root',
      category: RootTypes.MOLECULAR_FUNCTION,
      label: 'mf',
      term: null,
      aspect: null,
      rootTypes: [],
      isComplement: false,
      canDelete: false,
      required: true,
      relations: [],
    }
    const errors = [{ uid: 'a', field: 'b', message: 'c' }]
    const state = {
      activityForm: {
        activityType: 'activity' as const,
        mode: FormMode.EDIT,
        existingActivityUid: 'act-1',
        root,
        isDirty: true,
        errors,
      },
    }

    expect(selectActivityForm(state as Parameters<typeof selectActivityForm>[0])).toBe(state.activityForm)
    expect(selectFormRoot(state as Parameters<typeof selectFormRoot>[0])).toBe(root)
    expect(selectFormMode(state as Parameters<typeof selectFormMode>[0])).toBe(FormMode.EDIT)
    expect(selectFormType(state as Parameters<typeof selectFormType>[0])).toBe('activity')
    expect(selectFormErrors(state as Parameters<typeof selectFormErrors>[0])).toBe(errors)
    expect(selectExistingActivityUid(state as Parameters<typeof selectExistingActivityUid>[0])).toBe('act-1')
  })
})
