import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import AnnouncementBell from '@/features/announcements/components/AnnouncementBell'

const renderBell = (total: number, unread: number) => {
  const onClick = vi.fn()
  return {
    onClick,
    ...renderWithProviders(
      <MantineProvider>
        <AnnouncementBell total={total} unread={unread} onClick={onClick} />
      </MantineProvider>
    ),
  }
}

describe('AnnouncementBell', () => {
  // The panel is the only way back to a dismissed announcement, so the bell has
  // to survive the list emptying.
  it('stays put when there is nothing to show', () => {
    renderBell(0, 0)

    expect(screen.getByRole('button', { name: 'No announcements' })).toBeInTheDocument()
  })

  it('still opens the panel with nothing to show', async () => {
    const { onClick, user } = renderBell(0, 0)

    await user.click(screen.getByRole('button', { name: 'No announcements' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('has no badge when there is nothing to show', () => {
    renderBell(0, 0)

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('badges the unread count', () => {
    renderBell(3, 2)

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  // The bell must not vanish once everything is read — you still want to reread.
  it('stays visible with no badge once everything is read', () => {
    renderBell(3, 0)

    expect(screen.getByRole('button', { name: '3 announcements' })).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('counts unread, not total', () => {
    renderBell(5, 1)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })

  it('labels a single announcement in the singular', () => {
    renderBell(1, 0)

    expect(screen.getByRole('button', { name: '1 announcement' })).toBeInTheDocument()
  })

  it('says how many are unread', () => {
    renderBell(4, 2)

    expect(screen.getByRole('button', { name: '2 unread of 4 announcements' })).toBeInTheDocument()
  })

  it('opens the panel when clicked', async () => {
    const { onClick, user } = renderBell(2, 1)

    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledOnce()
  })
})
