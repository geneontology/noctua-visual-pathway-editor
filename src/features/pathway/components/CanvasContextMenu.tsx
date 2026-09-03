import type React from 'react'
import { MenuItem } from '@/@noctua.core/components/menu/AnchoredMenu'
import CursorAnchoredMenu from './CursorAnchoredMenu'
import { FaPaste, FaObjectGroup } from 'react-icons/fa'

interface CanvasContextMenuProps {
  open: boolean
  /** Viewport coordinates of the right-click — where the pasted node lands. */
  x: number
  y: number
  onClose: () => void
  onPaste: () => void
  /** Present only when a copied region is waiting in localStorage. */
  regionSummary?: string | null
  onPasteRegion?: () => void
}

/** Right-click menu on empty canvas. */
const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  open,
  x,
  y,
  onClose,
  onPaste,
  regionSummary,
  onPasteRegion,
}) => (
  <CursorAnchoredMenu open={open} x={x} y={y} onClose={onClose}>
    {regionSummary && onPasteRegion && (
      <MenuItem
        onClick={() => {
          onClose()
          onPasteRegion()
        }}
      >
        <span className="flex items-center gap-2">
          <FaObjectGroup size={13} />
          Paste {regionSummary}
        </span>
      </MenuItem>
    )}
    <MenuItem
      onClick={() => {
        onClose()
        onPaste()
      }}
    >
      <span className="flex items-center gap-2">
        <FaPaste size={13} />
        Paste activity
      </span>
    </MenuItem>
  </CursorAnchoredMenu>
)

export default CanvasContextMenu
