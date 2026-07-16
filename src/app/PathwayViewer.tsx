import { useCallback, useState, useEffect } from 'react'
import type React from 'react'
import { useGetGraphModelQuery } from '@/features/gocam/slices/camApiSlice'
import { useAppDispatch, useAppSelector } from './hooks'
import {
  setModel,
  setSelectedActivity,
} from '@/features/gocam/slices/camSlice'
import { useSearchParams } from 'react-router-dom'
import PathwayGraph from '@/features/pathway/components/PathwayGraph'
import GraphToolbar from '@/features/pathway/components/GraphToolbar'
import StencilPalette from '@/features/pathway/components/StencilPalette'
import {
  setRightDrawerOpen,
  setRightPanelTab,
  RightPanelTab,
} from '@/@noctua.core/components/drawer/drawerSlice'
import type { Activity, Edge } from '@/features/gocam/models/cam'
import { ActivityType } from '@/features/gocam/models/cam'
import type { ActivityFormType } from '@/features/gocam/models/formModels'
import {
  resetForm,
  initCreateForm,
  initDuplicateForm,
} from '@/features/gocam/slices/activityFormSlice'
import { Button, Modal } from '@mantine/core'
import { FaExclamationTriangle } from 'react-icons/fa'
import { resolveModalSize } from '@/@noctua.core/components/dialog/modalSize'
import SimpleDialog from '@/@noctua.core/components/dialog/SimpleDialog'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'
import ActivityDialog from '@/features/gocam/components/dialogs/ActivityFormDialog'
import ActivityForm from '@/features/gocam/components/forms/ActivityForm'
import ConnectorForm from '@/features/relations/components/ConnectorForm'
import { renderConnectorDialogTitle } from '@/features/relations/services/connectorTitle'
import { selectAuthUser, selectBaristaToken } from '@/features/auth/slices/authSlice'
import { useGroupGuard } from '@/features/gocam/components/GroupGuardProvider'
import { usePathwayCanvas } from './hooks/usePathwayCanvas'
import { useDeleteConfirmation } from './hooks/useDeleteConfirmation'
import { useBaristaModelWatch } from './hooks/useBaristaModelWatch'

interface ConnectorDialog {
  open: boolean
  source: Activity | null
  target: Activity | null
  edge: Edge | null
}

const closedConnector: ConnectorDialog = {
  open: false,
  source: null,
  target: null,
  edge: null,
}

const DUPLICATE_LINK_MESSAGE =
  "These two activities are already connected. Use the 'Edit relation' function or delete the relation before creating a new one."

const PathwayEditor: React.FC = () => {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const modelId = searchParams.get('model_id')

  const user = useAppSelector(selectAuthUser)
  const baristaToken = useAppSelector(selectBaristaToken)
  const isLoggedIn = !!user
  const checkGroup = useGroupGuard()

  const canvas = usePathwayCanvas(isLoggedIn)
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const [connector, setConnector] = useState<ConnectorDialog>(closedConnector)
  const [duplicateLinkOpen, setDuplicateLinkOpen] = useState(false)

  const {
    data: graphModel,
    error,
    isLoading,
    isSuccess,
    refetch,
  } = useGetGraphModelQuery(
    { modelId: modelId || '', baristaToken: baristaToken || '' },
    { skip: !modelId }
  )

  const { externalChangePending, acknowledge } = useBaristaModelWatch(modelId)

  const handleRefreshModel = useCallback(() => {
    acknowledge()
    refetch()
  }, [acknowledge, refetch])

  const del = useDeleteConfirmation(graphModel?.data ?? null)

  useEffect(() => {
    if (isSuccess && graphModel?.data) {
      dispatch(setModel(graphModel.data))
    }
  }, [graphModel, isSuccess, dispatch])

  // ── Canvas callbacks ──────────────────────────────────────────

  const handleSelectActivity = useCallback(
    (activityId: string) => {
      dispatch(setSelectedActivity(activityId))
      dispatch(setRightPanelTab(RightPanelTab.ACTIVITY_TABLE))
      dispatch(setRightDrawerOpen(true))
    },
    [dispatch]
  )

  const handleLinkClick = useCallback(
    (sourceId: string, targetId: string) => {
      const model = graphModel?.data
      if (!model) return
      const source = model.activities.find(a => a.uid === sourceId)
      const target = model.activities.find(a => a.uid === targetId)
      if (!source || !target) return
      const edge = model.activityConnections.find(
        c =>
          (c.sourceId === source.rootNode?.uid &&
            c.targetId === target.rootNode?.uid) ||
          (c.sourceId === target.rootNode?.uid &&
            c.targetId === source.rootNode?.uid)
      )
      if (!edge) return
      checkGroup(() => setConnector({ open: true, source, target, edge }))
    },
    [graphModel, checkGroup]
  )

  const handleLinkCreated = useCallback(
    (sourceId: string, targetId: string) => {
      const source = graphModel?.data?.activities.find(a => a.uid === sourceId)
      const target = graphModel?.data?.activities.find(a => a.uid === targetId)
      if (source && target) {
        checkGroup(() => setConnector({ open: true, source, target, edge: null }))
      }
    },
    [graphModel, checkGroup]
  )

  const handleDuplicateLink = useCallback(() => {
    setDuplicateLinkOpen(true)
  }, [])

  const handleDuplicateActivity = useCallback(
    (activityId: string) => {
      const activity = graphModel?.data?.activities.find(a => a.uid === activityId)
      if (!activity) return
      const activityType: ActivityFormType =
        activity.type === ActivityType.MOLECULE
          ? 'molecule'
          : activity.type === ActivityType.PROTEIN_COMPLEX
            ? 'proteinComplex'
            : 'activity'
      checkGroup(() => {
        dispatch(resetForm())
        dispatch(initDuplicateForm({ activity, activityType }))
        setActivityFormOpen(true)
      })
    },
    [graphModel, dispatch, checkGroup]
  )

  const handleStencilDrop = useCallback(
    (type: string) => {
      checkGroup(() => {
        dispatch(resetForm())
        dispatch(initCreateForm(type as ActivityFormType))
        setActivityFormOpen(true)
      })
    },
    [dispatch, checkGroup]
  )

  const handleUpdateLocations = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      if (!modelId) return
      localStorage.setItem(`activityLocations-${modelId}`, JSON.stringify(positions))
    },
    [modelId]
  )

  if (!modelId) {
    return <div className="p-4">No model ID provided</div>
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      {!isLoggedIn && (
        <div className="flex items-center justify-center gap-2 border-b-2 border-amber-400 bg-amber-100 px-4 py-3 text-base text-amber-900 shadow-sm">
          <FaExclamationTriangle className="shrink-0 text-amber-500" size={18} />
          <span className="font-bold">Not Logged In:</span>
          You can only view existing annotations. Log in to edit.
        </div>
      )}

      <GraphToolbar
        layoutDetail={canvas.layoutDetail}
        spacing={canvas.spacing}
        onAutoLayout={canvas.onAutoLayout}
        onLayoutDetailChange={canvas.onLayoutDetailChange}
        onSpacingChange={canvas.onSpacingChange}
        onZoomIn={canvas.onZoomIn}
        onZoomOut={canvas.onZoomOut}
        onZoomReset={canvas.onZoomReset}
      />
      <div className="flex min-h-0 flex-1 flex-row">
        {isLoggedIn && <StencilPalette />}
        <div className="relative flex-1">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
              Loading...
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="p-4 text-red-500">Error loading graph data</div>
            </div>
          )}
          <PathwayGraph
            model={graphModel?.data ?? null}
            layoutDetail={canvas.layoutDetail}
            spacing={canvas.spacing}
            canvasRef={canvas.canvasRef}
            onActivityClick={handleSelectActivity}
            onEditClick={handleSelectActivity}
            onDuplicateClick={handleDuplicateActivity}
            onDeleteClick={del.requestDelete}
            onLinkClick={handleLinkClick}
            onLinkCreated={handleLinkCreated}
            onDuplicateLink={handleDuplicateLink}
            onStencilDrop={handleStencilDrop}
            onUpdateLocations={handleUpdateLocations}
          />
        </div>
      </div>

      {/* External update notification */}
      <Modal
        opened={externalChangePending}
        onClose={() => {}}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        size={resolveModalSize('sm')}
      >
        <div className="flex h-11 shrink-0 items-center border-b border-gray-200 bg-white px-4">
          <span className="text-sm font-semibold text-gray-800">Model Updated</span>
        </div>
        <div className="px-4 py-4 text-sm text-gray-700">
          This model has been modified. Please refresh to get the latest version.
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <Button onClick={handleRefreshModel} variant="filled">
            Refresh
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={del.isDeleteOpen}
        onClose={del.cancelDelete}
        onConfirm={del.confirmDelete}
        title="Confirm Delete?"
        message="Deleting this activity cannot be undone. Continue?"
      />

      {/* Connector form dialog */}
      <SimpleDialog
        open={connector.open}
        onClose={() => setConnector(closedConnector)}
        title={renderConnectorDialogTitle(connector.source, connector.target, !!connector.edge)}
        size="lg"
        tall
        bodyScroll="none"
      >
        {connector.source && connector.target && (
          <ConnectorForm
            sourceActivity={connector.source}
            targetActivity={connector.target}
            existingEdgeId={connector.edge?.id}
            existingSourceUid={connector.edge?.sourceId}
            existingTargetUid={connector.edge?.targetId}
            onClose={() => setConnector(closedConnector)}
            onSaved={() => setConnector(closedConnector)}
          />
        )}
      </SimpleDialog>

      {/* Duplicate connection warning */}
      <SimpleDialog
        open={duplicateLinkOpen}
        onClose={() => setDuplicateLinkOpen(false)}
        title="Activities Already Connected"
        size="xs"
      >
        <div className="px-4 py-4 text-sm text-gray-700">{DUPLICATE_LINK_MESSAGE}</div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <Button onClick={() => setDuplicateLinkOpen(false)} variant="filled">
            OK
          </Button>
        </div>
      </SimpleDialog>

      {/* Activity form dialog */}
      <ActivityDialog
        open={activityFormOpen}
        onClose={() => {
          // Dismissing the form (not saving) cancels any armed stencil drop so
          // the drop point can't leak onto a later-created node.
          canvas.canvasRef.current?.clearPendingDrop()
          setActivityFormOpen(false)
        }}
      >
        <ActivityForm onSaved={() => setActivityFormOpen(false)} />
      </ActivityDialog>
    </div>
  )
}

export default PathwayEditor
