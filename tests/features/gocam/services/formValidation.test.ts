import { describe, it, expect } from 'vitest'
import { validateActivityForm } from '@/features/gocam/services/formValidation'
import { FormMode } from '@/features/gocam/models/formModels'
import type {
  ActivityFormState,
  TermNode,
  RelationNode,
  EvidenceForm,
} from '@/features/gocam/models/formModels'
import type { GOlrResponse } from '@/features/search/models/search'

// ── Test helpers ────────────────────────────────────────────────────

const makeTerm = (id = 'GO:1', label = 'Foo'): GOlrResponse => ({
  id,
  label,
  link: '',
  description: '',
  isObsolete: false,
  replacedBy: '',
  rootTypes: [],
  xref: '',
  notAnnotatable: false,
  neighborhoodGraphJson: '',
})

const makeEvidence = (overrides: Partial<EvidenceForm> = {}): EvidenceForm => ({
  uid: 'ev-1',
  evidenceCode: { id: 'ECO:0000314', label: 'IDA' },
  reference: 'PMID:12345',
  withFrom: '',
  ...overrides,
})

const makeNode = (overrides: Partial<TermNode> = {}): TermNode => ({
  uid: 'node-1',
  category: 'GO:0003674',
  label: 'molecular function',
  term: null,
  aspect: null,
  rootTypes: [],
  isComplement: false,
  canDelete: false,
  required: false,
  relations: [],
  ...overrides,
})

const makeRelation = (overrides: Partial<RelationNode> = {}): RelationNode => ({
  uid: 'rel-1',
  predicate: { id: 'RO:0002333', label: 'enabled by' },
  target: makeNode({ uid: 'tgt-1' }),
  evidence: [makeEvidence()],
  ...overrides,
})

const wrap = (root: TermNode | null): ActivityFormState => ({
  activityType: 'activity',
  mode: FormMode.CREATE,
  existingActivityUid: null,
  root,
  isDirty: false,
  errors: [],
})

// ── Tests ───────────────────────────────────────────────────────────

describe('validateActivityForm — required nodes', () => {
  it('emits an error when the form has no root', () => {
    const errors = validateActivityForm(wrap(null))
    expect(errors).toEqual([{ uid: '', field: 'root', message: 'No activity form loaded' }])
  })

  it('flags required nodes that have no term', () => {
    const root = makeNode({ required: true, label: 'MF' })
    const errors = validateActivityForm(wrap(root))
    expect(errors).toEqual([
      { uid: root.uid, field: 'term', message: '"MF" is required' },
    ])
  })

  it('does not flag required nodes that have a term set', () => {
    const root = makeNode({ required: true, term: makeTerm() })
    expect(validateActivityForm(wrap(root))).toEqual([])
  })

  it('does not flag non-required empty nodes', () => {
    const root = makeNode({ required: false })
    expect(validateActivityForm(wrap(root))).toEqual([])
  })
})

describe('validateActivityForm — evidence rules', () => {
  it('does not validate evidence when target has no term', () => {
    const root = makeNode({
      term: makeTerm(),
      required: true,
      relations: [makeRelation({ evidence: [] })], // target has no term, evidence not checked
    })
    expect(validateActivityForm(wrap(root))).toEqual([])
  })

  it('flags targets with a term but zero evidence', () => {
    const target = makeNode({ uid: 'tgt-1', label: 'GP', term: makeTerm('GP:1', 'Gene') })
    const rel = makeRelation({ uid: 'rel-1', target, evidence: [] })
    const root = makeNode({ term: makeTerm(), relations: [rel] })
    const errors = validateActivityForm(wrap(root))
    expect(errors).toEqual([
      { uid: 'rel-1', field: 'evidence', message: 'GP requires at least one evidence' },
    ])
  })

  it('skips evidence checks when the target has skipEvidenceCheck', () => {
    const target = makeNode({
      uid: 'tgt-1',
      label: 'GP',
      term: makeTerm('GP:1', 'Gene'),
      skipEvidenceCheck: true,
    })
    const rel = makeRelation({ target, evidence: [] })
    const root = makeNode({ term: makeTerm(), relations: [rel] })
    expect(validateActivityForm(wrap(root))).toEqual([])
  })

  it('flags an evidence with a code but missing reference', () => {
    const target = makeNode({ uid: 'tgt-1', label: 'GP', term: makeTerm('GP:1', 'Gene') })
    const rel = makeRelation({
      target,
      evidence: [makeEvidence({ uid: 'ev-a', reference: '' })],
    })
    const root = makeNode({ term: makeTerm(), relations: [rel] })
    const errors = validateActivityForm(wrap(root))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({ uid: 'ev-a', field: 'reference' })
    expect(errors[0].message).toContain('no reference')
    expect(errors[0].message).toContain('evidence(1)')
  })
})

describe('validateActivityForm — reference format', () => {
  const validRefs = ['PMID:12345', 'DOI:10.1000/x', 'GO_REF:0000024']
  for (const ref of validRefs) {
    it(`accepts "${ref}"`, () => {
      const target = makeNode({ uid: 'tgt-1', label: 'GP', term: makeTerm('GP:1', 'Gene') })
      const rel = makeRelation({ target, evidence: [makeEvidence({ reference: ref })] })
      const root = makeNode({ term: makeTerm(), relations: [rel] })
      expect(validateActivityForm(wrap(root))).toEqual([])
    })
  }

  const invalidRefs = ['12345', 'BOGUS:1', 'PMID', '']
  for (const ref of invalidRefs) {
    it(`rejects "${ref}"`, () => {
      const target = makeNode({ uid: 'tgt-1', label: 'GP', term: makeTerm('GP:1', 'Gene') })
      const rel = makeRelation({ target, evidence: [makeEvidence({ reference: ref })] })
      const root = makeNode({ term: makeTerm(), relations: [rel] })
      const errors = validateActivityForm(wrap(root))
      // empty string is reported as "no reference"; the others as format
      expect(errors.length).toBeGreaterThan(0)
    })
  }

  it('reports "DB:accession format" for a non-empty bad reference', () => {
    const target = makeNode({ uid: 'tgt-1', label: 'GP', term: makeTerm('GP:1', 'Gene') })
    const rel = makeRelation({
      target,
      evidence: [makeEvidence({ uid: 'ev-x', reference: 'BAD:1' })],
    })
    const root = makeNode({ term: makeTerm(), relations: [rel] })
    const errors = validateActivityForm(wrap(root))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({ uid: 'ev-x', field: 'reference' })
    expect(errors[0].message).toContain('DB:accession')
  })
})

describe('validateActivityForm — withFrom format', () => {
  it('accepts a colon-containing withFrom', () => {
    const target = makeNode({ uid: 'tgt-1', label: 'GP', term: makeTerm('GP:1', 'Gene') })
    const rel = makeRelation({
      target,
      evidence: [makeEvidence({ withFrom: 'UniProtKB:P12345' })],
    })
    const root = makeNode({ term: makeTerm(), relations: [rel] })
    expect(validateActivityForm(wrap(root))).toEqual([])
  })

  it('rejects a withFrom without a colon', () => {
    const target = makeNode({ uid: 'tgt-1', label: 'GP', term: makeTerm('GP:1', 'Gene') })
    const rel = makeRelation({
      target,
      evidence: [makeEvidence({ uid: 'ev-w', withFrom: 'P12345' })],
    })
    const root = makeNode({ term: makeTerm(), relations: [rel] })
    const errors = validateActivityForm(wrap(root))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({ uid: 'ev-w', field: 'withFrom' })
  })

  it('empty withFrom is fine', () => {
    const target = makeNode({ uid: 'tgt-1', label: 'GP', term: makeTerm('GP:1', 'Gene') })
    const rel = makeRelation({ target, evidence: [makeEvidence({ withFrom: '' })] })
    const root = makeNode({ term: makeTerm(), relations: [rel] })
    expect(validateActivityForm(wrap(root))).toEqual([])
  })
})

describe('validateActivityForm — tree walking', () => {
  it('reports errors from deeply nested relations with correct positions', () => {
    // root → child (has term, two bad evidences)
    const child = makeNode({ uid: 'child', label: 'BP', term: makeTerm('GO:9', 'BP') })
    const rel = makeRelation({
      uid: 'rel-deep',
      target: child,
      evidence: [
        makeEvidence({ uid: 'ev1', reference: 'BAD:x' }),
        makeEvidence({ uid: 'ev2', reference: 'PMID:1', withFrom: 'no-colon' }),
      ],
    })
    const root = makeNode({ term: makeTerm(), relations: [rel] })

    const errors = validateActivityForm(wrap(root))
    // ev1 has bad-format ref; ev2 has bad withFrom
    expect(errors.map(e => e.uid)).toEqual(['ev1', 'ev2'])
    expect(errors[0].message).toContain('evidence(1)')
    expect(errors[1].message).toContain('evidence(2)')
  })

  it('accumulates errors from multiple branches', () => {
    const a = makeNode({ uid: 'a', label: 'A', required: true })
    const b = makeNode({ uid: 'b', label: 'B', required: true })
    const root = makeNode({
      term: makeTerm(),
      required: true,
      relations: [
        makeRelation({ uid: 'r-a', target: a }),
        makeRelation({ uid: 'r-b', target: b }),
      ],
    })
    const errors = validateActivityForm(wrap(root))
    expect(errors.map(e => e.uid).sort()).toEqual(['a', 'b'])
  })
})
