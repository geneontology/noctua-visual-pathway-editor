import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { useUserContext } from '@/app/hooks/useUserContext'
import { setUser } from '@/features/auth/slices/authSlice'
import type { User } from '@/features/auth/user'

const buildHarness = () => {
  const store = makeStore()
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, wrapper }
}

describe('useUserContext', () => {
  it('returns undefined when no user is loaded', () => {
    const { wrapper } = buildHarness()
    const { result } = renderHook(() => useUserContext(), { wrapper })
    expect(result.current).toBeUndefined()
  })

  it('returns undefined when user has no group', () => {
    const { store, wrapper } = buildHarness()
    store.dispatch(setUser({ uri: 'https://orcid.org/0000-0000-0000-0001' } as User))
    const { result } = renderHook(() => useUserContext(), { wrapper })
    expect(result.current).toBeUndefined()
  })

  it('returns undefined when user has no uri (orcid)', () => {
    const { store, wrapper } = buildHarness()
    store.dispatch(setUser({ group: { id: 'g1', label: 'G' } } as unknown as User))
    const { result } = renderHook(() => useUserContext(), { wrapper })
    expect(result.current).toBeUndefined()
  })

  it('returns {orcid, groupUrl} when both uri and group.id are set', () => {
    const { store, wrapper } = buildHarness()
    store.dispatch(
      setUser({
        uri: 'https://orcid.org/0000-0000-0000-0001',
        group: { id: 'https://group.example/g1', label: 'G' },
      } as User)
    )
    const { result } = renderHook(() => useUserContext(), { wrapper })
    expect(result.current).toEqual({
      orcid: 'https://orcid.org/0000-0000-0000-0001',
      groupUrl: 'https://group.example/g1',
    })
  })

  it('returns the same object reference until the user changes (useMemo)', () => {
    const { store, wrapper } = buildHarness()
    store.dispatch(
      setUser({
        uri: 'https://orcid.org/X',
        group: { id: 'g', label: 'G' },
      } as User)
    )
    const { result, rerender } = renderHook(() => useUserContext(), { wrapper })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
