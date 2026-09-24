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
import PinnedAnnouncementBar from '@/features/announcements/components/PinnedAnnouncementBar'
import TestingLauncher from '@/features/testing/components/TestingLauncher'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'

/** Fixed offsets are measured from the top nav; a pinned strip pushes them down. */
const TOOLBAR_BOTTOM = 50
const CAM_TOOLBAR_BOTTOM = 94
const PINNED_HEIGHT = 36
const BANNER_TOP = TOOLBAR_BOTTOM / 2
const RIGHT_DRAWER_WIDTH = 850
const TESTING_LAUNCHER_GAP = 20

interface LayoutProps {
  rightDrawerContent?: React.ReactNode
}
const Layout: React.FC<LayoutProps> = ({ rightDrawerContent }) => {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 36em)')

  const rightDrawerOpen = useAppSelector(selectRightDrawerOpen)

  // Owned here so the banner and the panel share it.
  const announcements = useAnnouncements()
  const announcementState = useAnnouncementState()
  const [announcementsOpen, setAnnouncementsOpen] = useState(false)
  const [focusedAnnouncementId, setFocusedAnnouncementId] = useState<string | null>(null)
  const openAnnouncements = (id: string | null = null) => {
    setFocusedAnnouncementId(id)
    setAnnouncementsOpen(true)
  }

  // Authors pin one at a time; if there are more, the first wins.
  const pinned = announcements.find(a => a.pinned)
  const pinnedOffset = pinned ? PINNED_HEIGHT : 0
  const banner = announcements.find(a => !a.pinned && !announcementState.isDismissed(a.id))

  // A phone's drawer is full width, so nothing fits beside it.
  const drawerShowing = !!rightDrawerContent && rightDrawerOpen && !isMobile
  const testingLauncherRight = TESTING_LAUNCHER_GAP + (drawerShowing ? RIGHT_DRAWER_WIDTH : 0)

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
        {pinned && (
          <div className="fixed left-0 top-0 z-50 w-full" style={{ height: PINNED_HEIGHT }}>
            <PinnedAnnouncementBar
              announcement={pinned}
              onViewMore={() => openAnnouncements(pinned.id)}
            />
          </div>
        )}

        {/* Keyed by id so the next one replays the drop-in. */}
        {banner && (
          <div
            className="pointer-events-none fixed inset-x-0 z-60 flex justify-center px-4"
            style={{ top: pinnedOffset + BANNER_TOP }}
          >
            <AnnouncementBanner
              key={banner.id}
              announcement={banner}
              onViewMore={() => openAnnouncements(banner.id)}
              onDismiss={announcementState.dismiss}
            />
          </div>
        )}

        <div
          className="fixed left-0 z-50 h-12 w-full border-b-2 border-b-primary-500"
          style={{ top: pinnedOffset }}
        >
          <Toolbar
            announcements={announcements}
            announcementState={announcementState}
            onOpenAnnouncements={() => openAnnouncements()}
          />
        </div>

        <div
          className="fixed z-40 flex w-full flex-1"
          style={{ top: TOOLBAR_BOTTOM + pinnedOffset }}
        >
          <CamToolbar />
        </div>

        <div
          className="fixed flex w-full flex-1"
          style={{ top: CAM_TOOLBAR_BOTTOM + pinnedOffset, bottom: 0 }}
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
                width: isMobile ? '100%' : RIGHT_DRAWER_WIDTH,
              }}
            >
              {rightDrawerContent}
            </div>
          )}
        </div>

        {ENVIRONMENT.isDev && (
          <div
            className="fixed bottom-5 z-30 transition-[right] duration-300 ease-out"
            style={{ right: testingLauncherRight }}
          >
            <TestingLauncher />
          </div>
        )}

        <AnnouncementPanel
          announcements={announcements}
          state={announcementState}
          opened={announcementsOpen}
          focusedId={focusedAnnouncementId}
          onClose={() => setAnnouncementsOpen(false)}
        />
      </div>
    </GroupGuardProvider>
  )
}

export default Layout
