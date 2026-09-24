import { useCallback, useSyncExternalStore } from 'react'

export const PREFERENCES_STORAGE_KEY = 'noctua.preferences'

/**
 * Every preference and its default. Values must be primitives: the snapshot is
 * re-read on every render, and only a primitive compares equal to the last read.
 */
const DEFAULTS = {
  'announcements.showRead': true,
}

type Preferences = typeof DEFAULTS
export type PreferenceKey = keyof Preferences

type Stored = Partial<Record<PreferenceKey, unknown>>

const listeners = new Set<() => void>()

// Used only when storage is blocked, so a toggle still works for the session.
let unpersisted: Stored = {}

function readStored(): Stored {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return unpersisted
  }
}

function read<K extends PreferenceKey>(key: K): Preferences[K] {
  const stored = readStored()[key]
  return typeof stored === typeof DEFAULTS[key] ? (stored as Preferences[K]) : DEFAULTS[key]
}

function write<K extends PreferenceKey>(key: K, value: Preferences[K]) {
  const next = { ...readStored(), [key]: value }
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next))
  } catch {
    unpersisted = next
  }
  listeners.forEach(listener => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Like `useState`, but remembered in this browser and shared across components. */
export function usePreference<K extends PreferenceKey>(
  key: K
): [Preferences[K], (value: Preferences[K]) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key))
  const set = useCallback((next: Preferences[K]) => write(key, next), [key])
  return [value, set]
}
