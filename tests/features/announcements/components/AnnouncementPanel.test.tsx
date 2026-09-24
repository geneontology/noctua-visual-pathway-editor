import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, renderHook, act } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import AnnouncementPanel from '@/features/announcements/components/AnnouncementPanel'
import {
  ANNOUNCEMENTS_STORAGE_KEY,
  useAnnouncementState,
} from '@/features/announcements/hooks/useAnnouncements'
import { PREFERENCES_STORAGE_KEY } from '@/@noctua.core/hooks/usePreference'
import { buildAnnouncement } from '@tests/fixtures/builders'
import type { Announcement } from '@/features/announcements/models/announcement'
import type { AnnouncementState } from '@/features/announcements/hooks/useAnnouncements'

/** A real state object, so the panel is exercised against the actual rules. */
const realState = () => renderHook(() => useAnnouncementState()).result

/** The panel wired to a live state hook, so its updates reach the rows. */
const LivePanel = ({
  announcements,
  opened = true,
}: {
  announcements: Announcement[]
  opened?: boolean
}) => {
  const state = useAnnouncementState()
  return (
    <AnnouncementPanel
      announcements={announcements}
      state={state}
      opened={opened}
      onClose={() => {}}
    />
  )
}

const stubState = (overrides: Partial<AnnouncementState> = {}): AnnouncementState => ({
  isRead: () => false,
  isDismissed: () => false,
  markRead: vi.fn(),
  markUnread: vi.fn(),
  dismiss: vi.fn(),
  ...overrides,
})

const renderPanel = (
  announcements: Announcement[],
  state: AnnouncementState,
  focusedId: string | null = null
) => {
  const onClose = vi.fn()
  return {
    onClose,
    ...renderWithProviders(
      <MantineProvider>
        <AnnouncementPanel
          announcements={announcements}
          state={state}
          opened
          focusedId={focusedId}
          onClose={onClose}
        />
      </MantineProvider>
    ),
  }
}

/** Row titles top to bottom — each row is the one button that expands. */
const rowOrder = () =>
  screen
    .getAllByRole('button', { expanded: false })
    .concat(screen.queryAllByRole('button', { expanded: true }))
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map(row => row.textContent ?? '')

const isBefore = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)

const readHeading = () => screen.getByText('Read', { exact: true })
const queryReadHeading = () => screen.queryByText('Read', { exact: true })
const showReadSwitch = () => screen.getByRole('switch', { name: 'Show read' })

const storedPreferences = () => JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}')

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

  it('has no Clear all', () => {
    renderPanel([buildAnnouncement('a'), buildAnnouncement('b')], stubState())

    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
  })

  // Dismissing is about the banner; the panel lists everything.
  it('still lists an announcement whose banner was dismissed, as new', () => {
    renderPanel(
      [buildAnnouncement('a', { title: 'Banner dismissed' })],
      stubState({ isDismissed: () => true })
    )

    expect(screen.getByText('Banner dismissed')).toBeInTheDocument()
    expect(screen.getByLabelText('Unread')).toBeInTheDocument()
    expect(queryReadHeading()).not.toBeInTheDocument()
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

    // It would otherwise jump under Read the moment it was opened.
    it('keeps a row it just read where it is until the panel is reopened', async () => {
      const announcements = [
        buildAnnouncement('a', { title: 'First' }),
        buildAnnouncement('b', { title: 'Second' }),
      ]
      const { user, rerender } = renderWithProviders(
        <MantineProvider>
          <LivePanel announcements={announcements} />
        </MantineProvider>
      )

      await user.click(screen.getByText('First'))
      expect(queryReadHeading()).not.toBeInTheDocument()

      rerender(
        <MantineProvider>
          <LivePanel announcements={announcements} opened={false} />
        </MantineProvider>
      )
      rerender(
        <MantineProvider>
          <LivePanel announcements={announcements} />
        </MantineProvider>
      )

      expect(isBefore(readHeading(), screen.getByText('First'))).toBe(true)
      expect(isBefore(screen.getByText('Second'), readHeading())).toBe(true)
    })
  })

  describe('opened on one announcement', () => {
    it('expands it', () => {
      renderPanel(
        [
          buildAnnouncement('a', { title: 'First', body: '<p>First body</p>' }),
          buildAnnouncement('b', { title: 'Second', body: '<p>Second body</p>' }),
        ],
        stubState(),
        'b'
      )

      expect(screen.getByText('Second body')).toBeInTheDocument()
      expect(screen.queryByText('First body')).not.toBeInTheDocument()
    })

    it('marks it read', () => {
      const markRead = vi.fn()
      renderPanel([buildAnnouncement('a'), buildAnnouncement('b')], stubState({ markRead }), 'b')

      expect(markRead).toHaveBeenCalledWith('b')
      expect(markRead).not.toHaveBeenCalledWith('a')
    })

    it('expands nothing when opened from the bell', () => {
      const markRead = vi.fn()
      renderPanel([buildAnnouncement('a', { body: '<p>First body</p>' })], stubState({ markRead }))

      expect(screen.queryByText('First body')).not.toBeInTheDocument()
      expect(markRead).not.toHaveBeenCalled()
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

  describe('order', () => {
    it('lists the newest first, by the date in the id', () => {
      renderPanel(
        [
          buildAnnouncement('2026-09-01-oldest', { title: 'Oldest' }),
          buildAnnouncement('2026-09-20-newest', { title: 'Newest' }),
          buildAnnouncement('2026-09-10-middle', { title: 'Middle' }),
        ],
        stubState()
      )

      expect(rowOrder()).toEqual([
        expect.stringContaining('Newest'),
        expect.stringContaining('Middle'),
        expect.stringContaining('Oldest'),
      ])
    })

    it('falls back to starts for an id with no date', () => {
      renderPanel(
        [
          buildAnnouncement('2026-09-01-dated', { title: 'Dated' }),
          buildAnnouncement('undated', { title: 'Undated', starts: '2026-09-15' }),
        ],
        stubState()
      )

      expect(rowOrder()).toEqual([
        expect.stringContaining('Undated'),
        expect.stringContaining('Dated'),
      ])
    })

    it('keeps a pinned one on top, however old', () => {
      renderPanel(
        [
          buildAnnouncement('2026-09-20-newer', { title: 'Newer' }),
          buildAnnouncement('2026-01-01-pinned', { title: 'Pinned', pinned: true }),
        ],
        stubState()
      )

      expect(rowOrder()[0]).toContain('Pinned')
    })

    it('puts every unread one before every read one', () => {
      renderPanel(
        [
          buildAnnouncement('2026-09-20-newest', { title: 'Newest, read' }),
          buildAnnouncement('2026-09-01-oldest', { title: 'Oldest, unread' }),
        ],
        stubState({ isRead: id => id === '2026-09-20-newest' })
      )

      expect(rowOrder()).toEqual([
        expect.stringContaining('Oldest, unread'),
        expect.stringContaining('Newest, read'),
      ])
    })

    it('orders the read ones newest first too', () => {
      renderPanel(
        [
          buildAnnouncement('2026-09-01-old', { title: 'Old' }),
          buildAnnouncement('2026-09-20-new', { title: 'New' }),
        ],
        stubState({ isRead: () => true })
      )

      expect(rowOrder()).toEqual([expect.stringContaining('New'), expect.stringContaining('Old')])
    })
  })

  describe('marking read and unread', () => {
    it('marks read from the row', async () => {
      const markRead = vi.fn()
      const { user } = renderPanel(
        [buildAnnouncement('a', { title: 'First' })],
        stubState({ markRead })
      )

      await user.click(screen.getByRole('button', { name: 'Mark First as read' }))

      expect(markRead).toHaveBeenCalledWith('a')
    })

    it('does not touch the banner', async () => {
      const dismiss = vi.fn()
      const { user } = renderPanel(
        [buildAnnouncement('a', { title: 'First' })],
        stubState({ dismiss })
      )

      await user.click(screen.getByRole('button', { name: 'Mark First as read' }))

      expect(dismiss).not.toHaveBeenCalled()
    })

    // Unlike reading it by expanding, this is a deliberate move.
    it('moves it under Read straight away', async () => {
      const { user } = renderWithProviders(
        <MantineProvider>
          <LivePanel
            announcements={[
              buildAnnouncement('a', { title: 'Keeper' }),
              buildAnnouncement('b', { title: 'Done with' }),
            ]}
          />
        </MantineProvider>
      )

      await user.click(screen.getByRole('button', { name: 'Mark Done with as read' }))

      expect(isBefore(readHeading(), screen.getByText('Done with'))).toBe(true)
      expect(isBefore(screen.getByText('Keeper'), readHeading())).toBe(true)
    })

    it('marks unread from a read row', async () => {
      const markUnread = vi.fn()
      const { user } = renderPanel(
        [buildAnnouncement('b', { title: 'Read earlier' })],
        stubState({ isRead: () => true, markUnread })
      )

      await user.click(screen.getByRole('button', { name: 'Mark Read earlier as unread' }))

      expect(markUnread).toHaveBeenCalledWith('b')
    })

    it('hands one marked unread back to the new ones', async () => {
      const { user } = renderWithProviders(
        <MantineProvider>
          <LivePanel
            announcements={[
              buildAnnouncement('a', { title: 'Keeper' }),
              buildAnnouncement('b', { title: 'Done with' }),
            ]}
          />
        </MantineProvider>
      )

      await user.click(screen.getByRole('button', { name: 'Mark Done with as read' }))
      await user.click(screen.getByRole('button', { name: 'Mark Done with as unread' }))

      expect(queryReadHeading()).not.toBeInTheDocument()
      expect(JSON.parse(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY) ?? '{}').read).toEqual([])
    })

    it('never offers a pinned one either control', () => {
      renderPanel(
        [buildAnnouncement('a', { title: 'Pinned', pinned: true })],
        stubState({ isRead: () => true })
      )

      expect(screen.queryByRole('button', { name: /^Mark Pinned as/ })).not.toBeInTheDocument()
    })

    it('keeps a pinned one with the new ones even once read', () => {
      renderPanel(
        [buildAnnouncement('pin', { title: 'Pinned', pinned: true })],
        stubState({ isRead: () => true })
      )

      expect(screen.getByText('Pinned')).toBeInTheDocument()
      expect(queryReadHeading()).not.toBeInTheDocument()
    })
  })

  describe('the Read section', () => {
    it('is headed and counted', () => {
      renderPanel(
        [buildAnnouncement('a'), buildAnnouncement('b'), buildAnnouncement('c')],
        stubState({ isRead: id => id !== 'a' })
      )

      expect(readHeading().parentElement).toHaveTextContent('Read2')
    })

    it('sits between the unread ones and the read ones', () => {
      renderPanel(
        [
          buildAnnouncement('a', { title: 'Still new' }),
          buildAnnouncement('b', { title: 'Read earlier' }),
        ],
        stubState({ isRead: id => id === 'b' })
      )

      expect(isBefore(screen.getByText('Still new'), readHeading())).toBe(true)
      expect(isBefore(readHeading(), screen.getByText('Read earlier'))).toBe(true)
    })

    it('is not there while nothing has been read', () => {
      renderPanel([buildAnnouncement('a'), buildAnnouncement('b')], stubState())

      expect(queryReadHeading()).not.toBeInTheDocument()
    })
  })

  describe('the Show read switch', () => {
    it('is on by default', () => {
      renderPanel([buildAnnouncement('a')], stubState({ isRead: () => true }))

      expect(showReadSwitch()).toBeChecked()
      expect(readHeading()).toBeInTheDocument()
    })

    it('is there even with nothing read', () => {
      renderPanel([buildAnnouncement('a')], stubState())

      expect(showReadSwitch()).toBeInTheDocument()
    })

    it('hides the Read section when turned off', async () => {
      const { user } = renderPanel(
        [
          buildAnnouncement('a', { title: 'Still new' }),
          buildAnnouncement('b', { title: 'Read earlier' }),
        ],
        stubState({ isRead: id => id === 'b' })
      )

      await user.click(showReadSwitch())

      expect(showReadSwitch()).not.toBeChecked()
      expect(queryReadHeading()).not.toBeInTheDocument()
      expect(screen.queryByText('Read earlier')).not.toBeInTheDocument()
      expect(screen.getByText('Still new')).toBeInTheDocument()
    })

    it('shows it again when turned back on', async () => {
      const { user } = renderPanel(
        [buildAnnouncement('b', { title: 'Read earlier' })],
        stubState({ isRead: () => true })
      )

      await user.click(showReadSwitch())
      await user.click(showReadSwitch())

      expect(screen.getByText('Read earlier')).toBeInTheDocument()
    })

    it('is remembered as a preference', async () => {
      const { user } = renderPanel([buildAnnouncement('a')], stubState())

      await user.click(showReadSwitch())

      expect(storedPreferences()).toEqual({ 'announcements.showRead': false })
    })

    it('starts off when it was left off', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ 'announcements.showRead': false })
      )
      renderPanel(
        [buildAnnouncement('b', { title: 'Read earlier' })],
        stubState({ isRead: () => true })
      )

      expect(showReadSwitch()).not.toBeChecked()
      expect(screen.queryByText('Read earlier')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('says you are caught up when there is nothing', () => {
      renderPanel([], stubState())

      expect(screen.getByText("You're all caught up")).toBeInTheDocument()
    })

    it('says so above the Read section once everything is read', () => {
      renderPanel(
        [buildAnnouncement('a', { title: 'Read earlier' })],
        stubState({ isRead: () => true })
      )

      expect(isBefore(screen.getByText("You're all caught up"), readHeading())).toBe(true)
      expect(screen.getByText('Read earlier')).toBeInTheDocument()
    })

    it('says so on its own with the read ones hidden', async () => {
      const { user } = renderPanel(
        [buildAnnouncement('a', { title: 'Read earlier' })],
        stubState({ isRead: () => true })
      )

      await user.click(showReadSwitch())

      expect(screen.getByText("You're all caught up")).toBeInTheDocument()
      expect(screen.queryByText('Read earlier')).not.toBeInTheDocument()
    })
  })

  it('persists a read through the real state hook', async () => {
    const state = realState()
    const { user } = renderPanel([buildAnnouncement('a', { title: 'First' })], state.current)

    await user.click(screen.getByRole('button', { name: 'Mark First as read' }))

    await act(async () => {})

    expect(JSON.parse(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY) ?? '{}')).toMatchObject({
      read: ['a'],
    })
  })
})
