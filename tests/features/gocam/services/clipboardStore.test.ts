import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readClipboard, regionSummary } from '@/features/gocam/services/clipboardStore'
import {
  REGION_CLIPBOARD_KEY,
  REGION_CLIPBOARD_KIND,
  type RegionClipboardPayload,
} from '@/features/gocam/services/regionClipboard'

// ── Fixtures ────────────────────────────────────────────────────────

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

const LATER = '2099-01-01T00:00:00.000Z'

beforeEach(() => {
  localStorage.clear()
})

// ── Tests ───────────────────────────────────────────────────────────

describe('regionSummary', () => {
  it('counts the nodes, leaving relations out of it', () => {
    expect(regionSummary(regionPayload(LATER, 3, 2))).toBe('3 nodes')
  })

  it('singularises — a single copied node is a region of one', () => {
    expect(regionSummary(regionPayload(LATER, 1, 0))).toBe('1 node')
  })
})

describe('readClipboard', () => {
  it('returns null when nothing has been copied', () => {
    expect(readClipboard()).toBeNull()
  })

  it('reports a stored region with its summary', () => {
    storeRegion(regionPayload(LATER, 2, 1))

    const entry = readClipboard()
    expect(entry?.summary).toBe('2 nodes')
    expect(entry?.copiedAt).toBe(LATER)
    expect(entry?.payload.activities).toHaveLength(2)
  })

  it('reports a single copied node the same way — one path for 1 and N', () => {
    storeRegion(regionPayload(LATER, 1, 0))

    expect(readClipboard()?.summary).toBe('1 node')
  })

  describe('resilience', () => {
    it('ignores a region entry that is not ours', () => {
      localStorage.setItem(REGION_CLIPBOARD_KEY, 'garbage')

      expect(readClipboard()).toBeNull()
    })

    it('ignores a malformed entry rather than throwing', () => {
      localStorage.setItem(REGION_CLIPBOARD_KEY, '{ not json')

      expect(() => readClipboard()).not.toThrow()
      expect(readClipboard()).toBeNull()
    })

    it('survives storage that refuses to be read', () => {
      const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      expect(readClipboard()).toBeNull()

      getItem.mockRestore()
    })
  })
})
