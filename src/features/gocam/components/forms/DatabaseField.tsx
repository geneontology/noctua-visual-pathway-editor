import type React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { FaFileMedical } from 'react-icons/fa'
import FloatingTextarea from '@/@noctua.core/components/textarea/FloatingTextarea'
import ReferenceDropdown from './ReferenceDropdown'
import WithDropdown from './WithDropdown'
import { useAppSelector } from '@/app/hooks'
import { selectModelReferences, selectModelWiths } from '../../slices/camSlice'
import { BLUR_CLOSE_DELAY_MS } from '@/@noctua.core/data/uiConstants'

interface DatabaseFieldProps {
  value: string
  onChange: (value: string) => void
  type: 'reference' | 'with'
}

const DatabaseField: React.FC<DatabaseFieldProps> = ({
  value,
  onChange,
  type,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const Dropdown = type === 'reference' ? ReferenceDropdown : WithDropdown
  const label = type === 'reference' ? 'Reference' : 'With/From'

  const modelReferences = useAppSelector(selectModelReferences)
  const modelWiths = useAppSelector(selectModelWiths)
  const suggestions = type === 'reference' ? modelReferences : modelWiths

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase()
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of suggestions) {
      if (!s || seen.has(s)) continue
      if (q && !s.toLowerCase().includes(q)) continue
      seen.add(s)
      out.push(s)
    }
    return out
  }, [suggestions, value])

  useEffect(() => {
    if (!open) setHighlightedIndex(-1)
  }, [open])

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1))
        break
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          e.preventDefault()
          handleSelect(filtered[highlightedIndex])
        }
        break
      case 'Escape':
        setOpen(false)
        break
    }
  }

  return (
    <>
      <div className="w-full" onKeyDown={handleKeyDown}>
        <FloatingTextarea
          size="xs"
          label={label}
          value={value}
          onChange={e => {
            onChange(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={e => {
            setTimeout(() => setOpen(false), BLUR_CLOSE_DELAY_MS)
            const trimmed = e.target.value.trim()
            if (trimmed !== e.target.value) onChange(trimmed)
          }}
          rows={2}
          rightSection={
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={e => {
                e.stopPropagation()
                setAnchorEl(e.currentTarget)
              }}
              className="self-end rounded-full p-1 hover:bg-gray-100"
            >
              <FaFileMedical size={14} />
            </button>
          }
        />

        {open && filtered.length > 0 && (
          <div className="relative">
            <div className="!bg-accent-50 absolute left-0 top-0 z-[1300] max-h-60 w-[400px] overflow-y-auto rounded-md bg-white shadow-lg">
              {filtered.map((option, index) => (
                <div
                  key={option}
                  className={`flex min-h-[40px] cursor-pointer items-center border-b border-primary-100 bg-accent-50 px-4 py-2 text-xs hover:bg-primary-50 ${index === highlightedIndex ? 'bg-primary-100' : ''}`}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="min-w-0 shrink font-normal">{option}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dropdown
        anchorEl={anchorEl}
        currentValue={value}
        onClose={() => setAnchorEl(null)}
        onSave={val => onChange(val)}
      />
    </>
  )
}

export default DatabaseField
