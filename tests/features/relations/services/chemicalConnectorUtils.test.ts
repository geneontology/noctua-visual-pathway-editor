import { describe, it, expect } from 'vitest'
import { categorizeParticipants } from '@/features/relations/services/chemicalConnectorUtils'

describe('categorizeParticipants', () => {
  it('returns three empty arrays when both inputs are empty', () => {
    expect(categorizeParticipants([], [])).toEqual({
      common: [],
      subjectOnly: [],
      objectOnly: [],
    })
  })

  it('splits subject/object into three buckets by id', () => {
    const subject = [
      { id: 'CHEBI:1', label: 'glucose' },
      { id: 'CHEBI:2', label: 'ATP' },
      { id: 'CHEBI:3', label: 'pyruvate' },
    ]
    const object = [
      { id: 'CHEBI:2', label: 'ATP' },
      { id: 'CHEBI:3', label: 'pyruvate' },
      { id: 'CHEBI:4', label: 'lactate' },
    ]
    const out = categorizeParticipants(subject, object)

    expect(out.common.map(p => p.id)).toEqual(['CHEBI:2', 'CHEBI:3'])
    expect(out.subjectOnly.map(p => p.id)).toEqual(['CHEBI:1'])
    expect(out.objectOnly.map(p => p.id)).toEqual(['CHEBI:4'])
  })

  it('marks `common` participants as selected:true by default', () => {
    const subject = [{ id: 'CHEBI:1', label: 'a' }]
    const object = [{ id: 'CHEBI:1', label: 'a' }]
    const out = categorizeParticipants(subject, object)
    expect(out.common).toEqual([{ id: 'CHEBI:1', label: 'a', selected: true }])
  })

  it('marks `subjectOnly` and `objectOnly` as selected:false', () => {
    const subject = [{ id: 'CHEBI:1', label: 'a' }]
    const object = [{ id: 'CHEBI:2', label: 'b' }]
    const out = categorizeParticipants(subject, object)
    expect(out.subjectOnly[0].selected).toBe(false)
    expect(out.objectOnly[0].selected).toBe(false)
  })

  it('preserves the subject ordering for both common and subjectOnly buckets', () => {
    const subject = [
      { id: 'C', label: 'C' },
      { id: 'A', label: 'A' },
      { id: 'B', label: 'B' },
    ]
    const object = [{ id: 'A', label: 'A' }]
    const out = categorizeParticipants(subject, object)
    expect(out.common.map(p => p.id)).toEqual(['A'])
    expect(out.subjectOnly.map(p => p.id)).toEqual(['C', 'B'])
  })

  it('does not mutate the input arrays', () => {
    const subject = [{ id: '1', label: 'x' }]
    const object = [{ id: '1', label: 'x' }]
    const subjectCopy = JSON.parse(JSON.stringify(subject))
    const objectCopy = JSON.parse(JSON.stringify(object))
    categorizeParticipants(subject, object)
    expect(subject).toEqual(subjectCopy)
    expect(object).toEqual(objectCopy)
  })
})
