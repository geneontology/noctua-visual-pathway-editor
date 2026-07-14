import { useCallback, useState } from 'react'
import { ActionIcon, Button, Select, Textarea } from '@mantine/core'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { buildSaveModelAnnotationsOperations } from '../services/activityOperations'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'
import SectionHeading from '@/@noctua.core/components/form/SectionHeading'
import {
  COMMENT_CATEGORIES,
  formatComment,
  parseComment,
  type StructuredComment,
} from '../data/commentCategories'

const CamCommentsForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const cam = useAppSelector(selectCamModel)
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()
  const [comments, setComments] = useState<StructuredComment[]>(
    () => cam?.comments?.map(parseComment) ?? []
  )
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null)

  const handleAddComment = useCallback(() => {
    setComments(prev => [...prev, { option: '', text: '' }])
  }, [])

  const handleRemoveComment = useCallback(
    (index: number) => {
      const current = comments[index]
      if (!current?.text.trim()) {
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

  const handleOptionChange = useCallback((index: number, value: string | null) => {
    setComments(prev => prev.map((c, i) => (i === index ? { ...c, option: value ?? '' } : c)))
  }, [])

  const handleTextChange = useCallback((index: number, value: string) => {
    setComments(prev => prev.map((c, i) => (i === index ? { ...c, text: value } : c)))
  }, [])

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
        {comments.length === 0 ? (
          <div className="py-2 text-sm italic text-gray-400">No comments yet</div>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((comment, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50/50 p-3"
              >
                <div className="flex items-end gap-2">
                  <Select
                    label="Category"
                    value={comment.option || null}
                    onChange={value => handleOptionChange(i, value)}
                    data={COMMENT_CATEGORIES as unknown as string[]}
                    size="sm"
                    placeholder="Select a category"
                    aria-label="Comment category"
                    className="flex-1"
                  />
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="lg"
                    onClick={() => handleRemoveComment(i)}
                    aria-label="Remove comment"
                  >
                    <FaTrash size={14} />
                  </ActionIcon>
                </div>
                {(comment.option || comment.text) && (
                  <Textarea
                    label="Comment"
                    value={comment.text}
                    onChange={e => handleTextChange(i, e.target.value)}
                    size="sm"
                    autosize
                    minRows={3}
                    maxRows={8}
                    placeholder="Write your comment..."
                  />
                )}
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
            aria-label="Add Comment"
          >
            {comments.length === 0 ? 'Add Comment' : 'Add Another Comment'}
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <Button variant="outline" size="sm" onClick={() => dispatch(closeDialog())}>
          Cancel
        </Button>
        <Button variant="filled" size="sm" onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <ConfirmDialog
        open={pendingRemoveIndex !== null}
        onClose={() => setPendingRemoveIndex(null)}
        onConfirm={confirmRemoveComment}
        title="Remove Comment"
        message="Remove this comment? This cannot be undone."
        confirmLabel="Remove"
      />
    </div>
  )
}

export default CamCommentsForm
