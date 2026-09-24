import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import type { PropsWithChildren } from 'react'
import { makeStore } from '@/app/store/store'
import type { AppStore } from '@/app/store/store'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import {
  announcementsApiSlice,
  useGetAnnouncementsQuery,
  POLL_INTERVAL_MS,
} from '@/features/announcements/slices/announcementsApiSlice'
import { useAnnouncements } from '@/features/announcements/hooks/useAnnouncements'
import { buildAnnouncement } from '@tests/fixtures/builders'

const FEED_URL = 'https://geneontology.github.io/noctua-announcements/announcements.json'

const jsonFeed = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

let store: AppStore
let fetchMock: ReturnType<typeof vi.fn>

const wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>

const firstRequest = () => fetchMock.mock.calls[0][0] as Request

const renderFeed = () => renderHook(() => useGetAnnouncementsQuery(), { wrapper })

beforeEach(() => {
  store = makeStore()
  fetchMock = vi.fn(() => Promise.resolve(jsonFeed([])))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('announcementsApiSlice', () => {
  describe('where it fetches from', () => {
    // The feed is GO infrastructure and lives in the geneontology org, not in
    // anyone's personal fork.
    it('points at the published feed in the geneontology org', () => {
      expect(ENVIRONMENT.announcementsUrl).toBe(FEED_URL)
    })

    it('requests exactly that URL', async () => {
      renderFeed()

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(firstRequest().url).toBe(FEED_URL)
    })

    // GitHub Pages sends max-age=600 and purges only its own CDN, so a poll
    // inside that window would otherwise re-read a stale copy from the browser.
    it('bypasses the browser cache', async () => {
      renderFeed()

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(firstRequest().cache).toBe('no-store')
    })

    // Sending Noctua API headers to GitHub Pages would be wrong and could trip
    // a CORS preflight on a host that has no reason to allow them.
    it('sends none of the Noctua API headers', async () => {
      renderFeed()

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(firstRequest().headers.get('X-API-Version')).toBeNull()
    })

    it('keeps its own cache, separate from the Noctua API slice', () => {
      expect(announcementsApiSlice.reducerPath).toBe('announcementsApi')
      expect(store.getState()).toHaveProperty('announcementsApi')
    })
  })

  describe('a good feed', () => {
    it('hands the entries through untouched', async () => {
      fetchMock.mockResolvedValue(
        jsonFeed([buildAnnouncement('first'), buildAnnouncement('second')])
      )

      const { result } = renderFeed()

      await waitFor(() => expect(result.current.data).toHaveLength(2))
      expect(result.current.data?.map(a => a.id)).toEqual(['first', 'second'])
    })

    it('serves a second subscriber from cache rather than refetching', async () => {
      const { result } = renderHook(
        () => ({ a: useGetAnnouncementsQuery(), b: useGetAnnouncementsQuery() }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.a.isSuccess).toBe(true))
      expect(result.current.b.isSuccess).toBe(true)
      expect(fetchMock).toHaveBeenCalledOnce()
    })
  })

  // Announcements are never load-bearing: every failure has to end as "no
  // announcements", never as a thrown error or a blocked render.
  describe('a broken feed', () => {
    const expectNoAnnouncements = async () => {
      const { result } = renderHook(
        () => ({ query: useGetAnnouncementsQuery(), shown: useAnnouncements() }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.query.isError).toBe(true))
      expect(result.current.query.data).toBeUndefined()
      expect(result.current.shown).toEqual([])
    }

    it('survives the feed being missing', async () => {
      fetchMock.mockResolvedValue(new Response('Not Found', { status: 404 }))

      await expectNoAnnouncements()
    })

    it('survives Pages being down', async () => {
      fetchMock.mockResolvedValue(new Response('', { status: 503 }))

      await expectNoAnnouncements()
    })

    it('survives the network being unreachable', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

      await expectNoAnnouncements()
    })

    it('survives a body that is not JSON', async () => {
      fetchMock.mockResolvedValue(
        new Response('<html>404</html>', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )

      await expectNoAnnouncements()
    })
  })

  describe('staying current in a long-lived tab', () => {
    it('polls every five minutes, so a tab left open picks up a new announcement', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        expect(POLL_INTERVAL_MS).toBe(5 * 60 * 1000)

        renderHook(
          () => useGetAnnouncementsQuery(undefined, { pollingInterval: POLL_INTERVAL_MS }),
          { wrapper }
        )
        await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())

        await act(async () => {
          await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
        })

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
      } finally {
        vi.useRealTimers()
      }
    })

    // Dispatched rather than raised as a window event: setupListeners binds its
    // listeners to the first store created in the process, so a per-test store
    // never sees the real event.
    it('refetches when the tab regains focus', async () => {
      renderFeed()
      await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())

      act(() => {
        store.dispatch(announcementsApiSlice.internalActions.onFocus())
      })

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    })

    it('refetches when the connection comes back', async () => {
      renderFeed()
      await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())

      act(() => {
        store.dispatch(announcementsApiSlice.internalActions.onOnline())
      })

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    })
  })
})
