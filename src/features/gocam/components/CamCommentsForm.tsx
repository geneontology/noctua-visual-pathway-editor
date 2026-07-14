import { useCallback, useState } from 'react'
import { Button } from '@mantine/core'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { buildSaveModelAnnotationsOperations } from '../services/activityOperations'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import SectionHeading from '@/@noctua.core/components/form/SectionHeading'
import StructuredCommentsEditor from './StructuredCommentsEditor'
import { formatComment, parseComment, type StructuredComment } from '../data/commentCategories'

const CamCommentsForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const cam = useAppSelector(selectCamModel)
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
    <div className="flex flex-col">
      <SectionHeading>Comments</SectionHeading>
      <div className="px-4 py-4">
        <StructuredCommentsEditor comments={comments} onChange={setComments} />
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <Button variant="outline" size="sm" onClick={() => dispatch(closeDialog())}>
          Cancel
        </Button>
        <Button variant="filled" size="sm" onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

export default CamCommentsForm
