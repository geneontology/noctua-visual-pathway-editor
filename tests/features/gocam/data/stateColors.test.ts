import { describe, it, expect } from 'vitest'
import { getStateColor } from '@/features/gocam/data/stateColors'

describe('getStateColor', () => {
  it('returns the development palette', () => {
    const c = getStateColor('development')
    expect(c.chip).toContain('orange')
    expect(c.circle).toContain('orange')
  })

  it('returns the production palette', () => {
    const c = getStateColor('production')
    expect(c.chip).toContain('green')
    expect(c.circle).toContain('green')
  })

  it('returns the review palette', () => {
    const c = getStateColor('review')
    expect(c.chip).toContain('lime')
    expect(c.circle).toContain('lime')
  })

  it('returns the delete palette', () => {
    const c = getStateColor('delete')
    expect(c.chip).toContain('red')
    expect(c.circle).toContain('red')
  })

  it('returns the gray default palette for unknown states', () => {
    const c = getStateColor('something-unknown')
    expect(c.chip).toContain('gray')
    expect(c.circle).toContain('gray')
  })

  it('returns the gray default palette for undefined / empty input', () => {
    expect(getStateColor(undefined)).toEqual(getStateColor('definitely-not-a-real-state'))
    expect(getStateColor('')).toEqual(getStateColor('definitely-not-a-real-state'))
  })

  it('every known state returns both chip and circle class strings', () => {
    for (const s of ['development', 'production', 'review', 'delete']) {
      const c = getStateColor(s)
      expect(typeof c.chip).toBe('string')
      expect(typeof c.circle).toBe('string')
      expect(c.chip.length).toBeGreaterThan(0)
      expect(c.circle.length).toBeGreaterThan(0)
    }
  })
})
