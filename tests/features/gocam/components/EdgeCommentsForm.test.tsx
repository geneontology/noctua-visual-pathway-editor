import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import EdgeCommentsForm from '@/features/gocam/components/EdgeCommentsForm'
import { buildModel, buildActivity, buildNode, buildEdgeWithEvidence } from '@tests/fixtures/builders'
import { AnnotationKey, OperationEntity, OperationType } from '@/features/gocam/models/operations'
import type { Operation } from '@/features/gocam/models/operations'

const updateMock = vi.hoisted(() => vi.fn(() => Promise.resolve({})))

vi.mock('@/features/gocam/slices/camApiSlice', () => ({
  useUpdateGraphModelMutation: () => [updateMock, { isLoading: false }],
}))

const EDGE_UID = 'edge_enabled_by'

const buildCamState = (comments: string[] = []) => {
  const edge = buildEdgeWithEvidence('enabled_by', [], comments)
  const activity = buildActivity('act', [buildNode('n', 'node')], [edge])
  return {
    cam: {
      model: buildModel([activity]),
      loading: false,
      error: null,
      selectedActivityId: null,
    },
  }
}

const renderForm = (
  preloadedState: ReturnType<typeof buildCamState>,
  edgeUid: string = EDGE_UID
) =>
  renderWithProviders(
    <MantineProvider>
      <EdgeCommentsForm edgeUid={edgeUid} />
    </MantineProvider>,
    { preloadedState }
  )

const commentInputs = () =>
  screen.queryAllByPlaceholderText('Write your comment...') as HTMLTextAreaElement[]

const savedEdgeComments = () => {
  const ops = updateMock.mock.calls[0][0] as Operation[]
  return ops
    .filter(
      o =>
        o.entity === OperationEntity.EDGE &&
        o.operation === OperationType.ADD_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.COMMENT
    )
    .map(o => (o.arguments.values as Array<{ value: string }>)[0].value)
}

beforeEach(() => {
  updateMock.mockClear()
})

describe('EdgeCommentsForm', () => {
  it('shows the statement (subject → predicate → object) context header', () => {
    renderForm(buildCamState())
    const predicate = screen.getByText('enabled by')
    expect(predicate.parentElement?.textContent).toContain('Source')
    expect(predicate.parentElement?.textContent).toContain('Target')
  })

  it('renders existing edge comments split into category + text', () => {
    renderForm(buildCamState(['General: edge note']))
    expect(commentInputs()[0].value).toBe('edge note')
    expect(screen.getAllByDisplayValue('General').length).toBeGreaterThan(0)
  })

  it('saves edge comments as EDGE annotation ops and closes the dialog', async () => {
    const { user, store } = renderForm(buildCamState(['General: edge note']))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(savedEdgeComments()).toEqual(['General: edge note'])
    const ops = updateMock.mock.calls[0][0] as Operation[]
    expect(ops.at(-1)?.operation).toBe(OperationType.STORE)
    expect(store.getState().dialog.open).toBe(false)
  })

  it('does not call updateGraphModel when Cancel is clicked', async () => {
    const { user } = renderForm(buildCamState(['General: edge note']))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('renders nothing when the edge is not found', () => {
    const { container } = renderForm(buildCamState(['General: edge note']), 'missing-uid')
    expect(container.querySelector('button')).toBeNull()
  })
})
