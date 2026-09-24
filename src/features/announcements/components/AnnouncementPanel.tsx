import type React from 'react'
import { useEffect, useState } from 'react'
import { Drawer, Switch } from '@mantine/core'
import { IoNotificationsOffOutline } from 'react-icons/io5'
import { usePreference } from '@/@noctua.core/hooks/usePreference'
import type { Announcement } from '../models/announcement'
import { createdOn } from '../hooks/useAnnouncements'
import type { AnnouncementState } from '../hooks/useAnnouncements'
import AnnouncementRow from './AnnouncementRow'

interface AnnouncementPanelProps {
  announcements: Announcement[]
  state: AnnouncementState
  opened: boolean
  /** Opened from a banner's "View more": the announcement to land on, expanded. */
  focusedId?: string | null
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
  focusedId = null,
  onClose,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showRead, setShowRead] = usePreference('announcements.showRead')

  // What was read when the panel opened. Reading a row now doesn't move it under
  // Read until the panel is next opened, so it doesn't jump away mid-read.
  const [readAtOpen, setReadAtOpen] = useState<string[] | null>(null)
  if (opened && readAtOpen === null) {
    setReadAtOpen(announcements.filter(a => state.isRead(a.id)).map(a => a.id))
  }
  if (!opened && readAtOpen !== null) setReadAtOpen(null)

  const { markRead } = state
  useEffect(() => {
    if (!opened || !focusedId) return
    setExpandedId(focusedId)
    markRead(focusedId)
  }, [opened, focusedId, markRead])

  const isFiledAsRead = (announcement: Announcement) =>
    !announcement.pinned &&
    state.isRead(announcement.id) &&
    (readAtOpen ?? []).includes(announcement.id)

  const newestFirst = (a: Announcement, b: Announcement) =>
    Number(b.pinned) - Number(a.pinned) || (createdOn(b) ?? '').localeCompare(createdOn(a) ?? '')

  const unread = announcements.filter(a => !isFiledAsRead(a)).sort(newestFirst)
  const read = showRead ? announcements.filter(isFiledAsRead).sort(newestFirst) : []

  // Accordion rather than independent toggles: one announcement is what you came
  // for, and it keeps the shade scannable.
  const toggle = (announcement: Announcement) => {
    const opening = expandedId !== announcement.id
    setExpandedId(opening ? announcement.id : null)
    if (opening) state.markRead(announcement.id)
  }

  const renderRow = (announcement: Announcement) => (
    <AnnouncementRow
      key={announcement.id}
      announcement={announcement}
      expanded={expandedId === announcement.id}
      read={state.isRead(announcement.id)}
      filedAsRead={isFiledAsRead(announcement)}
      onToggle={() => toggle(announcement)}
      onMarkRead={() => {
        state.markRead(announcement.id)
        setReadAtOpen(previous => [...(previous ?? []), announcement.id])
        if (expandedId === announcement.id) setExpandedId(null)
      }}
      onMarkUnread={() => state.markUnread(announcement.id)}
    />
  )

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={420}
      zIndex={100}
      title={
        <div className="flex w-full items-center gap-3">
          <span className="text-base font-bold">Notifications</span>

          <Switch
            className="ml-auto"
            size="xs"
            label="Show read"
            labelPosition="left"
            checked={showRead}
            onChange={event => {
              setShowRead(event.currentTarget.checked)
              setExpandedId(null)
            }}
          />
        </div>
      }
      // Mantine's title only grows to fit its content; flex-1 lets ml-auto work.
      classNames={{ title: 'flex-1 mr-3', body: 'bg-gray-100 h-full' }}
    >
      <div className="flex flex-col gap-1.5 pt-2 pb-4">
        {unread.map(renderRow)}

        {unread.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
            <IoNotificationsOffOutline className="text-2xl" />
            <span className="text-xs">You're all caught up</span>
          </div>
        )}

        {read.length > 0 && (
          <>
            <div className="mt-3 flex items-center gap-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Read</span>
              <span className="rounded-md bg-gray-200 px-1.5 py-0.5 text-2xs font-semibold text-gray-600">
                {read.length}
              </span>
            </div>
            {read.map(renderRow)}
          </>
        )}
      </div>
    </Drawer>
  )
}

export default AnnouncementPanel
