import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import { FaComment, FaPencilAlt, FaTrash } from 'react-icons/fa'

interface EditableCellProps {
  label: string
  onEdit?: () => void
  onDelete?: () => void
  /** Open the comment editor for this cell's individual (#231). Sits just above the edit icon. */
  onComment?: () => void
  /** Number of comments on this cell's individual — turns the comment icon green and shows a count. */
  commentCount?: number
  className?: string
  style?: CSSProperties
  children: ReactNode
}

const EditableCell = forwardRef<HTMLDivElement, EditableCellProps>(
  ({ label, onEdit, onDelete, onComment, commentCount = 0, className = '', style, children }, ref) => (
    <div
      ref={ref}
      className={`group/cell relative break-words rounded-md border border-gray-400 px-1.5 py-2 text-sm text-black hover:border-primary-500 ${className}`}
      style={style}
    >
      <div className="absolute -top-1.5 left-1 h-3 max-w-[80%] truncate bg-white px-1 text-xs leading-3 text-gray-500 group-hover/cell:text-primary-500">
        {label}
      </div>
      {children}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center text-red-400 opacity-0 pointer-events-none transition-opacity hover:bg-red-400 hover:text-white group-hover/cell:opacity-100 group-hover/cell:pointer-events-auto"
        >
          <FaTrash size={10} />
        </button>
      )}
      {onComment && (
        <button
          onClick={onComment}
          title={commentCount > 0 ? `${commentCount} comment${commentCount > 1 ? 's' : ''}` : 'Add comment'}
          aria-label={commentCount > 0 ? `Comments (${commentCount})` : 'Add comment'}
          className={`absolute bottom-5 right-0 flex h-5 w-5 items-center justify-center transition-opacity hover:bg-primary-500 hover:text-white ${
            commentCount > 0
              ? 'text-green-600 opacity-100'
              : 'text-gray-400 opacity-0 pointer-events-none group-hover/cell:opacity-100 group-hover/cell:pointer-events-auto'
          }`}
        >
          <FaComment size={9} />
          {commentCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-3 rounded-full bg-green-600 px-0.5 text-center text-[8px] leading-3 text-white">
              {commentCount}
            </span>
          )}
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center text-gray-400 opacity-0 pointer-events-none transition-opacity hover:bg-primary-500 hover:text-white group-hover/cell:opacity-100 group-hover/cell:pointer-events-auto"
        >
          <FaPencilAlt size={9} />
        </button>
      )}
    </div>
  )
)

EditableCell.displayName = 'EditableCell'

export default EditableCell
