import { useCallback, useMemo, useState } from 'react'
import { Button } from '@mantine/core'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import { buildSaveIndividualCommentsOperations } from '../services/activityOperations'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import StructuredCommentsEditor from './StructuredCommentsEditor'
import CommentTicketButton from './CommentTicketButton'
import { formatComment, parseComment, type StructuredComment } from '../data/commentCategories'
import { commentTicket } from '../data/annotationDispute'
import {
  activityLabel,
  individualLabel,
  statementLabel,
  evidenceLabel,
  findCommentSubject,
} from '../services/commentSubjects'

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
  const authUser = useAppSelector(selectAuthUser)
  const isLoggedIn = !!authUser
  const [updateGraphModel, { isLoading }] = useUpdateGraphModelMutation()

  // All individuals (regular nodes + evidence individuals) live in cam.nodes.
  const node = useMemo(
    () => cam?.nodes.find(n => n.uid === individualUid) ?? null,
    [cam, individualUid]
  )

  // Context for a GitHub ticket on a dispute or a pending ontology term: the
  // enabling gene of the activity this individual sits in, the individual
  // itself, and — when it's an evidence individual — the statement it supports
  // (#231, #289). Curators named are whoever contributed the individual being
  // commented on, not whoever is filing.
  const location = useMemo(() => findCommentSubject(cam, individualUid), [cam, individualUid])
  const ticketContext = useMemo(
    () => ({
      modelUrl: window.location.href,
      gene: location ? activityLabel(location.activity) : 'Activity',
      goTerm: individualLabel(node),
      statement: location?.edge ? statementLabel(location.edge) : undefined,
      evidence: location?.evidence ? evidenceLabel(location.evidence) : undefined,
      contributors: node?.contributors ?? [],
    }),
    [location, node]
  )

  const renderCommentAction = useCallback(
    (comment: StructuredComment) => {
      const ticket = commentTicket(comment.option, { ...ticketContext, comment: comment.text })
      return ticket ? <CommentTicketButton ticket={ticket} /> : null
    },
    [ticketContext]
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
        <div className="shrink-0 border-b border-gray-200 px-4 py-3">
          <div className="truncate text-xs text-gray-500">{subjectLabel}</div>
        </div>
      )}

      <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
        <StructuredCommentsEditor
          comments={comments}
          onChange={setComments}
          categories={categories}
          readOnly={!isLoggedIn}
          renderCommentAction={renderCommentAction}
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

export default IndividualCommentsForm
