import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import type { ReactElement } from 'react'
import { renderWithProviders } from '@tests/test-utils'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'

const renderDialog = (ui: ReactElement) =>
  renderWithProviders(<MantineProvider>{ui}</MantineProvider>)

describe('ConfirmDialog', () => {
  it('renders nothing when open is false', () => {
    renderDialog(
      <ConfirmDialog
        open={false}
        onClose={() => {}}
        onConfirm={() => {}}
        message="Hidden when closed"
      />
    )
    expect(screen.queryByText('Hidden when closed')).toBeNull()
  })

  it('renders title, message, and the default labels when open', () => {
    renderDialog(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete Annotation"
        message="Are you sure you want to delete this annotation?"
      />
    )
    expect(screen.getByText('Delete Annotation')).toBeInTheDocument()
    expect(
      screen.getByText('Are you sure you want to delete this annotation?')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('Cancel calls onClose and not onConfirm', async () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    renderDialog(
      <ConfirmDialog open onClose={onClose} onConfirm={onConfirm} message="msg" />
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Confirm calls onConfirm', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    renderDialog(
      <ConfirmDialog open onClose={() => {}} onConfirm={onConfirm} message="msg" />
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('honors custom confirm/cancel labels', () => {
    renderDialog(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        message="msg"
        confirmLabel="Remove"
        cancelLabel="Keep"
      />
    )
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
  })

  it('disables both buttons when busy is true', () => {
    renderDialog(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        message="msg"
        busy
      />
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
  })

  it('accepts a ReactNode message (not just a string)', () => {
    renderDialog(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        message={
          <>
            Are you sure you want to delete <strong data-testid="strong">Foo</strong>?
          </>
        }
      />
    )
    expect(screen.getByTestId('strong')).toHaveTextContent('Foo')
  })
})
