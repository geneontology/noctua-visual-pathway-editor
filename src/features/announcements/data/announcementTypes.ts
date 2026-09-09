import type { IconType } from 'react-icons'
import {
  IoMegaphoneOutline,
  IoSparklesOutline,
  IoAlarmOutline,
  IoConstructOutline,
  IoCalendarOutline,
} from 'react-icons/io5'
import type { AnnouncementType } from '../models/announcement'

/** The icon each kind of announcement gets in the panel. */
export const TYPE_ICONS: Record<AnnouncementType, IconType> = {
  announcement: IoMegaphoneOutline,
  update: IoSparklesOutline,
  reminder: IoAlarmOutline,
  maintenance: IoConstructOutline,
  event: IoCalendarOutline,
}

/** Falls back to the generic icon for a type the feed adds later. */
export const typeIcon = (type: AnnouncementType): IconType =>
  TYPE_ICONS[type] ?? IoMegaphoneOutline
