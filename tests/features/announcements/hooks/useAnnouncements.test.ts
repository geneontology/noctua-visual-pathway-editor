import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { buildAnnouncement } from '@tests/fixtures/builders'
import type { Announcement } from '@/features/announcements/models/announcement'

vi.mock('@/features/announcements/slices/announcementsApiSlice', () => ({
  useGetAnnouncementsQuery: vi.fn(),
  POLL_INTERVAL_MS: 1000,
}))

const { useGetAnnouncementsQuery } = await import(
  '@/features/announcements/slices/announcementsApiSlice'
)
const { useAnnouncements, relativeAge } = await import(
  '@/features/announcements/hooks/useAnnouncements'
)

const mockedQuery = vi.mocked(useGetAnnouncementsQuery)

const feed = (...announcements: Announcement[]) => {
  mockedQuery.mockReturnValue({ data: announcements } as ReturnType<
    typeof useGetAnnouncementsQuery
  >)
}

const idsFrom = () => renderHook(() => useAnnouncements()).result.current.map(a => a.id)

describe('useAnnouncements', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Local time, matching how the hook reads the date.
    vi.setSystemTime(new Date('2026-03-15T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns an empty list before the feed arrives', () => {
    mockedQuery.mockReturnValue({ data: undefined } as ReturnType<
      typeof useGetAnnouncementsQuery
    >)

    expect(idsFrom()).toEqual([])
  })

  it('returns an empty list when the fetch failed, so a bad feed is never load-bearing', () => {
    mockedQuery.mockReturnValue({ data: undefined, isError: true } as ReturnType<
      typeof useGetAnnouncementsQuery
    >)

    expect(idsFrom()).toEqual([])
  })

  describe('app targeting', () => {
    it('keeps announcements aimed at this app', () => {
      feed(
        buildAnnouncement('all'),
        buildAnnouncement('vpe-only', { apps: ['vpe'] }),
        buildAnnouncement('with-form', { apps: ['form', 'vpe'] })
      )

      expect(idsFrom()).toEqual(['all', 'vpe-only', 'with-form'])
    })

    it('drops announcements aimed at other apps', () => {
      feed(
        buildAnnouncement('landing-only', { apps: ['landing'] }),
        buildAnnouncement('form-only', { apps: ['form'] })
      )

      expect(idsFrom()).toEqual([])
    })
  })

  describe('scheduling', () => {
    it('hides one that has not started yet', () => {
      feed(buildAnnouncement('future', { starts: '2026-03-16' }))

      expect(idsFrom()).toEqual([])
    })

    it('shows one starting today', () => {
      feed(buildAnnouncement('today', { starts: '2026-03-15' }))

      expect(idsFrom()).toEqual(['today'])
    })

    it('shows one with no start date', () => {
      feed(buildAnnouncement('always', { starts: null }))

      expect(idsFrom()).toEqual(['always'])
    })

    it('treats expires as exclusive, so it is gone on the expiry date itself', () => {
      feed(buildAnnouncement('expiring', { expires: '2026-03-15' }))

      expect(idsFrom()).toEqual([])
    })

    it('still shows one expiring tomorrow', () => {
      feed(buildAnnouncement('tomorrow', { expires: '2026-03-16' }))

      expect(idsFrom()).toEqual(['tomorrow'])
    })

    it('shows one with no expiry forever', () => {
      feed(buildAnnouncement('forever', { starts: '2020-01-01', expires: null }))

      expect(idsFrom()).toEqual(['forever'])
    })

    it('combines both bounds', () => {
      feed(
        buildAnnouncement('before', { starts: '2026-03-01', expires: '2026-03-10' }),
        buildAnnouncement('during', { starts: '2026-03-10', expires: '2026-03-20' }),
        buildAnnouncement('after', { starts: '2026-03-20', expires: '2026-03-30' })
      )

      expect(idsFrom()).toEqual(['during'])
    })
  })

  describe('timezone', () => {
    // toISOString() would report 2026-03-16 here, expiring the announcement a
    // day early for anyone west of UTC.
    it('uses the local date, not UTC, late in the evening', () => {
      vi.setSystemTime(new Date('2026-03-15T23:30:00'))
      feed(buildAnnouncement('tonight', { expires: '2026-03-16' }))

      expect(idsFrom()).toEqual(['tonight'])
    })

    it('uses the local date, not UTC, early in the morning', () => {
      vi.setSystemTime(new Date('2026-03-15T00:30:00'))
      feed(buildAnnouncement('this-morning', { starts: '2026-03-15' }))

      expect(idsFrom()).toEqual(['this-morning'])
    })
  })

  it('preserves feed order, so pinned-first survives filtering', () => {
    feed(
      buildAnnouncement('pinned', { pinned: true }),
      buildAnnouncement('newer'),
      buildAnnouncement('older')
    )

    expect(idsFrom()).toEqual(['pinned', 'newer', 'older'])
  })

  it('filters an expired pinned announcement out like any other', () => {
    feed(buildAnnouncement('stale-pin', { pinned: true, expires: '2026-03-01' }))

    expect(idsFrom()).toEqual([])
  })
})

describe('relativeAge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    [null, 'now'],
    ['2026-03-15', 'today'],
    ['2026-03-14', 'yesterday'],
    ['2026-03-12', '3d'],
    ['2026-03-01', '2w'],
    ['2026-01-05', '2mo'],
    ['2024-03-15', '2y'],
  ])('renders %s as %s', (starts, expected) => {
    expect(relativeAge(starts)).toBe(expected)
  })

  it('returns an empty string for an unparseable date rather than NaN', () => {
    expect(relativeAge('not-a-date')).toBe('')
  })
})
