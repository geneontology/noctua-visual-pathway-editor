import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PREFERENCES_STORAGE_KEY, usePreference } from '@/@noctua.core/hooks/usePreference'

const KEY = 'announcements.showRead'

const stored = () => JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}')

describe('usePreference', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reads the default when nothing is stored', () => {
    const { result } = renderHook(() => usePreference(KEY))

    expect(result.current[0]).toBe(true)
  })

  it('updates and persists a change', () => {
    const { result } = renderHook(() => usePreference(KEY))

    act(() => result.current[1](false))

    expect(result.current[0]).toBe(false)
    expect(stored()).toEqual({ [KEY]: false })
  })

  it('reads a value an earlier session stored', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ [KEY]: false }))

    const { result } = renderHook(() => usePreference(KEY))

    expect(result.current[0]).toBe(false)
  })

  it('keeps other entries under the same key', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ 'some.other': 'kept' }))
    const { result } = renderHook(() => usePreference(KEY))

    act(() => result.current[1](false))

    expect(stored()).toEqual({ 'some.other': 'kept', [KEY]: false })
  })

  it('updates every component reading the same preference', async () => {
    const Reader = ({ label }: { label: string }) => {
      const [value, setValue] = usePreference(KEY)
      return (
        <button type="button" onClick={() => setValue(!value)}>
          {label}: {String(value)}
        </button>
      )
    }
    render(
      <>
        <Reader label="first" />
        <Reader label="second" />
      </>
    )

    await userEvent.click(screen.getByRole('button', { name: 'first: true' }))

    expect(screen.getByRole('button', { name: 'first: false' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'second: false' })).toBeInTheDocument()
  })

  describe('bad stored values', () => {
    it('ignores a value of the wrong type', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ [KEY]: 'no' }))

      const { result } = renderHook(() => usePreference(KEY))

      expect(result.current[0]).toBe(true)
    })

    it('treats unparseable JSON as nothing stored', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, 'not json{')

      const { result } = renderHook(() => usePreference(KEY))

      expect(result.current[0]).toBe(true)
    })

    it('treats a stored non-object as nothing stored', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(null))

      const { result } = renderHook(() => usePreference(KEY))

      expect(result.current[0]).toBe(true)
    })

    it('still toggles for the session when storage is blocked', () => {
      const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied')
      })
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('denied')
      })

      const { result } = renderHook(() => usePreference(KEY))
      act(() => result.current[1](false))

      expect(result.current[0]).toBe(false)

      getItem.mockRestore()
      setItem.mockRestore()
    })
  })
})
