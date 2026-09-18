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

/** The panel wired to a live state hook, so its updates reach the rows. */
const LivePanel = ({ announcements }: { announcements: Announcement[] }) => {
  const state = useAnnouncementState()
  return (
    <AnnouncementPanel
      announcements={announcements}
      state={state}
      opened
      onClose={() => {}}
    />
  )
}

const stubState = (overrides: Partial<AnnouncementState> = {}): AnnouncementState => ({
  isRead: () => false,
  isBannerClosed: () => false,
  isDismissed: () => false,
  markRead: vi.fn(),
  closeBanner: vi.fn(),
  dismiss: vi.fn(),
  dismissAll: vi.fn(),
  restore: vi.fn(),
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
      await user.click(screen.getByRole('button', { name: 'Dismiss First' }))

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

      expect(screen.queryByRole('button', { name: 'Dismiss Pinned' })).not.toBeInTheDocument()
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

  // Dismissing hides rather than deletes, so nothing is lost to a stray click on
  // Clear all.
  describe('showing dismissed announcements', () => {
    it('offers no toggle while nothing has been dismissed', () => {
      renderPanel([buildAnnouncement('a'), buildAnnouncement('b')], stubState())

      expect(screen.queryByRole('button', { name: /Show dismissed/ })).not.toBeInTheDocument()
    })

    it('counts what is hidden behind the toggle', () => {
      renderPanel(
        [buildAnnouncement('a'), buildAnnouncement('b'), buildAnnouncement('c')],
        stubState({ isDismissed: id => id !== 'a' })
      )

      expect(screen.getByRole('button', { name: 'Show dismissed (2)' })).toBeInTheDocument()
    })

    it('lists the dismissed ones once toggled on', async () => {
      const { user } = renderPanel(
        [
          buildAnnouncement('a', { title: 'Still here' }),
          buildAnnouncement('b', { title: 'Cleared earlier' }),
        ],
        stubState({ isDismissed: id => id === 'b' })
      )
      expect(screen.queryByText('Cleared earlier')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Show dismissed (1)' }))

      expect(screen.getByText('Cleared earlier')).toBeInTheDocument()
      expect(screen.getByText('Still here')).toBeInTheDocument()
    })

    it('goes back to the new ones', async () => {
      const { user } = renderPanel(
        [
          buildAnnouncement('a', { title: 'Still here' }),
          buildAnnouncement('b', { title: 'Cleared earlier' }),
        ],
        stubState({ isDismissed: id => id === 'b' })
      )

      await user.click(screen.getByRole('button', { name: 'Show dismissed (1)' }))
      await user.click(screen.getByRole('button', { name: 'Show new only' }))

      expect(screen.queryByText('Cleared earlier')).not.toBeInTheDocument()
    })

    it('restores one from its row', async () => {
      const restore = vi.fn()
      const { user } = renderPanel(
        [buildAnnouncement('b', { title: 'Cleared earlier' })],
        stubState({ isDismissed: () => true, restore })
      )

      await user.click(screen.getByRole('button', { name: 'Show dismissed (1)' }))
      await user.click(screen.getByRole('button', { name: 'Restore Cleared earlier' }))

      expect(restore).toHaveBeenCalledWith('b')
    })

    it('restores one from its expanded row', async () => {
      const restore = vi.fn()
      const { user } = renderPanel(
        [buildAnnouncement('b', { title: 'Cleared earlier' })],
        stubState({ isDismissed: () => true, restore })
      )

      await user.click(screen.getByRole('button', { name: 'Show dismissed (1)' }))
      await user.click(screen.getByText('Cleared earlier'))
      await user.click(screen.getByRole('button', { name: 'Restore Cleared earlier' }))

      expect(restore).toHaveBeenCalledWith('b')
    })

    // Clearing while looking at the dismissed ones reads as "clear these too",
    // which is the opposite of what the view is for.
    it('hides Clear all while the dismissed ones are showing', async () => {
      const { user } = renderPanel(
        [buildAnnouncement('a'), buildAnnouncement('b')],
        stubState({ isDismissed: id => id === 'b' })
      )
      expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Show dismissed (1)' }))

      expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
    })

    it('says there is nothing at all when the feed is empty', async () => {
      renderPanel([], stubState())

      expect(screen.getByText("You're all caught up")).toBeInTheDocument()
    })

    // Driven through a live hook rather than `realState()`: that returns a
    // snapshot, so the panel would never see the state change.
    it('comes back through the real state hook', async () => {
      const { user } = renderWithProviders(
        <MantineProvider>
          <LivePanel
            announcements={[
              buildAnnouncement('a', { title: 'Keeper' }),
              buildAnnouncement('b', { title: 'Cleared earlier' }),
            ]}
          />
        </MantineProvider>
      )

      await user.click(screen.getByRole('button', { name: 'Dismiss Cleared earlier' }))
      expect(screen.queryByText('Cleared earlier')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Show dismissed (1)' }))
      await user.click(screen.getByRole('button', { name: 'Restore Cleared earlier' }))

      // Nothing is dismissed any more, so the toggle goes and the list is back
      // to showing everything that counts as new.
      expect(screen.queryByRole('button', { name: /Show dismissed/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Show new only' })).not.toBeInTheDocument()
      expect(screen.getByText('Cleared earlier')).toBeInTheDocument()
      expect(
        JSON.parse(localStorage.getItem('noctua.announcements.state') ?? '{}').dismissed
      ).toEqual([])
    })
  })

  it('persists a dismissal through the real state hook', async () => {
    const state = realState()
    const { user } = renderPanel([buildAnnouncement('a', { title: 'First' })], state.current)

    await user.click(screen.getByText('First'))
    await user.click(screen.getByRole('button', { name: 'Dismiss First' }))

    await act(async () => {})

    expect(JSON.parse(localStorage.getItem('noctua.announcements.state') ?? '{}')).toMatchObject({
      dismissed: ['a'],
    })
  })
})
