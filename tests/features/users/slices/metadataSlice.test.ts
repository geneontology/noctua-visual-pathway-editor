import { describe, it, expect } from 'vitest'
import metadataReducer, {
  setUsers,
  setGroups,
} from '@/features/users/slices/metadataSlice'
import type { Contributor, Group } from '@/features/users/models/contributor'

const initial = metadataReducer(undefined, { type: '@@INIT' })

const sampleContributors: Contributor[] = [
  { uri: 'https://orcid.org/0000-0000-0000-0001', name: 'Alice' },
  { uri: 'https://orcid.org/0000-0000-0000-0002', name: 'Bob' },
]

const sampleGroups: Group[] = [
  { id: 'http://geneontology.org/groups/test', label: 'Test Group' },
]

describe('metadataSlice', () => {
  it('starts empty and not loading', () => {
    expect(initial).toEqual({ contributors: [], groups: [], loading: false })
  })

  it('setUsers stores contributors', () => {
    const next = metadataReducer(initial, setUsers(sampleContributors))
    expect(next.contributors).toBe(sampleContributors)
    expect(next.groups).toEqual([])
  })

  it('setGroups stores groups', () => {
    const next = metadataReducer(initial, setGroups(sampleGroups))
    expect(next.groups).toBe(sampleGroups)
    expect(next.contributors).toEqual([])
  })

  it('setUsers preserves an already-set groups list', () => {
    const withGroups = metadataReducer(initial, setGroups(sampleGroups))
    const next = metadataReducer(withGroups, setUsers(sampleContributors))
    expect(next.groups).toBe(sampleGroups)
    expect(next.contributors).toBe(sampleContributors)
  })

  it('setUsers overwrites previous contributors', () => {
    const first = metadataReducer(initial, setUsers(sampleContributors))
    const replacement: Contributor[] = [{ uri: 'orcid:other' }]
    const next = metadataReducer(first, setUsers(replacement))
    expect(next.contributors).toBe(replacement)
  })

  it('does not flip the loading flag on its own (no thunks here)', () => {
    const next = metadataReducer(initial, setUsers(sampleContributors))
    expect(next.loading).toBe(false)
  })
})
