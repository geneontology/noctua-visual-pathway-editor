import { useCallback, useMemo, useState } from 'react'
import { Button } from '@mantine/core'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { buildSaveIndividualCommentsOperations } from '../services/activityOperations'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import StructuredCommentsEditor from './StructuredCommentsEditor'
import { formatComment, parseComment, type StructuredComment } from '../data/commentCategories'

interface IndividualCommentsFormProps {
  /** UID of the individual to comment on — a GO term / input node, or an evidence individual. */
  individualUid: string
  /** Selectable categories for this comment scope (individual vs reference). */
  categories?: readonly string[]
  /** Short label describing what's being commented on, shown in the header. */
  subjectLabel?: string
}

/**
 * Add/edit categorized comments on a single individual (#231). Powers both the
 * individual (GO term / input) comment dialog and the reference (evidence
 * individual) comment dialog — the only difference is the category list.
 */
const IndividualCommentsForm: React.FC<IndividualCommentsFormProps> = ({
  individualUid,
  categories,
  subjectLabel,
}) => {
  const dispatch = useAppDispatch()
  const cam = useAppSelector(selectCamModel)
  const isLoggedIn = !!useAppSelector(selectAuthUser)
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()

  // All individuals (regular nodes + evidence individuals) live in cam.nodes.
  const node = useMemo(
    () => cam?.nodes.find(n => n.uid === individualUid) ?? null,
    [cam, individualUid]
  )

  const [comments, setComments] = useState<StructuredComment[]>(
    () => node?.comments?.map(parseComment) ?? []
  )

  const handleSave = useCallback(async () => {
    if (!cam?.id || !node) return
    const filteredComments = comments.filter(c => c.text.trim()).map(formatComment)
    const ops = buildSaveIndividualCommentsOperations(
      individualUid,
      cam.id,
      node.comments ?? [],
      filteredComments
    )
    await updateGraphModel(ops)
    dispatch(closeDialog())
  }, [cam, node, individualUid, comments, updateGraphModel, dispatch])

  if (!cam || !node) return null

  return (
    <div className="flex flex-col">
      {subjectLabel && (
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="truncate text-xs text-gray-500">{subjectLabel}</div>
        </div>
      )}

      <div className="px-4 py-4">
        <StructuredCommentsEditor
          comments={comments}
          onChange={setComments}
          categories={categories}
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

export default IndividualCommentsForm
