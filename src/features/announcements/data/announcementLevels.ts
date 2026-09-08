import type { AnnouncementLevel } from '../models/announcement'

/**
 * Background/border/text classes per level. Kept as whole class strings rather
 * than interpolated fragments so Tailwind's scanner can see them.
 */
export const LEVEL_STYLES: Record<AnnouncementLevel, string> = {
  info: 'bg-blue-100 border-blue-300 text-blue-900',
  success: 'bg-green-100 border-green-300 text-green-900',
  warning: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  danger: 'bg-red-100 border-red-300 text-red-900',
}

/** Fallback for a level the feed adds before this app knows about it. */
export const DEFAULT_LEVEL_STYLE = LEVEL_STYLES.info

export const levelStyle = (level: AnnouncementLevel): string =>
  LEVEL_STYLES[level] ?? DEFAULT_LEVEL_STYLE
