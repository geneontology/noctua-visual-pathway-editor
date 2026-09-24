import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import PinnedAnnouncementBar from '@/features/announcements/components/PinnedAnnouncementBar'
import { buildAnnouncement } from '@tests/fixtures/builders'
import type { Announcement } from '@/features/announcements/models/announcement'

const renderBar = (overrides: Partial<Announcement> = {}) => {
  const onViewMore = vi.fn()

  return {
    onViewMore,
    ...renderWithProviders(
      <MantineProvider>
        <PinnedAnnouncementBar
          announcement={buildAnnouncement('pin', { pinned: true, ...overrides })}
          onViewMore={onViewMore}
        />
      </MantineProvider>
    ),
  }
}

describe('PinnedAnnouncementBar', () => {
  it('shows the title and the description', () => {
    renderBar({ title: 'Maintenance Friday', description: 'Down for 30 minutes.' })

    expect(screen.getByText('Maintenance Friday')).toBeInTheDocument()
    expect(screen.getByText('Down for 30 minutes.')).toBeInTheDocument()
  })

  it('opens the panel from View more', async () => {
    const { onViewMore, user } = renderBar()

    await user.click(screen.getByRole('button', { name: 'View more' }))

    expect(onViewMore).toHaveBeenCalledOnce()
  })

  it('has no way to close or acknowledge it', () => {
    renderBar()

    expect(screen.queryByRole('button', { name: 'Close announcement' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument()
  })

  it('links out to the details page in a new tab', () => {
    renderBar({ descriptionUrl: 'https://example.org/details' })

    const link = screen.getByRole('link', { name: 'More details' })
    expect(link).toHaveAttribute('href', 'https://example.org/details')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders no link when there is none', () => {
    renderBar({ descriptionUrl: null })

    expect(screen.queryByRole('link', { name: 'More details' })).not.toBeInTheDocument()
  })

  it.each([
    ['info', 'bg-blue-100'],
    ['danger', 'bg-red-100'],
  ] as const)('colours itself for level %s', (level, expectedClass) => {
    renderBar({ level })

    expect(screen.getByTestId('pinned-announcement')).toHaveClass(expectedClass)
  })
})
