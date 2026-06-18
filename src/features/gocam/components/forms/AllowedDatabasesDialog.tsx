import { useMemo } from 'react'
import { Button } from '@mantine/core'
import SimpleDialog from '@/@noctua.core/components/dialog/SimpleDialog'

interface AllowedDatabasesDialogProps {
  open: boolean
  onClose: () => void
  title: string
  databases: readonly string[]
}

const AllowedDatabasesDialog = ({ open, onClose, title, databases }: AllowedDatabasesDialogProps) => {
  // Case-insensitive sort — default Array.sort() orders uppercase before lowercase
  // (ASCII), which pushes lowercase-initial prefixes like "dictyBase" to the end.
  const sortedDatabases = useMemo(
    () => [...databases].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    [databases]
  )

  return (
    <SimpleDialog open={open} onClose={onClose} title={title} size="xs">
      <div className="flex flex-col">
        <div className="p-4">
          <p className="mb-2 text-sm text-gray-700">The following database prefixes are allowed:</p>
          <ul className="visible-scrollbar max-h-[400px] overflow-y-scroll">
            {sortedDatabases.map(db => (
              <li key={db} className="rounded px-1 py-1 text-sm font-medium text-gray-900">
                {db}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <Button onClick={onClose} variant="filled">
            Close
          </Button>
        </div>
      </div>
    </SimpleDialog>
  )
}

export default AllowedDatabasesDialog
