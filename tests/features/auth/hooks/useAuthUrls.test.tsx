import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { useAuthUrls } from '@/features/auth/hooks/useAuthUrls'
import { setBaristaToken } from '@/features/auth/slices/authSlice'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'

const buildHarness = () => {
  const store = makeStore()
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, wrapper }
}

let originalHref: string

beforeEach(() => {
  originalHref = window.location.href
  window.history.replaceState(null, '', '/page?x=1')
})

afterEach(() => {
  window.history.replaceState(null, '', originalHref)
})

describe('useAuthUrls', () => {
  it('builds loginUrl pointing at Barista login with the current href as the return param', () => {
    const { wrapper } = buildHarness()
    const { result } = renderHook(() => useAuthUrls(), { wrapper })
    expect(result.current.loginUrl).toContain(`${ENVIRONMENT.globalBaristaLocation}/login`)
    expect(result.current.loginUrl).toContain('return=')
    const ret = new URL(result.current.loginUrl).searchParams.get('return')
    expect(ret).toBe(window.location.href)
  })

  it('logoutUrl does not include barista_token when no token is set', () => {
    const { wrapper } = buildHarness()
    const { result } = renderHook(() => useAuthUrls(), { wrapper })
    const params = new URL(result.current.logoutUrl).searchParams
    expect(params.get('barista_token')).toBeNull()
    expect(params.get('return')).toBe(window.location.href)
  })

  it('logoutUrl includes barista_token when set', () => {
    const { store, wrapper } = buildHarness()
    store.dispatch(setBaristaToken('tok-123'))
    const { result } = renderHook(() => useAuthUrls(), { wrapper })
    const params = new URL(result.current.logoutUrl).searchParams
    expect(params.get('barista_token')).toBe('tok-123')
  })

  it('noctuaUrl omits the trailing barista_token when no token is set', () => {
    const { wrapper } = buildHarness()
    const { result } = renderHook(() => useAuthUrls(), { wrapper })
    expect(result.current.noctuaUrl).toBe(`${ENVIRONMENT.noctuaUrl}?`)
  })

  it('noctuaUrl appends barista_token when set', () => {
    const { store, wrapper } = buildHarness()
    store.dispatch(setBaristaToken('tok-123'))
    const { result } = renderHook(() => useAuthUrls(), { wrapper })
    expect(result.current.noctuaUrl).toBe(`${ENVIRONMENT.noctuaUrl}?barista_token=tok-123`)
  })

  it('returns a memoized object — same ref while baristaToken is unchanged', () => {
    const { wrapper } = buildHarness()
    const { result, rerender } = renderHook(() => useAuthUrls(), { wrapper })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
