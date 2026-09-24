import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import PasteRegionDialog from '@/features/gocam/components/dialogs/PasteRegionDialog'
import {
  REGION_CLIPBOARD_KIND,
  type RegionClipboardPayload,
} from '@/features/gocam/services/regionClipboard'

const payload = (activities = 2, connections = 1): RegionClipboardPayload => ({
  kind: REGION_CLIPBOARD_KIND,
  copiedAt: new Date().toISOString(),
  sourceModelId: 'gomodel:src',
  activities: Array.from({ length: activities }, (_unused, i) => ({
    activityType: 'activity' as const,
    label: `ACT${i}`,
    rootNodeUid: `a${i}`,
    rootTermId: `GO:${i}`,
    offset: { x: i * 100, y: 0 },
    root: { uid: `a${i}`, relations: [] } as never,
  })),
  connections: Array.from({ length: connections }, (_unused, i) => ({
    predicate: { id: 'RO:0002413', label: 'regulates' },
    sourceNodeUid: 'a0',
    targetNodeUid: `a${i + 1}`,
    evidence: [],
  })),
})

const onConfirm = vi.fn()
const onCancel = vi.fn()

const renderDialog = (open = true, copied: RegionClipboardPayload = payload()) =>
  renderWithProviders(
    <MantineProvider>
      <PasteRegionDialog open={open} payload={copied} onCancel={onCancel} onConfirm={onConfirm} />
    </MantineProvider>
  )

const evidenceBox = () => screen.getByLabelText('Include evidence') as HTMLInputElement

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PasteRegionDialog — wording', () => {
  it('is titled "Paste copied nodes"', () => {
    renderDialog()
    expect(screen.getByText('Paste copied nodes')).toBeInTheDocument()
  })

  it('asks about the nodes and their relations', () => {
    renderDialog(true, payload(2, 1))
    expect(screen.getByText('Paste 2 nodes and their relations?')).toBeInTheDocument()
  })

  it('leaves relations out when the copy has none', () => {
    renderDialog(true, payload(1, 0))
    expect(screen.getByText('Paste 1 node?')).toBeInTheDocument()
  })

  it('no longer says where or when the nodes were copied', () => {
    renderDialog()
    expect(screen.queryByText(/Copied from/)).not.toBeInTheDocument()
    expect(screen.queryByText(/straight away/)).not.toBeInTheDocument()
  })

  it('shows a preview of the copied nodes', () => {
    renderDialog()
    expect(screen.getByRole('img', { name: 'Preview of 2 nodes' })).toBeInTheDocument()
  })
})

describe('PasteRegionDialog — include evidence', () => {
  it('starts checked, so a paste keeps the evidence it was copied with', () => {
    renderDialog()
    expect(evidenceBox().checked).toBe(true)
  })

  it('confirms with evidence when the box is left alone', async () => {
    const { user } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Paste' }))
    expect(onConfirm).toHaveBeenCalledWith(true)
  })

  it('confirms without evidence once the curator opts out', async () => {
    const { user } = renderDialog()

    await user.click(evidenceBox())
    expect(evidenceBox().checked).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Paste' }))
    expect(onConfirm).toHaveBeenCalledWith(false)
  })

  it('goes back to checked on the next paste, so an opt-out does not persist', async () => {
    const { user, rerender } = renderDialog()

    await user.click(evidenceBox())
    expect(evidenceBox().checked).toBe(false)

    const reopen = (open: boolean) =>
      rerender(
        <MantineProvider>
          <PasteRegionDialog
            open={open}
            payload={payload()}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        </MantineProvider>
      )

    reopen(false)
    reopen(true)

    expect(evidenceBox().checked).toBe(true)
  })
})
