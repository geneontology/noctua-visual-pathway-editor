import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import IndividualCommentsForm from '@/features/gocam/components/IndividualCommentsForm'
import {
  buildModel,
  buildActivity,
  buildNode,
  buildEdgeWithEvidence,
} from '@tests/fixtures/builders'
import {
  INDIVIDUAL_COMMENT_CATEGORIES,
  REFERENCE_COMMENT_CATEGORIES,
} from '@/features/gocam/data/commentCategories'
import { OperationEntity, OperationType, AnnotationKey } from '@/features/gocam/models/operations'
import type { Operation } from '@/features/gocam/models/operations'
import type { GraphModel } from '@/features/gocam/models/cam'
import type { Contributor } from '@/features/users/models/contributor'

// Override just the mutation hook so Save is synchronous and inspectable; the
// rest of camApiSlice (used by the store) stays real.
const { mockUpdate } = vi.hoisted(() => ({
  mockUpdate: vi.fn(() => Promise.resolve({ data: {} })),
}))

vi.mock('@/features/gocam/slices/camApiSlice', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, useUpdateGraphModelMutation: () => [mockUpdate, { isLoading: false }] }
})

const IND = 'ind-1'

const buildCamModel = (
  comments: string[] = ['General: existing note'],
  contributors: Contributor[] = []
): GraphModel => {
  const node = { ...buildNode('GO:0003674', 'My Term'), uid: IND, comments, contributors }
  const model = buildModel([buildActivity('act', [node])])
  return { ...model, nodes: [node] }
}

// The same dialog also edits comments on an evidence individual, which hangs
// off an activity's edge rather than sitting in its nodes (#289).
const EV = 'ev-1'

const buildEvidenceCamModel = (comments: string[]): GraphModel => {
  const edge = buildEdgeWithEvidence('enabled_by', [{ id: 'ECO:0000314', label: 'IDA' }])
  edge.evidence![0] = { ...edge.evidence![0], uid: EV, comments }
  const model = buildModel([buildActivity('act', [buildNode('GO:0003674', 'My Term')], [edge])])
  // Evidence individuals also appear in the flat node list, which is where the
  // dialog reads the comments it edits.
  return { ...model, nodes: [{ ...buildNode('ECO:0000314', 'IDA'), uid: EV, comments }] }
}

const renderForm = (
  {
    individualUid = IND,
    categories = INDIVIDUAL_COMMENT_CATEGORIES,
  }: { individualUid?: string; categories?: readonly string[] } = {},
  model: GraphModel | null = buildCamModel(),
  loggedIn = true
) =>
  renderWithProviders(
    <MantineProvider>
      <IndividualCommentsForm
        individualUid={individualUid}
        categories={categories}
        subjectLabel="My Term"
      />
    </MantineProvider>,
    {
      preloadedState: {
        cam: { model, loading: false, error: null, selectedActivityId: null },
        ...(loggedIn
          ? { auth: { user: { uri: 'http://orcid.org/0000-0000-0000-0000' }, baristaToken: 't' } }
          : {}),
      },
    }
  )

describe('IndividualCommentsForm', () => {
  beforeEach(() => mockUpdate.mockClear())

  it('renders the subject label and the existing comment text', () => {
    renderForm()
    expect(screen.getByText('My Term')).toBeInTheDocument()
    expect(screen.getByDisplayValue('existing note')).toBeInTheDocument()
  })

  it('is read-only (no Save) when logged out', () => {
    renderForm({}, buildCamModel(), false)
    expect(screen.queryByText('Save')).not.toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('renders nothing when the individual is not in the model', () => {
    renderForm({ individualUid: 'missing' })
    expect(screen.queryByText('My Term')).not.toBeInTheDocument()
  })

  it('saves the current comment set as individual-scoped operations', async () => {
    const { user } = renderForm()
    await user.click(screen.getByText('Save'))

    expect(mockUpdate).toHaveBeenCalledTimes(1)
    const ops = mockUpdate.mock.calls[0][0] as Operation[]

    const add = ops.find(
      o => o.entity === OperationEntity.INDIVIDUAL && o.operation === OperationType.ADD_ANNOTATION
    )
    expect(add?.arguments.individual).toBe(IND)
    expect((add?.arguments.values as Array<{ key: AnnotationKey; value: string }>)[0]).toEqual({
      key: AnnotationKey.COMMENT,
      value: 'General: existing note',
    })
    expect(ops[ops.length - 1].operation).toBe(OperationType.STORE)
  })

  describe('annotation dispute ticket (#231)', () => {
    const disputeBody = () => {
      const href = screen.getByLabelText('File annotation dispute on GitHub').getAttribute('href')
      return new URL(href ?? '').searchParams.get('body') ?? ''
    }

    it('names the contributor of the individual, not the logged-in user', () => {
      renderForm(
        {},
        buildCamModel(
          ['Annotation dispute: wrong term'],
          [{ uri: 'http://orcid.org/0000-0002-1825-0097', name: 'Jane Doe' }]
        )
      )

      expect(disputeBody()).toBe(
        '* My Term\n* My Term (GO:0003674)\n* Jane Doe (0000-0002-1825-0097)\n\nwrong term'
      )
    })

    it('files the ticket with no curator when the individual has no contributors', () => {
      renderForm({}, buildCamModel(['Annotation dispute: wrong term']))

      expect(disputeBody()).toBe('* My Term\n* My Term (GO:0003674)\n\nwrong term')
    })

    // The comment is what the ticket is about, so it travels with it (#289).
    it('pastes the comment into the ticket body', () => {
      renderForm({}, buildCamModel(['GO term annotation dispute: this term is far too broad']))

      expect(disputeBody()).toContain('this term is far too broad')
    })

    it('offers no dispute ticket on a non-dispute comment', () => {
      renderForm()
      expect(screen.queryByLabelText('File annotation dispute on GitHub')).toBeNull()
    })
  })

  describe('the other comment tickets (#289)', () => {
    const ticket = (label: string) => {
      const href = screen.getByLabelText(label).getAttribute('href') ?? ''
      return { href, body: new URL(href).searchParams.get('body') ?? '' }
    }

    it('sends a pending ontology term to go-ontology', () => {
      renderForm({}, buildCamModel(['Ontology term pending: needs a more specific term']))

      const { href, body } = ticket('Request ontology term on GitHub')
      expect(href).toContain('go-ontology/issues/new')
      expect(body).toContain('* My Term (GO:0003674)')
      expect(body).toContain('needs a more specific term')
    })

    // An evidence individual is reached through the activity's edges, so the
    // ticket describes the statement it supports rather than a GO term.
    it('sends an evidence dispute to go-annotation with its statement and evidence', () => {
      renderForm(
        { individualUid: EV, categories: REFERENCE_COMMENT_CATEGORIES },
        buildEvidenceCamModel(['Evidence dispute: the figure shows the opposite'])
      )

      const { href, body } = ticket('File evidence dispute on GitHub')
      expect(href).toContain('go-annotation/issues/new')
      expect(body).toContain('* My Term')
      expect(body).toContain('* enabled by → Target')
      expect(body).toContain('* IDA · PMID:1')
      expect(body).toContain('the figure shows the opposite')
    })
  })
})
