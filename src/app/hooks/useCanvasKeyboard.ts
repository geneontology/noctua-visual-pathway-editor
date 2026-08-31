import { useEffect, useRef } from 'react'
import type { CamCanvas } from '@/features/pathway/graph/camCanvas'

/** True when the key is aimed at a text field, so we must not hijack it. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el.closest !== 'function') return false
  return !!el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
}

const ARROWS: Record<string, { dx: number; dy: number }> = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
}

/**
 * Canvas keyboard shortcuts for the multi-selection (#114): Escape to deselect,
 * Ctrl/Cmd+A to select every activity, arrow keys to nudge the selection.
 *
 * This is the app's first global key handler, so it is deliberately narrow — it
 * ignores keys aimed at form fields the same way `useActivityPaste` does, and
 * only claims a key when it actually acts on it.
 */
export function useCanvasKeyboard(
  enabled: boolean,
  canvasRef: React.MutableRefObject<CamCanvas | null>
) {
  // Kept in a ref so the listener isn't torn down and re-added on every render.
  const canvasRefRef = useRef(canvasRef)
  canvasRefRef.current = canvasRef

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = canvasRefRef.current.current
      if (!canvas || isEditableTarget(e.target)) return

      if (e.key === 'Escape') {
        canvas.clearSelection()
        return
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        canvas.selectAll()
        return
      }

      const arrow = ARROWS[e.key]
      if (arrow && canvas.getSelection().length > 0) {
        e.preventDefault()
        canvas.nudgeSelection(arrow.dx, arrow.dy)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled])
}
