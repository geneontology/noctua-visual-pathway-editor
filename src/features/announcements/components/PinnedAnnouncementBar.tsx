import type React from 'react'
import { Button } from '@mantine/core'
import type { Announcement } from '../models/announcement'
import { bannerStyle } from '../data/announcementLevels'
import { typeIcon } from '../data/announcementTypes'

interface PinnedAnnouncementBarProps {
  announcement: Announcement
  onViewMore: () => void
}

/** A pinned announcement: it can't be closed, so it takes its own strip above the nav. */
const PinnedAnnouncementBar: React.FC<PinnedAnnouncementBarProps> = ({
  announcement,
  onViewMore,
}) => {
  const Icon = typeIcon(announcement.type)

  return (
    <div
      className={`flex h-full w-full items-center justify-center border-b px-4 text-xs ${bannerStyle(announcement.level)}`}
      role="status"
      data-testid="pinned-announcement"
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
          className="!ml-auto shrink-0 !text-xs !normal-case"
          variant="default"
          size="compact-xs"
          onClick={onViewMore}
        >
          View more
        </Button>
      </div>
    </div>
  )
}

export default PinnedAnnouncementBar
