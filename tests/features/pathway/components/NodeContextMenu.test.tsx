import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import type { ReactElement } from 'react'
import { renderWithProviders } from '@tests/test-utils'
import NodeContextMenu from '@/features/pathway/components/NodeContextMenu'

// AnchoredMenu renders through Mantine's Portal, which needs MantineProvider.
const renderMantine = (ui: ReactElement) =>
  renderWithProviders(<MantineProvider>{ui}</MantineProvider>)

const handlers = () => ({
  onClose: vi.fn(),
  onView: vi.fn(),
  onEdit: vi.fn(),
  onCopy: vi.fn(),
  onComments: vi.fn(),
  onDelete: vi.fn(),
  onCopyRegion: vi.fn(),
  onDeleteRegion: vi.fn(),
})

type Handlers = ReturnType<typeof handlers>

type SelectConnected = (direction: 'downstream' | 'upstream' | 'connected') => void

const renderMenu = (
  props: Partial<{
    open: boolean
    interactive: boolean
    regionSummary: string
    onSelectConnected: SelectConnected
  }> = {},
  h: Handlers = handlers()
) => {
  const utils = renderMantine(
    <NodeContextMenu
      open={props.open ?? true}
      x={120}
      y={80}
      interactive={props.interactive ?? true}
      regionSummary={props.regionSummary ?? null}
      onSelectConnected={props.onSelectConnected}
      {...h}
    />
  )
  return { ...utils, ...h }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('NodeContextMenu — visibility', () => {
  it('renders nothing when closed', () => {
    renderMenu({ open: false })
    expect(screen.queryByText('Copy')).not.toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })
})

describe('NodeContextMenu — logged in (interactive)', () => {
  it('offers Edit, Copy, Comments and Delete', () => {
    renderMenu({ interactive: true })
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Copy')).toBeInTheDocument()
    expect(screen.getByText('Comments')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('offers the Select section for a single node', () => {
    renderMenu({ onSelectConnected: vi.fn() })
    expect(screen.getByText('Select')).toBeInTheDocument()
    expect(screen.getByText('Downstream')).toBeInTheDocument()
    expect(screen.getByText('Upstream')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('does not offer the read-only View item', () => {
    renderMenu({ interactive: true })
    expect(screen.queryByText('View activity')).not.toBeInTheDocument()
  })

  it('Copy calls onCopy and closes the menu', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: true }, h)

    await user.click(screen.getByText('Copy'))
    expect(h.onCopy).toHaveBeenCalledTimes(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('Edit calls onEdit and closes', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: true }, h)

    await user.click(screen.getByText('Edit'))
    expect(h.onEdit).toHaveBeenCalledTimes(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('Comments calls onComments and closes', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: true }, h)

    await user.click(screen.getByText('Comments'))
    expect(h.onComments).toHaveBeenCalledTimes(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('Delete calls onDelete and closes', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: true }, h)

    await user.click(screen.getByText('Delete'))
    expect(h.onDelete).toHaveBeenCalledTimes(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('fires only the clicked action', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: true }, h)

    await user.click(screen.getByText('Copy'))
    expect(h.onEdit).not.toHaveBeenCalled()
    expect(h.onDelete).not.toHaveBeenCalled()
    expect(h.onComments).not.toHaveBeenCalled()
  })
})

describe('NodeContextMenu — multi-selection', () => {
  it('replaces the single-node Copy and Delete with the region rows', () => {
    renderMenu({ regionSummary: '8 nodes' })
    expect(screen.getByText('Copy 8 nodes')).toBeInTheDocument()
    expect(screen.getByText('Delete 8 nodes')).toBeInTheDocument()
    expect(screen.queryByText('Copy')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('drops Edit and Comments — they act on one node, not the selection', () => {
    renderMenu({ regionSummary: '8 nodes' })
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Comments')).not.toBeInTheDocument()
  })

  it('drops the Select section — it grows from one node, not the selection', () => {
    renderMenu({ regionSummary: '8 nodes', onSelectConnected: vi.fn() })
    expect(screen.queryByText('Select')).not.toBeInTheDocument()
    expect(screen.queryByText('Downstream')).not.toBeInTheDocument()
    expect(screen.queryByText('Upstream')).not.toBeInTheDocument()
    expect(screen.queryByText('Connected')).not.toBeInTheDocument()
  })

  it('Copy 8 nodes calls onCopyRegion, not the single-node onCopy', async () => {
    const h = handlers()
    const { user } = renderMenu({ regionSummary: '8 nodes' }, h)

    await user.click(screen.getByText('Copy 8 nodes'))
    expect(h.onCopyRegion).toHaveBeenCalledTimes(1)
    expect(h.onCopy).not.toHaveBeenCalled()
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('Delete 8 nodes calls onDeleteRegion, not the single-node onDelete', async () => {
    const h = handlers()
    const { user } = renderMenu({ regionSummary: '8 nodes' }, h)

    await user.click(screen.getByText('Delete 8 nodes'))
    expect(h.onDeleteRegion).toHaveBeenCalledTimes(1)
    expect(h.onDelete).not.toHaveBeenCalled()
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })
})

describe('NodeContextMenu — read-only (logged out)', () => {
  it('offers only View and Comments', () => {
    renderMenu({ interactive: false })
    expect(screen.getByText('View activity')).toBeInTheDocument()
    expect(screen.getByText('Comments')).toBeInTheDocument()
  })

  it('hides the editing actions — Edit, Copy and Delete', () => {
    renderMenu({ interactive: false })
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Copy')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('View calls onView and closes', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: false }, h)

    await user.click(screen.getByText('View activity'))
    expect(h.onView).toHaveBeenCalledTimes(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('offers only View with 2+ selected — Comments shows a single node', () => {
    renderMenu({ interactive: false, regionSummary: '8 nodes' })
    expect(screen.getByText('View activity')).toBeInTheDocument()
    expect(screen.queryByText('Comments')).not.toBeInTheDocument()
  })

  it('Comments still works when logged out', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: false }, h)

    await user.click(screen.getByText('Comments'))
    expect(h.onComments).toHaveBeenCalledTimes(1)
  })
})

describe('NodeContextMenu — cursor anchoring', () => {
  it('parks its anchor placeholder at the click coordinates', () => {
    const { container } = renderMantine(
      <NodeContextMenu open x={321} y={123} interactive {...handlers()} />
    )
    const anchor = container.querySelector('.pointer-events-none.fixed') as HTMLElement
    expect(anchor).toBeTruthy()
    expect(anchor.style.left).toBe('321px')
    expect(anchor.style.top).toBe('123px')
  })
})
