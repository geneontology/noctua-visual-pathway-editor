import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { buildAnnouncement } from '@tests/fixtures/builders'
import type { Announcement } from '@/features/announcements/models/announcement'

vi.mock('@/features/announcements/slices/announcementsApiSlice', () => ({
  useGetAnnouncementsQuery: vi.fn(),
  POLL_INTERVAL_MS: 1000,
}))

// ENVIRONMENT is read at module load from VITE_APP_ENV, so the environment has
// to be swappable to cover what production does with a testing announcement.
const { environment } = vi.hoisted(() => ({
  environment: { appEnv: 'dev', isDev: true, isBeta: false, isProd: false },
}))

vi.mock('@/@noctua.core/data/constants', () => ({ ENVIRONMENT: environment }))

const runningOn = (appEnv: 'dev' | 'beta' | 'prod') => {
  environment.appEnv = appEnv
  environment.isDev = appEnv === 'dev'
  environment.isBeta = appEnv === 'beta'
  environment.isProd = appEnv === 'prod'
}

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
    runningOn('dev')
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
        buildAnnouncement('with-sae', { apps: ['sae', 'vpe'] })
      )

      expect(idsFrom()).toEqual(['all', 'vpe-only', 'with-sae'])
    })

    it('drops announcements aimed at other apps', () => {
      feed(
        buildAnnouncement('landing-page-only', { apps: ['landing-page'] }),
        buildAnnouncement('sae-only', { apps: ['sae'] })
      )

      expect(idsFrom()).toEqual([])
    })
  })

  // A draft the author wants to look at in place before everyone sees it.
  describe('testing announcements', () => {
    it('shows one on dev', () => {
      runningOn('dev')
      feed(buildAnnouncement('draft', { testing: true }))

      expect(idsFrom()).toEqual(['draft'])
    })

    it('shows one on any build that is not production', () => {
      runningOn('beta')
      feed(buildAnnouncement('draft', { testing: true }))

      expect(idsFrom()).toEqual(['draft'])
    })

    it('never shows one in production', () => {
      runningOn('prod')
      feed(buildAnnouncement('draft', { testing: true }))

      expect(idsFrom()).toEqual([])
    })

    it('leaves ordinary announcements alone in production', () => {
      runningOn('prod')
      feed(buildAnnouncement('real'), buildAnnouncement('draft', { testing: true }))

      expect(idsFrom()).toEqual(['real'])
    })

    it('still applies the other filters to a testing announcement', () => {
      runningOn('dev')
      feed(
        buildAnnouncement('expired-draft', { testing: true, expires: '2026-03-01' }),
        buildAnnouncement('other-app-draft', { testing: true, apps: ['landing-page'] })
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

    // A bare date has no time, so it means the whole of that day.
    it('still shows one on its expiry date, which it has not finished yet', () => {
      feed(buildAnnouncement('expiring', { expires: '2026-03-15' }))

      expect(idsFrom()).toEqual(['expiring'])
    })

    it('is gone the day after it expires', () => {
      feed(buildAnnouncement('expiring', { expires: '2026-03-14' }))

      expect(idsFrom()).toEqual([])
    })

    it('is still showing a minute before midnight on its expiry date', () => {
      vi.setSystemTime(new Date('2026-03-15T23:59:00'))
      feed(buildAnnouncement('expiring', { expires: '2026-03-15' }))

      expect(idsFrom()).toEqual(['expiring'])
    })

    it('is gone a minute after midnight', () => {
      vi.setSystemTime(new Date('2026-03-16T00:01:00'))
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

  // A value with a time is an absolute instant, converted from the author's
  // timezone when the feed was built.
  describe('a scheduled time', () => {
    const at = (local: string) => new Date(local).toISOString()

    it('hides one until its start time', () => {
      feed(buildAnnouncement('window', { starts: at('2026-03-15T16:00:00') }))

      expect(idsFrom()).toEqual([])
    })

    it('shows one once its start time has passed', () => {
      feed(buildAnnouncement('window', { starts: at('2026-03-15T09:00:00') }))

      expect(idsFrom()).toEqual(['window'])
    })

    it('shows one inside its window', () => {
      feed(
        buildAnnouncement('window', {
          starts: at('2026-03-15T09:00:00'),
          expires: at('2026-03-15T18:00:00'),
        })
      )

      expect(idsFrom()).toEqual(['window'])
    })

    it('hides one whose window closed earlier today', () => {
      feed(
        buildAnnouncement('window', {
          starts: at('2026-03-15T06:00:00'),
          expires: at('2026-03-15T09:00:00'),
        })
      )

      expect(idsFrom()).toEqual([])
    })

    it('mixes a timed bound with a whole-day one', () => {
      feed(
        buildAnnouncement('mixed', {
          starts: '2026-03-15',
          expires: at('2026-03-15T18:00:00'),
        })
      )

      expect(idsFrom()).toEqual(['mixed'])
    })
  })

  // Waiting for the next poll would leave a maintenance banner up for minutes
  // after the window closed.
  describe('re-checking on time', () => {
    it('drops one the moment it expires, with no refetch', async () => {
      feed(
        buildAnnouncement('window', {
          expires: new Date('2026-03-15T12:05:00').toISOString(),
        })
      )
      const { result } = renderHook(() => useAnnouncements())
      expect(result.current.map(a => a.id)).toEqual(['window'])

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1000)
      })

      expect(result.current).toEqual([])
    })

    it('shows one the moment it starts, with no refetch', async () => {
      feed(
        buildAnnouncement('window', {
          starts: new Date('2026-03-15T12:05:00').toISOString(),
        })
      )
      const { result } = renderHook(() => useAnnouncements())
      expect(result.current).toEqual([])

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1000)
      })

      expect(result.current.map(a => a.id)).toEqual(['window'])
    })

    it('takes a whole-day announcement down at midnight', async () => {
      vi.setSystemTime(new Date('2026-03-15T23:58:00'))
      feed(buildAnnouncement('today-only', { expires: '2026-03-15' }))
      const { result } = renderHook(() => useAnnouncements())
      expect(result.current.map(a => a.id)).toEqual(['today-only'])

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3 * 60 * 1000)
      })

      expect(result.current).toEqual([])
    })

    it('does not spin when nothing is scheduled', async () => {
      feed(buildAnnouncement('forever'))
      const { result } = renderHook(() => useAnnouncements())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
      })

      expect(result.current.map(a => a.id)).toEqual(['forever'])
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
