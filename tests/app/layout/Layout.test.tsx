import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router-dom'
import type { UserEvent } from '@testing-library/user-event'
import { renderWithProviders } from '@tests/test-utils'
import { buildAnnouncement } from '@tests/fixtures/builders'
import type { Announcement } from '@/features/announcements/models/announcement'

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
  if (expectBanner) await screen.findByRole('status')

  return rendered
}

const banner = () => screen.getByRole('status')

// The banner's own "Close announcement" button also matches /announcement/, so
// the bell is addressed by its counting label.
const BELL_LABEL = /^(No|\d+( unread of \d+)?) announcements?$/
const bell = () => screen.getByRole('button', { name: BELL_LABEL })

/**
 * Scoped to the drawer: the banner renders the same titles, and the portal is
 * not reliably last in document order.
 */
const panel = () => within(screen.getByRole('dialog'))

const openPanel = async (user: UserEvent, from: 'banner' | 'bell') => {
  await user.click(from === 'banner' ? screen.getByRole('button', { name: 'View more' }) : bell())
  await screen.findByRole('dialog')
}

beforeEach(() => {
  localStorage.clear()
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

  describe('banner', () => {
    it('banners the topmost announcement in the feed', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      await renderLayout()

      expect(banner()).toHaveTextContent('Newest notice')
      expect(banner()).not.toHaveTextContent('Older notice')
    })

    it('reveals the next announcement when the top one is closed', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()

      await user.click(screen.getByRole('button', { name: 'Close announcement' }))

      await waitFor(() => expect(banner()).toHaveTextContent('Older notice'))
    })

    it('stops bannering once every announcement has been closed', async () => {
      serveFeed([buildAnnouncement('only', { title: 'Only notice' })])
      const { user } = await renderLayout()

      await user.click(screen.getByRole('button', { name: 'Close announcement' }))

      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    })

    it('remembers a closed banner across a reload', async () => {
      serveFeed([buildAnnouncement('only', { title: 'Only notice' })])
      const { user, unmount } = await renderLayout()
      await user.click(screen.getByRole('button', { name: 'Close announcement' }))
      unmount()

      await renderLayout({ expectBanner: false })

      // The bell is always rendered, so the count is what says the refetched
      // feed has landed. Still listed there: closing a banner is not dismissing.
      await waitFor(() => expect(bell()).toHaveAccessibleName('1 unread of 1 announcements'))
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('keeps a pinned announcement in the banner, with nothing to close it', async () => {
      serveFeed([buildAnnouncement('pin', { title: 'Pinned notice', pinned: true })])
      await renderLayout()

      expect(banner()).toHaveTextContent('Pinned notice')
      expect(
        screen.queryByRole('button', { name: 'Close announcement' })
      ).not.toBeInTheDocument()
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
  })

  describe('panel', () => {
    it('opens from the banner and lists every announcement, closed banner included', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()

      await openPanel(user, 'banner')

      expect(panel().getByText('Notifications')).toBeInTheDocument()
      expect(panel().getByText('Newest notice')).toBeInTheDocument()
      expect(panel().getByText('Older notice')).toBeInTheDocument()
    })

    it('opens from the bell', async () => {
      serveFeed([buildAnnouncement('a', { title: 'A notice' })])
      const { user } = await renderLayout()

      await openPanel(user, 'bell')

      expect(panel().getByText('A notice')).toBeInTheDocument()
    })

    // The regression that forced "read" and "banner closed" apart: opening the
    // panel used to make the banner disappear under the reader.
    it('leaves the banner up after the announcement is read in the panel', async () => {
      serveFeed([buildAnnouncement('a', { title: 'A notice', body: '<p>The full text</p>' })])
      const { user } = await renderLayout()

      await openPanel(user, 'banner')
      await user.click(panel().getByText('A notice'))

      expect(panel().getByText('The full text')).toBeInTheDocument()
      expect(banner()).toHaveTextContent('A notice')
    })

    it('clears the bell badge once everything has been read', async () => {
      serveFeed([buildAnnouncement('a', { title: 'A notice' })])
      const { user } = await renderLayout()

      await openPanel(user, 'bell')
      await user.click(panel().getByText('A notice'))

      await waitFor(() => expect(bell()).toHaveAccessibleName('1 announcement'))
    })

    it('takes a dismissed announcement out of the banner and the bell', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()

      await openPanel(user, 'banner')
      await user.click(panel().getByRole('button', { name: 'Dismiss Newest notice' }))

      await waitFor(() => expect(banner()).toHaveTextContent('Older notice'))
      expect(panel().queryByText('Newest notice')).not.toBeInTheDocument()
      expect(bell()).toHaveAccessibleName('1 unread of 1 announcements')
    })

    // The way back from a stray Clear all: the dismissed ones are hidden, not
    // deleted.
    it('restores a dismissed announcement to the panel, the banner and the bell', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()

      await openPanel(user, 'banner')
      await user.click(panel().getByRole('button', { name: 'Dismiss Newest notice' }))
      await waitFor(() => expect(banner()).toHaveTextContent('Older notice'))

      await user.click(panel().getByRole('button', { name: 'Show dismissed (1)' }))
      await user.click(panel().getByRole('button', { name: 'Restore Newest notice' }))

      expect(panel().getByText('Newest notice')).toBeInTheDocument()
      await waitFor(() => expect(banner()).toHaveTextContent('Newest notice'))
      expect(bell()).toHaveAccessibleName('1 unread of 2 announcements')
    })

    it('brings everything back after Clear all', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()

      await openPanel(user, 'banner')
      await user.click(panel().getByRole('button', { name: 'Clear all' }))
      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())

      await user.click(panel().getByRole('button', { name: 'Show dismissed (2)' }))
      await user.click(panel().getByRole('button', { name: 'Restore Newest notice' }))
      await user.click(panel().getByRole('button', { name: 'Restore Older notice' }))

      await waitFor(() => expect(banner()).toHaveTextContent('Newest notice'))
      expect(panel().getByText('Older notice')).toBeInTheDocument()
    })

    it('empties the panel and the banner with Clear all', async () => {
      serveFeed([
        buildAnnouncement('first', { title: 'Newest notice' }),
        buildAnnouncement('second', { title: 'Older notice' }),
      ])
      const { user } = await renderLayout()

      await openPanel(user, 'banner')
      await user.click(panel().getByRole('button', { name: 'Clear all' }))

      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
      expect(panel().getByText("You're all caught up")).toBeInTheDocument()
    })

    it('keeps a pinned announcement through Clear all', async () => {
      serveFeed([
        buildAnnouncement('pin', { title: 'Pinned notice', pinned: true }),
        buildAnnouncement('normal', { title: 'Ordinary notice' }),
      ])
      const { user } = await renderLayout()

      await openPanel(user, 'banner')
      await user.click(panel().getByRole('button', { name: 'Clear all' }))

      await waitFor(() => expect(panel().queryByText('Ordinary notice')).not.toBeInTheDocument())
      expect(panel().getByText('Pinned notice')).toBeInTheDocument()
      expect(banner()).toHaveTextContent('Pinned notice')
    })
  })
})
