import type React from 'react'
import { useCallback, useMemo } from 'react'
import { ActionIcon, Button, Tooltip } from '@mantine/core'
import { FaTimes, FaPen, FaPlus, FaComment } from 'react-icons/fa'
import type { Activity, Edge, GraphModel } from '../models/cam'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  setRightDrawerOpen,
  setRightPanelTab,
  RightPanelTab,
} from '@/@noctua.core/components/drawer/drawerSlice'
import { setSelectedActivity } from '../slices/camSlice'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import { getCommentCategoryBadgeClass, parseComment } from '../data/commentCategories'

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

function edgeLabel(edge: Edge): string {
  const subj = edge.source?.label ?? edge.sourceId
  const obj = edge.target?.label ?? edge.targetId
  return `${subj} ${edge.label || edge.id} ${obj}`
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

interface ActivityEdgesWithComments {
  activity: Activity
  edges: Edge[]
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ model }) => {
  const dispatch = useAppDispatch()
  const isLoggedIn = !!useAppSelector(selectAuthUser)

  const modelComments = model.comments ?? []

  const activitiesWithCommentedEdges = useMemo<ActivityEdgesWithComments[]>(
    () =>
      model.activities
        .map(activity => ({
          activity,
          edges: activity.edges.filter(e => e.comments && e.comments.length > 0),
        }))
        .filter(a => a.edges.length > 0),
    [model.activities]
  )

  const totalEdgeComments = useMemo(
    () =>
      activitiesWithCommentedEdges.reduce(
        (sum, a) => sum + a.edges.reduce((s, e) => s + e.comments.length, 0),
        0
      ),
    [activitiesWithCommentedEdges]
  )

  const totalCount = modelComments.length + totalEdgeComments

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

  const handleEditEdgeComments = useCallback(
    (edge: Edge, activity: Activity) => {
      dispatch(setSelectedActivity(activity.uid))
      dispatch(
        openDialog({
          component: DialogComponent.EDGE_COMMENTS_FORM,
          title: 'Comments',
          size: 'sm',
          customProps: { edgeUid: edge.uid },
        })
      )
    },
    [dispatch]
  )

  const handleSelectEdgeComment = useCallback(
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
        {/* ── Section A: Model comments ── */}
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

        {/* ── Section B: Per-statement comments grouped by activity ── */}
        <section>
          <div className="flex items-center border-l-4 border-amber-500 bg-amber-50 px-3 py-2">
            <span className="grow text-xs font-bold uppercase tracking-wider text-amber-800">
              Statements
            </span>
            {totalEdgeComments > 0 && (
              <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-2xs font-semibold text-amber-900">
                {totalEdgeComments}
              </span>
            )}
          </div>

          {activitiesWithCommentedEdges.length === 0 ? (
            <div className="px-3 py-2 text-xs italic text-gray-400">
              No statement comments yet. Open an activity and use the Comment item in a row's
              menu to add one.
            </div>
          ) : (
            <div className="flex flex-col">
              {activitiesWithCommentedEdges.map(({ activity, edges }) => (
                <div key={activity.uid} className="border-b border-slate-100 px-3 py-2">
                  <div
                    className="mb-1 truncate text-xs font-semibold text-gray-800"
                    title={activityLabel(activity)}
                  >
                    {activityLabel(activity)}
                  </div>
                  <div className="flex flex-col gap-2">
                    {edges.map(edge => (
                      <div key={edge.uid}>
                        <div className="mb-0.5 flex items-center gap-1">
                          <span
                            className="grow truncate font-mono text-2xs text-gray-500"
                            title={edgeLabel(edge)}
                          >
                            {edgeLabel(edge)}
                          </span>
                          {isLoggedIn && (
                            <Tooltip label="Edit comments" position="left" withArrow openDelay={300}>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="xs"
                                onClick={() => handleEditEdgeComments(edge, activity)}
                                aria-label={`Edit comments on ${edgeLabel(edge)}`}
                              >
                                <FaPen size={9} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {edge.comments.map((comment, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectEdgeComment(activity)}
                              className="cursor-pointer rounded-sm border-l-2 border-amber-300 bg-amber-50/50 px-2 py-1 text-left text-xs text-gray-700 transition-colors hover:bg-amber-100"
                              aria-label={`Select activity ${activityLabel(activity)}`}
                            >
                              <CommentText comment={comment} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default CommentsPanel
