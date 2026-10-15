import type React from 'react'
import type { KeyboardEvent } from 'react'
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { FiFile } from 'react-icons/fi'
import { useSearchTermsQuery } from '../slices/lookupApiSlice'
import type { GOlrResponse } from '../models/search'
import { AutocompleteType } from '../models/search'
import { Loader, Portal } from '@mantine/core'
import FloatingTextarea from '@/@noctua.core/components/textarea/FloatingTextarea'
import { DEBOUNCE_MS, BLUR_CLOSE_DELAY_MS, MIN_SEARCH_LENGTH } from '@/@noctua.core/data/uiConstants'

interface TermAutocompleteProps {
  label: string
  name: string
  rootTypeIds?: string[]
  excludeRootTypeIds?: string[]
  autocompleteType?: AutocompleteType
  value: GOlrResponse | null | string
  onChange: (value: GOlrResponse | null | string) => void
  onBlur?: () => void
  disabled?: boolean
  variant?: 'standard' | 'outlined' | 'filled'
  onOpenTermDetails?: (event: React.MouseEvent, item: GOlrResponse) => void
  /** Pre-populated options shown on focus before the user types (e.g. terms already used in the model) */
  initialOptions?: GOlrResponse[]
}

const TermAutocomplete: React.FC<TermAutocompleteProps> = ({
  label = '',
  name,
  rootTypeIds = [],
  excludeRootTypeIds,
  autocompleteType = AutocompleteType.TERM,
  value,
  onChange,
  onBlur,
  disabled = false,
  onOpenTermDetails,
  initialOptions = [],
}) => {
  const [inputValue, setInputValue] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const [options, setOptions] = useState<GOlrResponse[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('')
  const anchorRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const useAutocomplete =
    autocompleteType === AutocompleteType.TERM ||
    autocompleteType === AutocompleteType.EVIDENCE_CODE

  const { data, isLoading, isFetching, isError } = useSearchTermsQuery(
    { searchText: debouncedSearchTerm, closureIds: rootTypeIds, excludeClosureIds: excludeRootTypeIds },
    {
      skip: !useAutocomplete || !debouncedSearchTerm || debouncedSearchTerm.length < MIN_SEARCH_LENGTH,
      selectFromResult: ({ data, isLoading, isFetching, isError }) => ({
        data: data || [],
        isLoading,
        isFetching,
        isError,
      }),
    }
  )

  const searching = isLoading || isFetching

  useEffect(() => {
    if (useAutocomplete && data && data.length > 0) {
      setOptions(data)
      setHighlightedIndex(-1)
    }
  }, [data, useAutocomplete])

  // Clear stale remote options when search becomes inactive so prelookups can show again
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < MIN_SEARCH_LENGTH) {
      setOptions(prev => (prev.length === 0 ? prev : []))
      setHighlightedIndex(prev => (prev === -1 ? prev : -1))
    }
  }, [debouncedSearchTerm])

  // Show initialOptions (prelookups) whenever no remote results are loaded
  const showInitial = open && options.length === 0 && !searching
  const displayOptions = showInitial ? initialOptions : options

  // Track the anchor's viewport rect so the portaled dropdown can position
  // itself with fixed coordinates. Recompute on scroll/resize.
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (!rect) return
      // At least 400px, but kept on screen: on a narrow window a 400px list from
      // the field's left edge ran off the right side.
      const width = Math.min(Math.max(rect.width, 400), window.innerWidth - 8)
      const left = Math.max(4, Math.min(rect.left, window.innerWidth - width - 4))
      setDropdownPos({ top: rect.bottom, left, width })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    if (!useAutocomplete) return

    const handler = setTimeout(() => {
      setDebouncedSearchTerm(inputValue)
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(handler)
    }
  }, [inputValue, useAutocomplete])

  // Sync inputValue with external value prop (e.g., when Redux state changes)
  useEffect(() => {
    if (value && typeof value === 'object' && 'label' in value && value.label) {
      setInputValue(value.id ? `${value.label} (${value.id})` : value.label)
    } else if (value === null) {
      setInputValue('')
    }
  }, [value])

  useEffect(() => {
    if (!open) {
      setOptions([])
      setHighlightedIndex(-1)
    }
  }, [open])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // A term is one line. With the list shut (after Escape), Enter used to fall
    // through to the textarea and add a newline, which pushed the text out of
    // view and changed the search.
    if (event.key === 'Enter') event.preventDefault()
    if (!open) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1))
        break
      case 'Enter':
        event.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleOptionSelect(options[highlightedIndex])
        }
        break
      case 'Escape':
        // Closing the list is all this Escape does — not also the drawer or
        // dialog the field sits in.
        event.stopPropagation()
        setOpen(false)
        break
    }
  }

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const element = listRef.current.children[highlightedIndex] as HTMLElement
      element?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])


  const handleOptionSelect = (option: GOlrResponse) => {
    onChange(option)
    setInputValue(option.id ? `${option.label} (${option.id})` : option.label)
    setOpen(false)
    setHighlightedIndex(-1)
  }

  return (
    <div className="w-full">
      <div
        ref={anchorRef}
        onKeyDown={handleKeyDown}
        onMouseDown={() => useAutocomplete && setOpen(true)}
      >
        <FloatingTextarea
          id={`autocomplete-${name}`}
          name={name}
          label={label}
          size="xs"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => useAutocomplete && setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), BLUR_CLOSE_DELAY_MS)
            onBlur?.()
          }}
          disabled={disabled}
          rows={2}
          rightSection={searching ? <Loader size={20} /> : null}
        />
      </div>

      {open && dropdownPos && (
        <Portal>
          <div
            ref={listRef}
            className="max-h-64 overflow-y-auto rounded bg-noc-dropdown shadow-lg"
            style={{
              position: 'fixed',
              top: dropdownPos.top + 4,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 1300,
            }}
          >
            {!searching && displayOptions.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-500">
                {inputValue.length < MIN_SEARCH_LENGTH
                  ? 'Type at least 3 characters to search'
                  : // A failed GOlr lookup is not an empty one: "No results
                    // found" told the curator their term did not exist.
                    isError
                    ? 'Search failed — the term service did not answer. Try again.'
                    : 'No results found'}
              </div>
            )}

            {displayOptions.map((option, index) => {
              const doNotAnnotate = option.notAnnotatable === false
              const disabled = option.isObsolete || doNotAnnotate
              const bgClass = doNotAnnotate
                ? 'bg-red-200'
                : index === highlightedIndex
                  ? 'bg-noc-dropdown-hover'
                  : 'hover:bg-noc-dropdown-hover'
              return (
              <div
                key={option.id}
                className={`flex min-h-[40px] cursor-pointer items-center border-b border-noc-dropdown-rule px-4 py-2 text-xs ${bgClass} ${disabled ? 'pointer-events-none' : ''} ${option.isObsolete ? 'opacity-40 line-through' : ''}`}
                onClick={() => !disabled && handleOptionSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                title={doNotAnnotate ? 'Do not annotate' : undefined}
              >
                <div className="min-w-0 shrink font-normal">{option.label}</div>
                <span className="grow" />
                {autocompleteType === AutocompleteType.EVIDENCE_CODE && option.xref && (
                  <div className="ml-2 shrink-0 font-bold">{option.xref}</div>
                )}
                <div className="ml-2 shrink-0 text-2xs text-black/60">
                  {option.link ? (
                    <a
                      href={option.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center hover:text-blue-500"
                    >
                      {option.id}
                    </a>
                  ) : (
                    <span>{option.id}</span>
                  )}
                </div>

                {onOpenTermDetails && (
                  <button
                    className="ml-2 shrink-0 rounded-full border p-1 hover:bg-gray-200"
                    onClick={e => {
                      e.stopPropagation()
                      onOpenTermDetails(e, option)
                    }}
                  >
                    <FiFile className="ml-1" />
                  </button>
                )}
              </div>
              )
            })}
          </div>
        </Portal>
      )}
    </div>
  )
}

export default TermAutocomplete
