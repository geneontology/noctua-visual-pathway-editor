import type React from 'react'
import { ActionIcon } from '@mantine/core'
import { IoClose } from 'react-icons/io5'
import type { Announcement } from '../models/announcement'
import { bannerStyle } from '../data/announcementLevels'
import { typeIcon } from '../data/announcementTypes'

// `text-inherit` overrides the global link colour on "More details".
const ACTION =
  'rounded px-2 py-1 text-xs font-bold uppercase tracking-wide text-inherit no-underline hover:bg-black/5'

interface AnnouncementBannerProps {
  announcement: Announcement
  onViewMore: () => void
  /** Both "Got it" and ✕: it never pops up again, and stays unread in the panel. */
  onDismiss: (id: string) => void
}

/** The topmost unacknowledged announcement, floating over the editor. */
const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcement,
  onViewMore,
  onDismiss,
}) => {
  const Icon = typeIcon(announcement.type)

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-xl items-start gap-3 rounded-xl border-2 p-3 shadow-xl motion-safe:animate-heads-up ${bannerStyle(announcement.level)}`}
      role="status"
      data-testid="announcement-banner"
    >
      <Icon className="mt-0.5 shrink-0 text-lg" />

      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{announcement.title}</div>
        <div className="mt-0.5 line-clamp-2 text-xs">{announcement.description}</div>

        <div className="mt-2 -ml-2 flex items-center gap-1">
          <button type="button" className={ACTION} onClick={() => onDismiss(announcement.id)}>
            Got it
          </button>

          {announcement.descriptionUrl && (
            <a
              className={`ml-auto ${ACTION}`}
              href={announcement.descriptionUrl}
              target="_blank"
              rel="noreferrer"
            >
              More details
            </a>
          )}

          <button
            type="button"
            className={`${announcement.descriptionUrl ? '' : 'ml-auto'} ${ACTION}`}
            onClick={onViewMore}
          >
            View more
          </button>
        </div>
      </div>

      <ActionIcon
        className="-mr-1 -mt-1 shrink-0"
        variant="subtle"
        color="gray"
        size="sm"
        aria-label="Close announcement"
        onClick={() => onDismiss(announcement.id)}
      >
        <IoClose />
      </ActionIcon>
    </div>
  )
}

export default AnnouncementBanner
