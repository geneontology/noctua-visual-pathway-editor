import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CamStateForm from '@/features/gocam/components/CamStateForm'
import { buildModel, buildActivity, buildNode } from '@tests/fixtures/builders'

const updateMock = vi.hoisted(() => vi.fn(() => Promise.resolve({})))

vi.mock('@/features/gocam/slices/camApiSlice', () => ({
  useUpdateGraphModelMutation: () => [updateMock, { isLoading: false }],
}))

const buildCamState = (overrides: Partial<{ title: string; state: string; comments: string[] }> = {}) => {
  const model = buildModel([buildActivity('a', [buildNode('n', 'node')])])
  return {
    cam: {
      model: {
        ...model,
        title: overrides.title ?? 'My Model',
        state: overrides.state ?? 'development',
        comments: overrides.comments ?? [],
      },
      loading: false,
      error: null,
      selectedActivityId: null,
    },
    auth: { user: { uri: 'http://orcid.org/0000-0000-0000-0000' }, baristaToken: 'test-token' },
  }
}

const renderForm = (preloadedState: ReturnType<typeof buildCamState>) =>
  renderWithProviders(
    <MantineProvider>
      <CamStateForm />
    </MantineProvider>,
    { preloadedState }
  )

beforeEach(() => {
  updateMock.mockClear()
})

describe('CamStateForm', () => {
  it('renders the current state in the select', () => {
    renderForm(buildCamState({ state: 'production' }))
    expect(screen.getAllByDisplayValue('production').length).toBeGreaterThan(0)
  })

  it('defaults to "development" when cam has no state set', () => {
    const preloadedState = buildCamState({ state: 'development' })
    // Drop state from the model to exercise the `cam?.state ?? 'development'` fallback.
    delete (preloadedState.cam.model as { state?: string }).state
    renderForm(preloadedState)
    expect(screen.getAllByDisplayValue('development').length).toBeGreaterThan(0)
  })

  it('calls updateGraphModel when Save is clicked', async () => {
    const { user } = renderForm(buildCamState({ state: 'development' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateMock).toHaveBeenCalledTimes(1)
    const ops = updateMock.mock.calls[0][0]
    expect(Array.isArray(ops)).toBe(true)
  })

  it('does not call updateGraphModel when Cancel is clicked', async () => {
    const { user, store } = renderForm(buildCamState({ state: 'development' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(updateMock).not.toHaveBeenCalled()
    expect(store.getState().dialog.open).toBe(false)
  })

  it('closes the dialog after a successful save', async () => {
    const { user, store } = renderForm(buildCamState({ state: 'development' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(store.getState().dialog.open).toBe(false)
  })

  it('renders nothing when there is no cam model', () => {
    const { container } = renderWithProviders(
      <MantineProvider>
        <CamStateForm />
      </MantineProvider>,
      { preloadedState: { cam: { model: null, loading: false, error: null, selectedActivityId: null } } }
    )
    expect(container.querySelector('button')).toBeNull()
  })
})
