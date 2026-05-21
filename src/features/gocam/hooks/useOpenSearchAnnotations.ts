import { useCallback } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import type { Aspect, Entity, Evidence } from '../models/cam'

export interface SearchAnnotationsSelection {
  term: Entity
  evidences: Evidence[]
}

export type SearchAnnotationsOnApply = (selection: SearchAnnotationsSelection) => void

interface OpenSearchAnnotationsParams {
  gpId: string | null | undefined
  aspect: Aspect | null | undefined
  /** Called with the user's selection when they confirm. Caller decides what to do with it. */
  onApply: SearchAnnotationsOnApply
}

// Module-level handoff for the picker's onApply callback. Kept out of Redux
// state so the dialog slice stays serializable. Only one Search Annotations
// dialog can be open at a time, so a single slot is enough.
let pendingOnApply: SearchAnnotationsOnApply | null = null

/** Consumed by SearchAnnotations on mount. Returns and clears the pending callback. */
export function consumeSearchAnnotationsOnApply(): SearchAnnotationsOnApply | null {
  const cb = pendingOnApply
  pendingOnApply = null
  return cb
}

/**
 * Opens the Search Annotations picker, or shows a warning toast when the
 * gene product hasn't been filled in yet (search cannot run without a gpId).
 *
 * The dialog is caller-agnostic: it returns the picked term + evidences via
 * `onApply` and does not persist anything itself.
 */
export function useOpenSearchAnnotations() {
  const dispatch = useAppDispatch()
  return useCallback(
    (params: OpenSearchAnnotationsParams) => {
      if (!params.gpId) {
        dispatch(
          showToast({
            message: 'Add a gene product first to search annotations',
            severity: 'warning',
          })
        )
        return
      }
      if (!params.aspect) return
      pendingOnApply = params.onApply
      dispatch(
        openDialog({
          component: DialogComponent.SEARCH_ANNOTATIONS,
          title: 'Search Annotations',
          size: 'cam',
          bodyScroll: 'none',
          customProps: {
            gpId: params.gpId,
            aspect: params.aspect,
          },
        })
      )
    },
    [dispatch]
  )
}
