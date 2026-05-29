import { describe, it, expect, vi } from 'vitest'
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
} from '@/features/gocam/models/formModels'

// EntityRow uses TermAutocomplete + DatabaseField for inputs — stub them out so we
// can render in jsdom without their portal/lookup machinery.
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

// Note: in jsdom, Mantine Menu's click-to-open is flaky (it relies on a portal +
// transition that React Testing Library doesn't reliably trigger). The
// menu-rendering rules (canAddISSEvidence, etc.) are unit-tested separately in
// `services/annotationRules.test.ts`. The tests below cover what we *can*
// reliably assert from a static render: structural shape and the term-column
// indent math.

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
    // Mock renders evidence Autocomplete by its uid suffix
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

  it('omits the ellipsis menu when displayMenuButton=false', () => {
    const { container } = renderRow({ displayMenuButton: false })
    // The Menu.Target wraps an ActionIcon button. With the button gone, there
    // should be no <button> at all in the row (TermAutocomplete + DatabaseField
    // are mocked to plain divs).
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })

  it('renders an ellipsis menu trigger when displayMenuButton=true', () => {
    const { container } = renderRow({ displayMenuButton: true })
    // At least one button (the menu trigger).
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0)
  })
})

// ─── tree-connector indentation ─────────────────────────────────────

describe('EntityRow — tree connector lines', () => {
  it('renders no connector at treeLevel 1', () => {
    const { container } = renderRow({ treeLevel: 1 })
    // The connector is `<div class="... w-5 shrink-0 ...">` — 0 of those at depth 1.
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

// ─── protein-complex row shows the '+' trigger ──────────────────────

describe('EntityRow — protein-complex row menu trigger', () => {
  it('renders the "+" trigger (FaPlus) for a PROTEIN_CONTAINING_COMPLEX row', () => {
    // Pass `relation: null` so the recursive-insertion filter does not strip
    // the only "has part" entry (otherwise insertMenuItems is empty and the
    // '+' button conditional renders nothing).
    const node = makeNode({
      uid: 'complex-1',
      category: RootTypes.PROTEIN_CONTAINING_COMPLEX,
      aspect: null,
    })
    const { queryByTestId } = renderRow({ node, relation: null })
    expect(queryByTestId('icon-plus')).toBeInTheDocument()
    expect(queryByTestId('icon-ellipsis')).toBeNull()
  })

  it('renders the ellipsis trigger for non-complex rows', () => {
    const node = makeNode({ uid: 'mf-row' })
    const { queryByTestId } = renderRow({ node })
    expect(queryByTestId('icon-ellipsis')).toBeInTheDocument()
    expect(queryByTestId('icon-plus')).toBeNull()
  })
})

// ─── IS NOT complement badge ────────────────────────────────────────
// Note: the badge is rendered by GroupCard (parent), not EntityRow itself.
// This block intentionally omitted; covered by ActivityForm-level tests when added.
