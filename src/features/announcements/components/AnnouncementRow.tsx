import type React from 'react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { IoArrowUndoOutline, IoChevronDown, IoClose, IoPin } from 'react-icons/io5'
import type { Announcement } from '../models/announcement'
import { accentStyle, dotStyle } from '../data/announcementLevels'
import { typeIcon } from '../data/announcementTypes'
import { createdOn, relativeAge } from '../hooks/useAnnouncements'

interface AnnouncementRowProps {
  announcement: Announcement
  expanded: boolean
  read: boolean
  /** Listed under the panel's Read heading: muted, and offers Mark as unread. */
  filedAsRead?: boolean
  onToggle: () => void
  onMarkRead: () => void
  onMarkUnread?: () => void
}

/**
 * One notification. Collapsed it shows a single line of the description;
 * expanded it reveals the full body.
 *
 * The expander sits on the left like a tree and mark read/unread on the right, so
 * the two never share a spot, and both are always visible rather than appearing
 * on hover. Pinned rows have no such control.
 */
const AnnouncementRow: React.FC<AnnouncementRowProps> = ({
  announcement,
  expanded,
  read,
  filedAsRead = false,
  onToggle,
  onMarkRead,
  onMarkUnread,
}) => {
  const Icon = typeIcon(announcement.type)
  const age = relativeAge(createdOn(announcement))
  // Solid greys, not opacity: faded text failed the 4.5:1 contrast minimum.
  const accent = filedAsRead ? 'text-gray-400 border-l-gray-300' : accentStyle(announcement.level)

  return (
    <div
      className={`relative rounded-r border-l-4 shadow-sm transition-shadow hover:shadow ${accent} ${filedAsRead ? 'bg-gray-50' : 'bg-white'}`}
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

        <Icon className={`mt-0.5 shrink-0 text-base ${accent}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {!read && (
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyle(announcement.level)}`}
                aria-label="Unread"
              />
            )}
            <span
              className={`truncate text-sm ${filedAsRead ? 'text-gray-600' : 'text-gray-900'} ${read ? 'font-medium' : 'font-bold'}`}
            >
              {announcement.title}
            </span>
            {announcement.pinned && (
              <IoPin className="shrink-0 text-xs text-gray-400" aria-label="Pinned" />
            )}
            <span className="ml-auto shrink-0 text-xs text-gray-500">{age}</span>
          </div>

          {!expanded && (
            <div className="truncate text-xs text-gray-500">{announcement.description}</div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 pl-[54px]">
          {/* Sanitized at build time in noctua-announcements (scripts/build.mjs),
              so the feed never carries markup this app has to clean up. */}
          <div
            className="noc-announcement-body text-xs leading-relaxed text-gray-700"
            dangerouslySetInnerHTML={{ __html: announcement.body }}
          />

          {announcement.descriptionUrl && (
            <a
              className="mt-2 inline-block text-xs font-medium underline"
              href={announcement.descriptionUrl}
              target="_blank"
              rel="noreferrer"
            >
              More details
            </a>
          )}
        </div>
      )}

      {filedAsRead ? (
        <Tooltip label="Mark as unread" position="left" withArrow openDelay={300}>
          <ActionIcon
            className="!absolute !right-1.5 !top-2.5"
            variant="subtle"
            color="gray"
            size="xs"
            aria-label={`Mark ${announcement.title} as unread`}
            onClick={onMarkUnread}
          >
            <IoArrowUndoOutline />
          </ActionIcon>
        </Tooltip>
      ) : (
        // A pinned announcement always stays at the top, so it gets no control.
        !announcement.pinned && (
          <Tooltip label="Mark as read" position="left" withArrow openDelay={300}>
            <ActionIcon
              className="!absolute !right-1.5 !top-2.5"
              variant="subtle"
              color="gray"
              size="xs"
              aria-label={`Mark ${announcement.title} as read`}
              onClick={onMarkRead}
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
