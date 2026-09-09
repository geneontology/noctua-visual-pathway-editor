import type React from 'react'
import { ActionIcon, Button } from '@mantine/core'
import { IoClose } from 'react-icons/io5'
import type { Announcement } from '../models/announcement'
import { bannerStyle } from '../data/announcementLevels'
import { typeIcon } from '../data/announcementTypes'

interface AnnouncementBannerProps {
  announcement: Announcement
  onViewMore: () => void
  onClose: (id: string) => void
}

/**
 * Sits above the top nav, full width, showing the topmost announcement.
 *
 * Closing it hides this announcement's banner for good (remembered per id, so a
 * newly published one still banners) but leaves it in the panel. That is a
 * separate thing from having read it — folding the two together made the banner
 * vanish as soon as anyone opened the panel.
 */
const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcement,
  onViewMore,
  onClose,
}) => {
  const Icon = typeIcon(announcement.type)

  return (
    <div
      className={`flex h-full w-full items-center justify-center border-b px-4 text-xs ${bannerStyle(announcement.level)}`}
      role="status"
    >
      <div className="flex min-w-0 max-w-5xl flex-1 items-center gap-2">
        <Icon className="shrink-0" />
        <span className="shrink-0 font-bold">{announcement.title}</span>
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

        <Button
          className="!ml-auto shrink-0 !text-2xs !normal-case"
          variant="default"
          size="compact-xs"
          onClick={onViewMore}
        >
          View more
        </Button>

        {/* A pinned announcement stays put — that's the point of pinning it. */}
        {!announcement.pinned && (
          <ActionIcon
            className="shrink-0"
            variant="subtle"
            color="gray"
            size="sm"
            aria-label="Close announcement"
            onClick={() => onClose(announcement.id)}
          >
            <IoClose />
          </ActionIcon>
        )}
      </div>
    </div>
  )
}

export default AnnouncementBanner
