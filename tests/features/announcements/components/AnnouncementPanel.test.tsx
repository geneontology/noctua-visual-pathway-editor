import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, renderHook, act } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import AnnouncementPanel from '@/features/announcements/components/AnnouncementPanel'
import { useAnnouncementState } from '@/features/announcements/hooks/useAnnouncements'
import { buildAnnouncement } from '@tests/fixtures/builders'
import type { Announcement } from '@/features/announcements/models/announcement'
import type { AnnouncementState } from '@/features/announcements/hooks/useAnnouncements'

/** A real state object, so the panel is exercised against the actual rules. */
const realState = () => renderHook(() => useAnnouncementState()).result

const stubState = (overrides: Partial<AnnouncementState> = {}): AnnouncementState => ({
  isRead: () => false,
  isBannerClosed: () => false,
  isDismissed: () => false,
  markRead: vi.fn(),
  closeBanner: vi.fn(),
  dismiss: vi.fn(),
  dismissAll: vi.fn(),
  ...overrides,
})

const renderPanel = (announcements: Announcement[], state: AnnouncementState) => {
  const onClose = vi.fn()
  return {
    onClose,
    ...renderWithProviders(
      <MantineProvider>
        <AnnouncementPanel
          announcements={announcements}
          state={state}
          opened
          onClose={onClose}
        />
      </MantineProvider>
    ),
  }
}

describe('AnnouncementPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('lists every announcement collapsed, showing the description', () => {
    renderPanel(
      [
        buildAnnouncement('a', { title: 'First', description: 'First summary' }),
        buildAnnouncement('b', { title: 'Second', description: 'Second summary' }),
      ],
      stubState()
    )

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('First summary')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('keeps bodies hidden until a row is expanded', () => {
    renderPanel([buildAnnouncement('a', { body: '<p>The long body</p>' })], stubState())

    expect(screen.queryByText('The long body')).not.toBeInTheDocument()
  })

  describe('expanding', () => {
    it('reveals the body and hides the one-line description', async () => {
      const { user } = renderPanel(
        [
          buildAnnouncement('a', {
            title: 'First',
            description: 'Short summary',
            body: '<p>The long body</p>',
          }),
        ],
        stubState()
      )

      await user.click(screen.getByText('First'))

      expect(screen.getByText('The long body')).toBeInTheDocument()
      expect(screen.queryByText('Short summary')).not.toBeInTheDocument()
    })

    it('marks the announcement read', async () => {
      const markRead = vi.fn()
      const { user } = renderPanel(
        [buildAnnouncement('a', { title: 'First' })],
        stubState({ markRead })
      )

      await user.click(screen.getByText('First'))

      expect(markRead).toHaveBeenCalledWith('a')
    })

    it('collapses the previously expanded row, keeping the list scannable', async () => {
      const { user } = renderPanel(
        [
          buildAnnouncement('a', { title: 'First', body: '<p>First body</p>' }),
          buildAnnouncement('b', { title: 'Second', body: '<p>Second body</p>' }),
        ],
        stubState()
      )

      await user.click(screen.getByText('First'))
      expect(screen.getByText('First body')).toBeInTheDocument()

      await user.click(screen.getByText('Second'))
      expect(screen.getByText('Second body')).toBeInTheDocument()
      expect(screen.queryByText('First body')).not.toBeInTheDocument()
    })

    it('collapses again when clicked a second time', async () => {
      const { user } = renderPanel(
        [buildAnnouncement('a', { title: 'First', body: '<p>First body</p>' })],
        stubState()
      )

      await user.click(screen.getByText('First'))
      await user.click(screen.getByText('First'))

      expect(screen.queryByText('First body')).not.toBeInTheDocument()
    })

    it('renders links inside the body, opening them in a new tab', async () => {
      const { user } = renderPanel(
        [
          buildAnnouncement('a', {
            title: 'First',
            body: '<p>See <a href="https://geneontology.org" target="_blank" rel="noopener noreferrer">the docs</a></p>',
          }),
        ],
        stubState()
      )

      await user.click(screen.getByText('First'))

      const link = screen.getByRole('link', { name: 'the docs' })
      expect(link).toHaveAttribute('href', 'https://geneontology.org')
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('renders the descriptionUrl as a More details link', async () => {
      const { user } = renderPanel(
        [
          buildAnnouncement('a', {
            title: 'First',
            descriptionUrl: 'https://example.org/slides',
          }),
        ],
        stubState()
      )

      await user.click(screen.getByText('First'))

      expect(screen.getByRole('link', { name: 'More details' })).toHaveAttribute(
        'href',
        'https://example.org/slides'
      )
    })
  })

  describe('unread marker', () => {
    it('marks an unread announcement', () => {
      renderPanel([buildAnnouncement('a')], stubState({ isRead: () => false }))

      expect(screen.getByLabelText('Unread')).toBeInTheDocument()
    })

    it('drops the marker once read', () => {
      renderPanel([buildAnnouncement('a')], stubState({ isRead: () => true }))

      expect(screen.queryByLabelText('Unread')).not.toBeInTheDocument()
    })
  })

  describe('dismissing', () => {
    it('hides a dismissed announcement', () => {
      renderPanel(
        [
          buildAnnouncement('a', { title: 'Gone' }),
          buildAnnouncement('b', { title: 'Still here' }),
        ],
        stubState({ isDismissed: id => id === 'a' })
      )

      expect(screen.queryByText('Gone')).not.toBeInTheDocument()
      expect(screen.getByText('Still here')).toBeInTheDocument()
    })

    it('dismisses from the expanded row', async () => {
      const dismiss = vi.fn()
      const { user } = renderPanel(
        [buildAnnouncement('a', { title: 'First' })],
        stubState({ dismiss })
      )

      await user.click(screen.getByText('First'))
      await user.click(screen.getByRole('button', { name: 'Dismiss' }))

      expect(dismiss).toHaveBeenCalledWith('a')
    })

    it('clears every dismissable announcement at once', async () => {
      const dismissAll = vi.fn()
      const { user } = renderPanel(
        [buildAnnouncement('a'), buildAnnouncement('b')],
        stubState({ dismissAll })
      )

      await user.click(screen.getByRole('button', { name: 'Clear all' }))

      expect(dismissAll).toHaveBeenCalledWith(['a', 'b'])
    })
  })

  describe('pinned', () => {
    it('cannot be dismissed from its expanded row', async () => {
      const { user } = renderPanel(
        [buildAnnouncement('a', { title: 'Pinned', pinned: true })],
        stubState()
      )

      await user.click(screen.getByText('Pinned'))

      expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
    })

    it('is left out of Clear all', async () => {
      const dismissAll = vi.fn()
      const { user } = renderPanel(
        [
          buildAnnouncement('pin', { pinned: true }),
          buildAnnouncement('normal'),
        ],
        stubState({ dismissAll })
      )

      await user.click(screen.getByRole('button', { name: 'Clear all' }))

      expect(dismissAll).toHaveBeenCalledWith(['normal'])
    })

    it('stays listed even if somehow marked dismissed', () => {
      renderPanel(
        [buildAnnouncement('pin', { title: 'Pinned', pinned: true })],
        stubState({ isDismissed: () => true })
      )

      expect(screen.getByText('Pinned')).toBeInTheDocument()
    })

    it('hides Clear all when everything left is pinned', () => {
      renderPanel([buildAnnouncement('pin', { pinned: true })], stubState())

      expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('says you are caught up when there is nothing', () => {
      renderPanel([], stubState())

      expect(screen.getByText("You're all caught up")).toBeInTheDocument()
    })

    it('says the same when everything has been dismissed', () => {
      renderPanel([buildAnnouncement('a')], stubState({ isDismissed: () => true }))

      expect(screen.getByText("You're all caught up")).toBeInTheDocument()
    })
  })

  it('persists a dismissal through the real state hook', async () => {
    const state = realState()
    const { user } = renderPanel([buildAnnouncement('a', { title: 'First' })], state.current)

    await user.click(screen.getByText('First'))
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))

    await act(async () => {})

    expect(JSON.parse(localStorage.getItem('noctua.announcements.state') ?? '{}')).toMatchObject({
      dismissed: ['a'],
    })
  })
})
