import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CamTitleForm from '@/features/gocam/components/CamTitleForm'
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
  }
}

const renderForm = (preloadedState: ReturnType<typeof buildCamState>) =>
  renderWithProviders(
    <MantineProvider>
      <CamTitleForm />
    </MantineProvider>,
    { preloadedState }
  )

beforeEach(() => {
  updateMock.mockClear()
})

describe('CamTitleForm', () => {
  it('renders the current title in the input', () => {
    renderForm(buildCamState({ title: 'Existing title' }))
    const input = screen.getByLabelText('Title') as HTMLTextAreaElement
    expect(input.value).toBe('Existing title')
  })

  it('disables Save when the title is empty', async () => {
    const { user } = renderForm(buildCamState({ title: '' }))
    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()

    await user.type(screen.getByLabelText('Title'), 'New title')
    expect(save).not.toBeDisabled()
  })

  it('disables Save for whitespace-only title', async () => {
    const { user } = renderForm(buildCamState({ title: 'Existing' }))
    const input = screen.getByLabelText('Title') as HTMLTextAreaElement
    await user.clear(input)
    await user.type(input, '   ')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('calls updateGraphModel with operations when Save is clicked', async () => {
    const { user } = renderForm(buildCamState({ title: 'Old' }))
    const input = screen.getByLabelText('Title') as HTMLTextAreaElement
    await user.clear(input)
    await user.type(input, 'Changed')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateMock).toHaveBeenCalledTimes(1)
    const ops = updateMock.mock.calls[0][0]
    expect(Array.isArray(ops)).toBe(true)
    expect(ops.length).toBeGreaterThan(0)
  })

  it('does not call updateGraphModel when Cancel is clicked', async () => {
    const { user, store } = renderForm(buildCamState({ title: 'Old' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(updateMock).not.toHaveBeenCalled()
    expect(store.getState().dialog.open).toBe(false)
  })

  it('closes the dialog after a successful save', async () => {
    const { user, store } = renderForm(buildCamState({ title: 'Old' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(store.getState().dialog.open).toBe(false)
  })

  it('renders nothing when there is no cam model', () => {
    const { container } = renderWithProviders(
      <MantineProvider>
        <CamTitleForm />
      </MantineProvider>,
      { preloadedState: { cam: { model: null, loading: false, error: null, selectedActivityId: null } } }
    )
    expect(container.querySelector('button')).toBeNull()
  })
})
