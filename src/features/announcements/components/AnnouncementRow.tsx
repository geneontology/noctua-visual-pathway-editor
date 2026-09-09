import type React from 'react'
import { ActionIcon } from '@mantine/core'
import { IoChevronDown, IoClose, IoPin } from 'react-icons/io5'
import type { Announcement } from '../models/announcement'
import { accentStyle, dotStyle } from '../data/announcementLevels'
import { typeIcon } from '../data/announcementTypes'
import { relativeAge } from '../hooks/useAnnouncements'

interface AnnouncementRowProps {
  announcement: Announcement
  expanded: boolean
  read: boolean
  onToggle: () => void
  onDismiss: () => void
}

/**
 * One notification. Collapsed it shows a single line of the description;
 * expanded it reveals the full body. Pinned rows can't be dismissed.
 */
const AnnouncementRow: React.FC<AnnouncementRowProps> = ({
  announcement,
  expanded,
  read,
  onToggle,
  onDismiss,
}) => {
  const Icon = typeIcon(announcement.type)
  const age = relativeAge(announcement.starts)

  return (
    <div
      className={`group relative rounded-r border-l-4 bg-white shadow-sm transition-shadow hover:shadow ${accentStyle(announcement.level)}`}
    >
      <button
        type="button"
        className="flex w-full items-start gap-2.5 p-2.5 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <Icon className={`mt-0.5 shrink-0 text-base ${accentStyle(announcement.level)}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {!read && (
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyle(announcement.level)}`}
                aria-label="Unread"
              />
            )}
            <span
              className={`truncate text-xs text-gray-900 ${read ? 'font-medium' : 'font-bold'}`}
            >
              {announcement.title}
            </span>
            {announcement.pinned && (
              <IoPin className="shrink-0 text-2xs text-gray-400" aria-label="Pinned" />
            )}
            <span className="ml-auto shrink-0 text-2xs text-gray-400">{age}</span>
          </div>

          {!expanded && (
            <div className="truncate text-2xs text-gray-500">{announcement.description}</div>
          )}
        </div>

        <IoChevronDown
          className={`mt-0.5 shrink-0 text-xs text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 pl-[34px]">
          {/* Sanitized at build time in noctua-announcements (scripts/build.mjs),
              so the feed never carries markup this app has to clean up. */}
          <div
            className="noc-announcement-body text-2xs leading-relaxed text-gray-700"
            dangerouslySetInnerHTML={{ __html: announcement.body }}
          />

          <div className="mt-2 flex items-center gap-3">
            {announcement.descriptionUrl && (
              <a
                className="text-2xs font-medium underline"
                href={announcement.descriptionUrl}
                target="_blank"
                rel="noreferrer"
              >
                More details
              </a>
            )}
            {!announcement.pinned && (
              <button
                type="button"
                className="text-2xs text-gray-400 hover:text-gray-700"
                onClick={onDismiss}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {!announcement.pinned && !expanded && (
        <ActionIcon
          className="!absolute !right-1 !top-1 !opacity-0 group-hover:!opacity-100"
          variant="subtle"
          color="gray"
          size="xs"
          aria-label={`Dismiss ${announcement.title}`}
          onClick={onDismiss}
        >
          <IoClose />
        </ActionIcon>
      )}
    </div>
  )
}

export default AnnouncementRow
