import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import ConnectorForm from '@/features/relations/components/ConnectorForm'
import { ActivityType, type Activity, type GraphNode } from '@/features/gocam/models/cam'

// ConnectorForm composes the (heavy) RelationForm — stub it so this test only
// covers ConnectorForm's wire-through. The stub surfaces the props it received
// so we can verify them.
const relationFormSpy = vi.hoisted(() => ({
  lastProps: null as Record<string, unknown> | null,
}))

vi.mock('@/features/relations/components/RelationForm', () => ({
  default: (props: Record<string, unknown>) => {
    relationFormSpy.lastProps = props
    return <div data-testid="relation-form-stub" />
  },
}))

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

const renderConnectorForm = (
  props: Partial<React.ComponentProps<typeof ConnectorForm>> = {}
) => {
  const sourceActivity =
    props.sourceActivity ??
    makeActivity(
      'src',
      makeNode('GO:src', 'Source MF'),
      makeNode('UniProtKB:S1', 'Source GP')
    )
  const targetActivity =
    props.targetActivity ??
    makeActivity(
      'tgt',
      makeNode('GO:tgt', 'Target MF'),
      makeNode('UniProtKB:T1', 'Target GP')
    )
  return renderWithProviders(
    <MantineProvider>
      <ConnectorForm
        sourceActivity={sourceActivity}
        targetActivity={targetActivity}
        onClose={() => {}}
        {...props}
      />
    </MantineProvider>
  )
}

describe('ConnectorForm — body', () => {
  it('renders the RelationForm body without an inline header', () => {
    renderConnectorForm()
    expect(screen.getByTestId('relation-form-stub')).toBeInTheDocument()
    // Header text now lives on the SimpleDialog title — not inside this component.
    expect(screen.queryByText(/Causal Relation Form:/)).toBeNull()
    expect(screen.queryByText('Subject:')).toBeNull()
    expect(screen.queryByText('Object:')).toBeNull()
  })
})

describe('ConnectorForm — RelationForm wire-through', () => {
  it('forwards source/target activities and edit props to RelationForm', () => {
    relationFormSpy.lastProps = null
    const sourceActivity = makeActivity('src', makeNode('GO:src', 'Source MF'))
    const targetActivity = makeActivity('tgt', makeNode('GO:tgt', 'Target MF'))
    const onClose = vi.fn()
    const onSaved = vi.fn()
    renderConnectorForm({
      sourceActivity,
      targetActivity,
      existingEdgeId: 'RO:0002211',
      existingSourceUid: 'src-uid',
      existingTargetUid: 'tgt-uid',
      onClose,
      onSaved,
    })

    const props = relationFormSpy.lastProps!
    expect(props.sourceActivity).toBe(sourceActivity)
    expect(props.targetActivity).toBe(targetActivity)
    expect(props.existingEdgeId).toBe('RO:0002211')
    expect(props.existingSourceUid).toBe('src-uid')
    expect(props.existingTargetUid).toBe('tgt-uid')
    expect(props.onClose).toBe(onClose)
    expect(props.onSaved).toBe(onSaved)
  })
})
