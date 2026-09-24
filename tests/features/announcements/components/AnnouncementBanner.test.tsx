import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import AnnouncementBanner from '@/features/announcements/components/AnnouncementBanner'
import { buildAnnouncement } from '@tests/fixtures/builders'
import type { Announcement } from '@/features/announcements/models/announcement'

const renderBanner = (overrides: Partial<Announcement> = {}) => {
  const onViewMore = vi.fn()
  const onDismiss = vi.fn()
  const announcement = buildAnnouncement('a1', overrides)

  return {
    onViewMore,
    onDismiss,
    announcement,
    ...renderWithProviders(
      <MantineProvider>
        <AnnouncementBanner
          announcement={announcement}
          onViewMore={onViewMore}
          onDismiss={onDismiss}
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

  describe('acknowledging', () => {
    it('dismisses with Got it, by announcement id', async () => {
      const { onDismiss, user } = renderBanner()

      await user.click(screen.getByRole('button', { name: 'Got it' }))

      expect(onDismiss).toHaveBeenCalledWith('a1')
    })

    it('dismisses with ✕ too', async () => {
      const { onDismiss, user } = renderBanner()

      await user.click(screen.getByRole('button', { name: 'Close announcement' }))

      expect(onDismiss).toHaveBeenCalledWith('a1')
    })

    it('does not open the panel on the way out', async () => {
      const { onViewMore, user } = renderBanner()

      await user.click(screen.getByRole('button', { name: 'Got it' }))

      expect(onViewMore).not.toHaveBeenCalled()
    })
  })

  it('capitalises its actions without changing their names', () => {
    renderBanner()

    expect(screen.getByRole('button', { name: 'Got it' })).toHaveClass('uppercase')
    expect(screen.getByRole('button', { name: 'View more' })).toHaveClass('uppercase')
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
