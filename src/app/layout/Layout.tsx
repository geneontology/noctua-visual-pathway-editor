import type React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Toolbar from './Toolbar'
import Footer from './Footer'
import { selectRightDrawerOpen } from '@/@noctua.core/components/drawer/drawerSlice'
import { useAppSelector } from '../hooks'
import { initGA, trackPageView } from '@/analytics'
import { useEffect } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import CamToolbar from '@/features/gocam/components/CamToolbar'
import GroupGuardProvider from '@/features/gocam/components/GroupGuardProvider'
import LoadingOverlay from '@/@noctua.core/components/loading-overlay/LoadingOverlay'
import {
  useAnnouncements,
  useAnnouncementDismissal,
} from '@/features/announcements/hooks/useAnnouncements'
import AnnouncementBanner from '@/features/announcements/components/AnnouncementBanner'

/** Fixed offsets below are measured from the toolbar; the banner shifts them. */
const TOOLBAR_BOTTOM = 50
const CAM_TOOLBAR_BOTTOM = 94
const BANNER_HEIGHT = 32

interface LayoutProps {
  rightDrawerContent?: React.ReactNode
}
const Layout: React.FC<LayoutProps> = ({ rightDrawerContent }) => {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 36em)')

  const rightDrawerOpen = useAppSelector(selectRightDrawerOpen)

  const announcements = useAnnouncements()
  const { isDismissed, dismiss } = useAnnouncementDismissal()
  // Only the topmost announcement gets a banner; the rest live behind the bell.
  const banner = announcements.find(a => !isDismissed(a.id))
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
        <div className="fixed left-0 top-0 z-50 h-12 w-full border-b-2 border-b-primary-500">
          <Toolbar />
        </div>
        {banner && (
          <div
            className="fixed left-0 z-40 w-full"
            style={{ top: TOOLBAR_BOTTOM, height: BANNER_HEIGHT }}
          >
            <AnnouncementBanner announcement={banner} onDismiss={dismiss} />
          </div>
        )}

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
      </div>
    </GroupGuardProvider>
  )
}

export default Layout
