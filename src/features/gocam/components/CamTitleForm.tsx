import { useCallback, useState } from 'react'
import { Button, Textarea } from '@mantine/core'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { buildSaveModelAnnotationsOperations } from '../services/activityOperations'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'

const CamTitleForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const cam = useAppSelector(selectCamModel)
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()
  const [title, setTitle] = useState(cam?.title ?? '')

  const handleSave = useCallback(async () => {
    if (!cam?.id) return
    const ops = buildSaveModelAnnotationsOperations(
      cam.id,
      { title: cam.title, state: cam.state, comments: cam.comments },
      { title, state: cam.state ?? '', comments: cam.comments ?? [] }
    )
    await updateGraphModel(ops)
    dispatch(closeDialog())
  }, [cam, title, updateGraphModel, dispatch])

  if (!cam) return null

  return (
    <div className="flex flex-col">
      <div className="px-4 py-4">
        <Textarea
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          size="sm"
          autosize
          minRows={3}
          maxRows={6}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <Button variant="outline" size="sm" onClick={() => dispatch(closeDialog())}>
          Cancel
        </Button>
        <Button
          variant="filled"
          size="sm"
          onClick={handleSave}
          disabled={isLoading || !title.trim()}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

export default CamTitleForm
