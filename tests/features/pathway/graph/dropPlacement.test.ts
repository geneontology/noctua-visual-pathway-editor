import { describe, expect, it } from 'vitest'
import { DropPlacement, centerTopLeft } from '@/features/pathway/graph/dropPlacement'

describe('centerTopLeft', () => {
  it('centers a box on the point', () => {
    expect(centerTopLeft({ x: 100, y: 200 }, { width: 40, height: 20 })).toEqual({
      x: 80,
      y: 190,
    })
  })

  it('returns the point unchanged for a zero-size box', () => {
    expect(centerTopLeft({ x: 5, y: 7 }, { width: 0, height: 0 })).toEqual({ x: 5, y: 7 })
  })

  it('handles negative drop coordinates', () => {
    expect(centerTopLeft({ x: -10, y: -10 }, { width: 20, height: 20 })).toEqual({
      x: -20,
      y: -20,
    })
  })
})

describe('DropPlacement', () => {
  it('starts unarmed and places nothing', () => {
    const dp = new DropPlacement()
    expect(dp.isArmed).toBe(false)
    expect(dp.resolve(['a', 'b'])).toBeNull()
  })

  it('places the newly-appeared activity at the drop point', () => {
    const dp = new DropPlacement()
    // First render establishes the baseline.
    expect(dp.resolve(['a', 'b'])).toBeNull()

    dp.arm({ x: 300, y: 150 })
    expect(dp.isArmed).toBe(true)

    // The new activity 'c' appears on the next render.
    const placement = dp.resolve(['a', 'b', 'c'])
    expect(placement).toEqual({ uid: 'c', point: { x: 300, y: 150 } })
    expect(dp.isArmed).toBe(false)
  })

  it('does not place anything when no activity is armed', () => {
    const dp = new DropPlacement()
    dp.resolve(['a'])
    // 'b' appears but no drop was armed — auto-layout owns its position.
    expect(dp.resolve(['a', 'b'])).toBeNull()
  })

  // Regression: the bug was clearing the armed drop on the first re-render even
  // when the new activity wasn't in it yet (the save triggers a refetch, so the
  // node can arrive a render or two later). The drop must survive until its node
  // actually shows up.
  it('keeps the drop armed across an intervening render that lacks the new node', () => {
    const dp = new DropPlacement()
    dp.resolve(['a', 'b'])

    dp.arm({ x: 42, y: 84 })

    // Intervening render (e.g. refetch in flight): same activities, no new node.
    expect(dp.resolve(['a', 'b'])).toBeNull()
    expect(dp.isArmed).toBe(true)

    // The render that actually carries the new node finally arrives.
    const placement = dp.resolve(['a', 'b', 'c'])
    expect(placement).toEqual({ uid: 'c', point: { x: 42, y: 84 } })
    expect(dp.isArmed).toBe(false)
  })

  it('survives several intervening renders before the node appears', () => {
    const dp = new DropPlacement()
    dp.resolve(['a'])
    dp.arm({ x: 1, y: 2 })

    expect(dp.resolve(['a'])).toBeNull()
    expect(dp.resolve(['a'])).toBeNull()
    expect(dp.resolve(['a'])).toBeNull()
    expect(dp.isArmed).toBe(true)

    expect(dp.resolve(['a', 'z'])).toEqual({ uid: 'z', point: { x: 1, y: 2 } })
  })

  it('clear() discards an armed drop so it never places', () => {
    const dp = new DropPlacement()
    dp.resolve(['a'])
    dp.arm({ x: 9, y: 9 })
    expect(dp.isArmed).toBe(true)

    dp.clear()
    expect(dp.isArmed).toBe(false)

    // A new node appears later, but the cancelled drop must not grab it.
    expect(dp.resolve(['a', 'b'])).toBeNull()
  })

  it('only places once per armed drop', () => {
    const dp = new DropPlacement()
    dp.resolve(['a'])
    dp.arm({ x: 10, y: 20 })

    expect(dp.resolve(['a', 'b'])).toEqual({ uid: 'b', point: { x: 10, y: 20 } })
    // A subsequent new node is not placed because the drop was consumed.
    expect(dp.resolve(['a', 'b', 'c'])).toBeNull()
  })

  it('arm() overwrites a previous unconsumed drop point', () => {
    const dp = new DropPlacement()
    dp.resolve(['a'])
    dp.arm({ x: 1, y: 1 })
    dp.arm({ x: 500, y: 600 })

    expect(dp.resolve(['a', 'b'])).toEqual({ uid: 'b', point: { x: 500, y: 600 } })
  })

  it('detects the new node relative to the previous render, not the original', () => {
    const dp = new DropPlacement()
    dp.resolve(['a'])

    // First drop adds 'b'.
    dp.arm({ x: 0, y: 0 })
    expect(dp.resolve(['a', 'b'])).toEqual({ uid: 'b', point: { x: 0, y: 0 } })

    // Second drop adds 'c'; 'b' is no longer considered new.
    dp.arm({ x: 7, y: 7 })
    expect(dp.resolve(['a', 'b', 'c'])).toEqual({ uid: 'c', point: { x: 7, y: 7 } })
  })

  it('picks the first new uid when several appear at once', () => {
    const dp = new DropPlacement()
    dp.resolve(['a'])
    dp.arm({ x: 3, y: 4 })

    const placement = dp.resolve(['a', 'b', 'c'])
    expect(placement).toEqual({ uid: 'b', point: { x: 3, y: 4 } })
  })

  it('handles activities being removed without placing anything', () => {
    const dp = new DropPlacement()
    dp.resolve(['a', 'b', 'c'])
    dp.arm({ x: 5, y: 5 })

    // A render where an activity was deleted — no genuinely new uid.
    expect(dp.resolve(['a', 'b'])).toBeNull()
    expect(dp.isArmed).toBe(true)
  })
})
