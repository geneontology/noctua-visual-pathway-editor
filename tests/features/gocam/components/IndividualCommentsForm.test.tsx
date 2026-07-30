import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import IndividualCommentsForm from '@/features/gocam/components/IndividualCommentsForm'
import { buildModel, buildActivity, buildNode } from '@tests/fixtures/builders'
import { INDIVIDUAL_COMMENT_CATEGORIES } from '@/features/gocam/data/commentCategories'
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

const renderForm = (
  { individualUid = IND }: { individualUid?: string } = {},
  model: GraphModel | null = buildCamModel(),
  loggedIn = true
) =>
  renderWithProviders(
    <MantineProvider>
      <IndividualCommentsForm
        individualUid={individualUid}
        categories={INDIVIDUAL_COMMENT_CATEGORIES}
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
        '* My Term\n* My Term (GO:0003674)\n* Jane Doe (0000-0002-1825-0097)'
      )
    })

    it('files the ticket with no curator when the individual has no contributors', () => {
      renderForm({}, buildCamModel(['Annotation dispute: wrong term']))

      expect(disputeBody()).toBe('* My Term\n* My Term (GO:0003674)')
    })

    it('offers no dispute ticket on a non-dispute comment', () => {
      renderForm()
      expect(screen.queryByLabelText('File annotation dispute on GitHub')).toBeNull()
    })
  })
})
