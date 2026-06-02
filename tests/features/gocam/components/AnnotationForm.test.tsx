import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import type * as MantineCore from '@mantine/core'
import type { ReactElement, ReactNode } from 'react'
import { renderWithProviders } from '@tests/test-utils'
import AnnotationForm from '@/features/gocam/components/forms/AnnotationForm'
import { RootTypes } from '@/features/gocam/models/cam'
import type { EvidenceForm } from '@/features/gocam/models/formModels'

// ── Child mocks ─────────────────────────────────────────────────────
//
// AnnotationForm pulls in TermAutocomplete (RTK Query lookup), DatabaseField
// (Mantine popover + portals), and the locally-rendered SearchAnnotations
// picker (also RTK Query). They are not what we are testing here, so we
// stub them with minimal stand-ins that surface their state to assertions
// and expose a way to simulate user actions.

// Captures the props the picker last received so picker integration tests
// can inspect them and invoke onApply / onClose without rendering the real
// picker modal.
const pickerSpy = vi.hoisted(() => ({
  lastProps: null as null | {
    open: boolean
    gpId: string
    aspect?: string
    onApply: (sel: {
      term: { id: string; label: string }
      evidences: Array<{ evidenceCode: { id: string; label: string }; reference?: string; with?: string }>
    }) => void
    onClose: () => void
  },
}))

vi.mock('@/features/gocam/components/forms/SearchAnnotations', () => ({
  default: (props: NonNullable<typeof pickerSpy.lastProps>) => {
    pickerSpy.lastProps = props
    return props.open ? <div data-testid="search-annotations-open" /> : null
  },
}))

vi.mock('@/features/search/components/Autocomplete', () => ({
  default: ({
    label,
    name,
    value,
    onChange,
  }: {
    label: string
    name: string
    value: { id: string; label: string } | null | string
    onChange: (v: { id: string; label: string }) => void
  }) => {
    const id = typeof value === 'object' && value ? value.id : ''
    const labelText = typeof value === 'object' && value ? value.label : ''
    return (
      <div data-testid={`autocomplete-${name}`}>
        <span data-testid={`autocomplete-label-${name}`}>{label}</span>
        <span data-testid={`autocomplete-value-${name}`}>{id}</span>
        <span data-testid={`autocomplete-value-label-${name}`}>{labelText}</span>
        <button
          type="button"
          onClick={() => onChange({ id: 'ECO:test', label: 'test pick' })}
          data-testid={`autocomplete-pick-${name}`}
        >
          pick
        </button>
      </div>
    )
  },
}))

vi.mock('@/features/gocam/components/forms/DatabaseField', () => ({
  default: ({
    type,
    value,
    onChange,
  }: {
    type: 'reference' | 'with'
    value: string
    onChange: (v: string) => void
  }) => (
    <label>
      {type === 'reference' ? 'Reference' : 'With/From'}
      <input
        aria-label={type === 'reference' ? 'Reference' : 'With/From'}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  ),
}))

// Mantine's Menu uses a Popover + portal + transitions that aren't reliable in
// jsdom (click-to-open often fails to render the dropdown). Mock the Menu subtree
// so each row's items render inline as <button role="menuitem">. Everything else
// from @mantine/core (MantineProvider, Modal, Button, ActionIcon, …) passes
// through, so the real ConfirmDialog modal still renders.
vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual<typeof MantineCore>('@mantine/core')

  type Child = { children?: ReactNode; onClick?: () => void; color?: string; disabled?: boolean }

  const Item = ({ children, onClick, color, disabled }: Child) => (
    <button type="button" role="menuitem" data-color={color} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )

  const Menu = Object.assign(({ children }: Child) => <div>{children}</div>, {
    Target: ({ children }: Child) => <>{children}</>,
    Dropdown: ({ children }: Child) => <div role="menu">{children}</div>,
    Item,
  })

  return { ...actual, Menu }
})

// ── Helpers ─────────────────────────────────────────────────────────

const renderForm = (ui: ReactElement) =>
  renderWithProviders(<MantineProvider>{ui}</MantineProvider>)

/** Find the Evidence section by its header. */
const evidenceSection = () => {
  const header = screen
    .getAllByText('Evidence')
    .find(el => el.tagName === 'DIV') as HTMLElement | undefined
  if (!header) throw new Error('Evidence section header not found')
  return header.closest('section') as HTMLElement
}

const evidenceReferenceInputs = () =>
  within(evidenceSection()).getAllByLabelText('Reference') as HTMLInputElement[]

const evidenceCount = () => evidenceReferenceInputs().length

/** Evidence-code id text for each row, in DOM (row) order. */
const evidenceCodeValues = () =>
  within(evidenceSection())
    .getAllByTestId(/^autocomplete-value-annotation-evidence-/)
    .map(el => el.textContent)

/** Per-row ⋮ menu items (one per row, in row order) matching the given name. */
const menuItems = (name: string | RegExp) =>
  within(evidenceSection()).getAllByRole('menuitem', { name })

const queryMenuItems = (name: string | RegExp) =>
  within(evidenceSection()).queryAllByRole('menuitem', { name })

beforeEach(() => {
  pickerSpy.lastProps = null
})

// ── Tests ───────────────────────────────────────────────────────────

describe('AnnotationForm — initial render', () => {
  it('seeds one empty evidence row when initialEvidences is empty', () => {
    renderForm(<AnnotationForm showTerm={false} />)
    expect(evidenceCount()).toBe(1)
    expect(evidenceReferenceInputs()[0].value).toBe('')
  })

  it('uses provided initialEvidences', () => {
    const initial: EvidenceForm[] = [
      { uid: 'a', evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:1', withFrom: '' },
      { uid: 'b', evidenceCode: { id: 'ECO:0000250', label: 'ISS' }, reference: 'GO_REF:0000024', withFrom: '' },
    ]
    renderForm(<AnnotationForm showTerm={false} initialEvidences={initial} />)
    expect(evidenceCount()).toBe(2)
    const refs = evidenceReferenceInputs().map(i => i.value)
    expect(refs).toEqual(['PMID:1', 'GO_REF:0000024'])
  })

  it('hides the Term section when showTerm is false', () => {
    renderForm(<AnnotationForm showTerm={false} />)
    expect(screen.queryByText('Term')).toBeNull()
    expect(screen.queryByText('Fill with root term')).toBeNull()
  })

  it('renders the Term section with the Fill with root term button when showTerm + rootTypes + aspect', () => {
    renderForm(
      <AnnotationForm
        showTerm
        termRootTypes={[RootTypes.BIOLOGICAL_PROCESS]}
        aspect={'biological_process' as never}
      />
    )
    // "Term" appears twice — once as the section header, once as the Autocomplete label
    expect(screen.getAllByText('Term').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('autocomplete-annotation-term')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fill with root term' })).toBeInTheDocument()
    // No header "Add ISS" button anymore — ISS lives in the per-row evidence menu
    expect(screen.queryByRole('button', { name: 'Add ISS' })).toBeNull()
  })

  it('omits "Fill with root term" when termRootTypes is empty', () => {
    renderForm(<AnnotationForm showTerm />)
    expect(screen.queryByRole('button', { name: 'Fill with root term' })).toBeNull()
  })

  it('omits "Search Annotations" when gpId or aspect are missing', () => {
    renderForm(<AnnotationForm showTerm termRootTypes={[RootTypes.BIOLOGICAL_PROCESS]} />)
    expect(screen.queryByRole('button', { name: 'Search Annotations' })).toBeNull()
  })
})

describe('AnnotationForm — evidence row menu', () => {
  it('exposes ISS / ISO / IC / Clear Values / Delete in the row menu when canAddISS is true', () => {
    renderForm(<AnnotationForm showTerm={false} aspect={'biological_process' as never} />)
    // "Add evidence" is no longer in the row menu — it's the bottom button
    expect(queryMenuItems('Add evidence')).toHaveLength(0)
    expect(menuItems('ISS').length).toBeGreaterThanOrEqual(1)
    expect(menuItems('ISO').length).toBeGreaterThanOrEqual(1)
    expect(menuItems('IC').length).toBeGreaterThanOrEqual(1)
    expect(menuItems('Clear Values').length).toBeGreaterThanOrEqual(1)
    expect(menuItems('Delete').length).toBeGreaterThanOrEqual(1)
  })

  it('the bottom "Add another evidence" button appends a fresh empty row', async () => {
    const user = userEvent.setup()
    renderForm(<AnnotationForm showTerm={false} />)
    expect(evidenceCount()).toBe(1)
    // One row already seeded → the button reads "Add another evidence", not "Add evidence"
    expect(screen.queryByRole('button', { name: 'Add evidence' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Add another evidence' }))

    expect(evidenceCount()).toBe(2)
    expect(evidenceReferenceInputs()[1].value).toBe('')
  })

  it('"ISS" replaces the current row with ECO:0000250 + GO_REF:0000024 (no new row)', async () => {
    const user = userEvent.setup()
    renderForm(<AnnotationForm showTerm={false} aspect={'biological_process' as never} />)
    expect(evidenceCount()).toBe(1)

    await user.click(menuItems('ISS')[0])

    expect(evidenceCount()).toBe(1)
    expect(evidenceReferenceInputs()[0].value).toBe('GO_REF:0000024')
    expect(evidenceCodeValues()[0]).toBe('ECO:0000250')
  })

  it('"ISO" replaces the current row (ECO:0000266 + GO_REF:0000024)', async () => {
    const user = userEvent.setup()
    renderForm(<AnnotationForm showTerm={false} aspect={'biological_process' as never} />)

    await user.click(menuItems('ISO')[0])

    expect(evidenceCount()).toBe(1)
    expect(evidenceReferenceInputs()[0].value).toBe('GO_REF:0000024')
    expect(evidenceCodeValues()[0]).toBe('ECO:0000266')
  })

  it('"IC" replaces the current row (ECO:0000305 + GO_REF:0000036)', async () => {
    const user = userEvent.setup()
    renderForm(<AnnotationForm showTerm={false} aspect={'biological_process' as never} />)

    await user.click(menuItems('IC')[0])

    expect(evidenceCount()).toBe(1)
    expect(evidenceReferenceInputs()[0].value).toBe('GO_REF:0000036')
    expect(evidenceCodeValues()[0]).toBe('ECO:0000305')
  })

  it('replaces only the targeted row, leaving sibling rows untouched', async () => {
    const user = userEvent.setup()
    const initial: EvidenceForm[] = [
      { uid: 'a', evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:1', withFrom: '' },
      { uid: 'b', evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:2', withFrom: '' },
    ]
    renderForm(
      <AnnotationForm
        showTerm={false}
        initialEvidences={initial}
        aspect={'biological_process' as never}
      />
    )
    expect(evidenceCount()).toBe(2)

    await user.click(menuItems('ISS')[1])

    expect(evidenceCount()).toBe(2)
    // row 0 untouched
    expect(evidenceReferenceInputs()[0].value).toBe('PMID:1')
    expect(evidenceCodeValues()[0]).toBe('ECO:0000314')
    // row 1 replaced with ISS
    expect(evidenceReferenceInputs()[1].value).toBe('GO_REF:0000024')
    expect(evidenceCodeValues()[1]).toBe('ECO:0000250')
  })

  it('"Clear Values" empties the current row', async () => {
    const user = userEvent.setup()
    const initial: EvidenceForm[] = [
      {
        uid: 'a',
        evidenceCode: { id: 'ECO:0000250', label: 'ISS' },
        reference: 'GO_REF:0000024',
        withFrom: 'UniProtKB:P1',
      },
    ]
    renderForm(<AnnotationForm showTerm={false} initialEvidences={initial} />)
    expect(evidenceReferenceInputs()[0].value).toBe('GO_REF:0000024')

    await user.click(menuItems('Clear Values')[0])

    expect(evidenceCount()).toBe(1)
    expect(evidenceReferenceInputs()[0].value).toBe('')
    expect(evidenceCodeValues()[0]).toBe('')
  })

  it('omits ISS/ISO/IC menu items when aspect is missing (canAddISS=false)', () => {
    renderForm(<AnnotationForm showTerm={false} />)
    expect(queryMenuItems('ISS')).toHaveLength(0)
    expect(queryMenuItems('ISO')).toHaveLength(0)
    expect(queryMenuItems('IC')).toHaveLength(0)
    // The non-ISS actions remain available
    expect(screen.getByRole('button', { name: 'Add another evidence' })).toBeInTheDocument()
    expect(menuItems('Clear Values').length).toBeGreaterThanOrEqual(1)
    expect(menuItems('Delete').length).toBeGreaterThanOrEqual(1)
  })
})

describe('AnnotationForm — term section buttons', () => {
  it('"Fill with root term" sets the root term and ND evidence (GO_REF:0000015)', async () => {
    const user = userEvent.setup()
    renderForm(
      <AnnotationForm
        showTerm
        termRootTypes={[RootTypes.BIOLOGICAL_PROCESS]}
        initialEvidences={[
          { uid: 'a', evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:1', withFrom: '' },
          { uid: 'b', evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:2', withFrom: '' },
        ]}
        aspect={'biological_process' as never}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Fill with root term' }))

    expect(screen.getByTestId('autocomplete-value-annotation-term').textContent).toBe(
      RootTypes.BIOLOGICAL_PROCESS
    )
    expect(screen.getByTestId('autocomplete-value-label-annotation-term').textContent).toBe(
      'biological_process'
    )
    expect(evidenceCount()).toBe(1)
    expect(evidenceReferenceInputs()[0].value).toBe('GO_REF:0000015')
    const evValue = screen.getByTestId(/^autocomplete-value-annotation-evidence-/)
    expect(evValue.textContent).toBe('ECO:0000307')
  })
})

describe('AnnotationForm — remove evidence (Delete menu item)', () => {
  it('Delete is disabled on the only row, enabled with more, and removes an empty row immediately', async () => {
    const user = userEvent.setup()
    renderForm(<AnnotationForm showTerm={false} />)
    expect(evidenceCount()).toBe(1)
    expect(menuItems('Delete')[0]).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Add another evidence' }))
    expect(evidenceCount()).toBe(2)
    const deletes = menuItems('Delete')
    expect(deletes[0]).not.toBeDisabled()

    // Empty row → removed immediately, no confirmation
    await user.click(deletes[0])
    expect(evidenceCount()).toBe(1)
  })

  it('Delete on a row with content asks for confirmation before removing', async () => {
    const user = userEvent.setup()
    const initial: EvidenceForm[] = [
      { uid: 'a', evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:1', withFrom: '' },
      { uid: 'b', evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:2', withFrom: '' },
    ]
    renderForm(<AnnotationForm showTerm={false} initialEvidences={initial} />)
    expect(evidenceCount()).toBe(2)

    await user.click(menuItems('Delete')[0])
    // Not removed yet — confirmation pending
    expect(evidenceCount()).toBe(2)
    expect(await screen.findByText('Remove Evidence')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Remove' }))
    expect(evidenceCount()).toBe(1)
    // row 0 (PMID:1) removed, row 1 (PMID:2) remains
    expect(evidenceReferenceInputs()[0].value).toBe('PMID:2')
  })
})

describe('AnnotationForm — Save / Cancel', () => {
  it('Save is disabled until a term is selected when showTerm is true', () => {
    renderForm(<AnnotationForm showTerm termRootTypes={[RootTypes.BIOLOGICAL_PROCESS]} />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('Save is enabled immediately when showTerm is false', () => {
    renderForm(<AnnotationForm showTerm={false} />)
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
  })

  it('Save invokes the onSubmit prop with filtered evidences and closes the dialog', async () => {
    const onSubmit = vi.fn()

    const initial: EvidenceForm[] = [
      // a fully-populated row
      { uid: 'a', evidenceCode: { id: 'ECO:0000250', label: 'ISS' }, reference: 'GO_REF:0000024', withFrom: '' },
      // a completely empty row — must be filtered out by handleSave
      { uid: 'empty', evidenceCode: { id: '', label: '' }, reference: '', withFrom: '' },
    ]

    const user = userEvent.setup()
    const { store } = renderForm(
      <AnnotationForm showTerm={false} initialEvidences={initial} onSubmit={onSubmit} />
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const arg = onSubmit.mock.calls[0][0]
    expect(arg.term).toBeNull()
    expect(arg.evidences).toHaveLength(1)
    expect(arg.evidences[0].evidenceCode.id).toBe('ECO:0000250')
    expect(arg.evidences[0].reference).toBe('GO_REF:0000024')

    // closeDialog dispatched → dialog.open is false
    expect(store.getState().dialog.open).toBe(false)
  })

  it('Save is a no-op when no onSubmit prop is provided (still closes the dialog)', async () => {
    const user = userEvent.setup()
    const { store } = renderForm(<AnnotationForm showTerm={false} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(store.getState().dialog.open).toBe(false)
  })

  it('Cancel dispatches closeDialog', async () => {
    const user = userEvent.setup()
    const { store } = renderForm(<AnnotationForm showTerm={false} />)
    // Seed: open the dialog so we can prove Cancel closes it
    store.dispatch({
      type: 'dialog/openDialog',
      payload: { component: 'AnnotationForm' },
    })
    expect(store.getState().dialog.open).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(store.getState().dialog.open).toBe(false)
  })
})

describe('AnnotationForm — Search Annotations picker integration', () => {
  it('renders Search Annotations button when both gpId and aspect are provided', () => {
    renderForm(
      <AnnotationForm
        showTerm
        gpId="UniProtKB:P12345"
        aspect={'biological_process' as never}
      />
    )
    expect(screen.getByRole('button', { name: 'Search Annotations' })).toBeInTheDocument()
  })

  it('opens the picker locally (does not dispatch openDialog) when clicked', async () => {
    const user = userEvent.setup()
    const { store } = renderForm(
      <AnnotationForm
        showTerm
        gpId="UniProtKB:P12345"
        aspect={'biological_process' as never}
      />
    )
    expect(pickerSpy.lastProps?.open).toBe(false)
    expect(store.getState().dialog.open).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Search Annotations' }))

    expect(pickerSpy.lastProps?.open).toBe(true)
    expect(pickerSpy.lastProps?.gpId).toBe('UniProtKB:P12345')
    // The form stays mounted underneath — global dialog state is unchanged
    expect(store.getState().dialog.open).toBe(false)
    // And the picker has access to its own onApply / onClose props
    expect(typeof pickerSpy.lastProps?.onApply).toBe('function')
    expect(typeof pickerSpy.lastProps?.onClose).toBe('function')
  })

  it('Cancel from the picker (onClose) preserves the form state', async () => {
    const user = userEvent.setup()
    const initial: EvidenceForm[] = [
      { uid: 'a', evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:42', withFrom: '' },
    ]
    renderForm(
      <AnnotationForm
        showTerm
        gpId="UniProtKB:P12345"
        aspect={'biological_process' as never}
        initialEvidences={initial}
      />
    )

    // Open picker
    await user.click(screen.getByRole('button', { name: 'Search Annotations' }))
    expect(pickerSpy.lastProps?.open).toBe(true)

    // Cancel from picker — should NOT clear the form's existing evidence row
    act(() => {
      pickerSpy.lastProps!.onClose()
    })

    expect(evidenceCount()).toBe(1)
    expect(evidenceReferenceInputs()[0].value).toBe('PMID:42')
  })

  it('onApply from the picker prefills term and evidences on the form', async () => {
    const user = userEvent.setup()
    renderForm(
      <AnnotationForm
        showTerm
        gpId="UniProtKB:P12345"
        aspect={'biological_process' as never}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Search Annotations' }))

    // Simulate the picker reporting back a selection
    act(() => {
      pickerSpy.lastProps!.onApply({
        term: { id: 'GO:0006468', label: 'protein phosphorylation' },
        evidences: [
          { evidenceCode: { id: 'ECO:0000314', label: 'IDA' }, reference: 'PMID:99', with: '' },
        ],
      })
    })

    // Term autocomplete now shows the picked term
    expect(screen.getByTestId('autocomplete-value-annotation-term').textContent).toBe(
      'GO:0006468'
    )
    expect(screen.getByTestId('autocomplete-value-label-annotation-term').textContent).toBe(
      'protein phosphorylation'
    )
    // Evidence row prefilled with the picked evidence
    expect(evidenceCount()).toBe(1)
    expect(evidenceReferenceInputs()[0].value).toBe('PMID:99')
  })

  it('onApply with no evidences falls back to a single empty evidence row', async () => {
    const user = userEvent.setup()
    renderForm(
      <AnnotationForm
        showTerm
        gpId="UniProtKB:P12345"
        aspect={'biological_process' as never}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Search Annotations' }))
    act(() => {
      pickerSpy.lastProps!.onApply({
        term: { id: 'GO:0000001', label: 't' },
        evidences: [],
      })
    })

    expect(evidenceCount()).toBe(1)
    expect(evidenceReferenceInputs()[0].value).toBe('')
  })
})
