import { describe, it, expect } from 'vitest'
import reducer, {
  show,
  hide,
  forceHide,
  selectLoadingOverlay,
  selectLoadingOverlayVisible,
} from '@/@noctua.core/components/loading-overlay/loadingOverlaySlice'

const initial = reducer(undefined, { type: '@@INIT' })

describe('loadingOverlaySlice reducers', () => {
  it('starts with counter=0 and an empty message', () => {
    expect(initial).toEqual({ counter: 0, message: '' })
  })

  it('show() increments the counter', () => {
    const a = reducer(initial, show(undefined))
    const b = reducer(a, show(undefined))
    expect(b.counter).toBe(2)
  })

  it('show() updates the message when provided', () => {
    const next = reducer(initial, show('Saving...'))
    expect(next.message).toBe('Saving...')
  })

  it('show() leaves the prior message in place when none is provided', () => {
    const a = reducer(initial, show('Saving...'))
    const b = reducer(a, show(undefined))
    expect(b.message).toBe('Saving...')
  })

  it('hide() decrements but never goes below 0', () => {
    const a = reducer(initial, show(undefined))
    const b = reducer(a, hide())
    expect(b.counter).toBe(0)

    const c = reducer(b, hide())
    expect(c.counter).toBe(0)
  })

  it('hide() clears the message when counter reaches 0', () => {
    const a = reducer(initial, show('Working'))
    const b = reducer(a, hide())
    expect(b.counter).toBe(0)
    expect(b.message).toBe('')
  })

  it('hide() preserves the message while counter > 0', () => {
    const a = reducer(initial, show('Saving...'))
    const b = reducer(a, show(undefined))
    const c = reducer(b, hide())
    expect(c.counter).toBe(1)
    expect(c.message).toBe('Saving...')
  })

  it('forceHide() resets counter and message regardless of state', () => {
    let s = reducer(initial, show('a'))
    s = reducer(s, show('b'))
    s = reducer(s, show('c'))
    const reset = reducer(s, forceHide())
    expect(reset).toEqual({ counter: 0, message: '' })
  })

  it('selectLoadingOverlay returns the slice as-is', () => {
    const state = { loadingOverlay: { counter: 2, message: 'X' } }
    expect(selectLoadingOverlay(state)).toBe(state.loadingOverlay)
  })

  it('selectLoadingOverlayVisible is true iff counter > 0', () => {
    expect(selectLoadingOverlayVisible({ loadingOverlay: { counter: 0, message: '' } })).toBe(false)
    expect(selectLoadingOverlayVisible({ loadingOverlay: { counter: 1, message: 'X' } })).toBe(true)
  })
})
