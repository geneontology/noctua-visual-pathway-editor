import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CanvasContextMenu from '@/features/pathway/components/CanvasContextMenu'

type Paste = { summary: string } | null

const ONE_NODE: Paste = { summary: '1 node' }

const renderMenu = (
  { open = true, x = 200, y = 150, paste = ONE_NODE, canEdit = true }: {
    open?: boolean
    x?: number
    y?: number
    paste?: Paste
    canEdit?: boolean
  } = {}
) => {
  const onClose = vi.fn()
  const onPaste = vi.fn()
  // AnchoredMenu renders through Mantine's Portal, which needs MantineProvider.
  const utils = renderWithProviders(
    <MantineProvider>
      <CanvasContextMenu
        open={open}
        x={x}
        y={y}
        paste={paste}
        canEdit={canEdit}
        onClose={onClose}
        onPaste={onPaste}
      />
    </MantineProvider>
  )
  return { ...utils, onClose, onPaste }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CanvasContextMenu', () => {
  it('renders nothing when closed', () => {
    renderMenu({ open: false })
    expect(screen.queryByText('Paste 1 node')).not.toBeInTheDocument()
  })

  it('offers Paste 1 node when a single copied node is on the clipboard', () => {
    renderMenu()
    expect(screen.getByText('Paste 1 node')).toBeInTheDocument()
  })

  it('calls onPaste and closes when clicked', async () => {
    const { user, onPaste, onClose } = renderMenu()

    await user.click(screen.getByText('Paste 1 node'))
    expect(onPaste).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  describe('clipboard availability', () => {
    it('names the region when one is on the clipboard', () => {
      renderMenu({ paste: { summary: '3 nodes' } })

      expect(screen.getByText('Paste 3 nodes')).toBeInTheDocument()
    })

    it('says nothing is available when the clipboard is empty', () => {
      renderMenu({ paste: null })

      expect(screen.getByText('Nothing to paste')).toBeInTheDocument()
      expect(screen.queryByText(/^Paste/)).not.toBeInTheDocument()
    })

    it('offers no paste action to click when nothing is available', async () => {
      const { user, onPaste } = renderMenu({ paste: null })

      await user.click(screen.getByText('Nothing to paste'))
      expect(onPaste).not.toHaveBeenCalled()
    })
  })

  describe('read-only', () => {
    // The menu must still open: JointJS suppresses the browser's own context
    // menu, so showing nothing would make right-click a dead end.
    it('opens with a log-in hint instead of a paste action', () => {
      renderMenu({ canEdit: false })

      expect(screen.getByText('Log in to edit')).toBeInTheDocument()
      expect(screen.queryByText('Paste 1 node')).not.toBeInTheDocument()
    })

    it('offers nothing to click even when the clipboard has something', async () => {
      const { user, onPaste } = renderMenu({
        canEdit: false,
        paste: { summary: '2 nodes' },
      })

      await user.click(screen.getByText('Log in to edit'))
      expect(onPaste).not.toHaveBeenCalled()
    })
  })

  it('offers no node-specific actions — this is the empty-canvas menu', () => {
    renderMenu()
    expect(screen.queryByText('Copy')).not.toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('parks its anchor placeholder at the click coordinates', () => {
    const { container } = renderMenu({ x: 640, y: 480 })
    const anchor = container.querySelector('.pointer-events-none.fixed') as HTMLElement
    expect(anchor).toBeTruthy()
    expect(anchor.style.left).toBe('640px')
    expect(anchor.style.top).toBe('480px')
  })
})
