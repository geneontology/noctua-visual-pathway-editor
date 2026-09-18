import type React from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ActionIcon, Button, Tooltip } from '@mantine/core'
import { FaTimes, FaPen, FaPlus, FaComment, FaArrowLeft } from 'react-icons/fa'
import type { Activity, Edge, Evidence, GraphModel, GraphNode } from '../models/cam'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  setRightDrawerOpen,
  setCommentsScope,
  selectCommentsActivityScope,
} from '@/@noctua.core/components/drawer/drawerSlice'
import { setSelectedActivity, selectSelectedActivityId } from '../slices/camSlice'
import { countComments } from '../services/graphServices'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import {
  getCommentCategoryBadgeClass,
  parseComment,
  INDIVIDUAL_COMMENT_CATEGORIES,
  REFERENCE_COMMENT_CATEGORIES,
} from '../data/commentCategories'
import { commentTicket } from '../data/annotationDispute'
import {
  activityLabel,
  individualLabel,
  statementLabel,
  evidenceLabel,
} from '../services/commentSubjects'
import CommentTicketButton from './CommentTicketButton'

interface CommentsPanelProps {
  model: GraphModel
}

const CommentText: React.FC<{ comment: string }> = ({ comment }) => {
  const { option, text } = parseComment(comment)
  return (
    <span className="whitespace-pre-wrap break-words">
      {option && (
        <span
          className={`mr-1 rounded-sm px-1 py-0.5 text-2xs font-semibold uppercase tracking-wide ${getCommentCategoryBadgeClass(option)}`}
        >
          {option}
        </span>
      )}
      {text}
    </span>
  )
}

// One comment-bearing subject within a type group (an edge, a node, or an evidence).
interface CommentSubject {
  key: string
  label: string
  // Secondary muted line under the label (e.g. evidence code + reference).
  sublabel?: string
  comments: string[]
  onEdit?: () => void
  // Optional trailing action rendered beside a specific comment (e.g. the
  // "file annotation dispute" ticket link). Returns null for comments that
  // don't get one.
  renderCommentAction?: (comment: string) => React.ReactNode
}

// Individual / References sub-group inside an activity section. Reads like a
// social-media thread: a muted subject line (the term, or relation → object ·
// reference), with its comments indented beneath it. Color lives only on the
// category badge — nothing else is tinted (#231).
const CommentTypeGroup: React.FC<{
  subjects: CommentSubject[]
  isLoggedIn: boolean
  activityName: string
  onSelectActivity: () => void
}> = ({ subjects, isLoggedIn, activityName, onSelectActivity }) => {
  if (subjects.length === 0) return null
  return (
    <div className="mb-2 flex flex-col gap-2 last:mb-0">
      {subjects.map(subj => {
        const context = [subj.label, subj.sublabel].filter(Boolean).join(' · ')
        return (
          <div key={subj.key}>
            {/* Subject — the thing being commented on. */}
            <div className="flex items-start gap-1">
              <div
                className="min-w-0 grow truncate font-mono text-2xs text-gray-500"
                title={context}
              >
                {context}
              </div>
              {isLoggedIn && subj.onEdit && (
                <Tooltip label="Edit comments" position="left" withArrow openDelay={300}>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={subj.onEdit}
                    aria-label={`Edit comments on ${subj.label}`}
                  >
                    <FaPen size={9} />
                  </ActionIcon>
                </Tooltip>
              )}
            </div>
            {/* Comments — indented under the subject, threaded like replies. */}
            <div className="ml-1 flex flex-col gap-0.5 border-l border-gray-200 pl-2">
              {subj.comments.map((comment, i) => {
                const action = subj.renderCommentAction?.(comment)
                return (
                  <div key={i} className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={onSelectActivity}
                      className="min-w-0 grow cursor-pointer rounded-sm px-1 py-0.5 text-left text-xs leading-snug text-gray-700 hover:bg-gray-50"
                      aria-label={`Select activity ${activityName}`}
                    >
                      <CommentText comment={comment} />
                    </button>
                    {action}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// An evidence bearing comments, paired with the edge (statement) it sits on so
// the panel can show subject → relation → object context.
interface EvidenceOnEdge {
  edge: Edge
  ev: Evidence
}

// All comments for one activity, split by type.
interface ActivityComments {
  activity: Activity
  nodes: GraphNode[]
  evidences: EvidenceOnEdge[]
  total: number
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ model }) => {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector(selectAuthUser)
  const isLoggedIn = !!authUser
  const selectedActivityId = useAppSelector(selectSelectedActivityId)
  // Set when the panel was opened from one activity unit's own comment icon:
  // that icon shows only that unit's comments (#289).
  const commentsScope = useAppSelector(selectCommentsActivityScope)

  const modelComments = model.comments ?? []

  const allActivitiesWithComments = useMemo<ActivityComments[]>(
    () =>
      model.activities
        .map(activity => {
          const nodes = activity.nodes.filter(n => n.comments && n.comments.length > 0)
          const evidences: EvidenceOnEdge[] = []
          activity.edges.forEach(edge => {
            ; (edge.evidence ?? []).forEach(ev => {
              if (ev.comments && ev.comments.length > 0) evidences.push({ edge, ev })
            })
          })
          const total =
            nodes.reduce((s, n) => s + (n.comments?.length ?? 0), 0) +
            evidences.reduce((s, e) => s + (e.ev.comments?.length ?? 0), 0)
          return { activity, nodes, evidences, total }
        })
        // Keep any activity with comments, plus the currently selected one even
        // if it has none — so clicking its comment button always shows (and
        // highlights) a section to land on (#231).
        .filter(a => a.total > 0 || a.activity.uid === selectedActivityId),
    [model.activities, selectedActivityId]
  )

  // Scoped to one activity unit, the panel drops every other section (and the
  // model comments, which belong to no unit) — #289.
  const scopedActivity = commentsScope
    ? (allActivitiesWithComments.find(a => a.activity.uid === commentsScope) ?? null)
    : null
  const isScoped = scopedActivity !== null
  const activitiesWithComments = scopedActivity ? [scopedActivity] : allActivitiesWithComments

  const handleShowAllComments = useCallback(() => {
    dispatch(setCommentsScope(null))
  }, [dispatch])

  // Scroll the selected activity's section into view when selection changes, so
  // the highlight is actually visible even when it's below the fold.
  const selectedSectionRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (selectedActivityId && selectedSectionRef.current) {
      selectedSectionRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedActivityId])

  const totalCount = countComments(model)

  // Sum of every comment sitting on an activity unit (node + relation), shown as
  // the count on the "Activity units" group header (#231). Scoped, that's the
  // one unit's comments, which is also all the panel is showing.
  const activityCommentTotal = activitiesWithComments.reduce((s, a) => s + a.total, 0)
  const headerCount = isScoped ? activityCommentTotal : totalCount

  const handleClose = useCallback(() => {
    dispatch(setRightDrawerOpen(false))
  }, [dispatch])

  const handleEditModelComments = useCallback(() => {
    dispatch(
      openDialog({
        component: DialogComponent.CAM_COMMENTS_FORM,
        title: 'Model Comments',
        size: 'lg',
      })
    )
  }, [dispatch])

  const handleEditNodeComments = useCallback(
    (node: GraphNode, activity: Activity) => {
      dispatch(setSelectedActivity(activity.uid))
      dispatch(
        openDialog({
          component: DialogComponent.INDIVIDUAL_COMMENTS_FORM,
          title: 'Node Comments',
          size: 'lg',
          customProps: {
            individualUid: node.uid,
            categories: INDIVIDUAL_COMMENT_CATEGORIES,
            subjectLabel: individualLabel(node),
          },
        })
      )
    },
    [dispatch]
  )

  const handleEditEvidenceComments = useCallback(
    (edge: Edge, ev: Evidence, activity: Activity) => {
      dispatch(setSelectedActivity(activity.uid))
      dispatch(
        openDialog({
          component: DialogComponent.INDIVIDUAL_COMMENTS_FORM,
          title: 'Relation Comments',
          size: 'lg',
          customProps: {
            individualUid: ev.uid,
            categories: REFERENCE_COMMENT_CATEGORIES,
            subjectLabel: `${statementLabel(edge)} · ${evidenceLabel(ev)}`,
          },
        })
      )
    },
    [dispatch]
  )

  const handleSelectActivity = useCallback(
    (activity: Activity) => {
      // Highlight the activity unit on the graph and mark this section selected;
      // stay on the Comments panel (don't jump to the Activity Table) — #231.
      dispatch(setSelectedActivity(activity.uid))
    },
    [dispatch]
  )

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 bg-white px-6 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <FaComment size={14} className="shrink-0 text-slate-600" />
          <span className="shrink-0 text-base font-semibold text-slate-800">Comments</span>
          {scopedActivity && (
            <span
              className="truncate text-xs text-slate-500"
              title={activityLabel(scopedActivity.activity)}
            >
              {activityLabel(scopedActivity.activity)}
            </span>
          )}
          {headerCount > 0 && (
            <span className="shrink-0 rounded-md bg-slate-200 px-1.5 py-0.5 text-2xs font-semibold text-slate-700">
              {headerCount}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isScoped && (
            <Button
              variant="subtle"
              size="xs"
              onClick={handleShowAllComments}
              leftSection={<FaArrowLeft size={10} />}
              className="!min-h-[26px] !text-xs !normal-case"
            >
              Show all comments
            </Button>
          )}
          <Button
            variant="outline"
            size="xs"
            onClick={handleClose}
            leftSection={<FaTimes size={10} />}
            className="!min-h-[26px] !border-gray-300 !text-xs !normal-case !text-primary-500 hover:!border-primary-500"
          >
            Close
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {/* ── Model comments — not tied to an activity, so hidden while scoped to one ── */}
        {!isScoped && (
          <section className="border-b border-slate-200">
            <div className="flex items-center border-l-4 border-primary-500 bg-primary-50 px-3 py-2">
              <span className="grow text-xs font-bold uppercase tracking-wider text-primary-700">
                Model
              </span>
              {modelComments.length > 0 && (
                <span className="mr-1 rounded-md bg-primary-100 px-1.5 py-0.5 text-2xs font-semibold text-primary-700">
                  {modelComments.length}
                </span>
              )}
              {isLoggedIn && (
                <Tooltip
                  label={modelComments.length > 0 ? 'Edit model comments' : 'Add model comment'}
                  position="bottom"
                  withArrow
                  openDelay={300}
                >
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={handleEditModelComments}
                    aria-label="Edit model comments"
                  >
                    {modelComments.length > 0 ? <FaPen size={11} /> : <FaPlus size={11} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </div>
            {modelComments.length === 0 ? (
              <div className="px-3 py-2 text-xs italic text-gray-400">No model comments yet</div>
            ) : (
              <div className="flex flex-col gap-1 px-3 py-2">
                {modelComments.map((comment, i) => (
                  <div
                    key={i}
                    className="rounded-sm border-l-2 border-primary-300 bg-primary-50/40 px-2 py-1 text-xs text-gray-700"
                  >
                    <CommentText comment={comment} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Activity units: group header over the per-activity sections ── */}
        <div className="flex items-center border-l-4 border-primary-500 bg-primary-50 px-3 py-2">
          <span className="grow text-xs font-bold uppercase tracking-wider text-primary-700">
            Activity units comments
          </span>
          {activityCommentTotal > 0 && (
            <span className="rounded-md bg-primary-100 px-1.5 py-0.5 text-2xs font-semibold text-primary-700">
              {activityCommentTotal}
            </span>
          )}
        </div>

        {/* ── One section per activity, comments split by type inside ── */}
        {activitiesWithComments.length === 0 ? (
          <div className="px-3 py-3 text-xs italic text-gray-400">
            No annotation comments yet. Use the comment icon on a node or relation to add one.
          </div>
        ) : (
          activitiesWithComments.map(({ activity, nodes, evidences, total }) => {
            const isSelected = activity.uid === selectedActivityId
            return (
              <section
                key={activity.uid}
                ref={isSelected ? selectedSectionRef : undefined}
                className={`border-b border-slate-200 ${isSelected ? 'bg-orange-50/40' : ''}`}
              >
                <div
                  className={`flex items-center border-l-4 px-3 py-2 ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-slate-400 bg-slate-50'
                    }`}
                >
                  <span
                    className="grow truncate text-xs font-bold text-slate-800"
                    title={activityLabel(activity)}
                  >
                    {activityLabel(activity)}
                  </span>
                  <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-2xs font-semibold text-slate-700">
                    {total}
                  </span>
                </div>

                <div className="px-3 py-2">
                  {total === 0 && (
                    <div className="text-xs italic text-gray-400">
                      No comments on this activity yet
                    </div>
                  )}
                  <CommentTypeGroup
                    isLoggedIn={isLoggedIn}
                    activityName={activityLabel(activity)}
                    onSelectActivity={() => handleSelectActivity(activity)}
                    subjects={nodes.map(node => ({
                      key: node.uid,
                      label: individualLabel(node),
                      comments: node.comments ?? [],
                      onEdit: () => handleEditNodeComments(node, activity),
                      renderCommentAction: comment => {
                        const { option, text } = parseComment(comment)
                        const ticket = commentTicket(option, {
                          modelUrl: window.location.href,
                          gene: activityLabel(activity),
                          goTerm: individualLabel(node),
                          // Curators on the ticket = whoever contributed the
                          // individual, not whoever is filing (#231).
                          contributors: node.contributors ?? [],
                          comment: text,
                        })
                        return ticket ? <CommentTicketButton ticket={ticket} /> : null
                      },
                    }))}
                  />
                  <CommentTypeGroup
                    isLoggedIn={isLoggedIn}
                    activityName={activityLabel(activity)}
                    onSelectActivity={() => handleSelectActivity(activity)}
                    subjects={evidences.map(({ edge, ev }) => ({
                      key: ev.uid,
                      label: statementLabel(edge),
                      sublabel: evidenceLabel(ev),
                      comments: ev.comments ?? [],
                      onEdit: () => handleEditEvidenceComments(edge, ev, activity),
                      renderCommentAction: comment => {
                        const { option, text } = parseComment(comment)
                        const ticket = commentTicket(option, {
                          modelUrl: window.location.href,
                          gene: activityLabel(activity),
                          // An evidence individual supports a statement rather
                          // than a term, so the ticket names both it and the
                          // evidence (#289).
                          statement: statementLabel(edge),
                          evidence: evidenceLabel(ev),
                          contributors: ev.contributors ?? [],
                          comment: text,
                        })
                        return ticket ? <CommentTicketButton ticket={ticket} /> : null
                      },
                    }))}
                  />
                </div>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}

export default CommentsPanel
