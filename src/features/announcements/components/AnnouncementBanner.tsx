import type React from 'react'
import { ActionIcon } from '@mantine/core'
import { IoClose } from 'react-icons/io5'
import type { Announcement } from '../models/announcement'
import { levelStyle } from '../data/announcementLevels'

interface AnnouncementBannerProps {
  announcement: Announcement
  onDismiss: (id: string) => void
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcement,
  onDismiss,
}) => {
  return (
    <div
      className={`flex h-full w-full items-center gap-2 border-b px-4 text-xs ${levelStyle(announcement.level)}`}
      role="status"
    >
      <span className="font-bold">{announcement.title}</span>
      <span className="truncate">{announcement.description}</span>

      {announcement.descriptionUrl && (
        <a
          className="shrink-0 whitespace-nowrap underline"
          href={announcement.descriptionUrl}
          target="_blank"
          rel="noreferrer"
        >
          More details
        </a>
      )}

      <ActionIcon
        className="!ml-auto shrink-0"
        variant="subtle"
        color="gray"
        size="sm"
        aria-label="Dismiss announcement"
        onClick={() => onDismiss(announcement.id)}
      >
        <IoClose />
      </ActionIcon>
    </div>
  )
}

export default AnnouncementBanner
