import { useCallback, useState } from 'react'
import { Button, Checkbox, TextInput } from '@mantine/core'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { useCopyGraphModelMutation } from '../slices/camApiSlice'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'

const CopyModelDialog: React.FC = () => {
  const dispatch = useAppDispatch()
  const cam = useAppSelector(selectCamModel)
  const [copyModel, { isLoading }] = useCopyGraphModelMutation()

  const [title, setTitle] = useState(cam?.title ? `Copy of ${cam.title}` : '')
  const [preserveEvidence, setPreserveEvidence] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!cam?.id || !title.trim()) return

    const result = await copyModel({
      modelId: cam.id,
      title: title.trim(),
      preserveEvidence,
    }).unwrap()

    dispatch(closeDialog())

    if (result?.newModelId) {
      const url = new URL(window.location.href)
      url.searchParams.set('model_id', result.newModelId)
      window.open(url.toString(), '_blank')
    }
  }, [cam, title, preserveEvidence, copyModel, dispatch])

  if (!cam) return null

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="mb-2 text-lg font-semibold uppercase tracking-wide text-gray-500">
          Source Model
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-gray-600">ID:</span>
            <span className="break-all text-gray-800">{cam.id}</span>
          </div>
          {cam.title && (
            <div className="flex gap-2">
              <span className="font-medium text-gray-600">Title:</span>
              <span className="text-gray-800">{cam.title}</span>
            </div>
          )}
          {cam.state && (
            <div className="flex gap-2">
              <span className="font-medium text-gray-600">State:</span>
              <span className="text-gray-800">{cam.state}</span>
            </div>
          )}
          {cam.contributors?.length ? (
            <div className="flex gap-2">
              <span className="font-medium text-gray-600">Contributors:</span>
              <span className="text-gray-800">
                {cam.contributors.map(c => c.name || c.uri).join(', ')}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="text-lg font-semibold uppercase tracking-wide text-gray-500">
          New Model
        </div>

        <TextInput
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          size="sm"
          autoFocus
        />

        <Checkbox
          checked={preserveEvidence}
          onChange={e => setPreserveEvidence(e.target.checked)}
          size="sm"
          label="Include evidence"
          description="Copy evidence annotations from the source model"
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <Button variant="outline" size="sm" onClick={() => dispatch(closeDialog())}>
          Cancel
        </Button>
        <Button
          variant="filled"
          size="sm"
          onClick={handleCopy}
          disabled={isLoading || !title.trim()}
        >
          {isLoading ? 'Copying...' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}

export default CopyModelDialog
