import { describe, it, expect } from 'vitest'
import authReducer, {
  setUser,
  setBaristaToken,
  logout,
  selectAuthUser,
  selectBaristaToken,
} from '@/features/auth/slices/authSlice'
import type { User } from '@/features/auth/user'

const initial = authReducer(undefined, { type: '@@INIT' })

const sampleUser: User = {
  uri: 'https://orcid.org/0000-0000-0000-1234',
  name: 'Alice',
  initials: 'A',
  color: '#abcdef',
  token: 'tok-xyz',
}

describe('authSlice reducers', () => {
  it('starts with null user and null baristaToken', () => {
    expect(initial).toEqual({ user: null, baristaToken: null })
  })

  it('setUser stores the user', () => {
    const next = authReducer(initial, setUser(sampleUser))
    expect(next.user).toBe(sampleUser)
    expect(next.baristaToken).toBeNull()
  })

  it('setUser(null) clears the user', () => {
    const withUser = authReducer(initial, setUser(sampleUser))
    const cleared = authReducer(withUser, setUser(null))
    expect(cleared.user).toBeNull()
  })

  it('setBaristaToken stores the token', () => {
    const next = authReducer(initial, setBaristaToken('barista-abc'))
    expect(next.baristaToken).toBe('barista-abc')
    expect(next.user).toBeNull()
  })

  it('setBaristaToken(null) clears the token', () => {
    const withToken = authReducer(initial, setBaristaToken('barista-abc'))
    const cleared = authReducer(withToken, setBaristaToken(null))
    expect(cleared.baristaToken).toBeNull()
  })

  it('logout clears both user and token', () => {
    let state = authReducer(initial, setUser(sampleUser))
    state = authReducer(state, setBaristaToken('barista-abc'))
    const after = authReducer(state, logout())
    expect(after.user).toBeNull()
    expect(after.baristaToken).toBeNull()
  })
})

describe('authSlice selectors', () => {
  it('selectAuthUser reads the user from state', () => {
    const state = { auth: { user: sampleUser, baristaToken: null } }
    expect(selectAuthUser(state)).toBe(sampleUser)
  })

  it('selectBaristaToken reads the token from state', () => {
    const state = { auth: { user: null, baristaToken: 'barista-abc' } }
    expect(selectBaristaToken(state)).toBe('barista-abc')
  })
})
