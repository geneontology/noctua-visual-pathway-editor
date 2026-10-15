import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/app/store/store'
import { noctuaDataApi } from '@/features/users/slices/metadataApiSlice'

/** Barista: `/users` and `/groups`, each answered with its own body. */
const serve = (users: unknown, groups: unknown = []) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      const url = typeof input === 'string' ? input : input.url
      return new Response(JSON.stringify(url.endsWith('/users') ? users : groups), {
        headers: { 'content-type': 'application/json' },
      })
    })
  )

const loadAll = async () => {
  const store = makeStore()
  const result = await store.dispatch(noctuaDataApi.endpoints.getAllData.initiate())
  return { store, result }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

// Shared with the landing page (features/users is a copy); keep the two in step.
describe('getAllData', () => {
  // Barista returns both lists in no useful order; the Angular app sorted them
  // at load, and every picker reads them from here.
  it('sorts users by name, ignoring case, with nameless users last', async () => {
    serve([
      { nickname: 'paul thomas', uri: 'p' },
      { uri: 'nameless' },
      { nickname: 'Huaiyu Mi', uri: 'h' },
      { nickname: 'Ada Lovelace', uri: 'a' },
    ])
    const { result } = await loadAll()

    expect(result.data?.users.map(u => u.uri)).toEqual(['a', 'h', 'p', 'nameless'])
  })

  it('sorts groups by label', async () => {
    serve(
      [],
      [
        { id: 'l', label: 'LBL' },
        { id: 'g', label: 'GO Central' },
        { id: 'a', label: 'ARUK-UCL' },
      ]
    )
    const { result } = await loadAll()

    expect(result.data?.groups.map(g => g.label)).toEqual(['ARUK-UCL', 'GO Central', 'LBL'])
  })

  // Barista sends no colour, so every chip came out grey. Angular derived one
  // from the first initial.
  it.each([
    ['Livia Famiglietti', '#f0f4c3'],
    ['Val Wood', '#c5cae9'],
    ['Sylvain Poux', '#f8bbd0'],
    // Index 0 had no colour in Angular either; the chip keeps its default.
    ['Ada Lovelace', undefined],
  ])('colours %s from the first initial', async (nickname, color) => {
    serve([{ nickname, uri: 'u' }])
    const { result } = await loadAll()

    expect(result.data?.users[0].color).toBe(color)
  })

  it('keeps a colour Barista does send', async () => {
    serve([{ nickname: 'Val Wood', uri: 'u', color: '#123456' }])
    const { result } = await loadAll()

    expect(result.data?.users[0].color).toBe('#123456')
  })

  it('treats a null body as empty lists', async () => {
    serve(null, null)
    const { result } = await loadAll()

    expect(result.data).toEqual({ users: [], groups: [] })
  })
})
