import { useCallback, useMemo } from 'react'
import type { Evidence, UserContext, Edge } from '../models/cam'
import { AnnotationKey } from '../models/operations'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { useAppSelector } from '@/app/hooks'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import {
  buildRemoveEvidenceOperations,
  buildClearEvidenceAnnotationOperations,
  buildDeleteNodeOperations,
} from '../services/activityOperations'

interface UseActivityNodeEditorArgs {
  nodeUid: string
  modelId: string
  userContext?: UserContext
  allEdges: Edge[]
  onNodeDeleted?: () => void
}

export function useActivityNodeEditor({
  nodeUid,
  modelId,
  userContext,
  allEdges,
  onNodeDeleted,
}: UseActivityNodeEditorArgs) {
  const [updateGraphModel] = useUpdateGraphModelMutation()
  const authUser = useAppSelector(selectAuthUser)

  const resolvedUserContext: UserContext | undefined = useMemo(() => {
    if (userContext) return userContext
    if (!authUser?.uri || !authUser?.group?.id) return undefined
    return { orcid: authUser.uri, groupUrl: authUser.group.id }
  }, [userContext, authUser])

  const handleRemoveEvidence = useCallback(
    async (ev: Evidence) => {
      await updateGraphModel(buildRemoveEvidenceOperations(ev.uid, modelId))
    },
    [modelId, updateGraphModel]
  )

  const handleClearField = useCallback(
    async (ev: Evidence, key: AnnotationKey.SOURCE | AnnotationKey.WITH) => {
      const oldValue = key === AnnotationKey.SOURCE ? ev.reference : ev.with
      if (!oldValue) return
      const ops = buildClearEvidenceAnnotationOperations(ev.uid, key, oldValue, modelId, resolvedUserContext)
      if (ops.length > 0) await updateGraphModel(ops)
    },
    [modelId, resolvedUserContext, updateGraphModel]
  )

  const handleDeleteNode = useCallback(async () => {
    // Collect the node plus its descendant subtree (children reached via
    // outgoing edges — part_of/occurs_in nesting), mirroring the old Angular
    // createActivityNodeDelete -> descendants(node). Without this, deleting a
    // nested BP/CC leaves the deeper term orphaned in the model.
    const subtreeUids = new Set<string>([nodeUid])
    const queue = [nodeUid]
    while (queue.length > 0) {
      const current = queue.shift()!
      for (const e of allEdges) {
        if (e.sourceId === current && !subtreeUids.has(e.targetId)) {
          subtreeUids.add(e.targetId)
          queue.push(e.targetId)
        }
      }
    }

    const nodeEdges = allEdges
      .filter(e => subtreeUids.has(e.sourceId) || subtreeUids.has(e.targetId))
      .map(e => ({ sourceId: e.sourceId, targetId: e.targetId, predicateId: e.id }))
    await updateGraphModel(buildDeleteNodeOperations([...subtreeUids], nodeEdges, modelId))
    onNodeDeleted?.()
  }, [nodeUid, allEdges, modelId, updateGraphModel, onNodeDeleted])

  return {
    updateGraphModel,
    resolvedUserContext,
    handleRemoveEvidence,
    handleClearField,
    handleDeleteNode,
  }
}
