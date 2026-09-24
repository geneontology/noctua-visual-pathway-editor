import type React from 'react'
import { useMemo, useRef, useState } from 'react'
import { MdSearch as SearchIcon } from 'react-icons/md'
import type { Activity } from '@/features/gocam/models/cam'
import { ActivityType } from '@/features/gocam/models/cam'
import { searchActivities } from '@/features/gocam/services/activitySearch'

/** Rows shown in the dropdown; "Select all" still acts on every match. */
const MAX_VISIBLE = 8

interface ActivitySearchProps {
  activities: Activity[]
  /**
   * Fired with the matching activity uids. One uid = a picked row (select and
   * centre it); several = "select all matches", highlighting them in place.
   */
  onSelect: (uids: string[]) => void
}

const typeBadge: Record<string, string> = {
  [ActivityType.MOLECULE]: 'chemical',
  [ActivityType.PROTEIN_COMPLEX]: 'complex',
}

/**
 * Find activities by anything they carry — terms (GP/MF/BP/CC), term ids,
 * PMIDs, evidence — and highlight the matches. Two activities enabled by the
 * same gene product both match, so this doubles as a canvas filter.
 */
const ActivitySearch: React.FC<ActivitySearchProps> = ({ activities, onSelect }) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const hits = useMemo(() => searchActivities(activities, query), [activities, query])
  const visible = hits.slice(0, MAX_VISIBLE)
  // With several matches, a leading row selects them all — Enter defaults to it.
  const hasAllRow = hits.length > 1
  const rowCount = visible.length + (hasAllRow ? 1 : 0)

  const close = () => {
    setQuery('')
    setOpen(false)
    setHighlighted(0)
    inputRef.current?.blur()
  }

  const pickRow = (row: number) => {
    if (hasAllRow && row === 0) {
      onSelect(hits.map(hit => hit.uid))
    } else {
      const hit = visible[hasAllRow ? row - 1 : row]
      if (!hit) return
      onSelect([hit.uid])
    }
    close()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(row => Math.min(row + 1, rowCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(row => Math.max(row - 1, 0))
    } else if (e.key === 'Enter' && rowCount > 0) {
      e.preventDefault()
      pickRow(highlighted)
    } else if (e.key === 'Escape') {
      close()
    }
    // Other keys are left alone; useCanvasKeyboard already ignores anything
    // aimed at an input, so typing here never triggers canvas shortcuts.
  }

  const showDropdown = open && query.trim().length > 0

  return (
    <div className="relative">
      <div className="flex h-7 items-center gap-1.5 rounded-full bg-gray-100 px-2.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-400">
        <SearchIcon size={15} className="shrink-0 text-gray-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setHighlighted(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          // Delayed so a mousedown on a result still lands before the list goes.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Find in model…"
          aria-label="Find activities by term, id, or reference"
          className="w-36 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {hits.length === 0 ? (
            <span className="block px-3 py-1.5 text-sm text-gray-400">No match in this model</span>
          ) : (
            <>
              {hasAllRow && (
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault()
                    pickRow(0)
                  }}
                  onMouseEnter={() => setHighlighted(0)}
                  className={`block w-full border-b border-gray-100 px-3 py-1.5 text-left text-sm font-medium text-blue-700 ${
                    highlighted === 0 ? 'bg-blue-50' : ''
                  }`}
                >
                  Select all {hits.length} matches
                </button>
              )}
              {visible.map((hit, index) => {
                const row = hasAllRow ? index + 1 : index
                return (
                  <button
                    key={hit.uid}
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault()
                      pickRow(row)
                    }}
                    onMouseEnter={() => setHighlighted(row)}
                    className={`block w-full px-3 py-1.5 text-left ${
                      highlighted === row ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm text-gray-900">
                      {hit.primary}
                      {typeBadge[hit.type] && (
                        <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-500">
                          {typeBadge[hit.type]}
                        </span>
                      )}
                    </span>
                    {hit.matchField && (
                      <span className="block truncate text-xs text-gray-500">
                        {hit.matchField}: {hit.matchText}
                      </span>
                    )}
                  </button>
                )
              })}
              {hits.length > MAX_VISIBLE && (
                <span className="block px-3 py-1 text-xs text-gray-400">
                  …and {hits.length - MAX_VISIBLE} more — Select all includes them
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ActivitySearch
