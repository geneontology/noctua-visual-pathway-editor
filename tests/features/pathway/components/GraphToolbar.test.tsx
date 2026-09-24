import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import GraphToolbar from '@/features/pathway/components/GraphToolbar'
import { MAX_BULK_NODES } from '@/features/pathway/data/selectionLimits'

const renderToolbar = (
  props: Partial<{ selectionCount: number; canEdit: boolean }> = {},
  onCopySelection = vi.fn()
) => {
  const onDeleteSelection = vi.fn()
  const utils = renderWithProviders(
    <MantineProvider>
      <GraphToolbar
        layoutDetail="detailed"
        spacing="compact"
        onAutoLayout={vi.fn()}
        onLayoutDetailChange={vi.fn()}
        onSpacingChange={vi.fn()}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
        selectionCount={props.selectionCount ?? 3}
        onClearSelection={vi.fn()}
        onCopySelection={onCopySelection}
        onDeleteSelection={onDeleteSelection}
        canEdit={props.canEdit ?? true}
      />
    </MantineProvider>
  )
  return { ...utils, onCopySelection, onDeleteSelection }
}

describe('GraphToolbar — selection actions', () => {
  it('offers Copy and Delete on a selection', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  // Regression: the handler behind onCopySelection takes an optional uid list,
  // so onClick passing the click event through as that list broke Copy while
  // leaving Ctrl+C (called with no arguments) working.
  it('calls onCopySelection with no arguments, never the click event', async () => {
    const onCopySelection = vi.fn()
    const { user } = renderToolbar({}, onCopySelection)

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(onCopySelection).toHaveBeenCalledTimes(1)
    expect(onCopySelection).toHaveBeenCalledWith()
  })

  it('calls onDeleteSelection with no arguments', async () => {
    const { user, onDeleteSelection } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(onDeleteSelection).toHaveBeenCalledTimes(1)
    expect(onDeleteSelection).toHaveBeenCalledWith()
  })

  // Removed — Copy covers it.
  it('offers no Duplicate action', () => {
    renderToolbar()
    expect(screen.queryByRole('button', { name: 'Duplicate' })).not.toBeInTheDocument()
  })

  it('hides the editing actions when logged out', () => {
    renderToolbar({ canEdit: false })
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('shows no selection actions when nothing is selected', () => {
    renderToolbar({ selectionCount: 0 })
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Duplicate' })).not.toBeInTheDocument()
  })
})

describe('GraphToolbar — bulk cap', () => {
  it('says the selection is over the cap', () => {
    renderToolbar({ selectionCount: MAX_BULK_NODES + 1 })
    expect(
      screen.getByText(`${MAX_BULK_NODES + 1} selected — max ${MAX_BULK_NODES}`)
    ).toBeInTheDocument()
  })

  it('greys out Copy and Delete past the cap, and they do nothing', async () => {
    const { user, onCopySelection, onDeleteSelection } = renderToolbar({
      selectionCount: MAX_BULK_NODES + 1,
    })
    const copy = screen.getByRole('button', { name: 'Copy' })
    const del = screen.getByRole('button', { name: 'Delete' })
    expect(copy).toHaveAttribute('aria-disabled', 'true')
    expect(del).toHaveAttribute('aria-disabled', 'true')

    await user.click(copy)
    await user.click(del)

    expect(onCopySelection).not.toHaveBeenCalled()
    expect(onDeleteSelection).not.toHaveBeenCalled()
  })

  it('keeps Copy and Delete live at exactly the cap', () => {
    renderToolbar({ selectionCount: MAX_BULK_NODES })
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveAttribute('aria-disabled', 'false')
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('aria-disabled', 'false')
  })
})
