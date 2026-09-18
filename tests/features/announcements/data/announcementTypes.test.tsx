import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IoMegaphoneOutline } from 'react-icons/io5'
import { TYPE_ICONS, typeIcon } from '@/features/announcements/data/announcementTypes'
import type { AnnouncementType } from '@/features/announcements/models/announcement'

const TYPES: AnnouncementType[] = [
  'announcement',
  'update',
  'reminder',
  'maintenance',
  'event',
]

describe('announcement type icons', () => {
  it.each(TYPES)('has an icon for %s', type => {
    expect(typeIcon(type)).toBeTypeOf('function')
  })

  it('gives each type its own icon, so the kind reads at a glance', () => {
    expect(new Set(Object.values(TYPE_ICONS)).size).toBe(TYPES.length)
  })

  it.each(TYPES)('renders an svg for %s', type => {
    const Icon = typeIcon(type)
    const { container } = render(<Icon />)

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  // A feed published after this build ships can carry a type this app has never
  // heard of. Rendering nothing there would leave a hole in the row.
  it('falls back to the megaphone for a type this build does not know', () => {
    expect(typeIcon('webinar' as AnnouncementType)).toBe(IoMegaphoneOutline)
  })
})
