import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useGetAnnouncementsQuery,
  POLL_INTERVAL_MS,
} from '../slices/announcementsApiSlice'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import { CURRENT_APP } from '../models/announcement'
import type { Announcement } from '../models/announcement'

const STORAGE_KEY = 'noctua.announcements.state'

// setTimeout fires immediately past this, which would spin.
const MAX_TIMEOUT_MS = 2_147_483_647
// Timers can fire a hair early; without a floor that would retry in a tight loop.
const MIN_BOUNDARY_DELAY_MS = 250

interface StoredState {
  /** Expanded in the panel. Clears the bell badge. */
  read: string[]
  /** Closed from the banner. Still listed in the panel. */
  bannerClosed: string[]
  /** Swiped away in the panel. Gone from the panel and the banner. */
  dismissed: string[]
}

const EMPTY_STATE: StoredState = { read: [], bannerClosed: [], dismissed: [] }

/**
 * The moment a schedule value refers to.
 *
 * `YYYY-MM-DD` means the whole of that day in the *viewer's* own timezone —
 * deliberately not UTC, which would start and end the day at the wrong moment
 * for everyone outside it. `edge: 'end'` therefore lands on the following
 * midnight, so `expires: 2026-03-14` runs to the end of the 14th.
 *
 * Anything with a time is already an absolute instant, converted from the
 * author's timezone when the feed was built.
 */
function instantOf(value: string, edge: 'start' | 'end'): number {
  if (value.includes('T')) return Date.parse(value)

  const at = new Date(`${value}T00:00:00`)
  if (edge === 'end') at.setDate(at.getDate() + 1)
  return at.getTime()
}

const startsAt = (announcement: Announcement): number | null =>
  announcement.starts ? instantOf(announcement.starts, 'start') : null

const endsAt = (announcement: Announcement): number | null =>
  announcement.expires ? instantOf(announcement.expires, 'end') : null

function isActive(announcement: Announcement, now: number): boolean {
  const start = startsAt(announcement)
  if (start !== null && now < start) return false

  const end = endsAt(announcement)
  if (end !== null && now >= end) return false

  return true
}

/**
 * The next moment this list could change, so it can be re-checked exactly then
 * rather than on a tick.
 */
function nextBoundary(announcements: Announcement[], now: number): number | null {
  let next: number | null = null

  for (const announcement of announcements) {
    for (const at of [startsAt(announcement), endsAt(announcement)]) {
      if (at !== null && at > now && (next === null || at < next)) next = at
    }
  }

  return next
}

/**
 * A draft an author wants to see in place before it reaches everyone. Any build
 * that is not production — the dev site — shows it; production never does.
 */
function isReleased(announcement: Announcement): boolean {
  return !announcement.testing || !ENVIRONMENT.isProd
}

/**
 * The announcements this app should show right now. The feed ships every
 * announcement for every app, so filtering by date, by `apps` and by `testing`
 * is the consumer's job.
 *
 * Re-checks on a timer and whenever the tab regains focus, so a tab left open
 * all day still picks up a new announcement.
 *
 * A failed fetch yields an empty list — announcements are never load-bearing.
 */
export function useAnnouncements(): Announcement[] {
  const { data } = useGetAnnouncementsQuery(undefined, {
    pollingInterval: POLL_INTERVAL_MS,
  })
  const [now, setNow] = useState(() => Date.now())

  // A maintenance banner set for 4pm should go up at 4pm, not whenever the next
  // poll happens to land. One timeout to the next boundary does that without
  // ticking; the same timer takes a whole-day announcement down at midnight.
  useEffect(() => {
    if (!data) return

    const next = nextBoundary(data, now)
    if (next === null) return

    const delay = Math.min(Math.max(next - Date.now(), MIN_BOUNDARY_DELAY_MS), MAX_TIMEOUT_MS)
    const timer = setTimeout(() => setNow(Date.now()), delay)
    return () => clearTimeout(timer)
  }, [data, now])

  return useMemo(() => {
    if (!data) return []
    return data.filter(a => a.apps.includes(CURRENT_APP) && isReleased(a) && isActive(a, now))
  }, [data, now])
}

function readStored(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_STATE
    const parsed = JSON.parse(raw)
    const list = (value: unknown) => (Array.isArray(value) ? (value as string[]) : [])
    return {
      read: list(parsed?.read),
      bannerClosed: list(parsed?.bannerClosed),
      dismissed: list(parsed?.dismissed),
    }
  } catch {
    // Private browsing, cleared storage, or a corrupted value. Everything reads
    // as new, which is the harmless direction to fail in.
    return EMPTY_STATE
  }
}

export interface AnnouncementState {
  isRead: (id: string) => boolean
  isBannerClosed: (id: string) => boolean
  isDismissed: (id: string) => boolean
  markRead: (id: string) => void
  closeBanner: (id: string) => void
  dismiss: (id: string) => void
  dismissAll: (ids: string[]) => void
  restore: (id: string) => void
}

/**
 * Per-browser announcement state, remembered across reloads.
 *
 * Three separate sets on purpose. Folding "banner closed" into "read" made the
 * banner vanish the moment someone opened the panel, which is not what closing
 * a banner means.
 *
 * Owned by `Layout` and passed down, so the banner and the panel stay in step.
 */
export function useAnnouncementState(): AnnouncementState {
  const [state, setState] = useState<StoredState>(readStored)

  const update = useCallback((change: (previous: StoredState) => StoredState) => {
    setState(previous => {
      const next = change(previous)
      if (next === previous) return previous
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Not persisting is fine; it comes back on reload.
      }
      return next
    })
  }, [])

  const markRead = useCallback(
    (id: string) =>
      update(previous =>
        previous.read.includes(id)
          ? previous
          : { ...previous, read: [...previous.read, id] }
      ),
    [update]
  )

  // Closing the banner is remembered per announcement id, so it stays closed
  // across reloads but the next announcement to be published still banners.
  const closeBanner = useCallback(
    (id: string) =>
      update(previous =>
        previous.bannerClosed.includes(id)
          ? previous
          : { ...previous, bannerClosed: [...previous.bannerClosed, id] }
      ),
    [update]
  )

  // Dismissing also marks read, so a swiped-away notification never lingers in
  // the bell's badge.
  const dismiss = useCallback(
    (id: string) =>
      update(previous =>
        previous.dismissed.includes(id)
          ? previous
          : {
              ...previous,
              read: previous.read.includes(id) ? previous.read : [...previous.read, id],
              dismissed: [...previous.dismissed, id],
            }
      ),
    [update]
  )

  const dismissAll = useCallback(
    (ids: string[]) =>
      update(previous => ({
        ...previous,
        read: [...new Set([...previous.read, ...ids])],
        dismissed: [...new Set([...previous.dismissed, ...ids])],
      })),
    [update]
  )

  // Puts a dismissed announcement back in the list. `read` is left alone — you
  // have already seen it, so it should not come back badged as new.
  const restore = useCallback(
    (id: string) =>
      update(previous =>
        previous.dismissed.includes(id)
          ? { ...previous, dismissed: previous.dismissed.filter(other => other !== id) }
          : previous
      ),
    [update]
  )

  const isRead = useCallback((id: string) => state.read.includes(id), [state.read])
  const isBannerClosed = useCallback(
    (id: string) => state.bannerClosed.includes(id),
    [state.bannerClosed]
  )
  const isDismissed = useCallback(
    (id: string) => state.dismissed.includes(id),
    [state.dismissed]
  )

  return {
    isRead,
    isBannerClosed,
    isDismissed,
    markRead,
    closeBanner,
    dismiss,
    dismissAll,
    restore,
  }
}

/** "now", "3d", "2w" — the age stamp on a panel row. */
export function relativeAge(starts: string | null): string {
  if (!starts) return 'now'
  const then = instantOf(starts, 'start')
  if (Number.isNaN(then)) return ''

  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}
