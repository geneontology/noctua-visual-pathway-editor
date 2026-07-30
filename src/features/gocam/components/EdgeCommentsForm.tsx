import { useCallback, useMemo, useState } from 'react'
import { Button } from '@mantine/core'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { buildSaveEdgeCommentsOperations } from '../services/activityOperations'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import StructuredCommentsEditor from './StructuredCommentsEditor'
import { formatComment, parseComment, type StructuredComment } from '../data/commentCategories'

interface EdgeCommentsFormProps {
  edgeUid: string
}

const EdgeCommentsForm: React.FC<EdgeCommentsFormProps> = ({ edgeUid }) => {
  const dispatch = useAppDispatch()
  const cam = useAppSelector(selectCamModel)
  const isLoggedIn = !!useAppSelector(selectAuthUser)
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()

  const edge = useMemo(() => {
    if (!cam) return null
    for (const activity of cam.activities) {
      const found = activity.edges.find(e => e.uid === edgeUid)
      if (found) return found
    }
    return null
  }, [cam, edgeUid])

  const [comments, setComments] = useState<StructuredComment[]>(
    () => edge?.comments?.map(parseComment) ?? []
  )

  const handleSave = useCallback(async () => {
    if (!cam?.id || !edge) return
    const filteredComments = comments.filter(c => c.text.trim()).map(formatComment)
    const ops = buildSaveEdgeCommentsOperations(edge, cam.id, filteredComments)
    await updateGraphModel(ops)
    dispatch(closeDialog())
  }, [cam, edge, comments, updateGraphModel, dispatch])

  if (!cam || !edge) return null

  const subjectLabel = edge.source?.label ?? edge.sourceId
  const objectLabel = edge.target?.label ?? edge.targetId
  const edgeLabel = edge.label || edge.id

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="truncate text-xs text-gray-500">
          {subjectLabel} <span className="italic text-gray-400">{edgeLabel}</span> {objectLabel}
        </div>
      </div>

      <div className="px-4 py-4">
        <StructuredCommentsEditor
          comments={comments}
          onChange={setComments}
          readOnly={!isLoggedIn}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <Button variant="outline" size="sm" onClick={() => dispatch(closeDialog())}>
          {isLoggedIn ? 'Cancel' : 'Close'}
        </Button>
        {isLoggedIn && (
          <Button variant="filled" size="sm" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default EdgeCommentsForm
