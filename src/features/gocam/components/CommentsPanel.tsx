import type React from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ActionIcon, Button, Tooltip } from '@mantine/core'
import { FaTimes, FaPen, FaPlus, FaComment } from 'react-icons/fa'
import type { Activity, Edge, Evidence, GraphModel, GraphNode } from '../models/cam'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setRightDrawerOpen } from '@/@noctua.core/components/drawer/drawerSlice'
import { setSelectedActivity, selectSelectedActivityId } from '../slices/camSlice'
import { countComments } from '../services/graphServices'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import {
  getCommentCategoryBadgeClass,
  parseComment,
  ANNOTATION_DISPUTE_CATEGORY,
  INDIVIDUAL_COMMENT_CATEGORIES,
  REFERENCE_COMMENT_CATEGORIES,
} from '../data/commentCategories'
import { buildAnnotationDisputeUrl } from '../data/annotationDispute'
import DisputeTicketButton from './DisputeTicketButton'

interface CommentsPanelProps {
  model: GraphModel
}

function activityLabel(activity: Activity): string {
  return (
    activity.enabledBy?.label ??
    activity.molecularFunction?.label ??
    activity.rootNode.label ??
    'Activity'
  )
}

function nodeLabel(node: GraphNode): string {
  if (node.label && node.id) return `${node.label} (${node.id})`
  return node.label || node.id || 'Individual'
}

function nodeShort(node?: GraphNode): string {
  return node?.label || node?.id || '?'
}

// The statement a reference belongs to, as relation → object (e.g.
// "enabled by → ABCA14 Sscr"). The subject is dropped — it's already the
// activity the section is under — to keep the line short (#231).
function statementLabel(edge: Edge): string {
  return `${edge.label || edge.id} → ${nodeShort(edge.target)}`
}

// Evidence code + reference, e.g. "IDA · PMID:25415977".
function referenceLabel(ev: Evidence): string {
  return [ev.evidenceCode?.label, ev.reference].filter(Boolean).join(' · ') || 'Reference'
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

  const modelComments = model.comments ?? []

  const activitiesWithComments = useMemo<ActivityComments[]>(
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
  // the count on the "Activity units" group header (#231).
  const activityCommentTotal = activitiesWithComments.reduce((s, a) => s + a.total, 0)

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
            subjectLabel: nodeLabel(node),
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
            subjectLabel: `${statementLabel(edge)} · ${referenceLabel(ev)}`,
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
      <div className="flex h-10 shrink-0 items-center justify-between bg-white px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <FaComment size={14} className="text-slate-600" />
          <span className="text-base font-semibold text-slate-800">Comments</span>
          {totalCount > 0 && (
            <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-2xs font-semibold text-slate-700">
              {totalCount}
            </span>
          )}
        </div>
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

      <div className="flex-1 overflow-y-auto bg-white">
        {/* ── Model comments (not tied to an activity) ── */}
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
                      label: nodeLabel(node),
                      comments: node.comments ?? [],
                      onEdit: () => handleEditNodeComments(node, activity),
                      renderCommentAction: comment => {
                        const { option } = parseComment(comment)
                        if (option !== ANNOTATION_DISPUTE_CATEGORY) return null
                        return (
                          <DisputeTicketButton
                            href={buildAnnotationDisputeUrl({
                              modelUrl: window.location.href,
                              gene: activityLabel(activity),
                              goTerm: nodeLabel(node),
                              // Curators on the ticket = whoever contributed the
                              // disputed individual, not whoever is filing (#231).
                              contributors: node.contributors ?? [],
                            })}
                          />
                        )
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
                      sublabel: referenceLabel(ev),
                      comments: ev.comments ?? [],
                      onEdit: () => handleEditEvidenceComments(edge, ev, activity),
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
