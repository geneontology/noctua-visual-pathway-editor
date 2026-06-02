import { describe, it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import EntityRow from '@/features/gocam/components/forms/EntityRow'
import { DisplayGroup } from '@/features/gocam/data/insertMenuConfig'
import { RootTypes, Aspect } from '@/features/gocam/models/cam'
import { Relations } from '@/@noctua.core/models/relations'
import { FormMode } from '@/features/gocam/models/formModels'
import type {
  TermNode,
  RelationNode,
  ActivityFormState,
  ActivityFormType,
} from '@/features/gocam/models/formModels'

// ── External mocks ─────────────────────────────────────────────────
//
// EntityRow uses TermAutocomplete + DatabaseField for inputs — stub them out so
// we can render in jsdom without their portal/lookup machinery.
vi.mock('@/features/search/components/Autocomplete', () => ({
  default: ({ label, name }: { label: string; name: string }) => (
    <div data-testid={`autocomplete-${name}`}>{label}</div>
  ),
}))
vi.mock('@/features/gocam/components/forms/DatabaseField', () => ({
  default: ({ type }: { type: 'reference' | 'with' }) => (
    <div data-testid={`db-${type}`}>{type}</div>
  ),
}))

// Stub the two icon components EntityRow uses so the trigger icon is
// observable in jsdom (react-icons renders bare <svg> with no identifying
// attribute by default).
vi.mock('react-icons/fa', () => ({
  FaEllipsisV: () => <span data-testid="icon-ellipsis" />,
  FaPlus: () => <span data-testid="icon-plus" />,
}))

// Mantine's Menu uses a Popover + portal + transitions that aren't reliable
// in jsdom — click-to-open often fails to render the dropdown. Mock the Menu
// subtree so all dropdown items render inline as <button role="menuitem">,
// which lets every condition assert directly on the DOM. Everything else from
// @mantine/core (MantineProvider, ActionIcon, etc.) passes through.
vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual<typeof import('@mantine/core')>('@mantine/core')

  type Child = { children?: React.ReactNode; onClick?: () => void; color?: string }

  const Item = ({ children, onClick, color }: Child) => (
    <button type="button" role="menuitem" data-color={color} onClick={onClick}>
      {children}
    </button>
  )

  const Sub = Object.assign(({ children }: Child) => <div>{children}</div>, {
    Target: ({ children }: Child) => <>{children}</>,
    Item: ({ children, onClick }: Child) => (
      <button type="button" role="menuitem" onClick={onClick}>
        {children}
      </button>
    ),
    Dropdown: ({ children }: Child) => <div role="menu">{children}</div>,
  })

  const Menu = Object.assign(({ children }: Child) => <div>{children}</div>, {
    Target: ({ children }: Child) => <>{children}</>,
    Dropdown: ({ children }: Child) => <div role="menu">{children}</div>,
    Item,
    Sub,
  })

  return { ...actual, Menu }
})

// ── Fixtures ───────────────────────────────────────────────────────

const makeNode = (overrides: Partial<TermNode> = {}): TermNode => ({
  uid: 'node-uid',
  category: RootTypes.MOLECULAR_FUNCTION,
  label: 'Molecular Function',
  term: null,
  aspect: Aspect.MOLECULAR_FUNCTION,
  rootTypes: [RootTypes.MOLECULAR_FUNCTION],
  isComplement: false,
  canDelete: false,
  required: true,
  relations: [],
  ...overrides,
})

const makeRelation = (overrides: Partial<RelationNode> = {}): RelationNode => ({
  uid: 'rel-uid',
  predicate: { id: Relations.PART_OF, label: 'part of' },
  target: makeNode(),
  evidence: [],
  ...overrides,
})

const buildFormState = (
  overrides: Partial<ActivityFormState> = {}
): { activityForm: ActivityFormState } => ({
  activityForm: {
    activityType: 'activity',
    mode: FormMode.CREATE,
    existingActivityUid: null,
    root: null,
    isDirty: false,
    errors: [],
    ...overrides,
  },
})

const renderRow = (
  props: Partial<React.ComponentProps<typeof EntityRow>> = {},
  formState: Partial<ActivityFormState> = {}
) => {
  return renderWithProviders(
    <MantineProvider>
      <EntityRow
        node={makeNode()}
        relation={makeRelation()}
        parentTermUid="parent"
        treeLevel={1}
        displayGroup={DisplayGroup.MF}
        errors={[]}
        {...props}
      />
    </MantineProvider>,
    { preloadedState: buildFormState(formState) }
  )
}

/** Find the dropdown nearest to the menu trigger (ellipsis or +). */
const dropdown = () => {
  const menus = screen.getAllByRole('menu')
  // Mantine Menu component renders 'role=menu' on Menu.Dropdown and on
  // Menu.Sub.Dropdown — pick the first one (the outermost menu shell).
  return menus[0]
}

// ─── structural rendering ───────────────────────────────────────────

describe('EntityRow — structural render', () => {
  it('renders the term autocomplete with the node label', () => {
    const { getByTestId } = renderRow({ node: makeNode({ uid: 'mf-1' }) })
    expect(getByTestId('autocomplete-term-mf-1')).toBeInTheDocument()
  })

  it('renders an Evidence column section when relation has evidence', () => {
    const node = makeNode({ uid: 'mf-2' })
    const relation = makeRelation({
      evidence: [
        { uid: 'ev-1', evidenceCode: { id: 'ECO:1', label: 'IDA' }, reference: '', withFrom: '' },
      ],
    })
    const { getByTestId } = renderRow({ node, relation })
    expect(getByTestId('autocomplete-evidence-ev-1')).toBeInTheDocument()
    expect(getByTestId('db-reference')).toBeInTheDocument()
    expect(getByTestId('db-with')).toBeInTheDocument()
  })

  it('does not render the evidence column when node.showEvidence === false', () => {
    const node = makeNode({ uid: 'mf-3', showEvidence: false })
    const relation = makeRelation({
      evidence: [
        { uid: 'ev-1', evidenceCode: { id: 'ECO:1', label: 'IDA' }, reference: '', withFrom: '' },
      ],
    })
    const { queryByTestId } = renderRow({ node, relation })
    expect(queryByTestId('autocomplete-evidence-ev-1')).toBeNull()
  })

  it('omits the ellipsis menu (and all menu items) when displayMenuButton=false', () => {
    const { queryByTestId } = renderRow({ displayMenuButton: false })
    expect(queryByTestId('icon-ellipsis')).toBeNull()
    expect(queryByTestId('icon-plus')).toBeNull()
    expect(screen.queryByRole('menuitem')).toBeNull()
  })

  it('renders an ellipsis menu trigger when displayMenuButton=true', () => {
    renderRow({ displayMenuButton: true })
    expect(screen.getByTestId('icon-ellipsis')).toBeInTheDocument()
  })
})

// ─── tree-connector indentation ─────────────────────────────────────

describe('EntityRow — tree connector lines', () => {
  it('renders no connector at treeLevel 1', () => {
    const { container } = renderRow({ treeLevel: 1 })
    expect(container.querySelectorAll('.w-5.shrink-0')).toHaveLength(0)
  })

  it('renders treeLevel-1 connectors at deeper nesting', () => {
    const { container } = renderRow({ treeLevel: 3 })
    expect(container.querySelectorAll('.w-5.shrink-0').length).toBe(2)
  })
})

// ─── term column width / right-edge alignment ───────────────────────

describe('EntityRow — term column flex-basis (indent math)', () => {
  const basisFromContainer = (root: HTMLElement) => {
    const termCell = root.querySelector('div[style*="flex-basis"]') as HTMLElement
    return parseInt(termCell.style.flexBasis, 10)
  }

  it('reserves the full base width at treeLevel 1', () => {
    const { container } = renderRow({ treeLevel: 1 })
    expect(basisFromContainer(container)).toBeGreaterThanOrEqual(200)
  })

  it('shrinks by 20px per tree level (preserves right-edge alignment)', () => {
    const r1 = renderRow({ treeLevel: 1 }).container
    const r3 = renderRow({ treeLevel: 3 }).container
    expect(basisFromContainer(r1) - basisFromContainer(r3)).toBe(40)
  })
})

// ─── Search Annotations menu item (the regression we just had) ──────

describe('EntityRow — Search Annotations menu item', () => {
  it('is present when node has an aspect AND onSearchAnnotations is provided', () => {
    const onSearchAnnotations = vi.fn()
    renderRow({
      node: makeNode({ aspect: Aspect.MOLECULAR_FUNCTION }),
      onSearchAnnotations,
    })
    expect(
      screen.getByRole('menuitem', { name: 'Search Annotations' })
    ).toBeInTheDocument()
  })

  it('is absent when onSearchAnnotations is not provided (protein-complex / molecule form scope)', () => {
    renderRow({
      node: makeNode({ aspect: Aspect.MOLECULAR_FUNCTION }),
      onSearchAnnotations: undefined,
    })
    expect(
      screen.queryByRole('menuitem', { name: 'Search Annotations' })
    ).toBeNull()
  })

  it('is absent when the node has no aspect (e.g. GP rows)', () => {
    renderRow({
      node: makeNode({ aspect: null }),
      onSearchAnnotations: vi.fn(),
    })
    expect(
      screen.queryByRole('menuitem', { name: 'Search Annotations' })
    ).toBeNull()
  })

  it('is absent on protein-complex rows (those use the "+" menu with insert items only)', () => {
    renderRow({
      node: makeNode({ category: RootTypes.PROTEIN_CONTAINING_COMPLEX, aspect: null }),
      relation: null,
      onSearchAnnotations: vi.fn(),
    })
    expect(
      screen.queryByRole('menuitem', { name: 'Search Annotations' })
    ).toBeNull()
  })

  it('calls onSearchAnnotations(node, relation) when clicked', async () => {
    const user = userEvent.setup()
    const node = makeNode({ aspect: Aspect.BIOLOGICAL_PROCESS })
    const relation = makeRelation()
    const onSearchAnnotations = vi.fn()
    renderRow({ node, relation, onSearchAnnotations })

    await user.click(screen.getByRole('menuitem', { name: 'Search Annotations' }))
    expect(onSearchAnnotations).toHaveBeenCalledTimes(1)
    expect(onSearchAnnotations).toHaveBeenCalledWith(node, relation)
  })
})

// ─── Non-complex (ellipsis) menu contents ───────────────────────────

describe('EntityRow — non-complex ellipsis menu contents', () => {
  it('shows the trigger as an ellipsis (not a +)', () => {
    renderRow()
    expect(screen.getByTestId('icon-ellipsis')).toBeInTheDocument()
    expect(screen.queryByTestId('icon-plus')).toBeNull()
  })

  it('shows "Add Context" submenu header when insertMenuItems exist', () => {
    // MF root w/ no used relations → has insertable items (happens during, has input, etc.)
    renderRow({
      node: makeNode({ category: RootTypes.MOLECULAR_FUNCTION, relations: [] }),
      relation: null,
    })
    expect(screen.getByRole('menuitem', { name: 'Add Context' })).toBeInTheDocument()
  })

  it('omits "Add Context" when there are no insertable items for the row', () => {
    // BIOLOGICAL_PHASE has no insert entry in canInsertEntity, so insertMenuItems is empty
    renderRow({
      node: makeNode({
        category: RootTypes.BIOLOGICAL_PHASE,
        aspect: null,
        rootTypes: [RootTypes.BIOLOGICAL_PHASE],
        relations: [],
      }),
      relation: null,
    })
    expect(screen.queryByRole('menuitem', { name: 'Add Context' })).toBeNull()
  })

  it('shows the "Evidence" submenu when a relation is present', () => {
    renderRow({ relation: makeRelation() })
    expect(screen.getByRole('menuitem', { name: 'Evidence' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Add Evidence' })).toBeInTheDocument()
  })

  it('omits the "Evidence" submenu when relation is null', () => {
    renderRow({ relation: null })
    expect(screen.queryByRole('menuitem', { name: 'Evidence' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Add Evidence' })).toBeNull()
  })

  it('shows "Add ISS / ISO / IC Evidence" when the row supports ISS (aspect set, not a molecule form)', () => {
    // Default form state already has activityType: 'activity', node has aspect.
    renderRow()
    expect(screen.getByRole('menuitem', { name: 'Add ISS Evidence' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Add ISO Evidence' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Add IC Evidence' })).toBeInTheDocument()
  })

  it('omits "Add ISS / ISO / IC Evidence" when the active form is a molecule form', () => {
    renderRow({}, { activityType: 'molecule' as ActivityFormType })
    expect(screen.queryByRole('menuitem', { name: 'Add ISS Evidence' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Add ISO Evidence' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Add IC Evidence' })).toBeNull()
  })

  it('omits "Add ISS / ISO / IC Evidence" when the node has no aspect (GP rows)', () => {
    renderRow({ node: makeNode({ aspect: null }) })
    expect(screen.queryByRole('menuitem', { name: 'Add ISS Evidence' })).toBeNull()
  })

  it('shows "Remove Evidence" when evidence is present, omits it otherwise', () => {
    const withEvidence = makeRelation({
      evidence: [
        { uid: 'ev-1', evidenceCode: { id: 'ECO:1', label: 'IDA' }, reference: '', withFrom: '' },
      ],
    })
    renderRow({ relation: withEvidence })
    expect(screen.getByRole('menuitem', { name: 'Remove Evidence' })).toBeInTheDocument()
  })

  it('omits "Remove Evidence" when the relation has no evidence rows', () => {
    renderRow({ relation: makeRelation({ evidence: [] }) })
    expect(screen.queryByRole('menuitem', { name: 'Remove Evidence' })).toBeNull()
  })

  it('shows "Clone Evidence" only when onCloneEvidence callback is provided', () => {
    renderRow({ onCloneEvidence: vi.fn() })
    expect(screen.getByRole('menuitem', { name: 'Clone Evidence' })).toBeInTheDocument()

    // re-render without the callback
    screen.unmount?.()
  })

  it('omits "Clone Evidence" when no onCloneEvidence callback', () => {
    renderRow({ onCloneEvidence: undefined })
    expect(screen.queryByRole('menuitem', { name: 'Clone Evidence' })).toBeNull()
  })

  it('shows "Fill with root term" when canAddISS and a relation are present', () => {
    renderRow()
    expect(
      screen.getByRole('menuitem', { name: 'Fill with root term' })
    ).toBeInTheDocument()
  })

  it('omits "Fill with root term" on molecule forms (canAddISS is false)', () => {
    renderRow({}, { activityType: 'molecule' as ActivityFormType })
    expect(
      screen.queryByRole('menuitem', { name: 'Fill with root term' })
    ).toBeNull()
  })

  it('shows the red "Remove" item only when canDelete && parentTermUid', () => {
    renderRow({
      node: makeNode({ canDelete: true }),
      parentTermUid: 'parent',
    })
    const remove = screen.getByRole('menuitem', { name: 'Remove' })
    expect(remove).toBeInTheDocument()
    expect(remove).toHaveAttribute('data-color', 'red')
  })

  it('omits "Remove" when node.canDelete is false', () => {
    renderRow({ node: makeNode({ canDelete: false }) })
    expect(screen.queryByRole('menuitem', { name: 'Remove' })).toBeNull()
  })

  it('omits "Remove" when parentTermUid is null (root rows are not removable)', () => {
    renderRow({ node: makeNode({ canDelete: true }), parentTermUid: null })
    expect(screen.queryByRole('menuitem', { name: 'Remove' })).toBeNull()
  })

  it('does NOT show the legacy "Clear Values" item (removed per review notes)', () => {
    renderRow()
    expect(screen.queryByRole('menuitem', { name: /Clear Values/i })).toBeNull()
  })
})

// ─── Protein-complex (+) menu contents ──────────────────────────────

describe('EntityRow — protein-complex (+) menu contents', () => {
  const complexNode = makeNode({
    uid: 'complex-1',
    category: RootTypes.PROTEIN_CONTAINING_COMPLEX,
    aspect: null,
    rootTypes: [RootTypes.PROTEIN_CONTAINING_COMPLEX],
  })

  it('renders the "+" trigger instead of the ellipsis', () => {
    renderRow({ node: complexNode, relation: null })
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument()
    expect(screen.queryByTestId('icon-ellipsis')).toBeNull()
  })

  it('shows the flat "has part" insert as a single menuitem (no Add Context wrapper)', () => {
    renderRow({ node: complexNode, relation: null })
    // The dropdown should contain "has part" (the only entry in
    // canInsertEntity[PROTEIN_CONTAINING_COMPLEX]) as a direct menuitem.
    const menu = dropdown()
    expect(within(menu).getByText('has part')).toBeInTheDocument()
    // It should NOT be nested under an "Add Context" submenu header.
    expect(within(menu).queryByText('Add Context')).toBeNull()
  })

  it('omits Search Annotations even when onSearchAnnotations would otherwise be passed', () => {
    renderRow({
      node: complexNode,
      relation: null,
      onSearchAnnotations: vi.fn(),
    })
    expect(
      screen.queryByRole('menuitem', { name: 'Search Annotations' })
    ).toBeNull()
  })

  it('omits the Evidence submenu (Add Evidence / Add ISS / Remove Evidence / Clone Evidence)', () => {
    renderRow({
      node: complexNode,
      relation: makeRelation({
        evidence: [
          { uid: 'ev-x', evidenceCode: { id: 'ECO:1', label: 'IDA' }, reference: '', withFrom: '' },
        ],
      }),
      onCloneEvidence: vi.fn(),
    })
    expect(screen.queryByRole('menuitem', { name: 'Evidence' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Add Evidence' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Add ISS Evidence' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Remove Evidence' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Clone Evidence' })).toBeNull()
  })

  it('omits "Fill with root term" and "Remove"', () => {
    renderRow({
      node: { ...complexNode, canDelete: true },
      relation: null,
      parentTermUid: 'parent',
    })
    expect(screen.queryByRole('menuitem', { name: 'Fill with root term' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Remove' })).toBeNull()
  })

  it('omits the legacy "Clear Values" item', () => {
    renderRow({ node: complexNode, relation: null })
    expect(screen.queryByRole('menuitem', { name: /Clear Values/i })).toBeNull()
  })
})
