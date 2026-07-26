import type React from 'react'
import { useCallback, useMemo } from 'react'
import { ActionIcon, Button, Tooltip } from '@mantine/core'
import { FaTimes, FaPen, FaPlus, FaComment } from 'react-icons/fa'
import type { Activity, Evidence, GraphModel, GraphNode } from '../models/cam'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  setRightDrawerOpen,
  setRightPanelTab,
  RightPanelTab,
} from '@/@noctua.core/components/drawer/drawerSlice'
import { setSelectedActivity } from '../slices/camSlice'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import {
  getCommentCategoryBadgeClass,
  parseComment,
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
  return node.label || node.id || 'Individual'
}

function referenceLabel(ev: Evidence): string {
  return ev.reference || ev.evidenceCode?.label || 'Reference'
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
  comments: string[]
  onEdit?: () => void
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
            <div className="mb-0.5 flex items-center gap-1">
              <span className="grow truncate font-mono text-2xs text-gray-500" title={subj.label}>
                {subj.label}
              </span>
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
              {subj.comments.map((comment, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={onSelectActivity}
                  className={`cursor-pointer rounded-sm border-l-2 px-2 py-1 text-left text-xs text-gray-700 transition-colors ${itemClass}`}
                  aria-label={`Select activity ${activityName}`}
                >
                  <CommentText comment={comment} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// All comments for one activity, split by type.
interface ActivityComments {
  activity: Activity
  nodes: GraphNode[]
  evidences: Evidence[]
  total: number
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ model }) => {
  const dispatch = useAppDispatch()
  const isLoggedIn = !!useAppSelector(selectAuthUser)

  const modelComments = model.comments ?? []

  const activitiesWithComments = useMemo<ActivityComments[]>(
    () =>
      model.activities
        .map(activity => {
          const nodes = activity.nodes.filter(n => n.comments && n.comments.length > 0)
          const evidences: Evidence[] = []
          activity.edges.forEach(edge => {
            ;(edge.evidence ?? []).forEach(ev => {
              if (ev.comments && ev.comments.length > 0) evidences.push(ev)
            })
          })
          const total =
            nodes.reduce((s, n) => s + (n.comments?.length ?? 0), 0) +
            evidences.reduce((s, ev) => s + (ev.comments?.length ?? 0), 0)
          return { activity, nodes, evidences, total }
        })
        .filter(a => a.total > 0),
    [model.activities]
  )

  const totalActivityComments = useMemo(
    () => activitiesWithComments.reduce((sum, a) => sum + a.total, 0),
    [activitiesWithComments]
  )

  const totalCount = modelComments.length + totalActivityComments

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
    (ev: Evidence, activity: Activity) => {
      dispatch(setSelectedActivity(activity.uid))
      dispatch(
        openDialog({
          component: DialogComponent.INDIVIDUAL_COMMENTS_FORM,
          title: 'Relation Comments',
          size: 'sm',
          customProps: {
            individualUid: ev.uid,
            categories: REFERENCE_COMMENT_CATEGORIES,
            subjectLabel: referenceLabel(ev),
          },
        })
      )
    },
    [dispatch]
  )

  const handleSelectActivity = useCallback(
    (activity: Activity) => {
      dispatch(setSelectedActivity(activity.uid))
      dispatch(setRightPanelTab(RightPanelTab.ACTIVITY_TABLE))
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
          activitiesWithComments.map(({ activity, nodes, evidences, total }) => (
            <section key={activity.uid} className="border-b border-slate-200">
              <div className="flex items-center border-l-4 border-slate-400 bg-slate-50 px-3 py-2">
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
                  }))}
                />
                <CommentTypeGroup
                  title="Relation"
                  titleClass="text-teal-800"
                  itemClass="border-teal-300 bg-teal-50/50 hover:bg-teal-100"
                  isLoggedIn={isLoggedIn}
                  activityName={activityLabel(activity)}
                  onSelectActivity={() => handleSelectActivity(activity)}
                  subjects={evidences.map(ev => ({
                    key: ev.uid,
                    label: referenceLabel(ev),
                    comments: ev.comments ?? [],
                    onEdit: () => handleEditEvidenceComments(ev, activity),
                  }))}
                />
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

export default CommentsPanel
