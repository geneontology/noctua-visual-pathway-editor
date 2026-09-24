import type { AnnouncementLevel } from '../models/announcement'

/**
 * Whole class strings rather than interpolated fragments, so Tailwind's scanner
 * can see them.
 *
 * The banner fills with colour because it has to be noticed. Panel rows only
 * tint their icon and left edge — a stack of fully-filled rows is unreadable,
 * and the icon carries the severity well enough at that size.
 */
export const BANNER_STYLES: Record<AnnouncementLevel, string> = {
  info: 'bg-blue-100 border-blue-400 text-blue-900',
  success: 'bg-green-100 border-green-400 text-green-900',
  warning: 'bg-yellow-100 border-yellow-400 text-yellow-900',
  danger: 'bg-red-100 border-red-400 text-red-900',
}

/** Icon tint + left edge for a row in the panel. */
export const ACCENT_STYLES: Record<AnnouncementLevel, string> = {
  info: 'text-blue-600 border-l-blue-400',
  success: 'text-green-600 border-l-green-400',
  warning: 'text-yellow-600 border-l-yellow-400',
  danger: 'text-red-600 border-l-red-400',
}

/** The unread dot, which needs a fill rather than a text colour. */
export const DOT_STYLES: Record<AnnouncementLevel, string> = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
}

export const bannerStyle = (level: AnnouncementLevel): string =>
  BANNER_STYLES[level] ?? BANNER_STYLES.info

export const accentStyle = (level: AnnouncementLevel): string =>
  ACCENT_STYLES[level] ?? ACCENT_STYLES.info

export const dotStyle = (level: AnnouncementLevel): string =>
  DOT_STYLES[level] ?? DOT_STYLES.info
