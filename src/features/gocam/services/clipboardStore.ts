import type { ActivityClipboardPayload } from './activityClipboard'
import { parseActivityClipboard } from './activityClipboard'
import type { RegionClipboardPayload } from './regionClipboard'
import { REGION_CLIPBOARD_KEY, parseRegion } from './regionClipboard'

/**
 * What is on the canvas clipboard, across both payload kinds.
 *
 * A single activity is still written to the *system* clipboard as text, so it
 * can cross browsers and tabs — but it is now mirrored here as well. That means
 * the UI can tell synchronously whether a paste is available (the system
 * clipboard can only be read behind a permission Firefox never grants), so the
 * context menu can offer Paste only when there is genuinely something to paste.
 *
 * Both kinds are timestamped and the newest wins, which is what makes "copy an
 * activity, then Ctrl+V" do the obvious thing even with an older region stored.
 */
const ACTIVITY_CLIPBOARD_KEY = 'noctua-activity-clipboard'

interface StoredActivity {
  copiedAt: string
  payload: ActivityClipboardPayload
}

export type ClipboardEntry =
  | { kind: 'region'; copiedAt: string; summary: string; payload: RegionClipboardPayload }
  | { kind: 'activity'; copiedAt: string; summary: string; payload: ActivityClipboardPayload }

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

export function regionSummary(payload: RegionClipboardPayload): string {
  const head = plural(payload.activities.length, 'activity', 'activities')
  if (payload.connections.length === 0) return head
  return `${head} and ${plural(payload.connections.length, 'relation', 'relations')}`
}

/** Store a single-activity copy. Returns false if storage refused it. */
export function writeActivityClipboardLocal(payload: ActivityClipboardPayload): boolean {
  try {
    const stored: StoredActivity = { copiedAt: new Date().toISOString(), payload }
    localStorage.setItem(ACTIVITY_CLIPBOARD_KEY, JSON.stringify(stored))
    return true
  } catch {
    // Private mode or a full quota — nothing was stored, so say so rather than
    // claiming a copy the user cannot paste.
    return false
  }
}

function readStoredActivity(): { copiedAt: string; payload: ActivityClipboardPayload } | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(ACTIVITY_CLIPBOARD_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const stored = parsed as Partial<StoredActivity> | null
  if (!stored?.payload || typeof stored.copiedAt !== 'string') return null

  // Re-validate through the shared parser so a stale format can't slip through.
  const payload = parseActivityClipboard(JSON.stringify(stored.payload))
  return payload ? { copiedAt: stored.copiedAt, payload } : null
}

function readStoredRegion(): { copiedAt: string; payload: RegionClipboardPayload } | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(REGION_CLIPBOARD_KEY)
  } catch {
    return null
  }
  const payload = parseRegion(raw)
  return payload ? { copiedAt: payload.copiedAt, payload } : null
}

const time = (iso: string): number => {
  const parsed = Date.parse(iso)
  return Number.isNaN(parsed) ? 0 : parsed
}

/** The most recent thing copied, or null when nothing is available. */
export function readClipboard(): ClipboardEntry | null {
  const region = readStoredRegion()
  const activity = readStoredActivity()

  if (region && (!activity || time(region.copiedAt) >= time(activity.copiedAt))) {
    return {
      kind: 'region',
      copiedAt: region.copiedAt,
      summary: regionSummary(region.payload),
      payload: region.payload,
    }
  }

  if (activity) {
    return {
      kind: 'activity',
      copiedAt: activity.copiedAt,
      summary: activity.payload.label || 'activity',
      payload: activity.payload,
    }
  }

  return null
}

export function clearActivityClipboardLocal(): void {
  try {
    localStorage.removeItem(ACTIVITY_CLIPBOARD_KEY)
  } catch {
    // Nothing to do.
  }
}
