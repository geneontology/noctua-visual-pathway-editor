import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CommentsPanel from '@/features/gocam/components/CommentsPanel'
import type { Contributor } from '@/features/users/models/contributor'
import { buildModel, buildActivity, buildNode, buildEdgeWithEvidence } from '@tests/fixtures/builders'
import { RightPanelTab } from '@/@noctua.core/components/drawer/drawerSlice'
import { DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import {
  INDIVIDUAL_COMMENT_CATEGORIES,
  REFERENCE_COMMENT_CATEGORIES,
} from '@/features/gocam/data/commentCategories'

// A model with one activity carrying a node (individual) comment and a
// reference (evidence) comment, plus a model-level comment.
const buildTestModel = () => {
  const node = {
    ...buildNode('GO:0003674', 'My Term'),
    comments: ['Ontology term pending: needs review'],
  }
  const edge = buildEdgeWithEvidence('enabled_by', [{ id: 'ECO:0000314', label: 'IDA' }])
  edge.evidence![0].comments = ['Figure/Table: see figure 2']
  const activity = buildActivity('act', [node], [edge])
  return { ...buildModel([activity]), comments: ['General: model comment'] }
}

interface RenderOpts {
  selectedActivityId?: string | null
  rightPanelTab?: RightPanelTab
}

const renderPanel = (
  model = buildTestModel(),
  { selectedActivityId = null, rightPanelTab = RightPanelTab.COMMENTS }: RenderOpts = {}
) =>
  renderWithProviders(
    <MantineProvider>
      <CommentsPanel model={model} />
    </MantineProvider>,
    {
      preloadedState: {
        auth: { user: { uri: 'http://orcid.org/0000-0000-0000-0000' }, baristaToken: 'test-token' },
        cam: { model: null, loading: false, error: null, selectedActivityId },
        drawer: { rightDrawerOpen: true, rightPanelTab },
      },
    }
  )

describe('CommentsPanel', () => {
  it('renders the model comment with its category badge', () => {
    renderPanel()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getAllByText(/model comment/).length).toBeGreaterThan(0)
  })

  it('renders a node comment with the GO id in the subject header (#231)', () => {
    renderPanel()
    expect(screen.getByText('My Term (GO:0003674)')).toBeInTheDocument()
    expect(screen.getByText('Ontology term pending')).toBeInTheDocument()
    expect(screen.getAllByText(/needs review/).length).toBeGreaterThan(0)
  })

  it('renders a reference comment as relation → object with an evidence·reference sublabel (#231)', () => {
    renderPanel()
    // Subject and reference share one context line; the statement's subject is
    // dropped — it's already the activity heading the section.
    expect(screen.getByText('enabled by → Target · IDA · PMID:1')).toBeInTheDocument()
    expect(screen.getByText('Figure/Table')).toBeInTheDocument()
    expect(screen.getAllByText(/see figure 2/).length).toBeGreaterThan(0)
  })

  it('shows the total comment count (model + node + reference)', () => {
    renderPanel()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not render statement (edge) comments (#231)', () => {
    const edge = buildEdgeWithEvidence('enabled_by', [], ['Annotation dispute: edge issue'])
    const model = buildModel([buildActivity('act', [buildNode('n', 'My Activity')], [edge])])
    renderPanel(model)

    expect(screen.queryByText('Statement')).not.toBeInTheDocument()
    expect(screen.queryByText(/edge issue/)).not.toBeInTheDocument()
    expect(screen.getByText(/No annotation comments yet/)).toBeInTheDocument()
  })

  it('selects the activity and stays on the Comments panel when a comment is clicked (#231)', async () => {
    const { user, store } = renderPanel()
    await user.click(screen.getAllByRole('button', { name: 'Select activity My Term' })[0])

    expect(store.getState().cam.selectedActivityId).toBe('act')
    expect(store.getState().drawer.rightPanelTab).toBe(RightPanelTab.COMMENTS)
  })

  it('opens the model comments dialog from the Model section edit button', async () => {
    const { user, store } = renderPanel()
    await user.click(screen.getByLabelText('Edit model comments'))

    const dialog = store.getState().dialog
    expect(dialog.open).toBe(true)
    expect(dialog.component).toBe(DialogComponent.CAM_COMMENTS_FORM)
  })

  it('opens the individual dialog with individual categories from the node edit pen (#231)', async () => {
    const { user, store } = renderPanel()
    await user.click(screen.getByLabelText('Edit comments on My Term (GO:0003674)'))

    const dialog = store.getState().dialog
    expect(dialog.component).toBe(DialogComponent.INDIVIDUAL_COMMENTS_FORM)
    expect(dialog.customProps.individualUid).toBe('uid_GO:0003674')
    expect(dialog.customProps.categories).toEqual(INDIVIDUAL_COMMENT_CATEGORIES)
    expect(store.getState().cam.selectedActivityId).toBe('act')
  })

  it('opens the reference dialog with reference categories from the relation edit pen (#231)', async () => {
    const { user, store } = renderPanel()
    await user.click(screen.getByLabelText('Edit comments on enabled by → Target'))

    const dialog = store.getState().dialog
    expect(dialog.component).toBe(DialogComponent.INDIVIDUAL_COMMENTS_FORM)
    expect(dialog.customProps.individualUid).toBe('ev_enabled_by_0')
    expect(dialog.customProps.categories).toEqual(REFERENCE_COMMENT_CATEGORIES)
  })

  it('highlights the selected activity section (#231)', () => {
    const { container } = renderPanel(buildTestModel(), { selectedActivityId: 'act' })
    expect(container.querySelector('.border-orange-500')).toBeInTheDocument()
  })

  it('shows the selected activity even when it has no comments (#231)', () => {
    const model = buildModel([buildActivity('act', [buildNode('n', 'My Activity')])])
    renderPanel(model, { selectedActivityId: 'act' })

    expect(screen.getByText('No comments on this activity yet')).toBeInTheDocument()
    expect(screen.getByText('My Activity')).toBeInTheDocument()
  })

  it('shows empty-state copy when there are no comments anywhere', () => {
    renderPanel(buildModel([buildActivity('act', [buildNode('n', 'My Activity')])]))
    expect(screen.getByText('No model comments yet')).toBeInTheDocument()
    expect(screen.getByText(/No annotation comments yet/)).toBeInTheDocument()
  })

  describe('annotation dispute ticket (#231)', () => {
    // The logged-in user (0000-0000-0000-0000, from renderPanel) is deliberately
    // not the contributor of the disputed node.
    const buildDisputedModel = (contributors: Contributor[]) => {
      const node = {
        ...buildNode('GO:0003674', 'My Term'),
        comments: ['Annotation dispute: wrong term for this gene'],
        contributors,
      }
      return buildModel([buildActivity('act', [node])])
    }

    const disputeBody = () => {
      const href = screen.getByLabelText('File annotation dispute on GitHub').getAttribute('href')
      return new URL(href ?? '').searchParams.get('body') ?? ''
    }

    it('names the contributor of the disputed statement, not the logged-in user', () => {
      renderPanel(
        buildDisputedModel([{ uri: 'http://orcid.org/0000-0002-1825-0097', name: 'Jane Doe' }])
      )

      expect(disputeBody()).toContain('* Jane Doe (0000-0002-1825-0097)')
      expect(disputeBody()).not.toContain('0000-0000-0000-0000')
    })

    it('lists every contributor of the disputed statement', () => {
      renderPanel(
        buildDisputedModel([
          { uri: 'http://orcid.org/0000-0002-1825-0097', name: 'Jane Doe' },
          { uri: 'http://orcid.org/0000-0001-5109-3700', name: 'John Roe' },
        ])
      )

      expect(disputeBody()).toContain(
        '* Jane Doe (0000-0002-1825-0097), John Roe (0000-0001-5109-3700)'
      )
    })

    it('files the ticket with no curator when the statement has no contributors', () => {
      renderPanel(buildDisputedModel([]))

      expect(disputeBody()).toBe('* My Term\n* My Term (GO:0003674)')
    })

    it('offers no dispute ticket on a non-dispute comment', () => {
      const node = {
        ...buildNode('GO:0003674', 'My Term'),
        comments: ['Ontology term pending: needs review'],
      }
      renderPanel(buildModel([buildActivity('act', [node])]))

      expect(screen.queryByLabelText('File annotation dispute on GitHub')).toBeNull()
    })
  })
})
