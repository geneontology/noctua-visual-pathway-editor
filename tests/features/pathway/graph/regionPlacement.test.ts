import { describe, it, expect } from 'vitest'
import { RegionPlacement } from '@/features/pathway/graph/dropPlacement'
import type { RenderedActivity } from '@/features/pathway/graph/dropPlacement'

const rendered = (...pairs: [string, string | null][]): RenderedActivity[] =>
  pairs.map(([uid, termId]) => ({ uid, termId }))

describe('RegionPlacement', () => {
  it('starts unarmed and places nothing', () => {
    const rp = new RegionPlacement()
    expect(rp.isArmed).toBe(false)
    expect(rp.resolve(rendered(['a', 'GO:1']))).toBeNull()
  })

  it('places nothing until activities actually appear', () => {
    const rp = new RegionPlacement()
    rp.resolve(rendered(['a', 'GO:1']))

    rp.arm({ x: 500, y: 300 }, [{ termId: 'GO:2', offset: { x: 0, y: 0 } }])
    expect(rp.isArmed).toBe(true)

    // Same activities as before — nothing new to place.
    expect(rp.resolve(rendered(['a', 'GO:1']))).toBeNull()
    expect(rp.isArmed).toBe(true)
  })

  it('rebuilds the copied layout at the paste point', () => {
    const rp = new RegionPlacement()
    rp.resolve(rendered(['old', 'GO:0']))

    rp.arm({ x: 500, y: 300 }, [
      { termId: 'GO:1', offset: { x: 0, y: 0 } },
      { termId: 'GO:2', offset: { x: 120, y: 60 } },
    ])

    const placements = rp.resolve(
      rendered(['old', 'GO:0'], ['new-1', 'GO:1'], ['new-2', 'GO:2'])
    )

    expect(placements).toEqual({
      'new-1': { x: 500, y: 300 },
      'new-2': { x: 620, y: 360 },
    })
  })

  it('disarms once it has placed a region', () => {
    const rp = new RegionPlacement()
    rp.resolve(rendered())
    rp.arm({ x: 0, y: 0 }, [{ termId: 'GO:1', offset: { x: 0, y: 0 } }])

    rp.resolve(rendered(['new-1', 'GO:1']))
    expect(rp.isArmed).toBe(false)

    expect(rp.resolve(rendered(['new-1', 'GO:1'], ['new-2', 'GO:1']))).toBeNull()
  })

  it('correlates by term id regardless of the order activities come back in', () => {
    const rp = new RegionPlacement()
    rp.resolve(rendered())
    rp.arm({ x: 0, y: 0 }, [
      { termId: 'GO:1', offset: { x: 10, y: 10 } },
      { termId: 'GO:2', offset: { x: 20, y: 20 } },
    ])

    // Server returns GO:2 first.
    const placements = rp.resolve(rendered(['new-2', 'GO:2'], ['new-1', 'GO:1']))

    expect(placements).toEqual({
      'new-1': { x: 10, y: 10 },
      'new-2': { x: 20, y: 20 },
    })
  })

  it('gives duplicate terms distinct offsets rather than stacking them', () => {
    const rp = new RegionPlacement()
    rp.resolve(rendered())
    rp.arm({ x: 0, y: 0 }, [
      { termId: 'GO:1', offset: { x: 0, y: 0 } },
      { termId: 'GO:1', offset: { x: 200, y: 0 } },
    ])

    const placements = rp.resolve(rendered(['new-1', 'GO:1'], ['new-2', 'GO:1']))

    const points = Object.values(placements!)
    expect(points).toHaveLength(2)
    expect(points[0]).not.toEqual(points[1])
  })

  describe('fallbacks', () => {
    it('uses leftover offsets in order when a term id does not match', () => {
      const rp = new RegionPlacement()
      rp.resolve(rendered())
      rp.arm({ x: 100, y: 100 }, [{ termId: 'GO:1', offset: { x: 5, y: 5 } }])

      // Server reports a different term than was copied.
      const placements = rp.resolve(rendered(['new-1', 'GO:999']))

      expect(placements).toEqual({ 'new-1': { x: 105, y: 105 } })
    })

    it('handles an activity with no term id at all', () => {
      const rp = new RegionPlacement()
      rp.resolve(rendered())
      rp.arm({ x: 0, y: 0 }, [{ termId: 'GO:1', offset: { x: 7, y: 7 } }])

      expect(rp.resolve(rendered(['new-1', null]))).toEqual({ 'new-1': { x: 7, y: 7 } })
    })

    it('grids extra activities that have no offset left to claim', () => {
      const rp = new RegionPlacement()
      rp.resolve(rendered())
      rp.arm({ x: 0, y: 0 }, [{ termId: 'GO:1', offset: { x: 0, y: 0 } }])

      const placements = rp.resolve(
        rendered(['new-1', 'GO:1'], ['extra-1', 'GO:9'], ['extra-2', 'GO:9'])
      )

      // The matched one keeps its offset; the extras get distinct grid slots.
      expect(placements!['new-1']).toEqual({ x: 0, y: 0 })
      expect(placements!['extra-1']).not.toEqual(placements!['extra-2'])
    })

    it('places what it can when fewer activities come back than were copied', () => {
      const rp = new RegionPlacement()
      rp.resolve(rendered())
      rp.arm({ x: 0, y: 0 }, [
        { termId: 'GO:1', offset: { x: 0, y: 0 } },
        { termId: 'GO:2', offset: { x: 50, y: 0 } },
      ])

      const placements = rp.resolve(rendered(['new-1', 'GO:1']))

      expect(placements).toEqual({ 'new-1': { x: 0, y: 0 } })
    })
  })

  describe('clear', () => {
    it('discards a pending paste', () => {
      const rp = new RegionPlacement()
      rp.resolve(rendered())
      rp.arm({ x: 0, y: 0 }, [{ termId: 'GO:1', offset: { x: 0, y: 0 } }])

      rp.clear()
      expect(rp.isArmed).toBe(false)
      expect(rp.resolve(rendered(['new-1', 'GO:1']))).toBeNull()
    })

    it('still tracks known uids after clearing, so a later paste is not confused', () => {
      const rp = new RegionPlacement()
      rp.arm({ x: 0, y: 0 }, [{ termId: 'GO:1', offset: { x: 0, y: 0 } }])
      rp.clear()
      rp.resolve(rendered(['a', 'GO:1']))

      rp.arm({ x: 900, y: 900 }, [{ termId: 'GO:2', offset: { x: 0, y: 0 } }])
      const placements = rp.resolve(rendered(['a', 'GO:1'], ['b', 'GO:2']))

      expect(placements).toEqual({ b: { x: 900, y: 900 } })
    })
  })
})
