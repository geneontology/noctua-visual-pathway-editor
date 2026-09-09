import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import type { Announcement } from '../models/announcement'

/**
 * How often an open tab re-checks the feed. Curators leave the editor open for
 * hours, so without this a new announcement would only appear on reload — which
 * is exactly the caveat the old prototype shipped with.
 *
 * The feed is a few KB from a CDN, so this is cheap. Combined with the ~30s
 * publish workflow, an announcement is in front of people within about six
 * minutes of the commit, and sooner if they switch back to the tab.
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000

/**
 * Separate from `apiService` on purpose: the feed lives on GitHub Pages, not the
 * Noctua API, so it must not inherit that base URL, its `X-API-Version` header,
 * or its cache policy.
 */
export const announcementsApiSlice = createApi({
  reducerPath: 'announcementsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  // `setupListeners` is already wired in the store, so these take effect.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: builder => ({
    getAnnouncements: builder.query<Announcement[], void>({
      // GitHub Pages sends `Cache-Control: max-age=600`. The CDN is purged on
      // deploy, but browsers aren't, so bypass the browser cache — otherwise a
      // poll inside that window would just re-read a stale copy.
      query: () => ({ url: ENVIRONMENT.announcementsUrl, cache: 'no-store' }),
    }),
  }),
})

export const { useGetAnnouncementsQuery } = announcementsApiSlice
export { POLL_INTERVAL_MS }
