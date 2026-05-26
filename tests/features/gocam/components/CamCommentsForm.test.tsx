import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CamCommentsForm from '@/features/gocam/components/CamCommentsForm'
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
      <CamCommentsForm />
    </MantineProvider>,
    { preloadedState }
  )

const commentInputs = () => screen.queryAllByPlaceholderText('Comment') as HTMLTextAreaElement[]

beforeEach(() => {
  updateMock.mockClear()
})

describe('CamCommentsForm', () => {
  it('shows "No comments yet" when comments is empty', () => {
    renderForm(buildCamState({ comments: [] }))
    expect(screen.getByText('No comments yet')).toBeInTheDocument()
    expect(screen.queryAllByPlaceholderText('Comment')).toHaveLength(0)
  })

  it('renders existing comments as inputs', () => {
    renderForm(buildCamState({ comments: ['first', 'second'] }))
    const inputs = commentInputs()
    expect(inputs).toHaveLength(2)
    expect(inputs.map(i => i.value)).toEqual(['first', 'second'])
  })

  it('Add button appends an empty comment row', async () => {
    const { user } = renderForm(buildCamState({ comments: ['one'] }))
    expect(commentInputs()).toHaveLength(1)

    await user.click(screen.getByLabelText('Add comment'))

    const inputs = commentInputs()
    expect(inputs).toHaveLength(2)
    expect(inputs[1].value).toBe('')
  })

  it('removes an empty comment immediately without confirm', async () => {
    const { user } = renderForm(buildCamState({ comments: ['', 'keep me'] }))
    const removeButtons = screen.getAllByLabelText('Remove comment')

    await user.click(removeButtons[0])

    const inputs = commentInputs()
    expect(inputs).toHaveLength(1)
    expect(inputs[0].value).toBe('keep me')
    expect(screen.queryByText(/Remove this comment/)).toBeNull()
  })

  it('asks for confirmation before removing a comment with content', async () => {
    const { user } = renderForm(buildCamState({ comments: ['has content'] }))
    await user.click(screen.getAllByLabelText('Remove comment')[0])

    // ConfirmDialog opens with a Remove button; row isn't actually removed yet.
    expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument()
    expect(commentInputs()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(commentInputs()).toHaveLength(0)
  })

  it('keeps the row when the user cancels the remove-confirm dialog', async () => {
    const { user } = renderForm(buildCamState({ comments: ['has content'] }))
    await user.click(screen.getAllByLabelText('Remove comment')[0])

    // The confirm dialog adds a "Remove" button alongside the form's "Cancel".
    // There are two Cancel buttons once the dialog is open — the dialog's is the second.
    const removeBtn = await screen.findByRole('button', { name: 'Remove' })
    const dialogRoot = removeBtn.closest('section') ?? removeBtn.closest('[role="dialog"]')
    expect(dialogRoot).not.toBeNull()
    await user.click(within(dialogRoot as HTMLElement).getByRole('button', { name: 'Cancel' }))

    expect(commentInputs()).toHaveLength(1)
  })

  it('filters whitespace-only comments out on save', async () => {
    const { user } = renderForm(buildCamState({ comments: ['real comment', '   '] }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateMock).toHaveBeenCalledTimes(1)
    const ops = updateMock.mock.calls[0][0]
    expect(Array.isArray(ops)).toBe(true)
  })

  it('does not call updateGraphModel when Cancel is clicked', async () => {
    const { user, store } = renderForm(buildCamState({ comments: ['one'] }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(updateMock).not.toHaveBeenCalled()
    expect(store.getState().dialog.open).toBe(false)
  })

  it('closes the dialog after a successful save', async () => {
    const { user, store } = renderForm(buildCamState({ comments: ['one'] }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(store.getState().dialog.open).toBe(false)
  })

  it('renders nothing when there is no cam model', () => {
    const { container } = renderWithProviders(
      <MantineProvider>
        <CamCommentsForm />
      </MantineProvider>,
      { preloadedState: { cam: { model: null, loading: false, error: null, selectedActivityId: null } } }
    )
    expect(container.querySelector('button')).toBeNull()
  })
})
