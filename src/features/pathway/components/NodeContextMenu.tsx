import type React from 'react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import AnchoredMenu, { MenuItem } from '@/@noctua.core/components/menu/AnchoredMenu'
import { FaComment, FaCopy, FaInfoCircle, FaPencilAlt, FaTrash } from 'react-icons/fa'

interface NodeContextMenuProps {
  open: boolean
  /** Viewport coordinates of the right-click. */
  x: number
  y: number
  /** False when not logged in — mirrors the read-only hover icons. */
  interactive: boolean
  onClose: () => void
  onView: () => void
  onEdit: () => void
  onCopy: () => void
  onComments: () => void
  onDelete: () => void
}

const Row = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <span className="flex items-center gap-2">
    {icon}
    {children}
  </span>
)

/**
 * Right-click menu on a pathway node. Offers the same actions as the icons that
 * appear on node hover.
 */
const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  open,
  x,
  y,
  interactive,
  onClose,
  onView,
  onEdit,
  onCopy,
  onComments,
  onDelete,
}) => {
  // AnchoredMenu positions against a real element, so the cursor point is
  // represented by a 1x1 placeholder parked at the click coordinates.
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)

  const run = (action: () => void) => () => {
    onClose()
    action()
  }

  return (
    <>
      <div
        ref={setAnchor}
        className="pointer-events-none fixed h-px w-px"
        style={{ left: x, top: y }}
      />
      <AnchoredMenu anchorEl={anchor} open={open} onClose={onClose}>
        {interactive ? (
          <>
            <MenuItem onClick={run(onEdit)}>
              <Row icon={<FaPencilAlt size={13} />}>Edit activity</Row>
            </MenuItem>
            <MenuItem onClick={run(onCopy)}>
              <Row icon={<FaCopy size={13} />}>Copy activity</Row>
            </MenuItem>
            <MenuItem onClick={run(onComments)}>
              <Row icon={<FaComment size={13} />}>Comments</Row>
            </MenuItem>
            <MenuItem onClick={run(onDelete)} className="!text-red-600 hover:!bg-red-50">
              <Row icon={<FaTrash size={13} />}>Delete activity</Row>
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={run(onView)}>
              <Row icon={<FaInfoCircle size={13} />}>View activity</Row>
            </MenuItem>
            <MenuItem onClick={run(onComments)}>
              <Row icon={<FaComment size={13} />}>Comments</Row>
            </MenuItem>
          </>
        )}
      </AnchoredMenu>
    </>
  )
}

export default NodeContextMenu
