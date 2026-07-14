import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CommentsPanel from '@/features/gocam/components/CommentsPanel'
import { buildModel, buildActivity, buildNode, buildEdgeWithEvidence } from '@tests/fixtures/builders'
import { RightPanelTab } from '@/@noctua.core/components/drawer/drawerSlice'
import { DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'

const EDGE_UID = 'edge_enabled_by'

const buildTestModel = () => {
  const edge = buildEdgeWithEvidence('enabled_by', [], ['Annotation dispute: edge issue'])
  const activity = buildActivity('act', [buildNode('n', 'My Activity')], [edge])
  return { ...buildModel([activity]), comments: ['General: model comment'] }
}

const renderPanel = (model = buildTestModel()) =>
  renderWithProviders(
    <MantineProvider>
      <CommentsPanel model={model} />
    </MantineProvider>
  )

describe('CommentsPanel', () => {
  it('renders the model comment with its category badge', () => {
    renderPanel()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getAllByText(/model comment/).length).toBeGreaterThan(0)
  })

  it('renders a statement comment grouped under its activity, with the edge label', () => {
    renderPanel()
    expect(screen.getByText('My Activity')).toBeInTheDocument()
    expect(screen.getByText('Source enabled by Target')).toBeInTheDocument()
    expect(screen.getByText('Annotation dispute')).toBeInTheDocument()
    expect(screen.getAllByText(/edge issue/).length).toBeGreaterThan(0)
  })

  it('shows the total comment count (model + statement)', () => {
    renderPanel()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('selects the activity and switches to the Activity tab when a statement comment is clicked', async () => {
    const { user, store } = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Select activity My Activity' }))

    expect(store.getState().cam.selectedActivityId).toBe('act')
    expect(store.getState().drawer.rightPanelTab).toBe(RightPanelTab.ACTIVITY_TABLE)
  })

  it('opens the model comments dialog from the Model section edit button', async () => {
    const { user, store } = renderPanel()
    await user.click(screen.getByLabelText('Edit model comments'))

    const dialog = store.getState().dialog
    expect(dialog.open).toBe(true)
    expect(dialog.component).toBe(DialogComponent.CAM_COMMENTS_FORM)
  })

  it('opens the edge comments dialog (with edgeUid) and selects the activity from the edge edit pen', async () => {
    const { user, store } = renderPanel()
    await user.click(screen.getByLabelText('Edit comments on Source enabled by Target'))

    const dialog = store.getState().dialog
    expect(dialog.open).toBe(true)
    expect(dialog.component).toBe(DialogComponent.EDGE_COMMENTS_FORM)
    expect(dialog.customProps.edgeUid).toBe(EDGE_UID)
    expect(store.getState().cam.selectedActivityId).toBe('act')
  })

  it('shows empty-state copy when there are no comments anywhere', () => {
    renderPanel(buildModel([buildActivity('act', [buildNode('n', 'My Activity')])]))
    expect(screen.getByText('No model comments yet')).toBeInTheDocument()
    expect(screen.getByText(/No statement comments yet/)).toBeInTheDocument()
  })
})
