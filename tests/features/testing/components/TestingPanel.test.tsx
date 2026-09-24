import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import TestingPanel from '@/features/testing/components/TestingPanel'
import { ANNOUNCEMENTS_STORAGE_KEY } from '@/features/announcements/hooks/useAnnouncements'
import { PREFERENCES_STORAGE_KEY } from '@/@noctua.core/hooks/usePreference'

const POSITIONS_KEY = 'activityLocations-gomodel:abc123'
const TOKEN_KEY = 'barista_token'

const seedStorage = () => {
  localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify({ read: ['a'], dismissed: ['a'] }))
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ 'announcements.showRead': false }))
  localStorage.setItem(POSITIONS_KEY, JSON.stringify({ n1: { x: 1, y: 2 } }))
  localStorage.setItem(TOKEN_KEY, 'secret-token-value')
  localStorage.setItem('another-workbench.state', '{}')
}

const renderPanel = () =>
  renderWithProviders(
    <MantineProvider>
      <TestingPanel opened onClose={() => {}} />
    </MantineProvider>
  )

const row = (label: string | RegExp) =>
  screen.getByRole('button', { name: label, expanded: false }).parentElement as HTMLElement

describe('TestingPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    seedStorage()
  })

  describe('the list', () => {
    it('names VPE’s own keys and shows the rest by key', () => {
      renderPanel()

      expect(screen.getByText('Announcements — read, dismissed')).toBeInTheDocument()
      expect(screen.getByText('Preferences')).toBeInTheDocument()
      expect(screen.getByText('Node positions — gomodel:abc123')).toBeInTheDocument()
      expect(screen.getByText('Login token — deleting it logs you out')).toBeInTheDocument()
      expect(screen.getByText('another-workbench.state')).toBeInTheDocument()
    })

    it('shows the stored value, pretty-printed, when a row is expanded', async () => {
      const { user } = renderPanel()

      await user.click(screen.getByRole('button', { name: /^Announcements/ }))

      expect(screen.getByText(/"dismissed": \[/)).toBeInTheDocument()
    })

    it('masks the login token', async () => {
      const { user } = renderPanel()

      await user.click(screen.getByRole('button', { name: /^Login token/ }))

      expect(screen.getByText('secret…')).toBeInTheDocument()
      expect(screen.queryByText(/secret-token-value/)).not.toBeInTheDocument()
    })

    it('says so when nothing is saved', () => {
      localStorage.clear()
      renderPanel()

      expect(screen.getByText('Nothing saved')).toBeInTheDocument()
    })
  })

  describe('deleting one key', () => {
    it('removes it from storage and the list', async () => {
      const { user } = renderPanel()

      await user.click(screen.getByRole('button', { name: `Delete ${POSITIONS_KEY}` }))

      expect(localStorage.getItem(POSITIONS_KEY)).toBeNull()
      expect(screen.queryByText('Node positions — gomodel:abc123')).not.toBeInTheDocument()
    })

    it('leaves every other key alone', async () => {
      const { user } = renderPanel()

      await user.click(screen.getByRole('button', { name: `Delete ${POSITIONS_KEY}` }))

      expect(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY)).not.toBeNull()
      expect(localStorage.getItem(TOKEN_KEY)).toBe('secret-token-value')
    })
  })

  describe('Reset VPE state', () => {
    it('clears announcements, preferences and node positions', async () => {
      const { user } = renderPanel()

      await user.click(screen.getByRole('button', { name: 'Reset VPE state' }))

      expect(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY)).toBeNull()
      expect(localStorage.getItem(PREFERENCES_STORAGE_KEY)).toBeNull()
      expect(localStorage.getItem(POSITIONS_KEY)).toBeNull()
    })

    it('keeps the login and other apps’ keys', async () => {
      const { user } = renderPanel()

      await user.click(screen.getByRole('button', { name: 'Reset VPE state' }))

      expect(localStorage.getItem(TOKEN_KEY)).toBe('secret-token-value')
      expect(localStorage.getItem('another-workbench.state')).toBe('{}')
    })

    it('is disabled when there is nothing of VPE’s to reset', () => {
      localStorage.clear()
      localStorage.setItem(TOKEN_KEY, 'secret-token-value')
      renderPanel()

      expect(screen.getByRole('button', { name: 'Reset VPE state' })).toBeDisabled()
    })
  })

  describe('reloading to apply', () => {
    const { location } = window

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...location, reload: vi.fn() },
      })
    })

    afterEach(() => {
      Object.defineProperty(window, 'location', { configurable: true, value: location })
    })

    it('asks for a reload only once something has been deleted', async () => {
      const { user } = renderPanel()
      expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Reset VPE state' }))

      expect(screen.getByText(/Reload to apply/)).toBeInTheDocument()
    })

    it('reloads the page', async () => {
      const { user } = renderPanel()

      await user.click(screen.getByRole('button', { name: `Delete ${POSITIONS_KEY}` }))
      await user.click(screen.getByRole('button', { name: 'Reload' }))

      expect(window.location.reload).toHaveBeenCalledOnce()
    })
  })

  it('offers each row its own delete', () => {
    renderPanel()

    expect(
      within(row(/^Preferences/)).getByRole('button', {
        name: `Delete ${PREFERENCES_STORAGE_KEY}`,
      })
    ).toBeInTheDocument()
  })
})
