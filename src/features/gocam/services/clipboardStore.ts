import type { RegionClipboardPayload } from './regionClipboard'
import { REGION_CLIPBOARD_KEY, parseRegion } from './regionClipboard'

/**
 * What is on the canvas clipboard. One kind only — a copied region, which is a
 * region of one when a single node was copied — so the UI can tell
 * synchronously whether a paste is available and offer Paste only when there is
 * genuinely something to paste.
 */
export interface ClipboardEntry {
  copiedAt: string
  summary: string
  payload: RegionClipboardPayload
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

/** e.g. "8 nodes" — how the canvas paste row counts a copied region. */
export function regionSummary(payload: RegionClipboardPayload): string {
  return plural(payload.activities.length, 'node', 'nodes')
}

/** The most recent thing copied, or null when nothing is available. */
export function readClipboard(): ClipboardEntry | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(REGION_CLIPBOARD_KEY)
  } catch {
    return null
  }

  const payload = parseRegion(raw)
  if (!payload) return null

  return {
    copiedAt: payload.copiedAt,
    summary: regionSummary(payload),
    payload,
  }
}
