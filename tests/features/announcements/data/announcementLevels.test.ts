import { describe, it, expect } from 'vitest'
import {
  BANNER_STYLES,
  ACCENT_STYLES,
  DOT_STYLES,
  bannerStyle,
  accentStyle,
  dotStyle,
} from '@/features/announcements/data/announcementLevels'
import type { AnnouncementLevel } from '@/features/announcements/models/announcement'

const LEVELS: AnnouncementLevel[] = ['info', 'success', 'warning', 'danger']

describe('announcement level styles', () => {
  it.each(LEVELS)('has a banner, accent and dot style for %s', level => {
    expect(bannerStyle(level)).toBeTruthy()
    expect(accentStyle(level)).toBeTruthy()
    expect(dotStyle(level)).toBeTruthy()
  })

  it('gives each level its own colour, so severity is distinguishable', () => {
    expect(new Set(Object.values(BANNER_STYLES)).size).toBe(LEVELS.length)
    expect(new Set(Object.values(ACCENT_STYLES)).size).toBe(LEVELS.length)
    expect(new Set(Object.values(DOT_STYLES)).size).toBe(LEVELS.length)
  })

  // Tailwind scans source for whole class names. A built-up string like
  // `bg-${level}-100` is invisible to it and gets purged from the stylesheet.
  it('spells class names out in full rather than interpolating them', () => {
    const every = [
      ...Object.values(BANNER_STYLES),
      ...Object.values(ACCENT_STYLES),
      ...Object.values(DOT_STYLES),
    ]

    for (const classes of every) {
      expect(classes).not.toContain('${')
      expect(classes).not.toContain('undefined')
    }
  })

  it('tints only the icon and left edge in the panel, so a stack of rows stays readable', () => {
    for (const level of LEVELS) {
      expect(accentStyle(level)).toContain('border-l-')
      expect(accentStyle(level)).not.toContain('bg-')
    }
  })

  it('fills the banner, which has to be noticed', () => {
    for (const level of LEVELS) {
      expect(bannerStyle(level)).toContain('bg-')
    }
  })

  it('uses a fill for the unread dot, not a text colour', () => {
    for (const level of LEVELS) {
      expect(dotStyle(level)).toMatch(/^bg-/)
    }
  })

  // The feed can add a level before this app knows about it; an unstyled
  // announcement is worse than one shown as info.
  describe('a level this build does not know', () => {
    const unknown = 'critical' as AnnouncementLevel

    it('falls back to info everywhere', () => {
      expect(bannerStyle(unknown)).toBe(BANNER_STYLES.info)
      expect(accentStyle(unknown)).toBe(ACCENT_STYLES.info)
      expect(dotStyle(unknown)).toBe(DOT_STYLES.info)
    })
  })
})
