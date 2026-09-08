import type React from 'react'
import { Drawer } from '@mantine/core'
import type { Announcement } from '../models/announcement'
import { levelStyle } from '../data/announcementLevels'

interface AnnouncementPanelProps {
  announcements: Announcement[]
  opened: boolean
  onClose: () => void
}

const AnnouncementPanel: React.FC<AnnouncementPanelProps> = ({
  announcements,
  opened,
  onClose,
}) => {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title="Announcements"
      zIndex={100}
    >
      <div className="flex flex-col gap-3">
        {announcements.map(announcement => (
          <div
            key={announcement.id}
            className={`rounded border p-3 ${levelStyle(announcement.level)}`}
          >
            <div className="text-sm font-bold">{announcement.title}</div>

            {/* Sanitized at build time in noctua-announcements (scripts/build.mjs),
                so the feed never carries markup this app has to clean up. */}
            <div
              className="noc-announcement-body mt-1 text-xs"
              dangerouslySetInnerHTML={{ __html: announcement.body }}
            />

            {announcement.descriptionUrl && (
              <a
                className="mt-2 inline-block text-xs underline"
                href={announcement.descriptionUrl}
                target="_blank"
                rel="noreferrer"
              >
                More details
              </a>
            )}
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="text-sm text-gray-400">No announcements right now.</div>
        )}
      </div>
    </Drawer>
  )
}

export default AnnouncementPanel
