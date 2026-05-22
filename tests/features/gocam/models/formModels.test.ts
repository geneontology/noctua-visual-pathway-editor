import { describe, it, expect } from 'vitest'
import {
  createEvidenceForm,
  createAutoPopulatedEvidence,
} from '@/features/gocam/models/formModels'
import { EVIDENCE_AUTO_POPULATE } from '@/features/gocam/data/camConstants'

describe('createEvidenceForm', () => {
  it('returns an empty evidence row with a fresh uid', () => {
    const ev = createEvidenceForm()
    expect(ev.uid).toMatch(/^[0-9a-f-]{36}$/)
    expect(ev.evidenceCode).toEqual({ id: '', label: '' })
    expect(ev.reference).toBe('')
    expect(ev.withFrom).toBe('')
  })

  it('produces a distinct uid on each call', () => {
    expect(createEvidenceForm().uid).not.toBe(createEvidenceForm().uid)
  })
})

describe('createAutoPopulatedEvidence', () => {
  it('fills the ISS variant from EVIDENCE_AUTO_POPULATE.iss (ECO:0000250 + GO_REF:0000024)', () => {
    const ev = createAutoPopulatedEvidence('iss')
    expect(ev.evidenceCode).toEqual({
      id: EVIDENCE_AUTO_POPULATE.iss.evidence.id,
      label: EVIDENCE_AUTO_POPULATE.iss.evidence.label,
    })
    expect(ev.evidenceCode.id).toBe('ECO:0000250')
    expect(ev.reference).toBe('GO_REF:0000024')
    expect(ev.withFrom).toBe('')
    expect(ev.uid).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('fills the ND variant from EVIDENCE_AUTO_POPULATE.nd (ECO:0000307 + GO_REF:0000015)', () => {
    const ev = createAutoPopulatedEvidence('nd')
    expect(ev.evidenceCode.id).toBe('ECO:0000307')
    expect(ev.reference).toBe('GO_REF:0000015')
    expect(ev.withFrom).toBe('')
  })

  it('produces a distinct uid on each call', () => {
    expect(createAutoPopulatedEvidence('iss').uid).not.toBe(
      createAutoPopulatedEvidence('iss').uid
    )
  })

  it('stays in sync with EVIDENCE_AUTO_POPULATE for every defined variant', () => {
    for (const variant of Object.keys(EVIDENCE_AUTO_POPULATE) as Array<
      keyof typeof EVIDENCE_AUTO_POPULATE
    >) {
      const ev = createAutoPopulatedEvidence(variant)
      const source = EVIDENCE_AUTO_POPULATE[variant]
      expect(ev.evidenceCode.id).toBe(source.evidence.id)
      expect(ev.evidenceCode.label).toBe(source.evidence.label)
      expect(ev.reference).toBe(source.reference)
    }
  })
})
