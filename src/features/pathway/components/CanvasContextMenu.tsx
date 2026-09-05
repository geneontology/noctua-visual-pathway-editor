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
  /**
   * What is on the clipboard, or null when nothing is. Both kinds are mirrored
   * into localStorage, so this can be answered synchronously — the menu offers
   * Paste only when there is genuinely something to paste.
   */
  paste: { kind: 'region' | 'activity'; summary: string } | null
  /** False when not logged in — the menu still opens, but offers no edit. */
  canEdit?: boolean
}

/** Right-click menu on empty canvas. */
const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  open,
  x,
  y,
  onClose,
  onPaste,
  paste,
  canEdit = true,
}) => (
  <CursorAnchoredMenu open={open} x={x} y={y} onClose={onClose}>
    {!canEdit ? (
      <span className="block px-3 py-1.5 text-sm text-gray-400">Log in to edit</span>
    ) : paste ? (
      <MenuItem
        onClick={() => {
          onClose()
          onPaste()
        }}
      >
        <span className="flex items-center gap-2">
          {paste.kind === 'region' ? <FaObjectGroup size={13} /> : <FaPaste size={13} />}
          Paste {paste.summary}
        </span>
      </MenuItem>
    ) : (
      <span className="block px-3 py-1.5 text-sm text-gray-400">Nothing to paste</span>
    )}
  </CursorAnchoredMenu>
)

export default CanvasContextMenu
