import { useCallback, useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { useUpdateGraphModelMutation } from '@/features/gocam/slices/camApiSlice'
import { setSelectedActivity } from '@/features/gocam/slices/camSlice'
import { setRightDrawerOpen } from '@/@noctua.core/components/drawer/drawerSlice'
import { buildDeleteRegionOperations } from '@/features/gocam/services/activityOperations'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import type { Activity, GraphModel } from '@/features/gocam/models/cam'

/**
 * Delete every selected activity in one m3Batch call (#114 follow-on).
 *
 * Mirrors `useDeleteConfirmation` for a multi-selection: the confirm step is the
 * same idea, but the operations for all N activities go in a single batch rather
 * than one round trip each.
 */
export function useRegionDelete(model: GraphModel | null, onDeleted?: () => void) {
  const dispatch = useAppDispatch()
  const [targets, setTargets] = useState<Activity[] | null>(null)
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()

  const requestDelete = useCallback(
    (activityIds: string[]) => {
      if (!model || activityIds.length === 0) return
      const selected = new Set(activityIds)
      const activities = model.activities.filter(a => selected.has(a.uid))
      if (activities.length > 0) setTargets(activities)
    },
    [model]
  )

  const cancelDelete = useCallback(() => setTargets(null), [])

  const confirmDelete = useCallback(async () => {
    if (!targets || !model) return

    const operations = buildDeleteRegionOperations(targets, model.id)
    const count = targets.length
    setTargets(null)

    try {
      await updateGraphModel(operations).unwrap()
      dispatch(setRightDrawerOpen(false))
      dispatch(setSelectedActivity(null))
      onDeleted?.()
      dispatch(
        showToast({
          message: `Deleted ${count} ${count === 1 ? 'activity' : 'activities'}`,
        })
      )
    } catch {
      dispatch(showToast({ message: 'Could not delete the selection', severity: 'error' }))
    }
  }, [targets, model, updateGraphModel, dispatch, onDeleted])

  return {
    deleteTargets: targets,
    isDeleteOpen: targets !== null,
    isDeleting: isLoading,
    requestDelete,
    confirmDelete,
    cancelDelete,
  }
}
