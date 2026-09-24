import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router-dom'
import type { UserEvent } from '@testing-library/user-event'
import { renderWithProviders } from '@tests/test-utils'
import { buildAnnouncement } from '@tests/fixtures/builders'
import type { Announcement } from '@/features/announcements/models/announcement'
import type * as Constants from '@/@noctua.core/data/constants'

// The parts of the shell this test is not about. CamToolbar and Footer pull in
// the whole CAM feature; the auth provider would try to reach Barista.
vi.mock('@/analytics', () => ({ initGA: vi.fn(), trackPageView: vi.fn() }))
vi.mock('@/features/gocam/components/CamToolbar', () => ({ default: () => null }))
vi.mock('@/app/layout/Footer', () => ({ default: () => null }))
vi.mock('@/features/auth/authProvider', () => ({
  useAuth: () => ({
    isLoggedIn: false,
    loginUrl: 'https://example.org/login',
    logoutUrl: 'https://example.org/logout',
    noctuaUrl: 'https://example.org/noctua',
  }),
}))

// Read at render time, so a test can flip it to check the dev-only tools.
const env = vi.hoisted(() => ({ isDev: true }))
vi.mock('@/@noctua.core/data/constants', async importOriginal => {
  const actual = await importOriginal<typeof Constants>()
  return {
    ...actual,
    ENVIRONMENT: {
      ...actual.ENVIRONMENT,
      get isDev() {
        return env.isDev
      },
    },
  }
})

const Layout = (await import('@/app/layout/Layout')).default

let fetchMock: ReturnType<typeof vi.fn>

const serveFeed = (announcements: Announcement[]) => {
  fetchMock = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(announcements), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  )
  vi.stubGlobal('fetch', fetchMock)
}

const renderShell = () =>
  renderWithProviders(
    <MantineProvider>
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    </MantineProvider>
  )

/**
 * Renders the shell against the mocked feed exactly as the app fetches it — the
 * query hook is not stubbed, so the path from network to banner is covered.
 */
const renderLayout = async ({ expectBanner = true } = {}) => {
  const rendered = renderShell()

  await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  if (expectBanner) await screen.findAllByRole('status')

  return rendered
}

const card = () => screen.getByTestId('announcement-banner')
const queryCard = () => screen.queryByTestId('announcement-banner')
/** The strip above the top nav, for a pinned announcement. */
const strip = () => screen.getByTestId('pinned-announcement')

// The card's own "Close announcement" button also matches /announcement/, so
// the bell is addressed by its counting label.
const BELL_LABEL = /^(No|\d+( unread of \d+)?) announcements?$/
const bell = () => screen.getByRole('button', { name: BELL_LABEL })

/**
 * Scoped to the drawer: the card renders the same titles, and the portal is not
 * reliably last in document order.
 */
const panel = () => within(screen.getByRole('dialog'))

const openPanel = async (user: UserEvent, from: 'card' | 'bell') => {
  await user.click(
    from === 'card' ? within(card()).getByRole('button', { name: 'View more' }) : bell()
  )
  await screen.findByRole('dialog')
}

const isBefore = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)

beforeEach(() => {
  localStorage.clear()
  env.isDev = true
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Layout announcements', () => {
  describe('an empty or irrelevant feed', () => {
    it('shows no banner when there is nothing to say, but keeps the bell', async () => {
      serveFeed([])
      await renderLayout({ expectBanner: false })

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(bell()).toHaveAccessibleName('No announcements')
    })

    // Without this there is no way to reach the panel, and so no way to restore
    // anything that was dismissed.
    it('opens the panel from the bell with nothing to show', async () => {
      serveFeed([])
      const { user } = await renderLayout({ expectBanner: false })

      await openPanel(user, 'bell')

      expect(panel().getByText("You're all caught up")).toBeInTheDocument()
    })

    it('ignores announcements aimed at the other Noctua apps', async () => {
      serveFeed([
        buildAnnouncement('landing', { title: 'Landing page notice', apps: ['landing-page'] }),
      ])
      await renderLayout({ expectBanner: false })

      expect(screen.queryByText('Landing page notice')).not.toBeInTheDocument()
      expect(bell()).toHaveAccessibleName('No announcements')
    })

    it('ignores an expired announcement', async () => {
      serveFeed([buildAnnouncement('old', { title: 'Last year', expires: '2000-01-01' })])
      await renderLayout({ expectBanner: false })

      expect(screen.queryByText('Last year')).not.toBeInTheDocument()
    })

    // A failed feed must never block the editor from rendering.
    it('renders the shell when the feed cannot be fetched', async () => {
      fetchMock = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
      vi.stubGlobal('fetch', fetchMock)
      renderShell()

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: /Noctua/i }).length).toBeGreaterThan(0)
    })
  })

  describe('the floating card', () => {
    it('shows the topmost announcement in the feed', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      await renderLayout()

      expect(card()).toHaveTextContent('Newest notice')
      expect(card()).not.toHaveTextContent('Older notice')
    })

    it('reveals the next announcement after Got it', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()

      await user.click(within(card()).getByRole('button', { name: 'Got it' }))

      await waitFor(() => expect(card()).toHaveTextContent('Older notice'))
    })

    it('treats ✕ exactly like Got it', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()

      await user.click(within(card()).getByRole('button', { name: 'Close announcement' }))

      await waitFor(() => expect(card()).toHaveTextContent('Older notice'))
    })

    // Dismissing is about the banner only; it hasn't been read.
    it('leaves a dismissed announcement unread in the panel and the bell', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()

      await user.click(within(card()).getByRole('button', { name: 'Got it' }))
      await openPanel(user, 'bell')

      expect(panel().getByText('Newest notice')).toBeInTheDocument()
      expect(panel().queryByText('Read', { exact: true })).not.toBeInTheDocument()
      expect(bell()).toHaveAccessibleName('2 unread of 2 announcements')
    })

    it('goes away once every announcement is acknowledged', async () => {
      serveFeed([buildAnnouncement('only', { title: 'Only notice' })])
      const { user } = await renderLayout()

      await user.click(within(card()).getByRole('button', { name: 'Got it' }))

      await waitFor(() => expect(queryCard()).not.toBeInTheDocument())
    })

    it('remembers an acknowledgement across a reload', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Acknowledged' }),
        buildAnnouncement('second', { title: 'Still new' }),
      ])
      const { user, unmount } = await renderLayout()
      await user.click(within(card()).getByRole('button', { name: 'Got it' }))
      unmount()

      await renderLayout()

      expect(card()).toHaveTextContent('Still new')
      expect(bell()).toHaveAccessibleName('2 unread of 2 announcements')
    })

    it('stays up after the announcement is read in the panel', async () => {
      serveFeed([buildAnnouncement('a', { title: 'A notice', body: '<p>The full text</p>' })])
      const { user } = await renderLayout()

      await openPanel(user, 'bell')
      await user.click(panel().getByText('A notice'))

      expect(panel().getByText('The full text')).toBeInTheDocument()
      expect(card()).toHaveTextContent('A notice')
    })

    it('never shows a pinned announcement — that gets the strip', async () => {
      serveFeed([buildAnnouncement('pin', { title: 'Pinned notice', pinned: true })])
      await renderLayout()

      expect(strip()).toHaveTextContent('Pinned notice')
      expect(queryCard()).not.toBeInTheDocument()
    })
  })

  describe('the pinned strip', () => {
    it('has no way to close it', async () => {
      serveFeed([buildAnnouncement('pin', { title: 'Pinned notice', pinned: true })])
      await renderLayout()

      expect(within(strip()).queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument()
      expect(
        within(strip()).queryByRole('button', { name: 'Close announcement' })
      ).not.toBeInTheDocument()
    })

    it('shows alongside the card for the rest', async () => {
      serveFeed([
        buildAnnouncement('pin', { title: 'Pinned notice', pinned: true }),
        buildAnnouncement('normal', { title: 'Ordinary notice' }),
      ])
      await renderLayout()

      expect(strip()).toHaveTextContent('Pinned notice')
      expect(card()).toHaveTextContent('Ordinary notice')
    })

    it('opens the panel on the pinned announcement, expanded', async () => {
      serveFeed([
        buildAnnouncement('pin', {
          title: 'Pinned notice',
          pinned: true,
          body: '<p>Pinned body</p>',
        }),
      ])
      const { user } = await renderLayout()

      await user.click(within(strip()).getByRole('button', { name: 'View more' }))

      expect(await panel().findByText('Pinned body')).toBeInTheDocument()
    })
  })

  describe('bell', () => {
    it('counts what the panel would show', async () => {
      serveFeed([buildAnnouncement('a'), buildAnnouncement('b'), buildAnnouncement('c')])
      await renderLayout()

      expect(bell()).toHaveAccessibleName('3 unread of 3 announcements')
    })

    it('leaves out announcements for other apps', async () => {
      serveFeed([buildAnnouncement('mine'), buildAnnouncement('theirs', { apps: ['sae'] })])
      await renderLayout()

      expect(bell()).toHaveAccessibleName('1 unread of 1 announcements')
    })

    it('keeps counting a dismissed banner until it is read', async () => {
      serveFeed([buildAnnouncement('a'), buildAnnouncement('b')])
      const { user } = await renderLayout()

      await user.click(within(card()).getByRole('button', { name: 'Got it' }))

      await waitFor(() => expect(card()).toHaveTextContent('Title b'))
      expect(bell()).toHaveAccessibleName('2 unread of 2 announcements')
    })
  })

  describe('panel', () => {
    it('opens from the card on that announcement, expanded and read', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice', body: '<p>Newest body</p>' }),
        buildAnnouncement('second', { title: 'Older notice', body: '<p>Older body</p>' }),
      ])
      const { user } = await renderLayout()

      await openPanel(user, 'card')

      expect(panel().getByText('Newest body')).toBeInTheDocument()
      expect(panel().queryByText('Older body')).not.toBeInTheDocument()
      await waitFor(() => expect(bell()).toHaveAccessibleName('1 unread of 2 announcements'))
    })

    it('opens from the bell with nothing expanded', async () => {
      serveFeed([buildAnnouncement('a', { title: 'A notice', body: '<p>The full text</p>' })])
      const { user } = await renderLayout()

      await openPanel(user, 'bell')

      expect(panel().getByText('A notice')).toBeInTheDocument()
      expect(panel().queryByText('The full text')).not.toBeInTheDocument()
    })

    it('clears the bell badge once everything has been read', async () => {
      serveFeed([buildAnnouncement('a', { title: 'A notice' })])
      const { user } = await renderLayout()

      await openPanel(user, 'bell')
      await user.click(panel().getByText('A notice'))

      await waitFor(() => expect(bell()).toHaveAccessibleName('1 announcement'))
    })

    it('has no Clear all', async () => {
      serveFeed([buildAnnouncement('a'), buildAnnouncement('b')])
      const { user } = await renderLayout()

      await openPanel(user, 'bell')

      expect(panel().queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
    })

    it('moves one marked read under Read and off the bell badge', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()

      await openPanel(user, 'bell')
      await user.click(panel().getByRole('button', { name: 'Mark Newest notice as read' }))

      expect(
        isBefore(panel().getByText('Read', { exact: true }), panel().getByText('Newest notice'))
      ).toBe(true)
      await waitFor(() => expect(bell()).toHaveAccessibleName('1 unread of 2 announcements'))
    })

    // Reading belongs to the panel; only Got it or ✕ take the banner down.
    it('leaves the banner up when it is marked read in the panel', async () => {
      serveFeed([buildAnnouncement('first', { title: 'Newest notice' })])
      const { user } = await renderLayout()

      await openPanel(user, 'bell')
      await user.click(panel().getByRole('button', { name: 'Mark Newest notice as read' }))

      expect(card()).toHaveTextContent('Newest notice')
    })

    it('never brings a dismissed banner back when marked unread', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()
      await user.click(within(card()).getByRole('button', { name: 'Got it' }))
      await waitFor(() => expect(card()).toHaveTextContent('Older notice'))

      await openPanel(user, 'bell')
      await user.click(panel().getByRole('button', { name: 'Mark Newest notice as read' }))
      await user.click(panel().getByRole('button', { name: 'Mark Newest notice as unread' }))

      expect(card()).toHaveTextContent('Older notice')
      expect(bell()).toHaveAccessibleName('2 unread of 2 announcements')
    })

    it('keeps the Show read choice across a reload', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user, unmount } = await renderLayout()
      await openPanel(user, 'bell')
      await user.click(panel().getByRole('button', { name: 'Mark Newest notice as read' }))
      await user.click(panel().getByRole('switch', { name: 'Show read' }))
      unmount()

      const { user: again } = await renderLayout()
      await openPanel(again, 'bell')

      expect(panel().getByRole('switch', { name: 'Show read' })).not.toBeChecked()
      expect(panel().queryByText('Newest notice')).not.toBeInTheDocument()
      expect(panel().getByText('Older notice')).toBeInTheDocument()
    })
  })

  describe('testing tools', () => {
    it('are offered on a dev build', async () => {
      serveFeed([])
      await renderLayout({ expectBanner: false })

      expect(screen.getByRole('button', { name: 'Testing tools' })).toBeInTheDocument()
    })

    it('are not there on any other build', async () => {
      env.isDev = false
      serveFeed([])
      await renderLayout({ expectBanner: false })

      expect(screen.queryByRole('button', { name: 'Testing tools' })).not.toBeInTheDocument()
    })
  })
})
