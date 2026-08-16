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
})

type Handlers = ReturnType<typeof handlers>

const renderMenu = (
  props: Partial<{ open: boolean; interactive: boolean }> = {},
  h: Handlers = handlers()
) => {
  const utils = renderMantine(
    <NodeContextMenu
      open={props.open ?? true}
      x={120}
      y={80}
      interactive={props.interactive ?? true}
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
    expect(screen.queryByText('Copy activity')).not.toBeInTheDocument()
    expect(screen.queryByText('Edit activity')).not.toBeInTheDocument()
  })
})

describe('NodeContextMenu — logged in (interactive)', () => {
  it('offers Edit, Copy, Comments and Delete', () => {
    renderMenu({ interactive: true })
    expect(screen.getByText('Edit activity')).toBeInTheDocument()
    expect(screen.getByText('Copy activity')).toBeInTheDocument()
    expect(screen.getByText('Comments')).toBeInTheDocument()
    expect(screen.getByText('Delete activity')).toBeInTheDocument()
  })

  it('does not offer the read-only View item', () => {
    renderMenu({ interactive: true })
    expect(screen.queryByText('View activity')).not.toBeInTheDocument()
  })

  it('Copy calls onCopy and closes the menu', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: true }, h)

    await user.click(screen.getByText('Copy activity'))
    expect(h.onCopy).toHaveBeenCalledTimes(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('Edit calls onEdit and closes', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: true }, h)

    await user.click(screen.getByText('Edit activity'))
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

    await user.click(screen.getByText('Delete activity'))
    expect(h.onDelete).toHaveBeenCalledTimes(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('fires only the clicked action', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: true }, h)

    await user.click(screen.getByText('Copy activity'))
    expect(h.onEdit).not.toHaveBeenCalled()
    expect(h.onDelete).not.toHaveBeenCalled()
    expect(h.onComments).not.toHaveBeenCalled()
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
    expect(screen.queryByText('Edit activity')).not.toBeInTheDocument()
    expect(screen.queryByText('Copy activity')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete activity')).not.toBeInTheDocument()
  })

  it('View calls onView and closes', async () => {
    const h = handlers()
    const { user } = renderMenu({ interactive: false }, h)

    await user.click(screen.getByText('View activity'))
    expect(h.onView).toHaveBeenCalledTimes(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
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
