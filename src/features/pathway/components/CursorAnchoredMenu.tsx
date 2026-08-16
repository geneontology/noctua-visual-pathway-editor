import type React from 'react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import AnchoredMenu from '@/@noctua.core/components/menu/AnchoredMenu'

interface CursorAnchoredMenuProps {
  open: boolean
  /** Viewport coordinates of the right-click. */
  x: number
  y: number
  onClose: () => void
  children: ReactNode
}

/**
 * Context-menu shell for the pathway canvas. AnchoredMenu positions against a
 * real element, so the cursor point is represented by a 1x1 placeholder parked
 * at the click coordinates — that way both menus inherit its viewport flipping,
 * outside-click and Escape handling.
 */
const CursorAnchoredMenu: React.FC<CursorAnchoredMenuProps> = ({
  open,
  x,
  y,
  onClose,
  children,
}) => {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)

  return (
    <>
      <div
        ref={setAnchor}
        className="pointer-events-none fixed h-px w-px"
        style={{ left: x, top: y }}
      />
      <AnchoredMenu anchorEl={anchor} open={open} onClose={onClose}>
        {children}
      </AnchoredMenu>
    </>
  )
}

export default CursorAnchoredMenu
