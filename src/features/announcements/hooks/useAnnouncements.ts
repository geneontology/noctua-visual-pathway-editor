import { useCallback, useMemo, useState } from 'react'
import { useGetAnnouncementsQuery } from '../slices/announcementsApiSlice'
import { CURRENT_APP } from '../models/announcement'
import type { Announcement } from '../models/announcement'

const DISMISSED_KEY = 'noctua.announcements.dismissed'

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
 * A failed fetch yields an empty list — announcements are never load-bearing.
 */
export function useAnnouncements(): Announcement[] {
  const { data } = useGetAnnouncementsQuery()

  return useMemo(() => {
    if (!data) return []
    const date = today()
    return data.filter(a => a.apps.includes(CURRENT_APP) && isActive(a, date))
  }, [data])
}

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Private browsing, cleared storage, or a corrupted value — nothing is
    // dismissed, which just means the banner shows again.
    return []
  }
}

/** Banner dismissals, remembered per announcement id in this browser. */
export function useAnnouncementDismissal() {
  const [dismissed, setDismissed] = useState<string[]>(readDismissed)

  const dismiss = useCallback((id: string) => {
    setDismissed(previous => {
      if (previous.includes(id)) return previous
      const next = [...previous, id]
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
      } catch {
        // Not persisting is fine; it comes back on reload.
      }
      return next
    })
  }, [])

  const isDismissed = useCallback((id: string) => dismissed.includes(id), [dismissed])

  return { isDismissed, dismiss }
}
