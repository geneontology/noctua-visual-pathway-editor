import type React from 'react'
import { useEffect, useState } from 'react'
import { ActionIcon, Button, Drawer, Tooltip } from '@mantine/core'
import { IoChevronDown, IoRefreshOutline, IoTrashOutline } from 'react-icons/io5'
import { ANNOUNCEMENTS_STORAGE_KEY } from '@/features/announcements/hooks/useAnnouncements'
import { PREFERENCES_STORAGE_KEY } from '@/@noctua.core/hooks/usePreference'

const POSITIONS_KEY = /^activityLocations-(.+)$/
const TOKEN_KEY = 'barista_token'

interface StoredEntry {
  key: string
  label: string | null
  value: string
}

/** A readable name for VPE's own keys; null for anything else. */
function labelFor(key: string): string | null {
  if (key === ANNOUNCEMENTS_STORAGE_KEY) return 'Announcements — read, dismissed'
  if (key === PREFERENCES_STORAGE_KEY) return 'Preferences'
  if (key === TOKEN_KEY) return 'Login token — deleting it logs you out'
  const positions = key.match(POSITIONS_KEY)
  if (positions) return `Node positions — ${positions[1]}`
  return null
}

/** Everything VPE saves except the login token. */
const isResettable = (key: string): boolean =>
  key === ANNOUNCEMENTS_STORAGE_KEY || key === PREFERENCES_STORAGE_KEY || POSITIONS_KEY.test(key)

function readEntries(): StoredEntry[] {
  try {
    return Object.keys(localStorage)
      .sort()
      .map(key => ({ key, label: labelFor(key), value: localStorage.getItem(key) ?? '' }))
  } catch {
    return []
  }
}

function displayValue(entry: StoredEntry): string {
  // Masked so it doesn't leak in a screen share.
  if (/token/i.test(entry.key)) return `${entry.value.slice(0, 6)}…`
  try {
    return JSON.stringify(JSON.parse(entry.value), null, 2)
  } catch {
    return entry.value
  }
}

const formatSize = (value: string): string =>
  value.length < 1024 ? `${value.length} B` : `${(value.length / 1024).toFixed(1)} KB`

interface TestingPanelProps {
  opened: boolean
  onClose: () => void
}

/**
 * Dev-only: view and delete what's saved in this browser.
 *
 * Deletes need a reload — most of this is read once at start, and the
 * announcement state would rewrite its key on the next change.
 */
const TestingPanel: React.FC<TestingPanelProps> = ({ opened, onClose }) => {
  const [entries, setEntries] = useState<StoredEntry[]>([])
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [needsReload, setNeedsReload] = useState(false)

  useEffect(() => {
    if (opened) setEntries(readEntries())
  }, [opened])

  const remove = (keys: string[]) => {
    try {
      keys.forEach(key => localStorage.removeItem(key))
    } catch {
      // Storage blocked: nothing to delete.
    }
    setEntries(readEntries())
    setNeedsReload(true)
  }

  const resettable = entries.filter(entry => isResettable(entry.key)).map(entry => entry.key)

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={420}
      zIndex={100}
      title={
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">Testing</span>
          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-2xs font-semibold text-amber-800">
            dev only
          </span>
        </div>
      }
      classNames={{ body: 'bg-gray-100 h-full' }}
    >
      <div className="flex flex-col gap-3 pt-2 pb-4">
        {needsReload && (
          <div className="flex items-center gap-2 rounded border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
            <span className="flex-1">Reload to apply — VPE reads saved state when it starts.</span>
            <Button
              className="!text-xs !normal-case"
              size="compact-xs"
              leftSection={<IoRefreshOutline />}
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </div>
        )}

        <section className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
              Saved in this browser
            </span>
            <Button
              className="!ml-auto !text-xs !normal-case"
              variant="default"
              size="compact-xs"
              disabled={resettable.length === 0}
              onClick={() => remove(resettable)}
            >
              Reset VPE state
            </Button>
          </div>
          <span className="text-xs text-gray-500">
            Reset clears announcements, preferences and node positions, and keeps you logged in.
          </span>

          {entries.map(entry => {
            const expanded = expandedKey === entry.key

            return (
              <div key={entry.key} className="relative rounded bg-white shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-start gap-2 p-2.5 pr-9 text-left"
                  onClick={() => setExpandedKey(expanded ? null : entry.key)}
                  aria-expanded={expanded}
                >
                  <IoChevronDown
                    className={`mt-1 shrink-0 text-xs text-gray-400 transition-transform ${expanded ? '' : '-rotate-90'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm text-gray-900">
                        {entry.label ?? entry.key}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-gray-400">
                        {formatSize(entry.value)}
                      </span>
                    </div>
                    {entry.label && (
                      <div className="truncate font-mono text-2xs text-gray-500">{entry.key}</div>
                    )}
                  </div>
                </button>

                {expanded && (
                  <pre className="mx-2.5 mb-2.5 max-h-64 overflow-auto rounded bg-gray-50 p-2 font-mono text-2xs text-gray-700">
                    {displayValue(entry)}
                  </pre>
                )}

                <Tooltip label="Delete" position="left" withArrow openDelay={300}>
                  <ActionIcon
                    className="!absolute !top-2.5 !right-1.5"
                    variant="subtle"
                    color="gray"
                    size="xs"
                    aria-label={`Delete ${entry.key}`}
                    onClick={() => remove([entry.key])}
                  >
                    <IoTrashOutline />
                  </ActionIcon>
                </Tooltip>
              </div>
            )
          })}

          {entries.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-400">Nothing saved</div>
          )}
        </section>
      </div>
    </Drawer>
  )
}

export default TestingPanel
