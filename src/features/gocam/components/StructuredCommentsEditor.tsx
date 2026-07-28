import type React from 'react'
import { useCallback, useState } from 'react'
import { ActionIcon, Button, Select, Textarea } from '@mantine/core'
import { FaTrash } from 'react-icons/fa'
import { FiPlus } from 'react-icons/fi'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'
import { COMMENT_CATEGORIES, type StructuredComment } from '../data/commentCategories'

interface StructuredCommentsEditorProps {
  comments: StructuredComment[]
  onChange: (next: StructuredComment[]) => void
  /** Selectable categories for the Category dropdown. Defaults to model comment categories. */
  categories?: readonly string[]
  /** View-only (not logged in): render comments but hide add/remove/edit affordances (#278). */
  readOnly?: boolean
}

/**
 * Controlled editor for a list of structured (Category + text) comments.
 * Shared by the model-level, per-statement, individual, and reference comment forms.
 */
const StructuredCommentsEditor: React.FC<StructuredCommentsEditorProps> = ({
  comments,
  onChange,
  categories = COMMENT_CATEGORIES,
  readOnly = false,
}) => {
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null)

  const handleAdd = useCallback(() => {
    onChange([...comments, { option: '', text: '' }])
  }, [comments, onChange])

  const handleRemove = useCallback(
    (index: number) => {
      const current = comments[index]
      if (!current?.text.trim()) {
        onChange(comments.filter((_, i) => i !== index))
        return
      }
      setPendingRemoveIndex(index)
    },
    [comments, onChange]
  )

  const confirmRemove = useCallback(() => {
    if (pendingRemoveIndex === null) return
    onChange(comments.filter((_, i) => i !== pendingRemoveIndex))
    setPendingRemoveIndex(null)
  }, [pendingRemoveIndex, comments, onChange])

  const handleOptionChange = useCallback(
    (index: number, value: string | null) => {
      onChange(comments.map((c, i) => (i === index ? { ...c, option: value ?? '' } : c)))
    },
    [comments, onChange]
  )

  const handleTextChange = useCallback(
    (index: number, value: string) => {
      onChange(comments.map((c, i) => (i === index ? { ...c, text: value } : c)))
    },
    [comments, onChange]
  )

  return (
    <>
      {comments.length === 0 ? (
        <div className="py-2 text-sm italic text-gray-400">No comments yet</div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50/50 p-3"
            >
              <Select
                label="Category"
                value={comment.option || null}
                onChange={value => handleOptionChange(i, value)}
                data={categories as unknown as string[]}
                size="sm"
                placeholder="Select a category"
                aria-label="Comment category"
                className="w-72 shrink-0"
                readOnly={readOnly}
              />
              {comment.option || comment.text ? (
                <Textarea
                  label="Comment"
                  value={comment.text}
                  onChange={e => handleTextChange(i, e.target.value)}
                  size="sm"
                  autosize
                  minRows={3}
                  maxRows={8}
                  placeholder="Write your comment..."
                  className="flex-1"
                  readOnly={readOnly}
                />
              ) : (
                <div className="flex-1" />
              )}
              {!readOnly && (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="lg"
                  onClick={() => handleRemove(i)}
                  aria-label="Remove comment"
                  className="mt-6 shrink-0"
                >
                  <FaTrash size={14} />
                </ActionIcon>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="mt-2">
          <Button
            size="compact-sm"
            variant="light"
            color="primary"
            leftSection={<FiPlus size={12} />}
            onClick={handleAdd}
            aria-label="Add Comment"
          >
            {comments.length === 0 ? 'Add Comment' : 'Add Another Comment'}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendingRemoveIndex !== null}
        onClose={() => setPendingRemoveIndex(null)}
        onConfirm={confirmRemove}
        title="Remove Comment"
        message="Remove this comment? This cannot be undone."
        confirmLabel="Remove"
      />
    </>
  )
}

export default StructuredCommentsEditor
