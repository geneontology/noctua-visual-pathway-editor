import { useCallback } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import type { Aspect } from '../models/cam'

interface OpenSearchAnnotationsParams {
  gpId: string | null | undefined
  aspect: Aspect | null | undefined
  /** Form-mode: form TermNode uid */
  targetNodeUid?: string
  /** Form-mode: form RelationNode uid */
  relationUid?: string
  /** Table-mode: CAM model id */
  modelId?: string
  /** Table-mode: CAM individual uid of the term being replaced */
  camNodeUid?: string
  /** Table-mode: current type id on that individual */
  camNodeTypeId?: string
  /** Table-mode: edge to attach evidence to */
  camEdge?: { sourceId: string; targetId: string; predicateId: string }
}

/**
 * Opens the Search Annotations dialog, or shows a warning toast when the
 * gene product hasn't been filled in yet (search cannot run without a gpId).
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
      dispatch(
        openDialog({
          component: DialogComponent.SEARCH_ANNOTATIONS,
          title: 'Search Annotations',
          size: 'cam',
          bodyScroll: 'none',
          customProps: { ...params },
        })
      )
    },
    [dispatch]
  )
}
