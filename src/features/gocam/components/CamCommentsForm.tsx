import { useCallback, useState } from 'react'
import { ActionIcon, Button, Textarea } from '@mantine/core'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { buildSaveModelAnnotationsOperations } from '../services/activityOperations'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'

const CamCommentsForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const cam = useAppSelector(selectCamModel)
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()
  const [comments, setComments] = useState<string[]>(cam?.comments ?? [])
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null)

  const handleAddComment = useCallback(() => {
    setComments(prev => [...prev, ''])
  }, [])

  const handleRemoveComment = useCallback(
    (index: number) => {
      const current = comments[index] ?? ''
      if (!current.trim()) {
        setComments(prev => prev.filter((_, i) => i !== index))
        return
      }
      setPendingRemoveIndex(index)
    },
    [comments]
  )

  const confirmRemoveComment = useCallback(() => {
    if (pendingRemoveIndex === null) return
    setComments(prev => prev.filter((_, i) => i !== pendingRemoveIndex))
    setPendingRemoveIndex(null)
  }, [pendingRemoveIndex])

  const handleCommentChange = useCallback((index: number, value: string) => {
    setComments(prev => prev.map((c, i) => (i === index ? value : c)))
  }, [])

  const handleSave = useCallback(async () => {
    if (!cam?.id) return
    const filteredComments = comments.filter(c => c.trim())
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
      <div className="px-4 py-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Comments
          </div>
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
                  minRows={3}
                  maxRows={8}
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
                  <FaTrash size={12} />
                </ActionIcon>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2">
          <Button
            size="compact-sm"
            variant="light"
            color="primary"
            leftSection={<FaPlus size={10} />}
            onClick={handleAddComment}
          >
            {comments.length === 0 ? 'Add comment' : 'Add another comment'}
          </Button>
        </div>
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

      <ConfirmDialog
        open={pendingRemoveIndex !== null}
        onClose={() => setPendingRemoveIndex(null)}
        onConfirm={confirmRemoveComment}
        title="Remove Comment"
        message="Remove this comment? You'll lose what you've typed."
        confirmLabel="Remove"
      />
    </div>
  )
}

export default CamCommentsForm
