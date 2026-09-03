import { useCallback, useState, useEffect } from 'react'
import type React from 'react'
import { useGetGraphModelQuery } from '@/features/gocam/slices/camApiSlice'
import { useAppDispatch, useAppSelector } from './hooks'
import {
  setModel,
  setSelectedActivity,
  selectSelectedActivityId,
} from '@/features/gocam/slices/camSlice'
import { useSearchParams } from 'react-router-dom'
import PathwayGraph from '@/features/pathway/components/PathwayGraph'
import GraphToolbar from '@/features/pathway/components/GraphToolbar'
import StencilPalette from '@/features/pathway/components/StencilPalette'
import NodeContextMenu from '@/features/pathway/components/NodeContextMenu'
import CanvasContextMenu from '@/features/pathway/components/CanvasContextMenu'
import {
  setRightDrawerOpen,
  setRightPanelTab,
  RightPanelTab,
} from '@/@noctua.core/components/drawer/drawerSlice'
import type { Activity, Edge } from '@/features/gocam/models/cam'
import type { ActivityFormType } from '@/features/gocam/models/formModels'
import {
  resetForm,
  initCreateForm,
  initPasteForm,
} from '@/features/gocam/slices/activityFormSlice'
import type { ActivityClipboardPayload } from '@/features/gocam/services/activityClipboard'
import {
  activityClipboardLabel,
  readActivityClipboard,
  serializeActivity,
  writeClipboardText,
} from '@/features/gocam/services/activityClipboard'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
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
import { useActivityPaste } from './hooks/useActivityPaste'
import { useCanvasKeyboard } from './hooks/useCanvasKeyboard'
import { useRegionDelete } from './hooks/useRegionDelete'
import { useUserContext } from './hooks/useUserContext'
import { useUpdateGraphModelMutation } from '@/features/gocam/slices/camApiSlice'
import {
  buildRegionPayload,
  clearRegion,
  readRegion,
  writeRegion,
} from '@/features/gocam/services/regionClipboard'
import type { RegionClipboardPayload } from '@/features/gocam/services/regionClipboard'
import { buildPasteRegionOperations } from '@/features/gocam/services/activityOperations'
import PasteRegionDialog from '@/features/gocam/components/dialogs/PasteRegionDialog'

interface ConnectorDialog {
  open: boolean
  source: Activity | null
  target: Activity | null
  edge: Edge | null
}

interface NodeMenuState {
  open: boolean
  activityId: string | null
  x: number
  y: number
}

const closedNodeMenu: NodeMenuState = { open: false, activityId: null, x: 0, y: 0 }

interface CanvasMenuState {
  open: boolean
  x: number
  y: number
  /** Summary of the stored region, or null when there isn't one to paste. */
  regionSummary: string | null
}

const closedCanvasMenu: CanvasMenuState = {
  open: false,
  x: 0,
  y: 0,
  regionSummary: null,
}

interface RegionPasteState {
  open: boolean
  payload: RegionClipboardPayload | null
  /** Viewport point the region should land on, when it came from a right-click. */
  at: { x: number; y: number } | undefined
}

const closedRegionPaste: RegionPasteState = { open: false, payload: null, at: undefined }

/** e.g. "3 activities" / "2 activities and 1 relation" — used in menus. */
const describeRegion = (activities: number, relations: number): string => {
  const head = `${activities} ${activities === 1 ? 'activity' : 'activities'}`
  if (relations === 0) return head
  return `${head} and ${relations} ${relations === 1 ? 'relation' : 'relations'}`
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
  const selectedActivityId = useAppSelector(selectSelectedActivityId)
  const isLoggedIn = !!user
  const checkGroup = useGroupGuard()

  const canvas = usePathwayCanvas(isLoggedIn)
  const userContext = useUserContext()
  const [updateGraphModel] = useUpdateGraphModelMutation()
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const [connector, setConnector] = useState<ConnectorDialog>(closedConnector)
  const [duplicateLinkOpen, setDuplicateLinkOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [regionPaste, setRegionPaste] = useState<RegionPasteState>(closedRegionPaste)
  const [nodeMenu, setNodeMenu] = useState<NodeMenuState>(closedNodeMenu)
  const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState>(closedCanvasMenu)

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
  const regionDel = useRegionDelete(graphModel?.data ?? null, () =>
    canvas.canvasRef.current?.clearSelection()
  )

  useEffect(() => {
    if (isSuccess && graphModel?.data) {
      dispatch(setModel(graphModel.data))
    }
  }, [graphModel, isSuccess, dispatch])

  useEffect(() => {
    canvas.canvasRef.current?.selectActivity(selectedActivityId)
  }, [selectedActivityId, canvas.canvasRef])

  // ── Canvas callbacks ──────────────────────────────────────────

  const handleSelectActivity = useCallback(
    (activityId: string) => {
      dispatch(setSelectedActivity(activityId))
      dispatch(setRightPanelTab(RightPanelTab.ACTIVITY_TABLE))
      dispatch(setRightDrawerOpen(true))
    },
    [dispatch]
  )

  const handleShowComments = useCallback(
    (activityId: string) => {
      dispatch(setSelectedActivity(activityId))
      dispatch(setRightPanelTab(RightPanelTab.COMMENTS))
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

  // Copy writes the activity to the system clipboard as text, so it can be
  // pasted back into this model or into a different one (even another tab).
  const handleCopyActivity = useCallback(
    async (activityId: string) => {
      const activity = graphModel?.data?.activities.find(a => a.uid === activityId)
      if (!activity) return

      const ok = await writeClipboardText(serializeActivity(activity, modelId))
      // Drop any stored region, so this becomes the thing Ctrl+V pastes. The two
      // clipboards are separate stores and Ctrl+V checks the region first, so a
      // leftover region would otherwise keep winning over a fresh single copy.
      clearRegion()
      dispatch(
        showToast(
          ok
            ? {
                message: `Copied "${activityClipboardLabel(activity)}" — paste (Ctrl+V) into any model`,
              }
            : { message: 'Could not access the clipboard', severity: 'error' }
        )
      )
    },
    [graphModel, modelId, dispatch]
  )

  // `at` is the right-click point for a menu paste. Ctrl+V has no click point of
  // its own, so the canvas falls back to the last pointer position over it.
  const handlePasteActivity = useCallback(
    (payload: ActivityClipboardPayload, at?: { x: number; y: number }) => {
      checkGroup(() => {
        // Armed like a stencil drop, so the node lands here once it comes back
        // from the server rather than wherever the layout puts it.
        canvas.canvasRef.current?.armDropAt(at)
        dispatch(resetForm())
        dispatch(initPasteForm({ root: payload.root, activityType: payload.activityType }))
        setActivityFormOpen(true)
      })
    },
    [dispatch, checkGroup, canvas.canvasRef]
  )

  // ── Region copy/paste (#114 follow-on) ────────────────────────
  //
  // The region payload lives in localStorage rather than the system clipboard,
  // so the menu-driven paste needs no clipboard-read permission (which Firefox
  // never grants) and Ctrl+V and the context menu share one code path.

  const handleCopyRegion = useCallback(() => {
    const model = graphModel?.data
    const canvasApi = canvas.canvasRef.current
    if (!model || !canvasApi) return

    const selection = canvasApi.getSelection()
    if (selection.length === 0) return

    const payload = buildRegionPayload(model, selection, canvasApi.getSelectionPositions())
    if (!payload) return

    const summary = describeRegion(payload.activities.length, payload.connections.length)
    const stored = writeRegion(payload)
    dispatch(
      showToast(
        stored
          ? { message: `Copied ${summary} — paste into this or any other model` }
          : { message: 'Could not store the copied region', severity: 'error' }
      )
    )
  }, [graphModel, canvas.canvasRef, dispatch])

  /** Opens the confirm dialog. Returns false when there's no region to paste. */
  const handleRequestPasteRegion = useCallback(
    (at?: { x: number; y: number }): boolean => {
      const payload = readRegion()
      if (!payload) return false
      checkGroup(() => setRegionPaste({ open: true, payload, at }))
      return true
    },
    [checkGroup]
  )

  const handleCancelPasteRegion = useCallback(() => {
    setRegionPaste(closedRegionPaste)
  }, [])

  const handleConfirmPasteRegion = useCallback(
    async (includeEvidence: boolean) => {
      const { payload, at } = regionPaste
      if (!payload || !modelId) return

      const operations = buildPasteRegionOperations(payload, modelId, userContext, {
        includeEvidence,
      })

      // Armed like a stencil drop, so the new activities rebuild their copied
      // layout once they come back from the server.
      canvas.canvasRef.current?.armRegionAt(
        payload.activities.map(entry => ({ termId: entry.rootTermId, offset: entry.offset })),
        at
      )
      setRegionPaste(closedRegionPaste)

      try {
        await updateGraphModel(operations).unwrap()
        dispatch(
          showToast({
            message: `Pasted ${describeRegion(
              payload.activities.length,
              payload.connections.length
            )}`,
          })
        )
      } catch {
        canvas.canvasRef.current?.clearPendingRegion()
        dispatch(showToast({ message: 'Could not paste the region', severity: 'error' }))
      }
    },
    [regionPaste, modelId, userContext, canvas.canvasRef, updateGraphModel, dispatch]
  )

  // Menu-driven paste has to go through the async Clipboard API — unlike Ctrl+V,
  // there's no paste event carrying the data.
  const handlePasteFromMenu = useCallback(
    async (at: { x: number; y: number }) => {
      const result = await readActivityClipboard()
      if (result.status === 'ok') {
        handlePasteActivity(result.payload, at)
        return
      }
      dispatch(
        showToast(
          result.status === 'empty'
            ? { message: 'No copied activity on the clipboard', severity: 'warning' }
            : {
                message:
                  'This browser blocked the clipboard read — press Ctrl+V to paste instead',
                severity: 'info',
                duration: 5000,
              }
        )
      )
    },
    [handlePasteActivity, dispatch]
  )

  // Paste is off while a dialog owns the screen so it can't open a second form
  // underneath the one already showing.
  const pasteEnabled =
    isLoggedIn && !activityFormOpen && !connector.open && !externalChangePending
  useActivityPaste(pasteEnabled, handlePasteActivity)
  // Same guard as paste — a dialog on screen owns the keyboard.
  const handleDeleteSelection = useCallback(() => {
    const selection = canvas.canvasRef.current?.getSelection() ?? []
    if (selection.length === 0) return
    checkGroup(() => regionDel.requestDelete(selection))
  }, [canvas.canvasRef, checkGroup, regionDel])

  useCanvasKeyboard(pasteEnabled, canvas.canvasRef, {
    onCopyRegion: handleCopyRegion,
    onPasteRegion: () => handleRequestPasteRegion(),
    onDeleteRegion: handleDeleteSelection,
  })

  const handleClearSelection = useCallback(() => {
    canvas.canvasRef.current?.clearSelection()
  }, [canvas.canvasRef])


  const handleNodeContextMenu = useCallback((activityId: string, x: number, y: number) => {
    setNodeMenu({ open: true, activityId, x, y })
  }, [])

  const closeNodeMenu = useCallback(() => {
    setNodeMenu(prev => ({ ...prev, open: false }))
  }, [])

  const handleBlankContextMenu = useCallback((x: number, y: number) => {
    // Read the stored region as the menu opens, so the Paste item only shows
    // when there is actually something to paste.
    const region = readRegion()
    setCanvasMenu({
      open: true,
      x,
      y,
      regionSummary: region
        ? describeRegion(region.activities.length, region.connections.length)
        : null,
    })
  }, [])

  const closeCanvasMenu = useCallback(() => {
    setCanvasMenu(prev => ({ ...prev, open: false }))
  }, [])

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
        selectionCount={selectedIds.length}
        onClearSelection={handleClearSelection}
        onCopySelection={handleCopyRegion}
        onDeleteSelection={handleDeleteSelection}
        canEdit={isLoggedIn}
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
            onCopyClick={handleCopyActivity}
            onDeleteClick={del.requestDelete}
            onCommentClick={handleShowComments}
            onContextMenu={handleNodeContextMenu}
            onBlankContextMenu={isLoggedIn ? handleBlankContextMenu : undefined}
            onSelectionChange={setSelectedIds}
            onLinkClick={handleLinkClick}
            onLinkCreated={handleLinkCreated}
            onDuplicateLink={handleDuplicateLink}
            onStencilDrop={handleStencilDrop}
            onUpdateLocations={handleUpdateLocations}
          />
        </div>
      </div>

      {/* Node right-click menu — same actions as the hover icons */}
      {nodeMenu.activityId && (
        <NodeContextMenu
          open={nodeMenu.open}
          x={nodeMenu.x}
          y={nodeMenu.y}
          interactive={isLoggedIn}
          onClose={closeNodeMenu}
          onView={() => handleSelectActivity(nodeMenu.activityId!)}
          onEdit={() => handleSelectActivity(nodeMenu.activityId!)}
          onCopy={() => handleCopyActivity(nodeMenu.activityId!)}
          regionSummary={selectedIds.length > 1 ? describeRegion(selectedIds.length, 0) : null}
          onCopyRegion={handleCopyRegion}
          onDeleteRegion={handleDeleteSelection}
          onComments={() => handleShowComments(nodeMenu.activityId!)}
          onDelete={() => del.requestDelete(nodeMenu.activityId!)}
        />
      )}

      {/* Blank-canvas right-click menu — paste lands at the click point */}
      <CanvasContextMenu
        open={canvasMenu.open}
        x={canvasMenu.x}
        y={canvasMenu.y}
        regionSummary={canvasMenu.regionSummary}
        onPasteRegion={() =>
          handleRequestPasteRegion({ x: canvasMenu.x, y: canvasMenu.y })
        }
        onClose={closeCanvasMenu}
        onPaste={() => handlePasteFromMenu({ x: canvasMenu.x, y: canvasMenu.y })}
      />

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

      {/* Bulk delete confirmation (#114 follow-on) */}
      <ConfirmDialog
        open={regionDel.isDeleteOpen}
        onClose={regionDel.cancelDelete}
        onConfirm={regionDel.confirmDelete}
        title="Delete selected activities"
        confirmLabel="Delete"
        busy={regionDel.isDeleting}
        message={
          <div className="flex flex-col gap-2">
            <p>
              Delete {regionDel.deleteTargets?.length ?? 0}{' '}
              {(regionDel.deleteTargets?.length ?? 0) === 1 ? 'activity' : 'activities'} and
              their relations?
            </p>
            <p className="text-xs text-gray-500">This cannot be undone.</p>
          </div>
        }
      />

      {/* Region paste confirmation (#114 follow-on) */}
      <PasteRegionDialog
        open={regionPaste.open}
        payload={regionPaste.payload}
        currentModelId={modelId}
        onCancel={handleCancelPasteRegion}
        onConfirm={handleConfirmPasteRegion}
      />

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
