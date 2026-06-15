import { describe, it, expect } from 'vitest'
import reducer, { showToast, hideToast } from '@/@noctua.core/components/toast/toastSlice'

const initial = reducer(undefined, { type: '@@INIT' })

describe('toastSlice reducers', () => {
  it('starts closed with success severity + 3000ms default duration', () => {
    expect(initial).toEqual({
      open: false,
      message: '',
      severity: 'success',
      duration: 3000,
    })
  })

  it('showToast sets message + opens with default severity/duration', () => {
    const next = reducer(initial, showToast({ message: 'Saved!' }))
    expect(next).toEqual({
      open: true,
      message: 'Saved!',
      severity: 'success',
      duration: 3000,
    })
  })

  it('showToast honors caller-provided severity and duration', () => {
    const next = reducer(
      initial,
      showToast({ message: 'Broken', severity: 'error', duration: 7000 })
    )
    expect(next.severity).toBe('error')
    expect(next.duration).toBe(7000)
  })

  it('hideToast flips open=false but preserves message/severity/duration', () => {
    const shown = reducer(
      initial,
      showToast({ message: 'Saved!', severity: 'success', duration: 5000 })
    )
    const hidden = reducer(shown, hideToast())
    expect(hidden.open).toBe(false)
    expect(hidden.message).toBe('Saved!')
    expect(hidden.severity).toBe('success')
    expect(hidden.duration).toBe(5000)
  })

  it('a second showToast overwrites the previous message', () => {
    const a = reducer(initial, showToast({ message: 'First' }))
    const b = reducer(a, showToast({ message: 'Second', severity: 'warning' }))
    expect(b.message).toBe('Second')
    expect(b.severity).toBe('warning')
  })
})
