import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import Toolbar from '@/app/layout/Toolbar'
import { EXTERNAL_LINKS } from '@/@noctua.core/data/constants'
import type * as Constants from '@/@noctua.core/data/constants'
import type { AnnouncementState } from '@/features/announcements/hooks/useAnnouncements'
import type { User } from '@/features/auth/user'

// The auth provider would try to reach Barista.
const auth = vi.hoisted(() => ({
  isLoggedIn: false,
  loginUrl: 'https://example.org/login',
  logoutUrl: 'https://example.org/logout',
  noctuaUrl: 'https://example.org/noctua',
}))
vi.mock('@/features/auth/authProvider', () => ({ useAuth: () => auth }))

// Read at render time, so each test can pick its build.
const env = vi.hoisted(() => ({ appEnv: 'dev' as AppEnv }))
vi.mock('@/@noctua.core/data/constants', async importOriginal => {
  const actual = await importOriginal<typeof Constants>()
  return {
    ...actual,
    ENVIRONMENT: {
      ...actual.ENVIRONMENT,
      get isDev() {
        return env.appEnv === 'dev'
      },
      get isBeta() {
        return env.appEnv === 'beta'
      },
      get isProd() {
        return env.appEnv === 'prod'
      },
    },
  }
})

const announcementState: AnnouncementState = {
  isRead: () => false,
  isDismissed: () => false,
  markRead: () => {},
  markUnread: () => {},
  dismiss: () => {},
}

const curator: User = {
  uri: 'http://orcid.org/0000-0002-1825-0097',
  name: 'Jane Doe',
  group: { id: 'http://example.org/group', label: 'Test Group' },
}

interface ToolbarOpts {
  appEnv?: AppEnv
  loggedIn?: boolean
}

const renderToolbar = ({ appEnv = 'dev', loggedIn = false }: ToolbarOpts = {}) => {
  env.appEnv = appEnv
  auth.isLoggedIn = loggedIn
  return renderWithProviders(
    <MantineProvider>
      <Toolbar
        announcements={[]}
        announcementState={announcementState}
        onOpenAnnouncements={() => {}}
      />
    </MantineProvider>,
    {
      preloadedState: {
        auth: { user: loggedIn ? curator : null, baristaToken: loggedIn ? 'test-token' : null },
      },
    }
  )
}

describe('Toolbar header (#298)', () => {
  it('reads "Noctua Visual Pathway Editor"', () => {
    renderToolbar()

    const name = screen.getByRole('link', { name: 'Visual Pathway Editor' })
    expect(name.previousElementSibling).toHaveAccessibleName('Noctua')
  })
})

describe('Toolbar build tag', () => {
  it.each(['dev', 'beta'] as const)('tags a %s build and flags it as a testing version', appEnv => {
    renderToolbar({ appEnv })

    expect(screen.getByText(`(${appEnv})`)).toBeInTheDocument()
    const notice = screen.getByText(/Testing Version/)
    expect(within(notice).getByRole('link', { name: 'Noctua' })).toHaveAttribute(
      'href',
      EXTERNAL_LINKS.NOCTUA_PRODUCTION
    )
  })

  it('shows neither on a prod build', () => {
    renderToolbar({ appEnv: 'prod' })

    expect(screen.queryByText('(dev)')).not.toBeInTheDocument()
    expect(screen.queryByText('(beta)')).not.toBeInTheDocument()
    expect(screen.queryByText(/Testing Version/)).not.toBeInTheDocument()
  })
})

describe('Toolbar account', () => {
  it('offers Login when logged out', () => {
    renderToolbar()

    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', auth.loginUrl)
  })

  it('shows the name and group when logged in', () => {
    renderToolbar({ loggedIn: true })

    expect(screen.getByRole('button', { name: /Jane Doe/ })).toHaveTextContent('Test Group')
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument()
  })

  describe('logging out', () => {
    const { location } = window

    beforeEach(() => {
      Object.defineProperty(window, 'location', { configurable: true, value: { ...location } })
    })

    afterEach(() => {
      Object.defineProperty(window, 'location', { configurable: true, value: location })
    })

    it('sends the browser to the logout URL', async () => {
      const { user } = renderToolbar({ loggedIn: true })

      await user.click(screen.getByRole('button', { name: /Jane Doe/ }))
      // jsdom gives the anchor a zero rect, so the menu stays hidden, and a hidden
      // item has no accessible name to find it by.
      await user.click(screen.getByText('Logout'))

      expect(window.location.href).toBe(auth.logoutUrl)
    })
  })
})
