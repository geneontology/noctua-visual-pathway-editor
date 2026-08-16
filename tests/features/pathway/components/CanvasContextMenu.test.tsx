import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CanvasContextMenu from '@/features/pathway/components/CanvasContextMenu'

const renderMenu = (open = true, x = 200, y = 150) => {
  const onClose = vi.fn()
  const onPaste = vi.fn()
  // AnchoredMenu renders through Mantine's Portal, which needs MantineProvider.
  const utils = renderWithProviders(
    <MantineProvider>
      <CanvasContextMenu open={open} x={x} y={y} onClose={onClose} onPaste={onPaste} />
    </MantineProvider>
  )
  return { ...utils, onClose, onPaste }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CanvasContextMenu', () => {
  it('renders nothing when closed', () => {
    renderMenu(false)
    expect(screen.queryByText('Paste activity')).not.toBeInTheDocument()
  })

  it('offers Paste activity when open', () => {
    renderMenu(true)
    expect(screen.getByText('Paste activity')).toBeInTheDocument()
  })

  it('calls onPaste and closes when clicked', async () => {
    const { user, onPaste, onClose } = renderMenu(true)

    await user.click(screen.getByText('Paste activity'))
    expect(onPaste).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('offers no node-specific actions — this is the empty-canvas menu', () => {
    renderMenu(true)
    expect(screen.queryByText('Copy activity')).not.toBeInTheDocument()
    expect(screen.queryByText('Edit activity')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete activity')).not.toBeInTheDocument()
  })

  it('parks its anchor placeholder at the click coordinates', () => {
    const { container } = renderMenu(true, 640, 480)
    const anchor = container.querySelector('.pointer-events-none.fixed') as HTMLElement
    expect(anchor).toBeTruthy()
    expect(anchor.style.left).toBe('640px')
    expect(anchor.style.top).toBe('480px')
  })
})
