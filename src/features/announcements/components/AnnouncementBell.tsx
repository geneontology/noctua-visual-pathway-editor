import type React from 'react'
import { ActionIcon, Indicator } from '@mantine/core'
import { IoNotificationsOutline } from 'react-icons/io5'

interface AnnouncementBellProps {
  /** Total shown in the panel. */
  total: number
  /** Not yet opened. Drives the badge, which disappears once everything is read. */
  unread: number
  onClick: () => void
}

/**
 * Always rendered, even with nothing to show: the panel is the only way to reach
 * dismissed announcements, so hiding the bell once the list empties would strand
 * anything cleared by accident.
 */
const AnnouncementBell: React.FC<AnnouncementBellProps> = ({ total, unread, onClick }) => {
  const bell = (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="md"
      aria-label={
        unread > 0
          ? `${unread} unread of ${total} announcements`
          : total === 0
            ? 'No announcements'
            : `${total} announcement${total === 1 ? '' : 's'}`
      }
      onClick={onClick}
    >
      <IoNotificationsOutline />
    </ActionIcon>
  )

  if (unread === 0) return bell

  return (
    <Indicator label={unread} size={16} color="red" offset={4}>
      {bell}
    </Indicator>
  )
}

export default AnnouncementBell
