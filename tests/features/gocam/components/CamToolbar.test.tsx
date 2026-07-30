import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CamToolbar from '@/features/gocam/components/CamToolbar'
import GroupGuardProvider from '@/features/gocam/components/GroupGuardProvider'
import { RightPanelTab } from '@/@noctua.core/components/drawer/drawerSlice'
import { DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import { buildModel, buildActivity, buildNode } from '@tests/fixtures/builders'

interface ToolbarOpts {
  /** Model state, e.g. "production" — the state chip only renders when set. */
  state?: string
  loggedIn?: boolean
}

const buildCam = (totalErrors = 0, { state, loggedIn = false }: ToolbarOpts = {}) => {
  const model = buildModel([buildActivity('a', [buildNode('n', 'node')])])
  return {
    auth: {
      user: loggedIn ? { uri: 'http://orcid.org/0000-0002-1825-0097', name: 'Jane Doe' } : null,
      baristaToken: loggedIn ? 'test-token' : null,
    },
    cam: {
      model: {
        ...model,
        title: 'My Model',
        state,
        validationErrors: {
          ...model.validationErrors,
          total: totalErrors,
          hasErrors: totalErrors > 0,
        },
      },
      loading: false,
      error: null,
      selectedActivityId: null,
    },
  }
}

const renderToolbar = (totalErrors = 0, opts: ToolbarOpts = {}) =>
  renderWithProviders(
    <MantineProvider>
      <GroupGuardProvider>
        <CamToolbar />
      </GroupGuardProvider>
    </MantineProvider>,
    { preloadedState: buildCam(totalErrors, opts) }
  )

describe('CamToolbar error chip', () => {
  it('shows a green "0 Error(s) Found" chip when there are 0 errors', () => {
    renderToolbar(0)
    const chip = screen.getByRole('button', { name: '0 Error(s) Found' })
    expect(chip.className).toContain('bg-green-100')
  })

  it('shows a red singular "1 Error Found" chip for one error', () => {
    renderToolbar(1)
    const chip = screen.getByRole('button', { name: '1 Error Found' })
    expect(chip.className).toContain('bg-red-100')
    expect(screen.queryByRole('button', { name: '0 Error(s) Found' })).toBeNull()
  })

  it('pluralizes the chip label when there is more than one error', () => {
    renderToolbar(3)
    const chip = screen.getByRole('button', { name: '3 Errors Found' })
    expect(chip.className).toContain('bg-red-100')
  })

  it('opens the CAM errors panel when the green chip is clicked', async () => {
    const { user, store } = renderToolbar(0)
    await user.click(screen.getByRole('button', { name: '0 Error(s) Found' }))

    expect(store.getState().drawer.rightDrawerOpen).toBe(true)
    expect(store.getState().drawer.rightPanelTab).toBe(RightPanelTab.CAM_ERRORS)
  })

  it('opens the CAM errors panel when the red chip is clicked', async () => {
    const { user, store } = renderToolbar(2)
    await user.click(screen.getByRole('button', { name: '2 Errors Found' }))

    expect(store.getState().drawer.rightDrawerOpen).toBe(true)
    expect(store.getState().drawer.rightPanelTab).toBe(RightPanelTab.CAM_ERRORS)
  })
})

describe('CamToolbar logged-out gating (#278)', () => {
  it('hides the model-title edit pen when logged out', () => {
    renderToolbar(0)

    expect(screen.getByTestId('model-title')).toHaveTextContent('My Model')
    expect(screen.queryByTestId('edit-model-title')).toBeNull()
  })

  it('shows the model-title edit pen when logged in', () => {
    renderToolbar(0, { loggedIn: true })
    expect(screen.getByTestId('edit-model-title')).toBeInTheDocument()
  })

  it('opens the title dialog from the edit pen when logged in', async () => {
    const { user, store } = renderToolbar(0, { loggedIn: true })
    await user.click(screen.getByTestId('edit-model-title'))

    const dialog = store.getState().dialog
    expect(dialog.open).toBe(true)
    expect(dialog.component).toBe(DialogComponent.CAM_TITLE_FORM)
  })

  it('renders the state chip read-only when logged out', () => {
    renderToolbar(0, { state: 'production' })

    expect(screen.getByText('production')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'production' })).toBeNull()
  })

  it('makes the state chip clickable when logged in', () => {
    renderToolbar(0, { state: 'production', loggedIn: true })
    expect(screen.getByRole('button', { name: 'production' })).toBeInTheDocument()
  })

  it('opens the state dialog from the state chip when logged in', async () => {
    const { user, store } = renderToolbar(0, { state: 'production', loggedIn: true })
    await user.click(screen.getByRole('button', { name: 'production' }))

    const dialog = store.getState().dialog
    expect(dialog.open).toBe(true)
    expect(dialog.component).toBe(DialogComponent.CAM_STATE_FORM)
  })
})
