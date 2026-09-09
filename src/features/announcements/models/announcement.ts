export type AnnouncementLevel = 'info' | 'success' | 'warning' | 'danger'

export type AnnouncementType =
  | 'announcement'
  | 'update'
  | 'reminder'
  | 'maintenance'
  | 'event'

export type AnnouncementApp = 'landing' | 'form' | 'vpe'

/** Which app this is, for filtering the shared feed. */
export const CURRENT_APP: AnnouncementApp = 'vpe'

/**
 * One entry from the published announcements feed.
 *
 * Shape is fixed by the build in the noctua-announcements repo — see its README.
 * `description` is the banner copy (plain text); `body` is the panel copy
 * (HTML, already sanitized at build time).
 *
 * `level` is how urgent it is (colour); `type` is what kind of thing it is
 * (icon). A pinned announcement always banners and can't be dismissed.
 */
export interface Announcement {
  id: string
  title: string
  level: AnnouncementLevel
  type: AnnouncementType
  pinned: boolean
  apps: AnnouncementApp[]
  starts: string | null
  expires: string | null
  description: string
  body: string
  descriptionUrl: string | null
}
