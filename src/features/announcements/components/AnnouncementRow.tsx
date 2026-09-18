import type React from 'react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { IoArrowUndoOutline, IoChevronDown, IoClose, IoPin } from 'react-icons/io5'
import type { Announcement } from '../models/announcement'
import { accentStyle, dotStyle } from '../data/announcementLevels'
import { typeIcon } from '../data/announcementTypes'
import { relativeAge } from '../hooks/useAnnouncements'

interface AnnouncementRowProps {
  announcement: Announcement
  expanded: boolean
  read: boolean
  /** Only ever true in the panel's "all" view, where dismissed rows are listed. */
  dismissed?: boolean
  onToggle: () => void
  onDismiss: () => void
  onRestore?: () => void
}

/**
 * One notification. Collapsed it shows a single line of the description;
 * expanded it reveals the full body.
 *
 * The expander sits on the left like a tree and dismiss/restore on the right, so
 * the two never share a spot, and both are always visible rather than appearing
 * on hover. Pinned rows have no dismiss control at all.
 */
const AnnouncementRow: React.FC<AnnouncementRowProps> = ({
  announcement,
  expanded,
  read,
  dismissed = false,
  onToggle,
  onDismiss,
  onRestore,
}) => {
  const Icon = typeIcon(announcement.type)
  const age = relativeAge(announcement.starts)

  return (
    <div
      className={`relative rounded-r border-l-4 bg-white shadow-sm transition-shadow hover:shadow ${accentStyle(announcement.level)} ${dismissed ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        className="flex w-full items-start gap-2 p-2.5 pr-9 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {/* Points right when closed, down when open — the usual tree affordance. */}
        <IoChevronDown
          className={`mt-1 shrink-0 text-xs text-gray-400 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />

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
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 pl-[54px]">
          {/* Sanitized at build time in noctua-announcements (scripts/build.mjs),
              so the feed never carries markup this app has to clean up. */}
          <div
            className="noc-announcement-body text-2xs leading-relaxed text-gray-700"
            dangerouslySetInnerHTML={{ __html: announcement.body }}
          />

          {announcement.descriptionUrl && (
            <a
              className="mt-2 inline-block text-2xs font-medium underline"
              href={announcement.descriptionUrl}
              target="_blank"
              rel="noreferrer"
            >
              More details
            </a>
          )}
        </div>
      )}

      {dismissed ? (
        <Tooltip label="Restore" position="left" withArrow openDelay={300}>
          <ActionIcon
            className="!absolute !right-1.5 !top-2"
            variant="subtle"
            color="gray"
            size="xs"
            aria-label={`Restore ${announcement.title}`}
            onClick={onRestore}
          >
            <IoArrowUndoOutline />
          </ActionIcon>
        </Tooltip>
      ) : (
        // A pinned announcement is not dismissable, so it gets no control.
        !announcement.pinned && (
          <Tooltip label="Dismiss" position="left" withArrow openDelay={300}>
            <ActionIcon
              className="!absolute !right-1.5 !top-2"
              variant="subtle"
              color="gray"
              size="xs"
              aria-label={`Dismiss ${announcement.title}`}
              onClick={onDismiss}
            >
              <IoClose />
            </ActionIcon>
          </Tooltip>
        )
      )}
    </div>
  )
}

export default AnnouncementRow
