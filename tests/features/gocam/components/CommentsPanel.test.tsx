import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CommentsPanel from '@/features/gocam/components/CommentsPanel'
import {
  buildModel,
  buildActivity,
  buildNode,
  buildEdgeWithEvidence,
} from '@tests/fixtures/builders'
import { DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import { RightPanelTab } from '@/@noctua.core/components/drawer/drawerSlice'
import type { GraphModel } from '@/features/gocam/models/cam'

const renderPanel = (model: GraphModel) =>
  renderWithProviders(
    <MantineProvider>
      <CommentsPanel model={model} />
    </MantineProvider>
  )

describe('CommentsPanel', () => {
  it('renders model-level comments under the Model section', () => {
    const model = buildModel([])
    model.comments = ['model comment one', 'model comment two']

    renderPanel(model)

    expect(screen.getByText('model comment one')).toBeInTheDocument()
    expect(screen.getByText('model comment two')).toBeInTheDocument()
  })

  it('shows placeholders when there are no comments at all', () => {
    renderPanel(buildModel([]))
    expect(screen.getByText(/No model comments yet/)).toBeInTheDocument()
    expect(screen.getByText(/No edge comments yet/)).toBeInTheDocument()
  })

  it('renders per-edge comments grouped by activity label', () => {
    const edge = buildEdgeWithEvidence('enabled_by', [{ id: 'ECO:1', label: 'IDA' }], [
      'edge comment',
    ])
    const activity = buildActivity('a1', [buildNode('mf', 'MF Label')], [edge])
    activity.enabledBy = buildNode('gp', 'My Protein')
    const model = buildModel([activity])

    renderPanel(model)

    expect(screen.getByText('My Protein')).toBeInTheDocument()
    expect(screen.getByText('edge comment')).toBeInTheDocument()
  })

  it('skips activities and edges that have no comments', () => {
    const commentedEdge = buildEdgeWithEvidence(
      'enabled_by',
      [{ id: 'ECO:1', label: 'IDA' }],
      ['has comment']
    )
    const uncommentedEdge = buildEdgeWithEvidence('part_of', [{ id: 'ECO:1', label: 'IDA' }], [])
    const a1 = buildActivity('a1', [buildNode('mf1', 'MF1')], [commentedEdge, uncommentedEdge])
    a1.enabledBy = buildNode('gp1', 'Activity One')

    const a2 = buildActivity(
      'a2',
      [buildNode('mf2', 'MF2')],
      [buildEdgeWithEvidence('enabled_by_2', [{ id: 'ECO:1', label: 'IDA' }], [])]
    )
    a2.enabledBy = buildNode('gp2', 'Activity Two (empty)')

    const model = buildModel([a1, a2])

    renderPanel(model)

    expect(screen.getByText('Activity One')).toBeInTheDocument()
    expect(screen.queryByText('Activity Two (empty)')).toBeNull()
  })

  it('clicking an edge comment selects the activity and switches to ACTIVITY_TABLE tab', async () => {
    const edge = buildEdgeWithEvidence('enabled_by', [{ id: 'ECO:1', label: 'IDA' }], [
      'select me',
    ])
    const activity = buildActivity('a1', [buildNode('mf', 'MF')], [edge])
    activity.enabledBy = buildNode('gp', 'GP Label')
    const model = buildModel([activity])

    const { user, store } = renderPanel(model)

    await user.click(screen.getByText('select me'))

    expect(store.getState().cam.selectedActivityId).toBe('a1')
    expect(store.getState().drawer.rightPanelTab).toBe(RightPanelTab.ACTIVITY_TABLE)
  })

  it('clicking Edit on the Model section opens CAM_COMMENTS_FORM', async () => {
    const model = buildModel([])
    model.comments = ['existing']

    const { user, store } = renderPanel(model)

    await user.click(screen.getByLabelText('Edit model comments'))

    const dialog = store.getState().dialog
    expect(dialog.open).toBe(true)
    expect(dialog.component).toBe(DialogComponent.CAM_COMMENTS_FORM)
  })

  it('clicking the edge edit pen opens EDGE_COMMENTS_FORM with edgeUid in customProps', async () => {
    const edge = buildEdgeWithEvidence('enabled_by', [{ id: 'ECO:1', label: 'IDA' }], [
      'comment',
    ])
    const activity = buildActivity('a1', [buildNode('mf', 'MF')], [edge])
    activity.enabledBy = buildNode('gp', 'GP Label')
    const model = buildModel([activity])

    const { user, store } = renderPanel(model)

    await user.click(screen.getAllByLabelText(/Edit comments on/)[0])

    const dialog = store.getState().dialog
    expect(dialog.open).toBe(true)
    expect(dialog.component).toBe(DialogComponent.EDGE_COMMENTS_FORM)
    expect(dialog.customProps).toEqual({ edgeUid: edge.uid })
    expect(store.getState().cam.selectedActivityId).toBe('a1')
  })

  it('Close button closes the right drawer', async () => {
    const { user, store } = renderPanel(buildModel([]))
    await user.click(screen.getByRole('button', { name: /Close/ }))
    expect(store.getState().drawer.rightDrawerOpen).toBe(false)
  })

  it('total count in header sums model comments + per-edge comments', () => {
    const edge1 = buildEdgeWithEvidence('e1', [{ id: 'ECO:1', label: 'IDA' }], ['ec1', 'ec2'])
    const a1 = buildActivity('a1', [buildNode('mf', 'MF')], [edge1])
    const model = buildModel([a1])
    model.comments = ['mc1']

    renderPanel(model)

    // total = 1 model + 2 edge = 3, appears in the header chip
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
