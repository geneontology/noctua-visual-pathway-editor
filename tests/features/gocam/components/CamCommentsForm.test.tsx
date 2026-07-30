import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CamCommentsForm from '@/features/gocam/components/CamCommentsForm'
import { buildModel, buildActivity, buildNode } from '@tests/fixtures/builders'
import { AnnotationKey, OperationType } from '@/features/gocam/models/operations'
import type { Operation } from '@/features/gocam/models/operations'

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
      <CamCommentsForm />
    </MantineProvider>,
    { preloadedState }
  )

// Comment bodies render as textareas; category pickers use this placeholder.
const commentInputs = () =>
  screen.queryAllByPlaceholderText('Write your comment...') as HTMLTextAreaElement[]
const emptyCategoryPickers = () => screen.queryAllByPlaceholderText('Select a category')

// COMMENT annotation values from the ops array passed to updateGraphModel.
const savedComments = () => {
  const ops = updateMock.mock.calls[0][0] as Operation[]
  return ops
    .filter(
      o =>
        o.operation === OperationType.ADD_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.COMMENT
    )
    .map(o => (o.arguments.values as Array<{ value: string }>)[0].value)
}

beforeEach(() => {
  updateMock.mockClear()
})

describe('CamCommentsForm', () => {
  it('shows "No comments yet" when comments is empty', () => {
    renderForm(buildCamState({ comments: [] }))
    expect(screen.getByText('No comments yet')).toBeInTheDocument()
    expect(commentInputs()).toHaveLength(0)
  })

  it('adds a category picker but no text field until a category is chosen', async () => {
    const { user } = renderForm(buildCamState({ comments: [] }))
    await user.click(screen.getByLabelText('Add Comment'))

    // Category select appears; the comment textarea only shows once a category is picked.
    expect(emptyCategoryPickers()).toHaveLength(1)
    expect(commentInputs()).toHaveLength(0)
  })

  it('renders existing structured comments split into category + text', () => {
    renderForm(buildCamState({ comments: ['General: first', 'Annotation dispute: second'] }))
    const inputs = commentInputs()
    expect(inputs.map(i => i.value)).toEqual(['first', 'second'])
    expect(screen.getAllByDisplayValue('General').length).toBeGreaterThan(0)
    expect(screen.getAllByDisplayValue('Annotation dispute').length).toBeGreaterThan(0)
  })

  it('renders a legacy (no-prefix) comment as text with a blank category', () => {
    renderForm(buildCamState({ comments: ['a legacy note'] }))
    expect(commentInputs()[0].value).toBe('a legacy note')
    expect(emptyCategoryPickers()).toHaveLength(1)
  })

  it('removes an empty comment immediately without confirm', async () => {
    const { user } = renderForm(buildCamState({ comments: ['General: keep me'] }))
    await user.click(screen.getByLabelText('Add Comment')) // adds an empty row

    const removeButtons = screen.getAllByLabelText('Remove comment')
    expect(removeButtons).toHaveLength(2)
    await user.click(removeButtons[1]) // the freshly-added empty one

    expect(commentInputs().map(i => i.value)).toEqual(['keep me'])
    expect(screen.queryByText(/Remove this comment/)).toBeNull()
  })

  it('asks for confirmation before removing a comment with content', async () => {
    const { user } = renderForm(buildCamState({ comments: ['General: has content'] }))
    await user.click(screen.getByLabelText('Remove comment'))

    expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument()
    expect(commentInputs()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(commentInputs()).toHaveLength(0)
  })

  it('keeps the row when the user cancels the remove-confirm dialog', async () => {
    const { user } = renderForm(buildCamState({ comments: ['General: has content'] }))
    await user.click(screen.getByLabelText('Remove comment'))

    const removeBtn = await screen.findByRole('button', { name: 'Remove' })
    const dialogRoot = removeBtn.closest('section') ?? removeBtn.closest('[role="dialog"]')
    expect(dialogRoot).not.toBeNull()
    await user.click(within(dialogRoot as HTMLElement).getByRole('button', { name: 'Cancel' }))

    expect(commentInputs()).toHaveLength(1)
  })

  it('drops whitespace-only comments and saves the rest formatted as "Category: text"', async () => {
    const { user } = renderForm(buildCamState({ comments: ['General: real', '   '] }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(savedComments()).toEqual(['General: real'])
  })

  it('does not call updateGraphModel when Cancel is clicked', async () => {
    const { user, store } = renderForm(buildCamState({ comments: ['General: one'] }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(updateMock).not.toHaveBeenCalled()
    expect(store.getState().dialog.open).toBe(false)
  })

  it('closes the dialog after a successful save', async () => {
    const { user, store } = renderForm(buildCamState({ comments: ['General: one'] }))
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
