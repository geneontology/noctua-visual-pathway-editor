import type React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Toolbar from './Toolbar'
import Footer from './Footer'
import { selectRightDrawerOpen } from '@/@noctua.core/components/drawer/drawerSlice'
import { useAppSelector } from '../hooks'
import { initGA, trackPageView } from '@/analytics'
import { useEffect, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import CamToolbar from '@/features/gocam/components/CamToolbar'
import GroupGuardProvider from '@/features/gocam/components/GroupGuardProvider'
import LoadingOverlay from '@/@noctua.core/components/loading-overlay/LoadingOverlay'
import {
  useAnnouncements,
  useAnnouncementState,
} from '@/features/announcements/hooks/useAnnouncements'
import AnnouncementBanner from '@/features/announcements/components/AnnouncementBanner'
import AnnouncementPanel from '@/features/announcements/components/AnnouncementPanel'

/** Fixed offsets are measured from the top nav; the banner sits above it and
    pushes everything down by its own height. */
const TOOLBAR_BOTTOM = 50
const CAM_TOOLBAR_BOTTOM = 94
const BANNER_HEIGHT = 36

interface LayoutProps {
  rightDrawerContent?: React.ReactNode
}
const Layout: React.FC<LayoutProps> = ({ rightDrawerContent }) => {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 36em)')

  const rightDrawerOpen = useAppSelector(selectRightDrawerOpen)

  // Owned here rather than in the Toolbar so the banner and the panel share it:
  // reading something in the panel closes its banner straight away.
  const announcements = useAnnouncements()
  const announcementState = useAnnouncementState()
  const [announcementsOpen, setAnnouncementsOpen] = useState(false)
  // The topmost announcement banners until it is explicitly closed or cleared.
  // Reading it in the panel must not make it vanish. A pinned one can't be
  // closed at all. Closing the top one reveals the next.
  const banner = announcements.find(
    a =>
      a.pinned ||
      (!announcementState.isBannerClosed(a.id) && !announcementState.isDismissed(a.id))
  )
  const bannerOffset = banner ? BANNER_HEIGHT : 0

  useEffect(() => {
    initGA('G-LHBLYRN338')
  }, [])

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return (
    <GroupGuardProvider>
      <div className="flex h-screen w-full flex-col bg-gray-300">
        <LoadingOverlay />
        {banner && (
          <div
            className="fixed left-0 top-0 z-50 w-full"
            style={{ height: BANNER_HEIGHT }}
          >
            <AnnouncementBanner
              announcement={banner}
              onViewMore={() => setAnnouncementsOpen(true)}
              onClose={announcementState.closeBanner}
            />
          </div>
        )}

        <div
          className="fixed left-0 z-50 h-12 w-full border-b-2 border-b-primary-500"
          style={{ top: bannerOffset }}
        >
          <Toolbar
            announcements={announcements}
            announcementState={announcementState}
            onOpenAnnouncements={() => setAnnouncementsOpen(true)}
          />
        </div>

        <div
          className="fixed z-40 flex w-full flex-1"
          style={{ top: TOOLBAR_BOTTOM + bannerOffset }}
        >
          <CamToolbar />
        </div>

        <div
          className="fixed flex w-full flex-1"
          style={{ top: CAM_TOOLBAR_BOTTOM + bannerOffset, bottom: 0 }}
        >
          <div className="flex-1 overflow-auto">
            <Outlet />
            <Footer />
          </div>

          {rightDrawerContent && (
            <div
              className={`absolute inset-y-0 right-0 overflow-hidden border-l border-gray-300 bg-white shadow-lg transition-transform duration-300 ease-out ${rightDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
              style={{
                width: isMobile ? '100%' : 850,
              }}
            >
              {rightDrawerContent}
            </div>
          )}
        </div>

        <AnnouncementPanel
          announcements={announcements}
          state={announcementState}
          opened={announcementsOpen}
          onClose={() => setAnnouncementsOpen(false)}
        />
      </div>
    </GroupGuardProvider>
  )
}

export default Layout
