import { describe, it, expect } from 'vitest'
import { getEdgeColor } from '@/features/pathway/graph/edgeDisplayService'
import { Relations } from '@/@noctua.core/models/relations'

describe('getEdgeColor', () => {
  it('returns "green" for positive-regulation relations', () => {
    expect(getEdgeColor(Relations.POSITIVELY_REGULATES)).toBe('green')
    expect(getEdgeColor(Relations.DIRECTLY_POSITIVELY_REGULATES)).toBe('green')
    expect(getEdgeColor(Relations.CAUSALLY_UPSTREAM_OF_POSITIVE_EFFECT)).toBe('green')
    expect(getEdgeColor(Relations.CAUSALLY_UPSTREAM_OF_OR_WITHIN_POSITIVE_EFFECT)).toBe('green')
    expect(getEdgeColor(Relations.IS_SMALL_MOLECULE_ACTIVATOR_OF)).toBe('green')
    expect(getEdgeColor(Relations.INDIRECTLY_POSITIVELY_REGULATES)).toBe('green')
  })

  it('returns "red" for negative-regulation relations', () => {
    expect(getEdgeColor(Relations.NEGATIVELY_REGULATES)).toBe('red')
    expect(getEdgeColor(Relations.DIRECTLY_NEGATIVELY_REGULATES)).toBe('red')
    expect(getEdgeColor(Relations.CAUSALLY_UPSTREAM_OF_NEGATIVE_EFFECT)).toBe('red')
    expect(getEdgeColor(Relations.CAUSALLY_UPSTREAM_OF_OR_WITHIN_NEGATIVE_EFFECT)).toBe('red')
    expect(getEdgeColor(Relations.IS_SMALL_MOLECULE_INHIBITOR_OF)).toBe('red')
    expect(getEdgeColor(Relations.INDIRECTLY_NEGATIVELY_REGULATES)).toBe('red')
  })

  it('returns "grey" for neutral relations', () => {
    expect(getEdgeColor(Relations.CAUSALLY_UPSTREAM_OF)).toBe('grey')
    expect(getEdgeColor(Relations.CAUSALLY_UPSTREAM_OF_OR_WITHIN)).toBe('grey')
    expect(getEdgeColor(Relations.CONSTITUTIVELY_UPSTREAM_OF)).toBe('grey')
    expect(getEdgeColor(Relations.PROVIDES_INPUT_FOR)).toBe('grey')
    expect(getEdgeColor(Relations.REMOVES_INPUT_FOR)).toBe('grey')
  })

  it('returns "black" for unrecognized relations (default fallback)', () => {
    expect(getEdgeColor('RO:0001234')).toBe('black')
    expect(getEdgeColor('')).toBe('black')
    expect(getEdgeColor('not-a-relation')).toBe('black')
  })
})
