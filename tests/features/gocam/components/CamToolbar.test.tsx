import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CamToolbar from '@/features/gocam/components/CamToolbar'
import GroupGuardProvider from '@/features/gocam/components/GroupGuardProvider'
import { RightPanelTab } from '@/@noctua.core/components/drawer/drawerSlice'
import { buildModel, buildActivity, buildNode } from '@tests/fixtures/builders'

const buildCam = (totalErrors = 0) => {
  const model = buildModel([buildActivity('a', [buildNode('n', 'node')])])
  return {
    cam: {
      model: {
        ...model,
        title: 'My Model',
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

const renderToolbar = (totalErrors = 0) =>
  renderWithProviders(
    <MantineProvider>
      <GroupGuardProvider>
        <CamToolbar />
      </GroupGuardProvider>
    </MantineProvider>,
    { preloadedState: buildCam(totalErrors) }
  )

describe('CamToolbar error chip', () => {
  it('shows a green "No Errors" chip when there are 0 errors', () => {
    renderToolbar(0)
    const chip = screen.getByRole('button', { name: 'No Errors' })
    expect(chip.className).toContain('bg-green-100')
    expect(screen.queryByRole('button', { name: /Found/ })).toBeNull()
  })

  it('shows a red singular "1 Error Found" chip for one error', () => {
    renderToolbar(1)
    const chip = screen.getByRole('button', { name: '1 Error Found' })
    expect(chip.className).toContain('bg-red-100')
    expect(screen.queryByRole('button', { name: 'No Errors' })).toBeNull()
  })

  it('pluralizes the chip label when there is more than one error', () => {
    renderToolbar(3)
    const chip = screen.getByRole('button', { name: '3 Errors Found' })
    expect(chip.className).toContain('bg-red-100')
  })

  it('opens the CAM errors panel when the green chip is clicked', async () => {
    const { user, store } = renderToolbar(0)
    await user.click(screen.getByRole('button', { name: 'No Errors' }))

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
