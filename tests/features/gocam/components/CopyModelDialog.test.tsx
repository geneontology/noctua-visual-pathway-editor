import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import CopyModelDialog from '@/features/gocam/components/CopyModelDialog'
import { buildModel, buildActivity, buildNode } from '@tests/fixtures/builders'

const copyMock = vi.hoisted(() =>
  vi.fn(() => ({ unwrap: () => Promise.resolve({ newModelId: null }) }))
)

vi.mock('@/features/gocam/slices/camApiSlice', () => ({
  useCopyGraphModelMutation: () => [copyMock, { isLoading: false }],
}))

const camState = () => {
  const model = buildModel([buildActivity('a', [buildNode('n', 'node')])])
  return {
    cam: {
      model: { ...model, id: 'gomodel:src', title: 'My Model' },
      loading: false,
      error: null,
      selectedActivityId: null,
    },
  }
}

const renderDialog = () =>
  renderWithProviders(
    <MantineProvider>
      <CopyModelDialog />
    </MantineProvider>,
    { preloadedState: camState() as never }
  )

const evidenceBox = () => screen.getByLabelText('Include evidence') as HTMLInputElement

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CopyModelDialog — include evidence', () => {
  it('starts checked, so a copied model keeps its evidence', () => {
    renderDialog()
    expect(evidenceBox().checked).toBe(true)
  })

  it('copies with evidence when the box is left alone', async () => {
    const { user } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(copyMock).toHaveBeenCalledWith(
      expect.objectContaining({ modelId: 'gomodel:src', preserveEvidence: true })
    )
  })

  it('copies without evidence once the curator opts out', async () => {
    const { user } = renderDialog()

    await user.click(evidenceBox())
    expect(evidenceBox().checked).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(copyMock).toHaveBeenCalledWith(
      expect.objectContaining({ preserveEvidence: false })
    )
  })
})
