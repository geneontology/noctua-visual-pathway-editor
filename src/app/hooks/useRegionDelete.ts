import { useCallback, useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { useUpdateGraphModelMutation } from '@/features/gocam/slices/camApiSlice'
import { setSelectedActivity } from '@/features/gocam/slices/camSlice'
import { setRightDrawerOpen } from '@/@noctua.core/components/drawer/drawerSlice'
import { buildDeleteRegionOperations } from '@/features/gocam/services/activityOperations'
import { buildRegionPayload } from '@/features/gocam/services/regionClipboard'
import type { RegionClipboardPayload } from '@/features/gocam/services/regionClipboard'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import type { Activity, GraphModel } from '@/features/gocam/models/cam'

interface DeleteRequest {
  activities: Activity[]
  /** Thumbnail for the dialog — the same miniature the paste dialog draws. */
  preview: RegionClipboardPayload | null
}

/**
 * Delete every selected activity in one m3Batch call (#114 follow-on).
 *
 * Mirrors `useDeleteConfirmation` for a multi-selection: the confirm step is the
 * same idea, but the operations for all N activities go in a single batch rather
 * than one round trip each.
 */
export function useRegionDelete(model: GraphModel | null, onDeleted?: () => void) {
  const dispatch = useAppDispatch()
  const [request, setRequest] = useState<DeleteRequest | null>(null)
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()

  /** `positions` are the selection's canvas positions, used to draw the thumbnail. */
  const requestDelete = useCallback(
    (activityIds: string[], positions: Record<string, { x: number; y: number }>) => {
      if (!model || activityIds.length === 0) return
      const selected = new Set(activityIds)
      const activities = model.activities.filter(a => selected.has(a.uid))
      if (activities.length === 0) return
      setRequest({ activities, preview: buildRegionPayload(model, activityIds, positions) })
    },
    [model]
  )

  const cancelDelete = useCallback(() => setRequest(null), [])

  const confirmDelete = useCallback(async () => {
    if (!request || !model) return

    const operations = buildDeleteRegionOperations(request.activities, model.id)
    const count = request.activities.length
    setRequest(null)

    try {
      await updateGraphModel(operations).unwrap()
      dispatch(setRightDrawerOpen(false))
      dispatch(setSelectedActivity(null))
      onDeleted?.()
      dispatch(
        showToast({
          message: `Deleted ${count} ${count === 1 ? 'node' : 'nodes'}`,
        })
      )
    } catch {
      dispatch(showToast({ message: 'Could not delete the selection', severity: 'error' }))
    }
  }, [request, model, updateGraphModel, dispatch, onDeleted])

  return {
    deleteTargets: request?.activities ?? null,
    deletePreview: request?.preview ?? null,
    isDeleteOpen: request !== null,
    isDeleting: isLoading,
    requestDelete,
    confirmDelete,
    cancelDelete,
  }
}
