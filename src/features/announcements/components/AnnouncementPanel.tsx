import type React from 'react'
import { useState } from 'react'
import { Drawer } from '@mantine/core'
import { IoNotificationsOffOutline } from 'react-icons/io5'
import type { Announcement } from '../models/announcement'
import type { AnnouncementState } from '../hooks/useAnnouncements'
import AnnouncementRow from './AnnouncementRow'

interface AnnouncementPanelProps {
  announcements: Announcement[]
  state: AnnouncementState
  opened: boolean
  onClose: () => void
}

/**
 * The notification shade. Rows are collapsed to a title and one line by default
 * and expand in place — opening the panel shouldn't mean scrolling past the full
 * text of every announcement to reach the one you want.
 */
const AnnouncementPanel: React.FC<AnnouncementPanelProps> = ({
  announcements,
  state,
  opened,
  onClose,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const visible = announcements.filter(a => a.pinned || !state.isDismissed(a.id))
  const clearable = visible.filter(a => !a.pinned).map(a => a.id)

  // Accordion rather than independent toggles: one announcement is what you came
  // for, and it keeps the shade scannable.
  const toggle = (announcement: Announcement) => {
    const opening = expandedId !== announcement.id
    setExpandedId(opening ? announcement.id : null)
    if (opening) state.markRead(announcement.id)
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={380}
      zIndex={100}
      title={
        <div className="flex w-full items-center gap-2">
          <span className="text-sm font-bold">Notifications</span>
          {clearable.length > 0 && (
            <button
              type="button"
              className="ml-auto text-2xs text-gray-500 hover:text-gray-900"
              onClick={() => {
                state.dismissAll(clearable)
                setExpandedId(null)
              }}
            >
              Clear all
            </button>
          )}
        </div>
      }
      classNames={{ body: 'bg-gray-100 h-full' }}
    >
      <div className="flex flex-col gap-1.5 pb-4">
        {visible.map(announcement => (
          <AnnouncementRow
            key={announcement.id}
            announcement={announcement}
            expanded={expandedId === announcement.id}
            read={state.isRead(announcement.id)}
            onToggle={() => toggle(announcement)}
            onDismiss={() => {
              state.dismiss(announcement.id)
              if (expandedId === announcement.id) setExpandedId(null)
            }}
          />
        ))}

        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
            <IoNotificationsOffOutline className="text-2xl" />
            <span className="text-xs">You&apos;re all caught up</span>
          </div>
        )}
      </div>
    </Drawer>
  )
}

export default AnnouncementPanel
