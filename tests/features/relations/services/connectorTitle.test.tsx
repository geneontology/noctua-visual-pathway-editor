import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  CONNECTOR_TITLE_LABEL_MAX,
  formatConnectorDialogTitle,
  renderConnectorDialogTitle,
} from '@/features/relations/services/connectorTitle'
import { ActivityType, type Activity, type GraphNode } from '@/features/gocam/models/cam'

const makeNode = (id: string, label: string): GraphNode => ({
  uid: `uid_${id}`,
  id,
  label,
  rootTypes: [],
  isComplement: false,
  contributors: [],
  groups: [],
  sources: [],
})

const makeActivity = (
  uid: string,
  rootNode: GraphNode,
  enabledBy: GraphNode | null = null
): Activity => ({
  uid,
  type: ActivityType.ACTIVITY,
  rootNode,
  molecularFunction: null,
  enabledBy,
  date: null,
  nodes: [rootNode],
  edges: [],
  hasViolations: false,
  violations: [],
})

describe('formatConnectorDialogTitle', () => {
  it('uses the molecular-function (rootNode) label and the create prefix, ignoring enabledBy', () => {
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', 'BTK Hsap'))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'air-2 Cele'))
    expect(formatConnectorDialogTitle(src, tgt, false)).toBe(
      'Causal Relation Form: Connect Src MF to Tgt MF'
    )
  })

  it('switches the prefix to "Edit Causal Relation" when editing', () => {
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', 'BTK Hsap'))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'air-2 Cele'))
    expect(formatConnectorDialogTitle(src, tgt, true)).toBe(
      'Edit Causal Relation: Connect Src MF to Tgt MF'
    )
  })

  it('uses the rootNode label for molecule activities too (MF → Molecule)', () => {
    const src = makeActivity('s', makeNode('GO:s', 'kinase activity'), null)
    const tgt = makeActivity('t', makeNode('CHEBI:t', 'ATP'), null)
    expect(formatConnectorDialogTitle(src, tgt, false)).toBe(
      'Causal Relation Form: Connect kinase activity to ATP'
    )
  })

  it('falls back to "Unknown" when the rootNode has no label', () => {
    const noLabel = { ...makeNode('GO:x', ''), label: undefined } as unknown as GraphNode
    const src = makeActivity('s', noLabel, null)
    const tgt = makeActivity('t', noLabel, null)
    expect(formatConnectorDialogTitle(src, tgt, false)).toBe(
      'Causal Relation Form: Connect Unknown to Unknown'
    )
  })

  it('returns the bare prefix when either activity is null (dialog closed/transition)', () => {
    expect(formatConnectorDialogTitle(null, null, false)).toBe('Causal Relation Form')
    expect(formatConnectorDialogTitle(null, null, true)).toBe('Edit Causal Relation')
  })

  it('truncates labels longer than CONNECTOR_TITLE_LABEL_MAX with " ..." suffix', () => {
    const longLabel = 'A'.repeat(80)
    const src = makeActivity('s', makeNode('GO:s', longLabel), null)
    const tgt = makeActivity('t', makeNode('GO:t', 'short'), null)
    const title = formatConnectorDialogTitle(src, tgt, false)

    const truncated = `${'A'.repeat(CONNECTOR_TITLE_LABEL_MAX)} ...`
    expect(title).toBe(`Causal Relation Form: Connect ${truncated} to short`)
  })

  it('trims a trailing space before appending " ..." so we never get "  ..."', () => {
    // Label whose 30th char (index 29) is a space → naive slice would produce
    // "positive regulation of kinase  ..." (double space). trimEnd avoids that.
    const label = 'positive regulation of kinase activity cascade'
    const src = makeActivity('s', makeNode('GO:s', label), null)
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), null)
    expect(formatConnectorDialogTitle(src, tgt, false)).toBe(
      'Causal Relation Form: Connect positive regulation of kinase ... to Tgt MF'
    )
  })

  it('leaves labels of exactly CONNECTOR_TITLE_LABEL_MAX characters untouched', () => {
    const exact = 'B'.repeat(CONNECTOR_TITLE_LABEL_MAX)
    const src = makeActivity('s', makeNode('GO:s', exact), null)
    const tgt = makeActivity('t', makeNode('GO:t', 'short'), null)
    expect(formatConnectorDialogTitle(src, tgt, false)).toBe(
      `Causal Relation Form: Connect ${exact} to short`
    )
  })
})

describe('renderConnectorDialogTitle (JSX)', () => {
  it('returns the bare prefix when either activity is null', () => {
    expect(renderConnectorDialogTitle(null, null, false)).toBe('Causal Relation Form')
    expect(renderConnectorDialogTitle(null, null, true)).toBe('Edit Causal Relation')
  })

  it('renders source and target MF labels as boxes joined by an arrow, ignoring enabledBy', () => {
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', 'BTK Hsap'))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'air-2 Cele'))
    const { container, getByText, queryByText } = render(
      <>{renderConnectorDialogTitle(src, tgt, false)}</>
    )

    expect(getByText('Connect')).toBeInTheDocument()
    expect(getByText('Src MF')).toBeInTheDocument()
    expect(getByText('Tgt MF')).toBeInTheDocument()
    // Gene-product labels are never shown.
    expect(queryByText('BTK Hsap')).toBeNull()
    expect(queryByText('air-2 Cele')).toBeNull()
    // An arrow (svg) sits between the two boxes.
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders the same source → target boxes when editing (no sentence prefix in the graph)', () => {
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), null)
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), null)
    const { getByText, queryByText } = render(<>{renderConnectorDialogTitle(src, tgt, true)}</>)
    expect(getByText('Src MF')).toBeInTheDocument()
    expect(getByText('Tgt MF')).toBeInTheDocument()
    expect(queryByText(/Causal Relation/)).toBeNull()
  })

  it('keeps the full MF label (CSS truncates, no " ..." in the string) and exposes it on hover', () => {
    const long = 'A'.repeat(80)
    const src = makeActivity('s', makeNode('GO:s', long), null)
    const tgt = makeActivity('t', makeNode('GO:t', 'short'), null)
    const { getByText, getByTitle } = render(<>{renderConnectorDialogTitle(src, tgt, false)}</>)
    // Full text is rendered; truncation is visual (CSS), so the string is intact.
    expect(getByText(long)).toBeInTheDocument()
    expect(getByTitle(long)).toBeInTheDocument()
  })
})
