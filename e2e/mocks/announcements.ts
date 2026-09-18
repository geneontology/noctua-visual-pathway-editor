import type { Page } from '@playwright/test'

/**
 * The published feed lives at
 * https://geneontology.github.io/noctua-announcements/announcements.json.
 * Matched loosely so the tests keep working if the shell repoints the URL.
 */
export const FEED_GLOB = '**/noctua-announcements/announcements.json'

export type AnnouncementLevel = 'info' | 'success' | 'warning' | 'danger'
export type AnnouncementType =
  | 'announcement'
  | 'update'
  | 'reminder'
  | 'maintenance'
  | 'event'
export type AnnouncementApp = 'landing-page' | 'sae' | 'vpe'

/** One entry of the built feed, as `scripts/build.mjs` emits it. */
export interface FeedAnnouncement {
  id: string
  title: string
  level: AnnouncementLevel
  type: AnnouncementType
  pinned: boolean
  /** Held back from production: the dev site only. */
  testing: boolean
  apps: AnnouncementApp[]
  starts: string | null
  expires: string | null
  description: string
  body: string
  descriptionUrl: string | null
}

export const announcement = (
  id: string,
  overrides: Partial<FeedAnnouncement> = {}
): FeedAnnouncement => ({
  id,
  title: `Title ${id}`,
  level: 'info',
  type: 'announcement',
  pinned: false,
  testing: false,
  apps: ['landing-page', 'sae', 'vpe'],
  starts: null,
  expires: null,
  description: `Description for ${id}`,
  body: `<p>Body for ${id}</p>`,
  descriptionUrl: null,
  ...overrides,
})

/** YYYY-MM-DD in local time, matching how the client compares dates. */
export const dateOffsetByDays = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const mockAnnouncementsFeed = async (
  page: Page,
  entries: FeedAnnouncement[]
): Promise<void> => {
  await page.route(FEED_GLOB, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(entries),
    })
  )
}

/** Pages down, feed missing, or a body that never parses. */
export const mockAnnouncementsFailure = async (
  page: Page,
  kind: 'http-error' | 'unparseable' | 'offline' = 'http-error'
): Promise<void> => {
  await page.route(FEED_GLOB, route => {
    if (kind === 'offline') return route.abort('failed')
    if (kind === 'unparseable') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: '<html>not json</html>',
      })
    }
    return route.fulfill({ status: 503, contentType: 'text/plain', body: 'unavailable' })
  })
}
