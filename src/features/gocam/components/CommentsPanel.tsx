import type React from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ActionIcon, Button, Tooltip } from '@mantine/core'
import { FaTimes, FaPen, FaPlus, FaComment, FaGithub } from 'react-icons/fa'
import type { Activity, Edge, Evidence, GraphModel, GraphNode } from '../models/cam'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setRightDrawerOpen } from '@/@noctua.core/components/drawer/drawerSlice'
import { setSelectedActivity, selectSelectedActivityId } from '../slices/camSlice'
import { countComments } from '../services/graphServices'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import {
  getCommentCategoryBadgeClass,
  parseComment,
  ANNOTATION_DISPUTE_CATEGORY,
  INDIVIDUAL_COMMENT_CATEGORIES,
  REFERENCE_COMMENT_CATEGORIES,
} from '../data/commentCategories'

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

// The statement a reference belongs to: subject → relation → object. Shown so a
// reference comment isn't just a bare PMID with no context (#231).
function statementLabel(edge: Edge): string {
  return `${nodeShort(edge.source)} → ${edge.label || edge.id} → ${nodeShort(edge.target)}`
}

// Evidence code + reference, e.g. "IDA · PMID:25415977".
function referenceLabel(ev: Evidence): string {
  return [ev.evidenceCode?.label, ev.reference].filter(Boolean).join(' · ') || 'Reference'
}

// GO annotation disputes are triaged as GitHub issues on this tracker (#231).
const GO_ANNOTATION_NEW_ISSUE_URL = 'https://github.com/geneontology/go-annotation/issues/new'

// Pull the bare ORCID id (e.g. "0000-0002-1825-0097") out of an ORCID URI.
function orcidId(uri: string): string {
  const match = uri.match(/\d{4}-\d{4}-\d{4}-[\dX]{4}/)
  return match ? match[0] : uri
}

// A pre-filled "new issue" link on geneontology/go-annotation for a disputed
// annotation, following the template in #231: title carries the model URL, body
// lists gene, disputed GO term, and (if resolvable) the curator.
function buildAnnotationDisputeUrl(params: {
  modelUrl: string
  gene: string
  goTerm: string
  curator: string
}): string {
  const { modelUrl, gene, goTerm, curator } = params
  const body = [`* ${gene}`, `* ${goTerm}`, curator ? `* ${curator}` : null]
    .filter(line => line !== null)
    .join('\n')
  const query = new URLSearchParams({ title: `Annotation dispute ${modelUrl}`, body })
  return `${GO_ANNOTATION_NEW_ISSUE_URL}?${query.toString()}`
}

// Trailing action on an "Annotation dispute" comment: opens the pre-filled
// go-annotation issue in a new tab so the curator can file it (#231).
const DisputeTicketButton: React.FC<{ href: string }> = ({ href }) => (
  <Tooltip label="File this dispute on go-annotation" position="left" withArrow openDelay={300}>
    <ActionIcon
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="subtle"
      color="red"
      size="sm"
      onClick={e => e.stopPropagation()}
      aria-label="File annotation dispute on GitHub"
    >
      <FaGithub size={12} />
    </ActionIcon>
  </Tooltip>
)

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

// Individual / References sub-group inside an activity section.
const CommentTypeGroup: React.FC<{
  title: string
  titleClass: string
  itemClass: string
  subjects: CommentSubject[]
  isLoggedIn: boolean
  activityName: string
  onSelectActivity: () => void
}> = ({ title, titleClass, itemClass, subjects, isLoggedIn, activityName, onSelectActivity }) => {
  if (subjects.length === 0) return null
  return (
    <div className="mb-2 last:mb-0">
      <div className={`mb-1 text-2xs font-bold uppercase tracking-wide ${titleClass}`}>{title}</div>
      <div className="flex flex-col gap-2">
        {subjects.map(subj => (
          <div key={subj.key}>
            <div className="mb-0.5 flex items-start gap-1">
              <div className="min-w-0 grow">
                <div className="truncate font-mono text-2xs text-gray-600" title={subj.label}>
                  {subj.label}
                </div>
                {subj.sublabel && (
                  <div className="truncate text-2xs text-gray-400" title={subj.sublabel}>
                    {subj.sublabel}
                  </div>
                )}
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
            <div className="flex flex-col gap-1">
              {subj.comments.map((comment, i) => {
                const action = subj.renderCommentAction?.(comment)
                return (
                  <div key={i} className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={onSelectActivity}
                      className={`grow cursor-pointer rounded-sm border-l-2 px-2 py-1 text-left text-xs text-gray-700 transition-colors ${itemClass}`}
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
        ))}
      </div>
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

  // Curator on a dispute ticket = the logged-in user, by name if we have it,
  // otherwise their ORCID id.
  const curatorName = authUser ? authUser.name?.trim() || orcidId(authUser.uri) : ''

  const modelComments = model.comments ?? []

  const activitiesWithComments = useMemo<ActivityComments[]>(
    () =>
      model.activities
        .map(activity => {
          const nodes = activity.nodes.filter(n => n.comments && n.comments.length > 0)
          const evidences: EvidenceOnEdge[] = []
          activity.edges.forEach(edge => {
            ;(edge.evidence ?? []).forEach(ev => {
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

  const handleClose = useCallback(() => {
    dispatch(setRightDrawerOpen(false))
  }, [dispatch])

  const handleEditModelComments = useCallback(() => {
    dispatch(
      openDialog({
        component: DialogComponent.CAM_COMMENTS_FORM,
        title: 'Model Comments',
        size: 'sm',
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
          size: 'sm',
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
          size: 'sm',
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
                className={`flex items-center border-l-4 px-3 py-2 ${
                  isSelected ? 'border-orange-500 bg-orange-50' : 'border-slate-400 bg-slate-50'
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
                  title="Node"
                  titleClass="text-purple-800"
                  itemClass="border-purple-300 bg-purple-50/50 hover:bg-purple-100"
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
                            modelUrl: `${ENVIRONMENT.noctuaUrl}/editor/graph/${model.id}`,
                            gene: activityLabel(activity),
                            goTerm: nodeLabel(node),
                            curator: curatorName,
                          })}
                        />
                      )
                    },
                  }))}
                />
                <CommentTypeGroup
                  title="Relation"
                  titleClass="text-teal-800"
                  itemClass="border-teal-300 bg-teal-50/50 hover:bg-teal-100"
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
