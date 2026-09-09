import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnnouncementState } from '@/features/announcements/hooks/useAnnouncements'

const STORAGE_KEY = 'noctua.announcements.state'

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')

describe('useAnnouncementState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with nothing read, closed or dismissed', () => {
    const { result } = renderHook(() => useAnnouncementState())

    expect(result.current.isRead('a')).toBe(false)
    expect(result.current.isBannerClosed('a')).toBe(false)
    expect(result.current.isDismissed('a')).toBe(false)
  })

  // The three sets are separate on purpose. Folding "banner closed" into "read"
  // made the banner disappear the moment anyone opened the panel.
  describe('the three states stay independent', () => {
    it('marking read does not close the banner or dismiss', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.markRead('a'))

      expect(result.current.isRead('a')).toBe(true)
      expect(result.current.isBannerClosed('a')).toBe(false)
      expect(result.current.isDismissed('a')).toBe(false)
    })

    it('closing the banner does not mark read or dismiss', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.closeBanner('a'))

      expect(result.current.isBannerClosed('a')).toBe(true)
      expect(result.current.isRead('a')).toBe(false)
      expect(result.current.isDismissed('a')).toBe(false)
    })

    it('dismissing also marks read, so it cannot linger in the bell badge', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.dismiss('a'))

      expect(result.current.isDismissed('a')).toBe(true)
      expect(result.current.isRead('a')).toBe(true)
    })

    it('dismissing keeps an earlier banner close', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.closeBanner('a'))
      act(() => result.current.dismiss('a'))

      expect(result.current.isBannerClosed('a')).toBe(true)
      expect(result.current.isDismissed('a')).toBe(true)
    })

    it('dismissAll keeps earlier banner closes', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.closeBanner('a'))
      act(() => result.current.dismissAll(['a', 'b']))

      expect(result.current.isBannerClosed('a')).toBe(true)
      expect(result.current.isDismissed('a')).toBe(true)
      expect(result.current.isDismissed('b')).toBe(true)
    })
  })

  describe('persistence', () => {
    it('writes each set to localStorage', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.markRead('read-one'))
      act(() => result.current.closeBanner('closed-one'))
      act(() => result.current.dismiss('gone-one'))

      expect(stored()).toEqual({
        read: ['read-one', 'gone-one'],
        bannerClosed: ['closed-one'],
        dismissed: ['gone-one'],
      })
    })

    // Keyed by id, so closing today's banner must not suppress tomorrow's.
    it('a newly published announcement is not affected by earlier closes', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ read: ['old'], bannerClosed: ['old'], dismissed: [] })
      )
      const { result } = renderHook(() => useAnnouncementState())

      expect(result.current.isBannerClosed('old')).toBe(true)
      expect(result.current.isBannerClosed('brand-new')).toBe(false)
    })

    it('restores state written by an earlier session', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ read: ['a'], bannerClosed: ['b'], dismissed: ['c'] })
      )
      const { result } = renderHook(() => useAnnouncementState())

      expect(result.current.isRead('a')).toBe(true)
      expect(result.current.isBannerClosed('b')).toBe(true)
      expect(result.current.isDismissed('c')).toBe(true)
    })

    it('does not rewrite storage when nothing changes', () => {
      const { result } = renderHook(() => useAnnouncementState())
      act(() => result.current.markRead('a'))

      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      act(() => result.current.markRead('a'))

      expect(setItem).not.toHaveBeenCalled()
      setItem.mockRestore()
    })
  })

  describe('bad stored values', () => {
    it('treats unparseable JSON as a clean slate', () => {
      localStorage.setItem(STORAGE_KEY, 'not json{')
      const { result } = renderHook(() => useAnnouncementState())

      expect(result.current.isRead('a')).toBe(false)
    })

    it('treats non-array fields as empty', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ read: 'nope', dismissed: 7 }))
      const { result } = renderHook(() => useAnnouncementState())

      expect(result.current.isRead('a')).toBe(false)
      expect(result.current.isDismissed('a')).toBe(false)
    })

    // State written before bannerClosed existed has no such key.
    it('fills in a missing set from older stored state', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ read: ['a'], dismissed: [] }))
      const { result } = renderHook(() => useAnnouncementState())

      expect(result.current.isRead('a')).toBe(true)
      expect(result.current.isBannerClosed('a')).toBe(false)
    })

    it('survives storage being unavailable', () => {
      const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied')
      })
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('denied')
      })

      const { result } = renderHook(() => useAnnouncementState())
      act(() => result.current.markRead('a'))

      // The write failed, but in-memory state still updated for this session.
      expect(result.current.isRead('a')).toBe(true)

      getItem.mockRestore()
      setItem.mockRestore()
    })
  })
})
