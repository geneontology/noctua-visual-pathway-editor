import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useGetAnnouncementsQuery,
  POLL_INTERVAL_MS,
} from '../slices/announcementsApiSlice'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import { CURRENT_APP } from '../models/announcement'
import type { Announcement } from '../models/announcement'

export const ANNOUNCEMENTS_STORAGE_KEY = 'noctua.announcements.state'

// setTimeout fires immediately past this, which would spin.
const MAX_TIMEOUT_MS = 2_147_483_647
// Timers can fire a hair early; without a floor that would retry in a tight loop.
const MIN_BOUNDARY_DELAY_MS = 250

interface StoredState {
  /** Viewed or marked read in the panel. Listed under Read; off the bell badge. */
  read: string[]
  /** "Got it" or ✕ on the banner. Never pops up again. */
  dismissed: string[]
}

const EMPTY_STATE: StoredState = { read: [], dismissed: [] }

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
    const raw = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY)
    if (!raw) return EMPTY_STATE
    const parsed = JSON.parse(raw)
    const list = (value: unknown) => (Array.isArray(value) ? (value as string[]) : [])
    return {
      read: list(parsed?.read),
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
  isDismissed: (id: string) => boolean
  markRead: (id: string) => void
  markUnread: (id: string) => void
  dismiss: (id: string) => void
}

/**
 * Per-browser announcement state, remembered across reloads.
 *
 * Read belongs to the panel and dismissed to the banner, and neither touches the
 * other: dismissing a banner leaves it unread, and marking it unread in the
 * panel doesn't pop the banner back up.
 */
export function useAnnouncementState(): AnnouncementState {
  const [state, setState] = useState<StoredState>(readStored)

  const update = useCallback((change: (previous: StoredState) => StoredState) => {
    setState(previous => {
      const next = change(previous)
      if (next === previous) return previous
      try {
        localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(next))
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

  const markUnread = useCallback(
    (id: string) =>
      update(previous =>
        previous.read.includes(id)
          ? { ...previous, read: previous.read.filter(other => other !== id) }
          : previous
      ),
    [update]
  )

  const dismiss = useCallback(
    (id: string) =>
      update(previous =>
        previous.dismissed.includes(id)
          ? previous
          : { ...previous, dismissed: [...previous.dismissed, id] }
      ),
    [update]
  )

  const isRead = useCallback((id: string) => state.read.includes(id), [state.read])
  const isDismissed = useCallback(
    (id: string) => state.dismissed.includes(id),
    [state.dismissed]
  )

  return {
    isRead,
    isDismissed,
    markRead,
    markUnread,
    dismiss,
  }
}

/** The date the id (the file name) starts with, else `starts`. */
export function createdOn(announcement: Announcement): string | null {
  return announcement.id.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? announcement.starts
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
