import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  clearActivityClipboardLocal,
  readClipboard,
  regionSummary,
  writeActivityClipboardLocal,
} from '@/features/gocam/services/clipboardStore'
import {
  ACTIVITY_CLIPBOARD_KIND,
  type ActivityClipboardPayload,
} from '@/features/gocam/services/activityClipboard'
import {
  REGION_CLIPBOARD_KEY,
  REGION_CLIPBOARD_KIND,
  type RegionClipboardPayload,
} from '@/features/gocam/services/regionClipboard'

// ── Fixtures ────────────────────────────────────────────────────────

const activityPayload = (label = 'CDK2'): ActivityClipboardPayload => ({
  kind: ACTIVITY_CLIPBOARD_KIND,
  activityType: 'activity',
  label,
  sourceModelId: 'gomodel:src',
  root: { uid: 'a', relations: [] } as never,
})

const regionPayload = (
  copiedAt: string,
  activities = 2,
  connections = 1
): RegionClipboardPayload => ({
  kind: REGION_CLIPBOARD_KIND,
  copiedAt,
  sourceModelId: 'gomodel:src',
  activities: Array.from({ length: activities }, (_unused, i) => ({
    activityType: 'activity' as const,
    label: `ACT${i}`,
    rootNodeUid: `a${i}`,
    rootTermId: `GO:${i}`,
    offset: { x: 0, y: 0 },
    root: { uid: `a${i}`, relations: [] } as never,
  })),
  connections: Array.from({ length: connections }, (_unused, i) => ({
    predicate: { id: 'RO:0002413', label: 'regulates' },
    sourceNodeUid: 'a0',
    targetNodeUid: `a${i + 1}`,
    evidence: [],
  })),
})

const storeRegion = (payload: RegionClipboardPayload) =>
  localStorage.setItem(REGION_CLIPBOARD_KEY, JSON.stringify(payload))

// Far either side of the real clock, because writeActivityClipboardLocal stamps
// the actual current time — so "now" always sits between these two.
const EARLIER = '1999-01-01T00:00:00.000Z'
const LATER = '2099-01-01T00:00:00.000Z'

beforeEach(() => {
  localStorage.clear()
})

// ── Tests ───────────────────────────────────────────────────────────

describe('regionSummary', () => {
  it('counts activities and relations', () => {
    expect(regionSummary(regionPayload(LATER, 3, 2))).toBe('3 activities and 2 relations')
  })

  it('singularises', () => {
    expect(regionSummary(regionPayload(LATER, 1, 1))).toBe('1 activity and 1 relation')
  })

  it('omits relations when there are none', () => {
    expect(regionSummary(regionPayload(LATER, 2, 0))).toBe('2 activities')
  })
})

describe('writeActivityClipboardLocal', () => {
  it('reports success so the caller can confirm the copy', () => {
    expect(writeActivityClipboardLocal(activityPayload())).toBe(true)
  })

  it('reports failure when storage refuses, rather than claiming a copy', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

    expect(writeActivityClipboardLocal(activityPayload())).toBe(false)

    setItem.mockRestore()
  })
})

describe('readClipboard', () => {
  it('returns null when nothing has been copied', () => {
    expect(readClipboard()).toBeNull()
  })

  it('reports a stored single activity', () => {
    writeActivityClipboardLocal(activityPayload('CDK2'))

    const entry = readClipboard()
    expect(entry?.kind).toBe('activity')
    expect(entry?.summary).toBe('CDK2')
  })

  it('reports a stored region with its summary', () => {
    storeRegion(regionPayload(LATER, 2, 1))

    const entry = readClipboard()
    expect(entry?.kind).toBe('region')
    expect(entry?.summary).toBe('2 activities and 1 relation')
  })

  describe('newest wins', () => {
    // This is what makes "copy an activity, then Ctrl+V" do the obvious thing
    // even when an older region is still stored.
    it('prefers a single activity copied after the region', () => {
      storeRegion(regionPayload(EARLIER))
      writeActivityClipboardLocal(activityPayload())

      expect(readClipboard()?.kind).toBe('activity')
    })

    it('prefers a region copied after the single activity', () => {
      writeActivityClipboardLocal(activityPayload())
      storeRegion(regionPayload(LATER))

      expect(readClipboard()?.kind).toBe('region')
    })
  })

  describe('resilience', () => {
    it('ignores a region entry that is not ours', () => {
      localStorage.setItem(REGION_CLIPBOARD_KEY, 'garbage')
      writeActivityClipboardLocal(activityPayload())

      expect(readClipboard()?.kind).toBe('activity')
    })

    it('ignores a malformed activity entry', () => {
      localStorage.setItem('noctua-activity-clipboard', '{ not json')
      storeRegion(regionPayload(LATER))

      expect(readClipboard()?.kind).toBe('region')
    })

    it('ignores an activity entry with no timestamp', () => {
      localStorage.setItem(
        'noctua-activity-clipboard',
        JSON.stringify({ payload: activityPayload() })
      )

      expect(readClipboard()).toBeNull()
    })

    it('ignores an activity entry whose payload fails validation', () => {
      localStorage.setItem(
        'noctua-activity-clipboard',
        JSON.stringify({ copiedAt: LATER, payload: { kind: 'something-else' } })
      )

      expect(readClipboard()).toBeNull()
    })

    it('falls back to the region when the activity entry is unreadable', () => {
      localStorage.setItem('noctua-activity-clipboard', 'nonsense')
      storeRegion(regionPayload(EARLIER))

      expect(readClipboard()?.kind).toBe('region')
    })
  })

  it('forgets a cleared single activity', () => {
    writeActivityClipboardLocal(activityPayload())
    clearActivityClipboardLocal()

    expect(readClipboard()).toBeNull()
  })

  it('falls back to the region once the activity is cleared', () => {
    storeRegion(regionPayload(EARLIER))
    writeActivityClipboardLocal(activityPayload())
    clearActivityClipboardLocal()

    expect(readClipboard()?.kind).toBe('region')
  })
})
