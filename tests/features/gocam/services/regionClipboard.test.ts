import { describe, it, expect, beforeEach } from 'vitest'
import {
  REGION_CLIPBOARD_KEY,
  REGION_CLIPBOARD_KIND,
  buildRegionPayload,
  clearRegion,
  parseRegion,
  readRegion,
  writeRegion,
} from '@/features/gocam/services/regionClipboard'
import type { RegionClipboardPayload } from '@/features/gocam/services/regionClipboard'
import type { Activity, Edge, GraphModel, GraphNode } from '@/features/gocam/models/cam'
import { ActivityType, RootTypes } from '@/features/gocam/models/cam'
import { buildActivity, buildNode } from '@tests/fixtures/builders'

// ── Fixtures ────────────────────────────────────────────────────────

const mf = (uid: string, id = 'GO:0003674'): GraphNode => ({
  ...buildNode(id, 'molecular_function'),
  uid,
  rootTypes: [RootTypes.MOLECULAR_FUNCTION],
})

/** An activity whose root node uid is `uid`. */
const activity = (uid: string, termId = 'GO:0003674'): Activity => {
  const root = mf(uid, termId)
  return { ...buildActivity(uid, [root]), rootNode: root, type: ActivityType.ACTIVITY }
}

const connection = (sourceId: string, targetId: string, predicate = 'RO:0002413'): Edge => ({
  uid: `edge-${sourceId}-${targetId}`,
  id: predicate,
  label: 'directly positively regulates',
  sourceId,
  targetId,
  source: mf(sourceId),
  target: mf(targetId),
  evidence: [],
  contributors: [],
  groups: [],
  comments: [],
})

const model = (
  activities: Activity[],
  activityConnections: Edge[] = []
): GraphModel =>
  ({
    id: 'gomodel:src',
    activities,
    activityConnections,
    nodes: [],
    edges: [],
  }) as unknown as GraphModel

const positions = (entries: Record<string, [number, number]>) =>
  Object.fromEntries(Object.entries(entries).map(([uid, [x, y]]) => [uid, { x, y }]))

beforeEach(() => {
  localStorage.clear()
})

// ── buildRegionPayload ──────────────────────────────────────────────

describe('buildRegionPayload', () => {
  it('returns null when nothing is selected', () => {
    expect(buildRegionPayload(model([activity('a')]), [], {})).toBeNull()
  })

  it('returns null when the selection matches no activity', () => {
    expect(buildRegionPayload(model([activity('a')]), ['nope'], {})).toBeNull()
  })

  it('captures only the selected activities', () => {
    const payload = buildRegionPayload(
      model([activity('a'), activity('b'), activity('c')]),
      ['a', 'c'],
      positions({ a: [0, 0], b: [50, 50], c: [100, 20] })
    )

    expect(payload?.activities.map(e => e.rootNodeUid)).toEqual(['a', 'c'])
  })

  it('stores offsets relative to the region top-left, not absolute positions', () => {
    const payload = buildRegionPayload(
      model([activity('a'), activity('b')]),
      ['a', 'b'],
      positions({ a: [300, 200], b: [400, 260] })
    )

    expect(payload?.activities.find(e => e.rootNodeUid === 'a')?.offset).toEqual({ x: 0, y: 0 })
    expect(payload?.activities.find(e => e.rootNodeUid === 'b')?.offset).toEqual({
      x: 100,
      y: 60,
    })
  })

  it('falls back to a zero offset for an activity with no known position', () => {
    const payload = buildRegionPayload(
      model([activity('a')]),
      ['a'],
      {}
    )

    expect(payload?.activities[0].offset).toEqual({ x: 0, y: 0 })
  })

  it('records the root term id, used to correlate uids after a paste', () => {
    const payload = buildRegionPayload(
      model([activity('a', 'GO:0016301')]),
      ['a'],
      positions({ a: [0, 0] })
    )

    expect(payload?.activities[0].rootTermId).toBe('GO:0016301')
  })

  describe('connections', () => {
    it('keeps a relation when both ends are selected', () => {
      const payload = buildRegionPayload(
        model([activity('a'), activity('b')], [connection('a', 'b')]),
        ['a', 'b'],
        positions({ a: [0, 0], b: [100, 0] })
      )

      expect(payload?.connections).toHaveLength(1)
      expect(payload?.connections[0]).toMatchObject({
        sourceNodeUid: 'a',
        targetNodeUid: 'b',
        predicate: { id: 'RO:0002413' },
      })
    })

    it('drops a relation pointing outside the selection', () => {
      const payload = buildRegionPayload(
        model([activity('a'), activity('b')], [connection('a', 'b')]),
        ['a'],
        positions({ a: [0, 0] })
      )

      expect(payload?.connections).toEqual([])
    })

    it('has no connections when none were copied', () => {
      const payload = buildRegionPayload(
        model([activity('a'), activity('b')]),
        ['a', 'b'],
        positions({ a: [0, 0], b: [100, 0] })
      )

      expect(payload?.connections).toEqual([])
    })
  })

  it('stamps the source model and a parseable timestamp', () => {
    const payload = buildRegionPayload(
      model([activity('a')]),
      ['a'],
      positions({ a: [0, 0] })
    )

    expect(payload?.sourceModelId).toBe('gomodel:src')
    expect(Number.isNaN(Date.parse(payload!.copiedAt))).toBe(false)
  })
})

// ── parseRegion ─────────────────────────────────────────────────────

describe('parseRegion', () => {
  const valid = (): RegionClipboardPayload => ({
    kind: REGION_CLIPBOARD_KIND,
    copiedAt: new Date().toISOString(),
    sourceModelId: 'gomodel:src',
    activities: [
      {
        activityType: 'activity',
        label: 'ACT',
        rootNodeUid: 'a',
        rootTermId: 'GO:0003674',
        offset: { x: 0, y: 0 },
        root: { uid: 'a', relations: [] } as never,
      },
    ],
    connections: [],
  })

  it('round-trips a valid payload', () => {
    const payload = valid()
    expect(parseRegion(JSON.stringify(payload))).toEqual(payload)
  })

  it.each([
    ['null', null],
    ['empty string', ''],
    ['whitespace', '   '],
    ['non-JSON text', 'hello world'],
    ['malformed JSON', '{ "kind": '],
  ])('rejects %s', (_label, input) => {
    expect(parseRegion(input as string | null)).toBeNull()
  })

  it('rejects a single-activity clipboard payload', () => {
    expect(parseRegion(JSON.stringify({ kind: 'noctua-activity/v1', root: {} }))).toBeNull()
  })

  it('rejects a payload with no activities', () => {
    expect(parseRegion(JSON.stringify({ ...valid(), activities: [] }))).toBeNull()
  })

  it('rejects a payload whose connections are missing', () => {
    const withoutConnections: Record<string, unknown> = { ...valid() }
    delete withoutConnections.connections
    expect(parseRegion(JSON.stringify(withoutConnections))).toBeNull()
  })

  it('rejects an activity entry with no usable tree', () => {
    const payload = valid()
    expect(
      parseRegion(
        JSON.stringify({
          ...payload,
          activities: [{ ...payload.activities[0], root: { uid: 'a' } }],
        })
      )
    ).toBeNull()
  })
})

// ── storage ─────────────────────────────────────────────────────────

describe('region storage', () => {
  const payload = (): RegionClipboardPayload =>
    buildRegionPayload(model([activity('a')]), ['a'], positions({ a: [0, 0] }))!

  it('writes and reads back a region', () => {
    expect(writeRegion(payload())).toBe(true)
    expect(readRegion()?.activities[0].rootNodeUid).toBe('a')
  })

  it('reads null when nothing has been copied', () => {
    expect(readRegion()).toBeNull()
  })

  it('reads null when the stored value is not one of ours', () => {
    localStorage.setItem(REGION_CLIPBOARD_KEY, 'garbage')
    expect(readRegion()).toBeNull()
  })

  it('last copy wins', () => {
    writeRegion(payload())
    const second = buildRegionPayload(
      model([activity('z')]),
      ['z'],
      positions({ z: [0, 0] })
    )!
    writeRegion(second)

    expect(readRegion()?.activities[0].rootNodeUid).toBe('z')
  })

  it('clears the stored region', () => {
    writeRegion(payload())
    clearRegion()
    expect(readRegion()).toBeNull()
  })
})
