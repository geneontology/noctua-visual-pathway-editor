import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import type { ReactElement } from 'react'
import { renderWithProviders } from '@tests/test-utils'
import SearchAnnotations from '@/features/gocam/components/forms/SearchAnnotations'
import type { AnnotationsResponse } from '@/features/search/models/search'

// ── Mock RTK Query hook ─────────────────────────────────────────────
//
// SearchAnnotations reads from `useSearchAnnotationsQuery` (RTK Query). We
// stub the hook to return canned data so this test exercises only the
// controlled-component contract: open/close, selection, onApply, onClose.

const lookupSpy = vi.hoisted(() => ({
  queryFn: vi.fn<
    [unknown, { skip?: boolean } | undefined],
    { data: AnnotationsResponse[]; isLoading: boolean }
  >(),
}))

vi.mock('@/features/search/slices/lookupApiSlice', () => ({
  useSearchAnnotationsQuery: (args: unknown, opts?: { skip?: boolean }) =>
    lookupSpy.queryFn(args, opts),
}))

// ── Helpers ─────────────────────────────────────────────────────────

const renderModal = (ui: ReactElement) =>
  renderWithProviders(<MantineProvider>{ui}</MantineProvider>)

const sampleAnnotations: AnnotationsResponse[] = [
  {
    uid: 'ann-1',
    term: { id: 'GO:0006468', label: 'protein phosphorylation' },
    evidences: [
      {
        uid: 'ev-1',
        evidenceCode: { id: 'ECO:0000314', label: 'IDA' },
        reference: 'PMID:111',
        referenceUrl: '',
        with: '',
        groups: [],
        contributors: [],
      },
      {
        uid: 'ev-2',
        evidenceCode: { id: 'ECO:0000250', label: 'ISS' },
        reference: 'PMID:222',
        referenceUrl: '',
        with: 'UniProtKB:Q9',
        groups: [],
        contributors: [],
      },
    ],
  },
  {
    uid: 'ann-2',
    term: { id: 'GO:0001234', label: 'other process' },
    evidences: [],
  },
]

beforeEach(() => {
  lookupSpy.queryFn.mockReset()
  lookupSpy.queryFn.mockReturnValue({ data: sampleAnnotations, isLoading: false })
})

// ── Tests ───────────────────────────────────────────────────────────

describe('SearchAnnotations — controlled-component contract', () => {
  it('renders nothing when open is false', () => {
    renderModal(
      <SearchAnnotations
        open={false}
        onClose={() => {}}
        onApply={() => {}}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
      />
    )
    expect(screen.queryByText('Search Annotations')).toBeNull()
  })

  it('skips the lookup query when closed', () => {
    renderModal(
      <SearchAnnotations
        open={false}
        onClose={() => {}}
        onApply={() => {}}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
      />
    )
    // Last call should have been invoked with skip: true
    const lastCall = lookupSpy.queryFn.mock.calls.at(-1)
    expect(lastCall?.[1]).toMatchObject({ skip: true })
  })

  it('renders title, term list, and footer buttons when open', () => {
    renderModal(
      <SearchAnnotations
        open
        onClose={() => {}}
        onApply={() => {}}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
      />
    )
    expect(screen.getByText('Search Annotations')).toBeInTheDocument()
    expect(screen.getByText('protein phosphorylation')).toBeInTheDocument()
    expect(screen.getByText('other process')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('Done is disabled until a term is selected', async () => {
    const user = userEvent.setup()
    renderModal(
      <SearchAnnotations
        open
        onClose={() => {}}
        onApply={() => {}}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
      />
    )

    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()

    await user.click(screen.getByText('protein phosphorylation'))
    expect(screen.getByRole('button', { name: 'Done' })).not.toBeDisabled()
  })

  it('Done calls onApply with the selected term + selected evidences, then onClose', async () => {
    const onApply = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderModal(
      <SearchAnnotations
        open
        onClose={onClose}
        onApply={onApply}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
      />
    )

    // Pick the first term
    await user.click(screen.getByText('protein phosphorylation'))
    // Pick one of its evidences (PMID:111 row)
    await user.click(screen.getByText('PMID:111'))

    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(onApply).toHaveBeenCalledTimes(1)
    const arg = onApply.mock.calls[0][0]
    expect(arg.term).toEqual({ id: 'GO:0006468', label: 'protein phosphorylation' })
    expect(arg.evidences).toHaveLength(1)
    expect(arg.evidences[0].uid).toBe('ev-1')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Done with no evidences selected reports an empty evidence list', async () => {
    const onApply = vi.fn()
    const user = userEvent.setup()

    renderModal(
      <SearchAnnotations
        open
        onClose={() => {}}
        onApply={onApply}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
      />
    )

    await user.click(screen.getByText('protein phosphorylation'))
    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply.mock.calls[0][0].evidences).toEqual([])
  })

  it('Cancel calls onClose without calling onApply', async () => {
    const onApply = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderModal(
      <SearchAnnotations
        open
        onClose={onClose}
        onApply={onApply}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
      />
    )

    await user.click(screen.getByText('protein phosphorylation'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onApply).not.toHaveBeenCalled()
  })

  it('shows loading state when isLoading is true', () => {
    lookupSpy.queryFn.mockReturnValue({ data: [], isLoading: true })
    renderModal(
      <SearchAnnotations
        open
        onClose={() => {}}
        onApply={() => {}}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
      />
    )
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows empty state when no annotations are returned', () => {
    lookupSpy.queryFn.mockReturnValue({ data: [], isLoading: false })
    renderModal(
      <SearchAnnotations
        open
        onClose={() => {}}
        onApply={() => {}}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
      />
    )
    expect(screen.getByText('No terms found')).toBeInTheDocument()
  })
})

// ── Preselect the currently-edited term (#255) ──────────────────────

describe('SearchAnnotations — preselect current term', () => {
  it('highlights the annotation matching preselectTermId by default (Done enabled, its evidence shown)', async () => {
    renderModal(
      <SearchAnnotations
        open
        onClose={() => {}}
        onApply={() => {}}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
        preselectTermId="GO:0006468"
      />
    )
    // The matching term's evidence appears in the right panel => it is selected.
    expect(await screen.findByText('PMID:111')).toBeInTheDocument()
    expect(screen.queryByText('Please select a term to view evidence')).toBeNull()
    // With a term auto-selected, Done is enabled without any click.
    expect(screen.getByRole('button', { name: 'Done' })).not.toBeDisabled()
  })

  it('applies the preselected term without a manual click, with no auto-selected evidence', async () => {
    const onApply = vi.fn()
    const user = userEvent.setup()
    renderModal(
      <SearchAnnotations
        open
        onClose={() => {}}
        onApply={onApply}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
        preselectTermId="GO:0006468"
      />
    )
    await screen.findByText('PMID:111') // wait for the preselect effect to settle
    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply.mock.calls[0][0].term).toEqual({
      id: 'GO:0006468',
      label: 'protein phosphorylation',
    })
    // Only the term is highlighted by default — evidence stays unchecked.
    expect(onApply.mock.calls[0][0].evidences).toEqual([])
  })

  it('does not preselect when preselectTermId matches no returned annotation', () => {
    renderModal(
      <SearchAnnotations
        open
        onClose={() => {}}
        onApply={() => {}}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
        preselectTermId="GO:9999999"
      />
    )
    expect(screen.getByText('Please select a term to view evidence')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
  })

  it('does not preselect anything when preselectTermId is omitted', () => {
    renderModal(
      <SearchAnnotations
        open
        onClose={() => {}}
        onApply={() => {}}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
      />
    )
    expect(screen.getByText('Please select a term to view evidence')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
  })

  it('lets a manual pick replace the preselected term', async () => {
    const user = userEvent.setup()
    renderModal(
      <SearchAnnotations
        open
        onClose={() => {}}
        onApply={() => {}}
        gpId="UniProtKB:P12345"
        aspect={'F' as never}
        preselectTermId="GO:0006468"
      />
    )
    await screen.findByText('PMID:111') // GO:0006468 preselected
    await user.click(screen.getByText('other process')) // switch to the term with no evidence
    expect(screen.getByText('No evidence available for this term')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).not.toBeDisabled()
  })
})
