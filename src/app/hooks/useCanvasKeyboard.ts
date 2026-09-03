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

export interface CanvasKeyboardActions {
  /** Ctrl/Cmd+C with a non-empty selection. */
  onCopyRegion?: () => void
  /**
   * Ctrl/Cmd+V. Return true to claim the keystroke — the single-activity paste
   * listens for the browser `paste` event, so only claim it when there really is
   * a region to paste, otherwise that path must stay reachable.
   */
  onPasteRegion?: () => boolean
  /** Delete/Backspace with a non-empty selection. */
  onDeleteRegion?: () => void
}

/**
 * Canvas keyboard shortcuts for the multi-selection (#114): Escape to deselect,
 * Ctrl/Cmd+A to select every activity, arrow keys to nudge the selection, and
 * Ctrl/Cmd+C / Ctrl/Cmd+V for region copy-paste and Delete to remove it.
 *
 * This is the app's first global key handler, so it is deliberately narrow — it
 * ignores keys aimed at form fields the same way `useActivityPaste` does, and
 * only claims a key when it actually acts on it.
 */
export function useCanvasKeyboard(
  enabled: boolean,
  canvasRef: React.MutableRefObject<CamCanvas | null>,
  actions: CanvasKeyboardActions = {}
) {
  // Kept in refs so the listener isn't torn down and re-added on every render.
  const canvasRefRef = useRef(canvasRef)
  canvasRefRef.current = canvasRef
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = canvasRefRef.current.current
      if (!canvas || isEditableTarget(e.target)) return

      if (e.key === 'Escape') {
        canvas.clearSelection()
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (canvas.getSelection().length === 0) return
        e.preventDefault()
        actionsRef.current.onDeleteRegion?.()
        return
      }

      const modifier = e.ctrlKey || e.metaKey

      if (modifier && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        canvas.selectAll()
        return
      }

      if (modifier && (e.key === 'c' || e.key === 'C')) {
        if (canvas.getSelection().length === 0) return
        e.preventDefault()
        actionsRef.current.onCopyRegion?.()
        return
      }

      if (modifier && (e.key === 'v' || e.key === 'V')) {
        // preventDefault here suppresses the `paste` event that
        // useActivityPaste listens for, so only do it when a region was claimed.
        if (actionsRef.current.onPasteRegion?.()) e.preventDefault()
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
