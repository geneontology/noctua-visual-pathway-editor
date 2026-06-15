import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { parameterize, removeBaristaTokenFromUrl } from '@/features/auth/authServices'

describe('parameterize', () => {
  it('joins key=value pairs with &', () => {
    expect(parameterize({ a: '1', b: '2' })).toBe('a=1&b=2')
  })

  it('filters out null values', () => {
    expect(parameterize({ a: '1', b: null, c: '3' })).toBe('a=1&c=3')
  })

  it('encodes keys and values', () => {
    expect(parameterize({ 'a key': 'a value' })).toBe('a%20key=a%20value')
    expect(parameterize({ q: 'a+b/c?d' })).toBe('q=a%2Bb%2Fc%3Fd')
  })

  it('returns an empty string when given an empty record', () => {
    expect(parameterize({})).toBe('')
  })

  it('returns an empty string when every value is null', () => {
    expect(parameterize({ a: null, b: null })).toBe('')
  })

  it('coerces non-null values to string via String()', () => {
    // Calling site types values as string|null, but the implementation runs
    // String(value), so accidental numbers/booleans still serialize.
    expect(parameterize({ a: 1 as unknown as string })).toBe('a=1')
  })
})

describe('removeBaristaTokenFromUrl', () => {
  let originalHref: string

  beforeEach(() => {
    originalHref = window.location.href
  })

  afterEach(() => {
    window.history.replaceState(null, '', originalHref)
  })

  it('strips the barista_token query param', () => {
    window.history.replaceState(null, '', '/page?barista_token=abc&keep=1')
    removeBaristaTokenFromUrl()
    const url = new URL(window.location.href)
    expect(url.searchParams.get('barista_token')).toBeNull()
    expect(url.searchParams.get('keep')).toBe('1')
  })

  it('is a no-op when no barista_token param is present', () => {
    window.history.replaceState(null, '', '/page?keep=1')
    removeBaristaTokenFromUrl()
    const url = new URL(window.location.href)
    expect(url.searchParams.get('keep')).toBe('1')
  })

  it('leaves the pathname intact', () => {
    window.history.replaceState(null, '', '/some/deep/path?barista_token=t')
    removeBaristaTokenFromUrl()
    expect(window.location.pathname).toBe('/some/deep/path')
  })
})
