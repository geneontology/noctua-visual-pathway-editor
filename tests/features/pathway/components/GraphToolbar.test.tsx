import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import GraphToolbar from '@/features/pathway/components/GraphToolbar'

const renderToolbar = (
  props: Partial<{ selectionCount: number; canEdit: boolean }> = {},
  onCopySelection = vi.fn()
) => {
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
        onDeleteSelection={vi.fn()}
        canEdit={props.canEdit ?? true}
      />
    </MantineProvider>
  )
  return { ...utils, onCopySelection }
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
