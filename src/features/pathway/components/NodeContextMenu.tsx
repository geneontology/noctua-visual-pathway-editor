import type React from 'react'
import type { ReactNode } from 'react'
import { MenuItem } from '@/@noctua.core/components/menu/AnchoredMenu'
import CursorAnchoredMenu from './CursorAnchoredMenu'
import {
  FaComment,
  FaCopy,
  FaInfoCircle,
  FaObjectGroup,
  FaPencilAlt,
  FaTrash,
  FaArrowDown,
  FaArrowUp,
  FaProjectDiagram,
} from 'react-icons/fa'

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
  /** Set when 2+ activities are selected, e.g. "3 activities". */
  regionSummary?: string | null
  onCopyRegion?: () => void
  onDeleteRegion?: () => void
  /** Grow the selection along the causal graph from this node. */
  onSelectConnected?: (direction: 'downstream' | 'upstream' | 'connected') => void
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
  regionSummary,
  onCopyRegion,
  onDeleteRegion,
  onSelectConnected,
}) => {
  const run = (action: () => void) => () => {
    onClose()
    action()
  }

  return (
    <CursorAnchoredMenu open={open} x={x} y={y} onClose={onClose}>
      {interactive ? (
        <>
          <MenuItem onClick={run(onEdit)}>
            <Row icon={<FaPencilAlt size={13} />}>Edit activity</Row>
          </MenuItem>
          <MenuItem onClick={run(onCopy)}>
            <Row icon={<FaCopy size={13} />}>Copy activity</Row>
          </MenuItem>
          {regionSummary && onCopyRegion && (
            <MenuItem onClick={run(onCopyRegion)}>
              <Row icon={<FaObjectGroup size={13} />}>Copy {regionSummary}</Row>
            </MenuItem>
          )}
          <MenuItem onClick={run(onComments)}>
            <Row icon={<FaComment size={13} />}>Comments</Row>
          </MenuItem>
          <MenuItem onClick={run(onDelete)} className="!text-red-600 hover:!bg-red-50">
            <Row icon={<FaTrash size={13} />}>Delete activity</Row>
          </MenuItem>
          {regionSummary && onDeleteRegion && (
            <MenuItem onClick={run(onDeleteRegion)} className="!text-red-600 hover:!bg-red-50">
              <Row icon={<FaTrash size={13} />}>Delete {regionSummary}</Row>
            </MenuItem>
          )}
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

      {onSelectConnected && (
        <>
          <div className="my-1 border-t border-gray-200" />
          <span className="block px-3 py-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
            Select
          </span>
          <MenuItem onClick={run(() => onSelectConnected('downstream'))}>
            <Row icon={<FaArrowDown size={13} />}>Downstream</Row>
          </MenuItem>
          <MenuItem onClick={run(() => onSelectConnected('upstream'))}>
            <Row icon={<FaArrowUp size={13} />}>Upstream</Row>
          </MenuItem>
          <MenuItem onClick={run(() => onSelectConnected('connected'))}>
            <Row icon={<FaProjectDiagram size={13} />}>Connected</Row>
          </MenuItem>
        </>
      )}
    </CursorAnchoredMenu>
  )
}

export default NodeContextMenu
