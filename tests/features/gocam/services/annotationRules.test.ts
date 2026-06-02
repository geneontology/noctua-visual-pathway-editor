import { describe, it, expect } from 'vitest'
import {
  canAddISSEvidence,
  isSearchAnnotationsEnabledFor,
} from '@/features/gocam/services/annotationRules'
import { ActivityType, Aspect } from '@/features/gocam/models/cam'

describe('canAddISSEvidence', () => {
  it('returns true when aspect is set and activityType is not MOLECULE', () => {
    expect(canAddISSEvidence(Aspect.MOLECULAR_FUNCTION, ActivityType.ACTIVITY)).toBe(true)
    expect(canAddISSEvidence(Aspect.BIOLOGICAL_PROCESS, ActivityType.ACTIVITY)).toBe(true)
    expect(canAddISSEvidence(Aspect.CELLULAR_COMPONENT, ActivityType.PROTEIN_COMPLEX)).toBe(true)
  })

  it('returns false when aspect is null (the node has no GO aspect, e.g. GP, chemical, phase)', () => {
    expect(canAddISSEvidence(null, ActivityType.ACTIVITY)).toBe(false)
  })

  it('returns false when aspect is undefined', () => {
    expect(canAddISSEvidence(undefined, ActivityType.ACTIVITY)).toBe(false)
  })

  it('returns false in MOLECULE activities even if aspect is set (e.g. CC child of chemical)', () => {
    expect(canAddISSEvidence(Aspect.CELLULAR_COMPONENT, ActivityType.MOLECULE)).toBe(false)
    expect(canAddISSEvidence(Aspect.MOLECULAR_FUNCTION, ActivityType.MOLECULE)).toBe(false)
  })

  it('treats unknown activityType as non-molecule (allows ISS)', () => {
    expect(canAddISSEvidence(Aspect.MOLECULAR_FUNCTION, undefined)).toBe(true)
    expect(canAddISSEvidence(Aspect.MOLECULAR_FUNCTION, null)).toBe(true)
    expect(canAddISSEvidence(Aspect.MOLECULAR_FUNCTION, 'someUnknownType')).toBe(true)
  })

  it('returns false when both inputs are nullish', () => {
    expect(canAddISSEvidence(null, null)).toBe(false)
    expect(canAddISSEvidence(undefined, undefined)).toBe(false)
  })
})

describe('isSearchAnnotationsEnabledFor', () => {
  // Scope per the review notes (downloads/notes lines 30-46):
  // - Protein-containing complex form: remove 'Search annotation'
  // - Chemical form: remove 'Search annotation'
  // - Activity Unit form: keep it (the default)
  it('returns true for the regular Activity Unit form', () => {
    expect(isSearchAnnotationsEnabledFor(ActivityType.ACTIVITY)).toBe(true)
  })

  it('returns false for protein-complex forms', () => {
    expect(isSearchAnnotationsEnabledFor(ActivityType.PROTEIN_COMPLEX)).toBe(false)
  })

  it('returns false for chemical / molecule forms', () => {
    expect(isSearchAnnotationsEnabledFor(ActivityType.MOLECULE)).toBe(false)
  })

  it('defaults to enabled for unknown / uninitialized activity types', () => {
    // The row-level EntityRow further gates by node.aspect, so it is safe to
    // default enabled here — fail-open rather than fail-silent.
    expect(isSearchAnnotationsEnabledFor(null)).toBe(true)
    expect(isSearchAnnotationsEnabledFor(undefined)).toBe(true)
    expect(isSearchAnnotationsEnabledFor('something-else')).toBe(true)
  })
})
