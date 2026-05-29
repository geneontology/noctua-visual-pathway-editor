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
  it('uses enabledBy labels and the create prefix for new connectors', () => {
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', 'BTK Hsap'))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'air-2 Cele'))
    expect(formatConnectorDialogTitle(src, tgt, false)).toBe(
      'Causal Relation Form: Connect BTK Hsap to air-2 Cele'
    )
  })

  it('switches the prefix to "Edit Causal Relation" when editing', () => {
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', 'BTK Hsap'))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'air-2 Cele'))
    expect(formatConnectorDialogTitle(src, tgt, true)).toBe(
      'Edit Causal Relation: Connect BTK Hsap to air-2 Cele'
    )
  })

  it('falls back to the rootNode label when enabledBy is missing', () => {
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), null)
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), null)
    expect(formatConnectorDialogTitle(src, tgt, false)).toBe(
      'Causal Relation Form: Connect Src MF to Tgt MF'
    )
  })

  it('falls back to "Unknown" when neither enabledBy nor rootNode supplies a label', () => {
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
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', longLabel))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'short'))
    const title = formatConnectorDialogTitle(src, tgt, false)

    const truncated = `${'A'.repeat(CONNECTOR_TITLE_LABEL_MAX)} ...`
    expect(title).toBe(`Causal Relation Form: Connect ${truncated} to short`)
  })

  it('trims a trailing space before appending " ..." so we never get "  ..."', () => {
    // Label whose 30th char is a space → naive slice would produce
    // "BTK Hsap verys long genes nam  ..." (double space). trimEnd avoids that.
    const label = 'BTK Hsap verys long genes nam more text'
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', label))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'air-2 Cele'))
    expect(formatConnectorDialogTitle(src, tgt, false)).toBe(
      'Causal Relation Form: Connect BTK Hsap verys long genes nam ... to air-2 Cele'
    )
  })

  it('leaves labels of exactly CONNECTOR_TITLE_LABEL_MAX characters untouched', () => {
    const exact = 'B'.repeat(CONNECTOR_TITLE_LABEL_MAX)
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', exact))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'short'))
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

  it('produces the same text as the string variant and accents only the gene labels', () => {
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', 'BTK Hsap'))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'air-2 Cele'))
    const { container, getByText } = render(
      <>{renderConnectorDialogTitle(src, tgt, false)}</>
    )

    // Surrounding text inherits the dialog-header styling; only the gene
    // labels live inside their own accent spans.
    expect(container.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Causal Relation Form: Connect BTK Hsap to air-2 Cele'
    )

    const source = getByText('BTK Hsap')
    const target = getByText('air-2 Cele')
    expect(source.className).toMatch(/italic/)
    expect(source.className).toMatch(/text-blue-700/)
    expect(target.className).toMatch(/italic/)
    expect(target.className).toMatch(/text-blue-700/)

    // The prefix is plain text (no wrapper span of its own).
    expect(container.querySelectorAll('span.italic')).toHaveLength(2)
  })

  it('switches the prefix to "Edit Causal Relation:" when editing', () => {
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', 'BTK Hsap'))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'air-2 Cele'))
    const { container } = render(<>{renderConnectorDialogTitle(src, tgt, true)}</>)
    expect(container.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Edit Causal Relation: Connect BTK Hsap to air-2 Cele'
    )
  })

  it('still truncates long labels to CONNECTOR_TITLE_LABEL_MAX + " ..."', () => {
    const long = 'A'.repeat(80)
    const src = makeActivity('s', makeNode('GO:s', 'Src MF'), makeNode('UP:s1', long))
    const tgt = makeActivity('t', makeNode('GO:t', 'Tgt MF'), makeNode('UP:t1', 'short'))
    const { getByText } = render(<>{renderConnectorDialogTitle(src, tgt, false)}</>)
    expect(getByText(`${'A'.repeat(CONNECTOR_TITLE_LABEL_MAX)} ...`)).toBeInTheDocument()
  })
})
