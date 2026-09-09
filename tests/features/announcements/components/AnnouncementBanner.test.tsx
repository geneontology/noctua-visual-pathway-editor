import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import AnnouncementBanner from '@/features/announcements/components/AnnouncementBanner'
import { buildAnnouncement } from '@tests/fixtures/builders'
import type { Announcement } from '@/features/announcements/models/announcement'

const renderBanner = (overrides: Partial<Announcement> = {}) => {
  const onViewMore = vi.fn()
  const onClose = vi.fn()
  const announcement = buildAnnouncement('a1', overrides)

  return {
    onViewMore,
    onClose,
    announcement,
    ...renderWithProviders(
      <MantineProvider>
        <AnnouncementBanner
          announcement={announcement}
          onViewMore={onViewMore}
          onClose={onClose}
        />
      </MantineProvider>
    ),
  }
}

describe('AnnouncementBanner', () => {
  it('shows the title and the description', () => {
    renderBanner({ title: 'Scheduled maintenance', description: 'Down for 30 minutes.' })

    expect(screen.getByText('Scheduled maintenance')).toBeInTheDocument()
    expect(screen.getByText('Down for 30 minutes.')).toBeInTheDocument()
  })

  it('opens the panel from View more', async () => {
    const { onViewMore, user } = renderBanner()

    await user.click(screen.getByRole('button', { name: 'View more' }))

    expect(onViewMore).toHaveBeenCalledOnce()
  })

  it('closes with the announcement id, so the close is remembered per announcement', async () => {
    const { onClose, user } = renderBanner()

    await user.click(screen.getByRole('button', { name: 'Close announcement' }))

    expect(onClose).toHaveBeenCalledWith('a1')
  })

  describe('descriptionUrl', () => {
    it('renders an external link when one is set', () => {
      renderBanner({ descriptionUrl: 'https://example.org/details' })

      const link = screen.getByRole('link', { name: 'More details' })
      expect(link).toHaveAttribute('href', 'https://example.org/details')
      // Opening in the same tab would navigate curators out of the editor.
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    })

    it('renders no link when there is none', () => {
      renderBanner({ descriptionUrl: null })

      expect(screen.queryByRole('link', { name: 'More details' })).not.toBeInTheDocument()
    })
  })

  describe('pinned', () => {
    it('cannot be closed', () => {
      renderBanner({ pinned: true })

      expect(
        screen.queryByRole('button', { name: 'Close announcement' })
      ).not.toBeInTheDocument()
    })

    it('can still be opened in the panel', () => {
      renderBanner({ pinned: true })

      expect(screen.getByRole('button', { name: 'View more' })).toBeInTheDocument()
    })
  })

  it.each([
    ['info', 'bg-blue-100'],
    ['success', 'bg-green-100'],
    ['warning', 'bg-yellow-100'],
    ['danger', 'bg-red-100'],
  ] as const)('colours itself for level %s', (level, expectedClass) => {
    const { container } = renderBanner({ level })

    expect(container.querySelector(`.${expectedClass}`)).toBeTruthy()
  })
})
