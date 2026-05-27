import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { renderHook } from '@testing-library/react'
import { usePopover } from '@/@noctua.core/hooks/usePopover'

describe('usePopover', () => {
  it('starts closed with no anchor or data', () => {
    const { result } = renderHook(() => usePopover<string>())
    expect(result.current.anchor).toBeNull()
    expect(result.current.isOpen).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('open() sets the anchor and flips isOpen to true', () => {
    const { result } = renderHook(() => usePopover<string>())
    const el = document.createElement('button')
    act(() => result.current.open(el))
    expect(result.current.anchor).toBe(el)
    expect(result.current.isOpen).toBe(true)
  })

  it('open() carries through the data payload', () => {
    const { result } = renderHook(() => usePopover<{ id: string }>())
    const el = document.createElement('div')
    act(() => result.current.open(el, { id: 'x' }))
    expect(result.current.data).toEqual({ id: 'x' })
  })

  it('close() clears anchor + data and flips isOpen to false', () => {
    const { result } = renderHook(() => usePopover<string>())
    const el = document.createElement('div')
    act(() => result.current.open(el, 'payload'))
    act(() => result.current.close())
    expect(result.current.anchor).toBeNull()
    expect(result.current.data).toBeUndefined()
    expect(result.current.isOpen).toBe(false)
  })

  it('open() with no data argument leaves data undefined', () => {
    const { result } = renderHook(() => usePopover<string>())
    const el = document.createElement('div')
    act(() => result.current.open(el))
    expect(result.current.data).toBeUndefined()
  })

  it('open() with a new anchor replaces the previous anchor/data', () => {
    const { result } = renderHook(() => usePopover<string>())
    const a = document.createElement('div')
    const b = document.createElement('span')
    act(() => result.current.open(a, 'first'))
    act(() => result.current.open(b, 'second'))
    expect(result.current.anchor).toBe(b)
    expect(result.current.data).toBe('second')
  })

  it('open/close handlers are stable references across rerenders', () => {
    const { result, rerender } = renderHook(() => usePopover<string>())
    const firstOpen = result.current.open
    const firstClose = result.current.close
    rerender()
    expect(result.current.open).toBe(firstOpen)
    expect(result.current.close).toBe(firstClose)
  })
})
