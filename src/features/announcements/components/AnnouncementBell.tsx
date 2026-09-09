import type React from 'react'
import { ActionIcon, Indicator } from '@mantine/core'
import { IoNotificationsOutline } from 'react-icons/io5'

interface AnnouncementBellProps {
  /** Total shown in the panel — the bell appears whenever this is non-zero. */
  total: number
  /** Not yet opened. Drives the badge, which disappears once everything is read. */
  unread: number
  onClick: () => void
}

const AnnouncementBell: React.FC<AnnouncementBellProps> = ({ total, unread, onClick }) => {
  if (total === 0) return null

  const bell = (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="md"
      aria-label={
        unread > 0
          ? `${unread} unread of ${total} announcements`
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
