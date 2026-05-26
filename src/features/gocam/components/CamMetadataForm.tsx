import { useCallback, useState } from 'react'
import { ActionIcon, Button, Select, Textarea } from '@mantine/core'
import { FiPlus, FiX } from 'react-icons/fi'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { buildSaveModelAnnotationsOperations } from '../services/activityOperations'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'
import { MODEL_STATES } from '../data/camConstants'

const CamMetadataForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const cam = useAppSelector(selectCamModel)
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()

  const [title, setTitle] = useState(cam?.title ?? '')
  const [state, setState] = useState(cam?.state ?? 'development')
  const [comments, setComments] = useState<string[]>(cam?.comments ?? [])
  const [pendingRemoveCommentIndex, setPendingRemoveCommentIndex] = useState<number | null>(null)

  const handleAddComment = useCallback(() => {
    setComments(prev => [...prev, ''])
  }, [])

  const handleRemoveComment = useCallback(
    (index: number) => {
      const current = comments[index] ?? ''
      if (!current.trim()) {
        // Empty comment — no data to lose, remove immediately
        setComments(prev => prev.filter((_, i) => i !== index))
        return
      }
      setPendingRemoveCommentIndex(index)
    },
    [comments]
  )

  const confirmRemoveComment = useCallback(() => {
    if (pendingRemoveCommentIndex === null) return
    setComments(prev => prev.filter((_, i) => i !== pendingRemoveCommentIndex))
    setPendingRemoveCommentIndex(null)
  }, [pendingRemoveCommentIndex])

  const handleCommentChange = useCallback((index: number, value: string) => {
    setComments(prev => prev.map((c, i) => (i === index ? value : c)))
  }, [])

  const handleSave = useCallback(async () => {
    if (!cam?.id) return

    const filteredComments = comments.filter(c => c.trim())

    const ops = buildSaveModelAnnotationsOperations(
      cam.id,
      { title: cam.title, state: cam.state, comments: cam.comments },
      { title, state, comments: filteredComments }
    )

    await updateGraphModel(ops)
    dispatch(closeDialog())
  }, [cam, title, state, comments, updateGraphModel, dispatch])

  if (!cam) return null

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Model Information
        </div>

        <Textarea
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          size="sm"
          autosize
          minRows={1}
          maxRows={3}
        />

        <Select
          label="State"
          value={state}
          onChange={value => value && setState(value)}
          size="sm"
          data={MODEL_STATES.map(s => ({ value: s, label: s }))}
        />
      </div>

      <div className="border-t border-gray-200 px-4 py-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Comments
          </div>
          <ActionIcon
            variant="subtle"
            color="blue"
            size="sm"
            onClick={handleAddComment}
            aria-label="Add comment"
          >
            <FiPlus size={14} />
          </ActionIcon>
        </div>

        {comments.length === 0 ? (
          <div className="py-2 text-sm italic text-gray-400">No comments yet</div>
        ) : (
          <div className="flex flex-col gap-2">
            {comments.map((comment, i) => (
              <div key={i} className="flex items-start gap-1">
                <Textarea
                  value={comment}
                  onChange={e => handleCommentChange(i, e.target.value)}
                  size="sm"
                  autosize
                  minRows={1}
                  maxRows={3}
                  className="flex-1"
                  placeholder="Comment"
                />
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => handleRemoveComment(i)}
                  aria-label="Remove comment"
                >
                  <FiX size={14} />
                </ActionIcon>
              </div>
            ))}
          </div>
        )}
      </div>

      {(cam.contributors?.length || cam.groups?.length) ? (
        <div className="border-t border-gray-200 px-4 py-4">
          <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Model Details
          </div>
          <div className="flex flex-col gap-1 text-sm">
            {cam.contributors?.length ? (
              <div className="flex gap-2">
                <span className="font-medium text-gray-600">Contributors:</span>
                <span className="text-gray-800">
                  {cam.contributors.map(c => c.name || c.uri).join(', ')}
                </span>
              </div>
            ) : null}
            {cam.groups?.length ? (
              <div className="flex gap-2">
                <span className="font-medium text-gray-600">Groups:</span>
                <span className="text-gray-800">
                  {cam.groups.map(g => g.label || g.id).join(', ')}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

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

      <ConfirmDialog
        open={pendingRemoveCommentIndex !== null}
        onClose={() => setPendingRemoveCommentIndex(null)}
        onConfirm={confirmRemoveComment}
        title="Remove Comment"
        message="Remove this comment? You'll lose what you've typed."
        confirmLabel="Remove"
      />
    </div>
  )
}

export default CamMetadataForm
