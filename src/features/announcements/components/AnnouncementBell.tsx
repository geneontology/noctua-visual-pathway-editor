import type React from 'react'
import { ActionIcon, Indicator } from '@mantine/core'
import { IoNotificationsOutline } from 'react-icons/io5'

interface AnnouncementBellProps {
  count: number
  onClick: () => void
}

const AnnouncementBell: React.FC<AnnouncementBellProps> = ({ count, onClick }) => {
  if (count === 0) return null

  return (
    <Indicator label={count} size={16} color="red" offset={4}>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="md"
        aria-label={`${count} announcement${count === 1 ? '' : 's'}`}
        onClick={onClick}
      >
        <IoNotificationsOutline />
      </ActionIcon>
    </Indicator>
  )
}

export default AnnouncementBell
