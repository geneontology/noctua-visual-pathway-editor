import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import type { Announcement } from '../models/announcement'

/**
 * Separate from `apiService` on purpose: the feed lives on GitHub Pages, not the
 * Noctua API, so it must not inherit that base URL, its `X-API-Version` header,
 * or its cache policy.
 */
export const announcementsApiSlice = createApi({
  reducerPath: 'announcementsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: builder => ({
    getAnnouncements: builder.query<Announcement[], void>({
      // GitHub Pages sends `Cache-Control: max-age=600`. The CDN is purged on
      // deploy, but browsers aren't, so bypass the browser cache to keep the
      // lag between publishing and showing down to the deploy itself.
      query: () => ({ url: ENVIRONMENT.announcementsUrl, cache: 'no-store' }),
    }),
  }),
})

export const { useGetAnnouncementsQuery } = announcementsApiSlice
