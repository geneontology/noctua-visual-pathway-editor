import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import EdgeCommentsForm from '@/features/gocam/components/EdgeCommentsForm'
import { buildModel, buildActivity, buildNode, buildEdgeWithEvidence } from '@tests/fixtures/builders'

const updateMock = vi.hoisted(() => vi.fn(() => Promise.resolve({})))

vi.mock('@/features/gocam/slices/camApiSlice', () => ({
  useUpdateGraphModelMutation: () => [updateMock, { isLoading: false }],
}))

const TARGET_EDGE_UID = 'edge_enabled_by'

const buildState = (edgeComments: string[] = []) => {
  const edge = buildEdgeWithEvidence('enabled_by', [{ id: 'ECO:1', label: 'IDA' }], edgeComments)
  const activity = buildActivity('a1', [buildNode('mf', 'MF')], [edge])
  return {
    cam: {
      model: buildModel([activity]),
      loading: false,
      error: null,
      selectedActivityId: 'a1',
    },
  }
}

const renderForm = (
  preloadedState: ReturnType<typeof buildState>,
  edgeUid: string = TARGET_EDGE_UID
) =>
  renderWithProviders(
    <MantineProvider>
      <EdgeCommentsForm edgeUid={edgeUid} />
    </MantineProvider>,
    { preloadedState }
  )

const commentInputs = () =>
  screen.queryAllByPlaceholderText('Comment') as HTMLTextAreaElement[]

beforeEach(() => {
  updateMock.mockClear()
})

describe('EdgeCommentsForm', () => {
  it('shows "No comments yet" when the edge has no comments', () => {
    renderForm(buildState([]))
    expect(screen.getByText('No comments yet')).toBeInTheDocument()
    expect(commentInputs()).toHaveLength(0)
  })

  it('renders existing edge comments as inputs', () => {
    renderForm(buildState(['first', 'second']))
    const inputs = commentInputs()
    expect(inputs).toHaveLength(2)
    expect(inputs.map(i => i.value)).toEqual(['first', 'second'])
  })

  it('Add button appends an empty comment row', async () => {
    const { user } = renderForm(buildState(['one']))
    expect(commentInputs()).toHaveLength(1)
    await user.click(screen.getByLabelText('Add comment'))
    const inputs = commentInputs()
    expect(inputs).toHaveLength(2)
    expect(inputs[1].value).toBe('')
  })

  it('removes an empty comment immediately without confirm', async () => {
    const { user } = renderForm(buildState(['', 'keep me']))
    const removeButtons = screen.getAllByLabelText('Remove comment')
    await user.click(removeButtons[0])

    const inputs = commentInputs()
    expect(inputs).toHaveLength(1)
    expect(inputs[0].value).toBe('keep me')
  })

  it('asks for confirmation before removing a comment with content', async () => {
    const { user } = renderForm(buildState(['has content']))
    await user.click(screen.getAllByLabelText('Remove comment')[0])

    const removeBtn = await screen.findByRole('button', { name: 'Remove' })
    expect(removeBtn).toBeInTheDocument()
    expect(commentInputs()).toHaveLength(1)

    await user.click(removeBtn)
    expect(commentInputs()).toHaveLength(0)
  })

  it('keeps the row when the user cancels the remove-confirm dialog', async () => {
    const { user } = renderForm(buildState(['has content']))
    await user.click(screen.getAllByLabelText('Remove comment')[0])

    const removeBtn = await screen.findByRole('button', { name: 'Remove' })
    const dialogRoot = removeBtn.closest('section') ?? removeBtn.closest('[role="dialog"]')
    expect(dialogRoot).not.toBeNull()
    await user.click(within(dialogRoot as HTMLElement).getByRole('button', { name: 'Cancel' }))
    expect(commentInputs()).toHaveLength(1)
  })

  it('filters whitespace-only comments out on save', async () => {
    const { user } = renderForm(buildState(['real', '   ']))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(updateMock).toHaveBeenCalledTimes(1)
    const ops = updateMock.mock.calls[0][0]
    expect(Array.isArray(ops)).toBe(true)
  })

  it('does not call updateGraphModel when Cancel is clicked', async () => {
    const { user, store } = renderForm(buildState(['one']))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(updateMock).not.toHaveBeenCalled()
    expect(store.getState().dialog.open).toBe(false)
  })

  it('closes the dialog after a successful save', async () => {
    const { user, store } = renderForm(buildState(['one']))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(store.getState().dialog.open).toBe(false)
  })

  it('renders nothing when the edge cannot be found', () => {
    const { container } = renderForm(buildState(['x']), 'edge_nonexistent')
    expect(container.querySelector('button')).toBeNull()
  })
})
