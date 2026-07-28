import { useCallback, useState } from 'react'
import { Button } from '@mantine/core'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { buildSaveModelAnnotationsOperations } from '../services/activityOperations'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import SectionHeading from '@/@noctua.core/components/form/SectionHeading'
import StructuredCommentsEditor from './StructuredCommentsEditor'
import { formatComment, parseComment, type StructuredComment } from '../data/commentCategories'

const CamCommentsForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const cam = useAppSelector(selectCamModel)
  const isLoggedIn = !!useAppSelector(selectAuthUser)
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()
  const [comments, setComments] = useState<StructuredComment[]>(
    () => cam?.comments?.map(parseComment) ?? []
  )

  const handleSave = useCallback(async () => {
    if (!cam?.id) return
    const filteredComments = comments.filter(c => c.text.trim()).map(formatComment)
    const ops = buildSaveModelAnnotationsOperations(
      cam.id,
      { title: cam.title, state: cam.state, comments: cam.comments },
      { title: cam.title ?? '', state: cam.state ?? '', comments: filteredComments }
    )
    await updateGraphModel(ops)
    dispatch(closeDialog())
  }, [cam, comments, updateGraphModel, dispatch])

  if (!cam) return null

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="shrink-0">
        <SectionHeading>Comments</SectionHeading>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <StructuredCommentsEditor
          comments={comments}
          onChange={setComments}
          readOnly={!isLoggedIn}
        />
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
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

export default CamCommentsForm
