import { useEffect, useRef } from 'react'
import { parseActivityClipboard } from '@/features/gocam/services/activityClipboard'
import type { ActivityClipboardPayload } from '@/features/gocam/services/activityClipboard'

/** True when the paste is aimed at a text field, so we must not hijack it. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el.closest !== 'function') return false
  return !!el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
}

/**
 * Ctrl+V on the pathway canvas: opens the Activity Form prefilled from a
 * clipboard payload written by the node's copy action, in this model or any
 * other. Uses the browser paste event rather than `navigator.clipboard.readText()`
 * so there's no clipboard-read permission prompt.
 */
export function useActivityPaste(
  enabled: boolean,
  onPaste: (payload: ActivityClipboardPayload) => void
) {
  // Kept in a ref so the listener isn't torn down and re-added on every render.
  const onPasteRef = useRef(onPaste)
  onPasteRef.current = onPaste

  useEffect(() => {
    if (!enabled) return

    const handlePaste = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return

      const text = e.clipboardData?.getData('text/plain')
      if (!text) return

      const payload = parseActivityClipboard(text)
      if (!payload) return

      e.preventDefault()
      onPasteRef.current(payload)
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [enabled])
}
