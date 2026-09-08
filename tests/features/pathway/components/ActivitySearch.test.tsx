import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import ActivitySearch from '@/features/pathway/components/ActivitySearch'
import type { Activity, GraphNode } from '@/features/gocam/models/cam'
import { ActivityType, RootTypes } from '@/features/gocam/models/cam'
import { buildActivity, buildNode } from '@tests/fixtures/builders'

const node = (uid: string, label: string, rootTypes: string[] = []): GraphNode => ({
  ...buildNode(uid, label, rootTypes),
  uid,
})

const activity = (
  uid: string,
  {
    enabledBy,
    bp,
    type = ActivityType.ACTIVITY,
  }: { enabledBy?: string; bp?: string; type?: ActivityType }
): Activity => {
  const nodes = [node(`${uid}-root`, enabledBy ?? 'root term')]
  if (bp) nodes.push(node(`${uid}-bp`, bp, [RootTypes.BIOLOGICAL_PROCESS]))
  return {
    ...buildActivity(uid, nodes),
    type,
    enabledBy: enabledBy
      ? node(`${uid}-gp`, enabledBy, [RootTypes.MOLECULAR_ENTITY])
      : null,
    molecularFunction: null,
  }
}

const ACTIVITIES: Activity[] = [
  activity('a1', { enabledBy: 'CDK2 Hsap', bp: 'mitotic cell cycle' }),
  activity('a2', { enabledBy: 'CDK2 Hsap' }),
  activity('a3', { enabledBy: 'ATP', type: ActivityType.MOLECULE }),
]

let onSelect: ReturnType<typeof vi.fn>

const renderSearch = (activities: Activity[] = ACTIVITIES) => {
  onSelect = vi.fn()
  return renderWithProviders(<ActivitySearch activities={activities} onSelect={onSelect} />)
}

const input = () => screen.getByPlaceholderText('Find in model…')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ActivitySearch', () => {
  it('shows no dropdown until something is typed', async () => {
    const { user } = renderSearch()
    await user.click(input())

    expect(screen.queryByText('No match in this model')).not.toBeInTheDocument()
  })

  it('says why a row matched when it was not the name', async () => {
    const { user } = renderSearch()
    await user.type(input(), 'mitotic')

    expect(screen.getByText('CDK2 Hsap')).toBeInTheDocument()
    expect(screen.getByText('BP: mitotic cell cycle')).toBeInTheDocument()
  })

  it('lists every activity with the same gene product and offers Select all', async () => {
    const { user } = renderSearch()
    await user.type(input(), 'cdk2')

    expect(screen.getAllByText('CDK2 Hsap')).toHaveLength(2)
    expect(screen.getByText('Select all 2 matches')).toBeInTheDocument()
  })

  it('Enter defaults to selecting all matches', async () => {
    const { user } = renderSearch()
    await user.type(input(), 'cdk2')
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith(['a1', 'a2'])
  })

  it('a single match has no Select all row and Enter picks it', async () => {
    const { user } = renderSearch()
    await user.type(input(), 'atp')

    expect(screen.queryByText(/Select all/)).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(['a3'])
  })

  it('arrows walk past the Select all row into individual hits', async () => {
    const { user } = renderSearch()
    await user.type(input(), 'cdk2')
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    expect(onSelect).toHaveBeenCalledWith(['a2'])
  })

  it('clicking a row selects just that activity and clears the box', async () => {
    const { user } = renderSearch()
    await user.type(input(), 'mitotic')
    await user.click(screen.getByText('CDK2 Hsap'))

    expect(onSelect).toHaveBeenCalledWith(['a1'])
    expect(input()).toHaveValue('')
  })

  it('badges non-default activity types', async () => {
    const { user } = renderSearch()
    await user.type(input(), 'atp')

    expect(screen.getByText('chemical')).toBeInTheDocument()
  })

  it('says so when nothing matches', async () => {
    const { user } = renderSearch()
    await user.type(input(), 'zzz')

    expect(screen.getByText('No match in this model')).toBeInTheDocument()
  })

  it('Escape closes and clears without selecting', async () => {
    const { user } = renderSearch()
    await user.type(input(), 'cdk2')
    await user.keyboard('{Escape}')

    expect(onSelect).not.toHaveBeenCalled()
    expect(input()).toHaveValue('')
  })

  it('caps visible rows but Select all covers every match', async () => {
    const many = Array.from({ length: 12 }, (_unused, i) =>
      activity(`m${i}`, { enabledBy: `GENE${i} match` })
    )
    const { user } = renderSearch(many)
    await user.type(input(), 'match')

    expect(screen.getAllByText(/^GENE\d+ match$/)).toHaveLength(8)
    expect(screen.getByText(/and 4 more/)).toBeInTheDocument()

    await user.click(screen.getByText('Select all 12 matches'))
    expect(onSelect).toHaveBeenCalledWith(many.map(a => a.uid))
  })
})
