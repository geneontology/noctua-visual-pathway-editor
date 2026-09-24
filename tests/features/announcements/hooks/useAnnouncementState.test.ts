import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  ANNOUNCEMENTS_STORAGE_KEY,
  useAnnouncementState,
} from '@/features/announcements/hooks/useAnnouncements'

const stored = () => JSON.parse(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY) ?? '{}')

describe('useAnnouncementState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with nothing read or dismissed', () => {
    const { result } = renderHook(() => useAnnouncementState())

    expect(result.current.isRead('a')).toBe(false)
    expect(result.current.isDismissed('a')).toBe(false)
  })

  // Read belongs to the panel, dismissed to the banner.
  describe('read and dismissed are independent', () => {
    it('dismissing the banner leaves it unread', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.dismiss('a'))

      expect(result.current.isDismissed('a')).toBe(true)
      expect(result.current.isRead('a')).toBe(false)
    })

    it('reading it leaves the banner up', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.markRead('a'))

      expect(result.current.isRead('a')).toBe(true)
      expect(result.current.isDismissed('a')).toBe(false)
    })

    // Otherwise marking it unread in the panel would pop the banner back up.
    it('marking it unread leaves a dismissed banner dismissed', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.dismiss('a'))
      act(() => result.current.markRead('a'))
      act(() => result.current.markUnread('a'))

      expect(result.current.isRead('a')).toBe(false)
      expect(result.current.isDismissed('a')).toBe(true)
    })

    it('touches only the announcement it is given', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.markRead('a'))
      act(() => result.current.dismiss('a'))

      expect(result.current.isRead('b')).toBe(false)
      expect(result.current.isDismissed('b')).toBe(false)
    })
  })

  describe('marking unread', () => {
    it('undoes a read', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.markRead('a'))
      act(() => result.current.markUnread('a'))

      expect(result.current.isRead('a')).toBe(false)
    })

    it('leaves the others read', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.markRead('a'))
      act(() => result.current.markRead('b'))
      act(() => result.current.markUnread('a'))

      expect(result.current.isRead('b')).toBe(true)
    })

    it('does nothing for one that was never read', () => {
      const { result } = renderHook(() => useAnnouncementState())
      const setItem = vi.spyOn(Storage.prototype, 'setItem')

      act(() => result.current.markUnread('never-read'))

      expect(setItem).not.toHaveBeenCalled()
      setItem.mockRestore()
    })
  })

  describe('persistence', () => {
    it('writes both sets to localStorage', () => {
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.markRead('read-one'))
      act(() => result.current.dismiss('dismissed-one'))

      expect(stored()).toEqual({ read: ['read-one'], dismissed: ['dismissed-one'] })
    })

    it('restores state written by an earlier session', () => {
      localStorage.setItem(
        ANNOUNCEMENTS_STORAGE_KEY,
        JSON.stringify({ read: ['a'], dismissed: ['b'] })
      )
      const { result } = renderHook(() => useAnnouncementState())

      expect(result.current.isRead('a')).toBe(true)
      expect(result.current.isDismissed('b')).toBe(true)
    })

    it('a newly published announcement is not affected by earlier dismissals', () => {
      localStorage.setItem(
        ANNOUNCEMENTS_STORAGE_KEY,
        JSON.stringify({ read: [], dismissed: ['old'] })
      )
      const { result } = renderHook(() => useAnnouncementState())

      expect(result.current.isDismissed('brand-new')).toBe(false)
    })

    it('does not rewrite storage when nothing changes', () => {
      const { result } = renderHook(() => useAnnouncementState())
      act(() => result.current.markRead('a'))
      act(() => result.current.dismiss('a'))

      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      act(() => result.current.markRead('a'))
      act(() => result.current.dismiss('a'))

      expect(setItem).not.toHaveBeenCalled()
      setItem.mockRestore()
    })
  })

  describe('bad stored values', () => {
    it('treats unparseable JSON as a clean slate', () => {
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, 'not json{')
      const { result } = renderHook(() => useAnnouncementState())

      expect(result.current.isRead('a')).toBe(false)
    })

    it('treats non-array fields as empty', () => {
      localStorage.setItem(
        ANNOUNCEMENTS_STORAGE_KEY,
        JSON.stringify({ read: 'nope', dismissed: 7 })
      )
      const { result } = renderHook(() => useAnnouncementState())

      expect(result.current.isRead('a')).toBe(false)
      expect(result.current.isDismissed('a')).toBe(false)
    })

    it('ignores fields it does not know', () => {
      localStorage.setItem(
        ANNOUNCEMENTS_STORAGE_KEY,
        JSON.stringify({ read: ['a'], bannerClosed: ['b'], dismissed: [] })
      )
      const { result } = renderHook(() => useAnnouncementState())

      act(() => result.current.dismiss('c'))

      expect(stored()).toEqual({ read: ['a'], dismissed: ['c'] })
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
