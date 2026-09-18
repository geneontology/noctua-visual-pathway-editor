import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import AnnouncementRow from '@/features/announcements/components/AnnouncementRow'
import { buildAnnouncement } from '@tests/fixtures/builders'
import type { Announcement } from '@/features/announcements/models/announcement'

interface RowOptions {
  expanded?: boolean
  read?: boolean
}

const renderRow = (
  overrides: Partial<Announcement> = {},
  { expanded = false, read = false }: RowOptions = {}
) => {
  const onToggle = vi.fn()
  const onDismiss = vi.fn()
  const announcement = buildAnnouncement('a1', overrides)

  return {
    onToggle,
    onDismiss,
    announcement,
    ...renderWithProviders(
      <MantineProvider>
        <AnnouncementRow
          announcement={announcement}
          expanded={expanded}
          read={read}
          onToggle={onToggle}
          onDismiss={onDismiss}
        />
      </MantineProvider>
    ),
  }
}

describe('AnnouncementRow', () => {
  describe('collapsed', () => {
    it('shows the title and one line of description', () => {
      renderRow({ title: 'Release 2.4', description: 'What changed this month.' })

      expect(screen.getByText('Release 2.4')).toBeInTheDocument()
      expect(screen.getByText('What changed this month.')).toBeInTheDocument()
    })

    it('keeps the body out of the DOM until expanded', () => {
      renderRow({ body: '<p>The full story</p>' })

      expect(screen.queryByText('The full story')).not.toBeInTheDocument()
    })

    it('reports itself as collapsed to assistive tech', () => {
      renderRow()

      expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument()
    })

    it('toggles when the row is clicked', async () => {
      const { onToggle, user } = renderRow({ title: 'Release 2.4' })

      await user.click(screen.getByText('Release 2.4'))

      expect(onToggle).toHaveBeenCalledOnce()
    })
  })

  describe('expanded', () => {
    it('renders the body HTML built by the feed', () => {
      renderRow({ body: '<p>Line one</p><p>Line two</p>' }, { expanded: true })

      expect(screen.getByText('Line one')).toBeInTheDocument()
      expect(screen.getByText('Line two')).toBeInTheDocument()
    })

    it('drops the truncated description, which the body now supersedes', () => {
      renderRow({ description: 'Short summary', body: '<p>Full body</p>' }, { expanded: true })

      expect(screen.queryByText('Short summary')).not.toBeInTheDocument()
    })

    it('reports itself as expanded to assistive tech', () => {
      renderRow({}, { expanded: true })

      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
    })

    it('links out when the announcement has a descriptionUrl', () => {
      renderRow({ descriptionUrl: 'https://example.org/notes' }, { expanded: true })

      const link = screen.getByRole('link', { name: 'More details' })
      expect(link).toHaveAttribute('href', 'https://example.org/notes')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    })

    it('has no link when there is no descriptionUrl', () => {
      renderRow({ descriptionUrl: null }, { expanded: true })

      expect(screen.queryByRole('link', { name: 'More details' })).not.toBeInTheDocument()
    })
  })

  describe('unread marker', () => {
    it('marks a row that has not been opened', () => {
      renderRow({}, { read: false })

      expect(screen.getByLabelText('Unread')).toBeInTheDocument()
    })

    it('drops the marker once read', () => {
      renderRow({}, { read: true })

      expect(screen.queryByLabelText('Unread')).not.toBeInTheDocument()
    })

    it('colours the dot by level', () => {
      const { container } = renderRow({ level: 'danger' }, { read: false })

      expect(container.querySelector('.bg-red-500')).toBeTruthy()
    })
  })

  describe('dismissing', () => {
    it('offers a hover control while collapsed', async () => {
      const { onDismiss, user } = renderRow({ title: 'Release 2.4' })

      await user.click(screen.getByRole('button', { name: 'Dismiss Release 2.4' }))

      expect(onDismiss).toHaveBeenCalledOnce()
    })

    // The expanded row has its own Dismiss text button; two would be redundant.
    it('drops the hover control once expanded', () => {
      renderRow({ title: 'Release 2.4' }, { expanded: true })

      expect(
        screen.queryByRole('button', { name: 'Dismiss Release 2.4' })
      ).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
    })

    it('dismisses from the expanded row', async () => {
      const { onDismiss, user } = renderRow({}, { expanded: true })

      await user.click(screen.getByRole('button', { name: 'Dismiss' }))

      expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('does not also toggle the row, which would expand it on the way out', async () => {
      const { onToggle, user } = renderRow({ title: 'Release 2.4' })

      await user.click(screen.getByRole('button', { name: 'Dismiss Release 2.4' }))

      expect(onToggle).not.toHaveBeenCalled()
    })
  })

  describe('pinned', () => {
    it('is flagged as pinned', () => {
      renderRow({ pinned: true })

      expect(screen.getByLabelText('Pinned')).toBeInTheDocument()
    })

    it('cannot be dismissed from the hover control', () => {
      renderRow({ title: 'Release 2.4', pinned: true })

      expect(
        screen.queryByRole('button', { name: 'Dismiss Release 2.4' })
      ).not.toBeInTheDocument()
    })

    it('cannot be dismissed from the expanded row either', () => {
      renderRow({ pinned: true }, { expanded: true })

      expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
    })

    it('still expands like any other row', async () => {
      const { onToggle, user } = renderRow({ title: 'Pinned notice', pinned: true })

      await user.click(screen.getByText('Pinned notice'))

      expect(onToggle).toHaveBeenCalledOnce()
    })
  })

  it('accents the left edge by level', () => {
    const { container } = renderRow({ level: 'warning' })

    expect(container.querySelector('.border-l-yellow-400')).toBeTruthy()
  })

  describe('age stamp', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-15T12:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it.each([
      ['2026-03-15', 'today'],
      ['2026-03-14', 'yesterday'],
      ['2026-03-08', '1w'],
      [null, 'now'],
    ])('stamps a start date of %s as %s', (starts, expected) => {
      renderRow({ starts })

      expect(screen.getByText(expected)).toBeInTheDocument()
    })
  })
})
