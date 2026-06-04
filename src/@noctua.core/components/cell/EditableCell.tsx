import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import { FaPencilAlt, FaTrash } from 'react-icons/fa'

interface EditableCellProps {
  label: string
  onEdit?: () => void
  onDelete?: () => void
  className?: string
  style?: CSSProperties
  children: ReactNode
}

const EditableCell = forwardRef<HTMLDivElement, EditableCellProps>(
  ({ label, onEdit, onDelete, className = '', style, children }, ref) => (
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
