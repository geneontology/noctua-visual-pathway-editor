import { useCallback, useState } from 'react'
import { Button, Select } from '@mantine/core'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { buildSaveModelAnnotationsOperations } from '../services/activityOperations'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import { MODEL_STATES } from '../data/camConstants'

const CamStateForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const cam = useAppSelector(selectCamModel)
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()
  const [state, setState] = useState(cam?.state ?? 'development')

  const handleSave = useCallback(async () => {
    if (!cam?.id) return
    const ops = buildSaveModelAnnotationsOperations(
      cam.id,
      { title: cam.title, state: cam.state, comments: cam.comments },
      { title: cam.title ?? '', state, comments: cam.comments ?? [] }
    )
    await updateGraphModel(ops)
    dispatch(closeDialog())
  }, [cam, state, updateGraphModel, dispatch])

  if (!cam) return null

  return (
    <div className="flex flex-col">
      <div className="px-4 py-4">
        <Select
          label="State"
          value={state}
          onChange={value => value && setState(value)}
          size="sm"
          data={MODEL_STATES.map(s => ({ value: s.value, label: s.label }))}
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
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

export default CamStateForm
