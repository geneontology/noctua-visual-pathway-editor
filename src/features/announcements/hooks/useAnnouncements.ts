import { useCallback, useMemo, useState } from 'react'
import {
  useGetAnnouncementsQuery,
  POLL_INTERVAL_MS,
} from '../slices/announcementsApiSlice'
import { CURRENT_APP } from '../models/announcement'
import type { Announcement } from '../models/announcement'

const STORAGE_KEY = 'noctua.announcements.state'

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
 * Today as YYYY-MM-DD in the viewer's own timezone. Deliberately not
 * `toISOString()`, which is UTC and would flip the date a day early or late
 * either side of midnight.
 */
function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** `expires` is exclusive — an announcement stops showing on that date. */
function isActive(announcement: Announcement, date: string): boolean {
  if (announcement.starts && announcement.starts > date) return false
  if (announcement.expires && announcement.expires <= date) return false
  return true
}

/**
 * The announcements this app should show right now. The feed ships every
 * announcement for every app, so filtering by date and by `apps` is the
 * consumer's job.
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

  return useMemo(() => {
    if (!data) return []
    const date = today()
    return data.filter(a => a.apps.includes(CURRENT_APP) && isActive(a, date))
  }, [data])
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
  }
}

/** "now", "3d", "2w" — the age stamp on a panel row. */
export function relativeAge(starts: string | null): string {
  if (!starts) return 'now'
  const then = new Date(`${starts}T00:00:00`).getTime()
  if (Number.isNaN(then)) return ''

  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}
