import * as joint from 'jointjs'
import * as dagre from 'dagre'
import { NodeCellList, NodeCellMolecule, NodeLink, cellNamespace, isSelectableCell } from './shapes'
import { DropPlacement, RegionPlacement, centerTopLeft } from './dropPlacement'
import type { Point, RegionPlacementEntry, RenderedActivity } from './dropPlacement'
import { SelectionModel } from './selectionModel'
import { MarqueeSelection } from './marqueeSelection'
import { getEdgeColor } from './edgeDisplayService'
import { orderActivityEdgesForDisplay } from '@/features/gocam/services/formUtils'
import type { GraphModel, Activity, Edge } from '@/features/gocam/models/cam'
import { ActivityType } from '@/features/gocam/models/cam'
import { Relations } from '@/@noctua.core/models/relations'

export type LayoutDetail = 'detailed' | 'activity' | 'simple'
export type LayoutSpacing = 'compact' | 'relaxed'

const GRID_COLOR = '#DDDDDD'

// Border colours for the two selection states. Multi-select wins where a node is
// both — they share the one `highlighter` stroke channel, since `body/fill` is
// repainted on every hover by _highlightSuccessorNodes.
const FOCUS_BORDER = { color: 'orange', hue: 500 }
const MULTI_SELECT_BORDER = { color: 'blue', hue: 600 }

/** How far one arrow-key press nudges the selection, in graph units. */
const NUDGE_STEP = 10

function activityColorKey(activity: Activity): string {
  switch (activity.type) {
    case ActivityType.MOLECULE:
      return 'teal'
    case ActivityType.PROTEIN_COMPLEX:
      return 'purple'
    default:
      return 'green'
  }
}

// Total comments an activity carries (across individuals and reference/evidence
// individuals) — drives the node's comment count badge (#231).
function activityCommentCount(activity: Activity): number {
  let count = 0
  for (const n of activity.nodes) count += n.comments?.length ?? 0
  for (const edge of activity.edges) {
    for (const ev of edge.evidence ?? []) count += ev.comments?.length ?? 0
  }
  return count
}

export class CamCanvas {
  paper: joint.dia.Paper
  graph: joint.dia.Graph
  private _wrapper: HTMLDivElement
  private _container: HTMLElement
  private _layoutChanged = false
  private _loading = false
  // Tracks a node being created from a stencil drop or a paste so it lands at
  // the drop point once it arrives from the server. See _handleDrop / armDropAt
  // / addCanvasGraph.
  private _dropPlacement = new DropPlacement()
  // Same job as _dropPlacement but for a pasted region of several activities.
  private _regionPlacement = new RegionPlacement()
  // Last pointer position over the canvas, in viewport coords — gives a keyboard
  // paste (Ctrl+V) somewhere sensible to land.
  private _lastPointerClient: Point | null = null
  // Multi-selection (#114). Keyed by activity uid, which is also the cell id, so
  // it survives the resetCells rebuild that every save triggers.
  private _selection = new SelectionModel()
  private _marquee: MarqueeSelection
  // The activity backing the right drawer — a separate state from the
  // multi-selection, drawn in a different colour.
  private _focusedUid: string | null = null
  // Last observed position of the node being dragged, so the rest of the
  // selection can be moved by the same delta. Tracked rather than derived from
  // the pointer so that a node clamped by `restrictTranslate` doesn't let the
  // group drift out of formation.
  private _dragAnchor: { id: string; x: number; y: number } | null = null
  private _groupDragging = false
  readOnly = false

  // Event callbacks — wired by the React component
  onActivityClick?: (activityId: string) => void
  onEditClick?: (activityId: string) => void
  onCopyClick?: (activityId: string) => void
  onDeleteClick?: (activityId: string) => void
  onCommentClick?: (activityId: string) => void
  onContextMenu?: (activityId: string, clientX: number, clientY: number) => void
  onBlankContextMenu?: (clientX: number, clientY: number) => void
  onLinkClick?: (sourceId: string, targetId: string) => void
  onLinkCreated?: (sourceId: string, targetId: string) => void
  onDuplicateLink?: () => void
  onUpdateLocations?: (positions: Record<string, { x: number; y: number }>) => void
  onStencilDrop?: (type: string) => void
  onSelectionChange?: (activityIds: string[]) => void

  constructor(container: HTMLElement) {
    // Captured so the paper's validate* callbacks (where `this` is the paper)
    // can read the canvas read-only state at drag time.
    const self = this
    this._container = container
    this._wrapper = document.createElement('div')
    this._wrapper.style.width = '100%'
    this._wrapper.style.height = '100%'
    container.appendChild(this._wrapper)

    this.graph = new joint.dia.Graph({}, { cellNamespace })
    this.paper = new joint.dia.Paper({
      cellViewNamespace: cellNamespace,
      el: this._wrapper,
      height: '100%',
      width: '100%',
      model: this.graph,
      restrictTranslate: true,
      // Allow the duplicate drag to commit so onDuplicateLink can surface a
      // popup; the change:source/target handler removes the extra link itself.
      multiLinks: true,
      markAvailable: true,
      validateConnection(cellViewS, _magnetS, cellViewT) {
        if (self.readOnly) return false
        if (cellViewS === cellViewT) return false
        return true
      },
      validateMagnet() {
        return !self.readOnly
      },
      defaultConnectionPoint: { name: 'boundary', args: { sticky: true } },
      defaultConnector: { name: 'smooth' },
      defaultLink: () => NodeLink.create(),
      async: true,
      interactive: { labelMove: false },
      linkPinning: false,
      gridSize: 10,
      drawGrid: {
        name: 'doubleMesh',
        args: [
          { color: GRID_COLOR, thickness: 1 },
          { color: GRID_COLOR, scaleFactor: 5, thickness: 4 },
        ],
      },
      sorting: joint.dia.Paper.sorting.APPROX,
    })

    this._marquee = new MarqueeSelection(this.paper, this.graph, {
      onSelect: (ids, additive) => {
        const changed = additive ? this._selection.add(ids) : this._selection.replace(ids)
        if (changed) this._commitSelection()
      },
      onClickBlank: () => {
        if (this._selection.clear()) this._commitSelection()
      },
    })

    this._initEvents()
    this._initStencilDrop()
  }

  private _initEvents() {
    // ── Blank canvas double-click: deselect all ──
    this.paper.on('blank:pointerdblclick', () => {
      this._focusedUid = null
      this._selection.clear()
      this._commitSelection()
    })

    // ── Element double-click: select + notify ──
    this.paper.on('element:pointerdblclick', (cellView: joint.dia.CellView) => {
      const element = cellView.model
      const activity = element.prop('activity') as Activity | undefined
      if (activity) {
        this._focusedUid = activity.uid
        this._renderSelection()
        this.onActivityClick?.(activity.uid)
      }
    })

    // ── Element pointerdown: shift/ctrl-click toggles multi-selection ──
    // A plain pointerdown is left alone so it still starts a drag and so the
    // double-click above (which opens the drawer) keeps working.
    this.paper.on(
      'element:pointerdown',
      (cellView: joint.dia.CellView, evt: joint.dia.Event) => {
        const element = cellView.model
        const activity = element.prop('activity') as Activity | undefined
        if (!activity) return

        const mouseEvt = evt as unknown as MouseEvent
        if (mouseEvt.shiftKey || mouseEvt.ctrlKey || mouseEvt.metaKey) {
          // ElementView.pointerdown notifies us and then calls dragStart()
          // directly, so stopPropagation wouldn't stop the drag —
          // preventDefaultInteraction is the hook dragStart actually checks.
          cellView.preventDefaultInteraction(evt)
          this._selection.toggle(activity.uid)
          this._commitSelection()
          return
        }

        // Dragging a node that isn't in the selection drops the selection, the
        // way PowerPoint does; dragging one that is keeps the group intact.
        if (!this._selection.has(activity.uid) && !this._selection.isEmpty) {
          this._selection.clear()
          this._commitSelection()
        }

        this._beginGroupDrag(element as joint.dia.Element)
      }
    )

    // ── Element hover: highlight + show edit/delete icons ──
    this.paper.on('element:mouseover', (cellView: joint.dia.CellView) => {
      const element = cellView.model
      // Read-only (not logged in) keeps the hover highlight but hides the
      // edit/duplicate/delete action icons.
      if (element instanceof NodeCellList) {
        element.hover(true, !this.readOnly)
        this._highlightSuccessorNodes(element)
      } else if (element instanceof NodeCellMolecule) {
        element.hover(true, !this.readOnly)
      }
    })

    this.paper.on('element:mouseleave', (cellView: joint.dia.CellView) => {
      const element = cellView.model
      if (element instanceof NodeCellList) {
        element.hover(false)
        this._unhighlightAllNodes()
      } else if (element instanceof NodeCellMolecule) {
        element.hover(false)
      }
    })

    // ── View icon click (read-only affordance): open the activity table ──
    this.paper.on('element:view:pointerdown', (cellView: joint.dia.CellView, evt: Event) => {
      evt.stopPropagation()
      const activity = cellView.model.prop('activity') as Activity | undefined
      if (activity) this.onActivityClick?.(activity.uid)
    })

    // ── Edit/delete icon clicks (from shape markup events) ──
    this.paper.on('element:edit:pointerdown', (cellView: joint.dia.CellView, evt: Event) => {
      evt.stopPropagation()
      const activity = cellView.model.prop('activity') as Activity | undefined
      if (activity) this.onEditClick?.(activity.uid)
    })

    this.paper.on('element:copy:pointerdown', (cellView: joint.dia.CellView, evt: Event) => {
      evt.stopPropagation()
      const activity = cellView.model.prop('activity') as Activity | undefined
      if (activity) this.onCopyClick?.(activity.uid)
    })

    this.paper.on('element:delete:pointerdown', (cellView: joint.dia.CellView, evt: Event) => {
      evt.stopPropagation()
      const activity = cellView.model.prop('activity') as Activity | undefined
      if (activity) this.onDeleteClick?.(activity.uid)
    })

    // ── Element right-click: node context menu (same actions as the hover icons) ──
    // Right-click is handled natively on the container — see _handleContextMenu.

    // ── Comment badge click: open the Comments panel for this activity ──
    this.paper.on('element:comment:pointerdown', (cellView: joint.dia.CellView, evt: Event) => {
      evt.stopPropagation()
      const activity = cellView.model.prop('activity') as Activity | undefined
      if (activity) this.onCommentClick?.(activity.uid)
    })

    // ── Link hover ──
    this.paper.on('link:mouseenter', (cellView: joint.dia.CellView) => {
      const element = cellView.model
      if (element instanceof NodeLink) {
        element.hover(true)
      }
    })

    this.paper.on('link:mouseleave', (cellView: joint.dia.CellView) => {
      const element = cellView.model
      if (element instanceof NodeLink) {
        element.hover(false)
      }
    })

    // ── Link double-click: open connector form ──
    this.paper.on('link:pointerdblclick', (cellView: joint.dia.CellView) => {
      const link = cellView.model
      const sourceId = link.get('source')?.id as string | undefined
      const targetId = link.get('target')?.id as string | undefined
      if (sourceId && targetId) {
        this._focusedUid = null
        this._selection.clear()
        this._commitSelection()
        this.onLinkClick?.(sourceId, targetId)
      }
    })

    // ── New link creation (drag between nodes) ──
    this.graph.on('change:source change:target', (link: joint.dia.Cell) => {
      if (this._loading) return
      const sourceId = link.get('source')?.id as string | undefined
      const targetId = link.get('target')?.id as string | undefined
      if (!sourceId || !targetId) return

      // Two activities may only have one connection. The existing connection is
      // still drawn, so if any other link already joins this pair (either
      // direction) remove the just-dragged duplicate and surface the popup
      // instead of opening the connector form.
      const alreadyConnected = this.graph.getLinks().some(existing => {
        if (existing.id === link.id) return false
        const s = existing.get('source')?.id as string | undefined
        const t = existing.get('target')?.id as string | undefined
        return (s === sourceId && t === targetId) || (s === targetId && t === sourceId)
      })

      if (alreadyConnected) {
        link.remove()
        this.onDuplicateLink?.()
        return
      }

      // The dragged link is a transient drawing artifact, not a persisted edge.
      // Remove it immediately and let the connector form drive creation: on save,
      // the model refetch redraws the real edge; on cancel nothing is left behind.
      // (Previously a cancelled draw stranded an "empty" link that couldn't be
      // edited or deleted and falsely blocked re-drawing via alreadyConnected.)
      link.remove()
      this.onLinkCreated?.(sourceId, targetId)
    })

    // ── Position tracking + group drag ──
    this.graph.on('change:position', (element: joint.dia.Cell) => {
      this._layoutChanged = true
      if (element instanceof joint.dia.Element) this._dragGroupWith(element)
    })

    this.paper.on('element:pointerup', () => {
      this._endGroupDrag()
      if (this._layoutChanged) {
        this._layoutChanged = false
        this._persistPositions()
      }
    })
  }

  // ── Public API ──────────────────────────────────────────────────

  addCanvasGraph(
    model: GraphModel,
    layoutDetail: LayoutDetail = 'detailed',
    spacing: LayoutSpacing = 'compact'
  ) {
    const cells: joint.dia.Cell[] = []

    for (const activity of model.activities) {
      if (activity.type === ActivityType.MOLECULE) {
        cells.push(this._createMolecule(activity))
      } else {
        cells.push(this._createNode(activity, layoutDetail))
      }
    }

    if (model.activityConnections) {
      for (const conn of model.activityConnections) {
        const link = this._createLink(conn)
        if (link) cells.push(link)
      }
    }

    this.paper.setDimensions('30000px', '30000px')
    this._loading = true
    this.graph.resetCells(cells)
    this._loading = false

    const savedPositions = this._loadPositions(model.id)
    let hasManualLayout = false

    if (savedPositions) {
      for (const element of this.graph.getElements()) {
        const activity = element.prop('activity') as Activity | undefined
        if (activity && savedPositions[activity.uid]) {
          element.position(savedPositions[activity.uid].x, savedPositions[activity.uid].y)
          hasManualLayout = true
        }
      }
    }

    if (!hasManualLayout) {
      this.autoLayout(spacing)
    }

    // A node dropped from the stencil should land at the drop point. The new
    // activity arrives from the server on a post-save re-render (possibly after
    // intervening renders), so the drop placement finds it by diffing against
    // the activities seen last render and centers it on the drop. When we place
    // one we keep the current viewport (skip the re-fit) so the node stays under
    // the cursor instead of being scrolled away.
    const rendered: RenderedActivity[] = []
    for (const el of this.graph.getElements()) {
      const activity = el.prop('activity') as Activity | undefined
      if (activity) {
        rendered.push({ uid: activity.uid, termId: activity.rootNode?.id ?? null })
      }
    }
    const activityUids = rendered.map(item => item.uid)

    const placement = this._dropPlacement.resolve(activityUids)
    if (placement) {
      const el = this.graph.getCell(placement.uid)
      if (el instanceof joint.dia.Element) {
        const pos = centerTopLeft(placement.point, el.size())
        el.position(pos.x, pos.y)
        this._persistPositions()
      }
    }

    // A pasted region places several activities at once, rebuilding the layout
    // they were copied in.
    const regionPlacements = this._regionPlacement.resolve(rendered)
    if (regionPlacements) {
      for (const [uid, point] of Object.entries(regionPlacements)) {
        const el = this.graph.getCell(uid)
        if (el instanceof joint.dia.Element) el.position(point.x, point.y)
      }
      this._persistPositions()
      // Select what was just pasted, so it can immediately be dragged as a unit.
      this._selection.replace(Object.keys(regionPlacements))
      this.onSelectionChange?.(this._selection.list())
    }

    if (!placement && !regionPlacements) {
      this.paper.scaleContentToFit({
        minScaleX: 0.3,
        minScaleY: 0.3,
        maxScaleX: 1,
        maxScaleY: 1,
      })
    }

    // resetCells above destroyed every cell, taking their selection borders with
    // them. Drop anything that no longer exists, then repaint onto the new cells
    // — this also restores the focused activity's border, which used to be lost
    // on every save because nothing re-applied it after a refetch.
    if (this._focusedUid && !activityUids.includes(this._focusedUid)) {
      this._focusedUid = null
    }
    const pruned = this._selection.prune(activityUids)
    this._renderSelection()
    if (pruned) this.onSelectionChange?.(this._selection.list())

    this.paper.unfreeze()
  }

  /** Discard a pending drop, e.g. when the create form is dismissed. */
  clearPendingDrop() {
    this._dropPlacement.clear()
  }

  /** Discard a pending region paste, e.g. when the paste dialog is cancelled. */
  clearPendingRegion() {
    this._regionPlacement.clear()
  }

  /**
   * Arm a region paste so the new activities rebuild their copied layout at a
   * viewport point — the region equivalent of `armDropAt`.
   */
  armRegionAt(entries: RegionPlacementEntry[], client?: Point) {
    this._regionPlacement.arm(this._localDropPoint(client), entries)
  }

  /**
   * Arm a region paste at a point already in graph coordinates — used by
   * duplicate, which offsets from where the originals sit rather than from the
   * pointer.
   */
  armRegionAtGraphPoint(entries: RegionPlacementEntry[], point: Point) {
    this._regionPlacement.arm(point, entries)
  }

  /** Top-left of the current selection in graph coordinates. */
  getSelectionOrigin(): Point | null {
    const points = Object.values(this.getSelectionPositions())
    if (points.length === 0) return null
    return {
      x: Math.min(...points.map(p => p.x)),
      y: Math.min(...points.map(p => p.y)),
    }
  }

  /** Top-left positions of the current multi-selection, for a region copy. */
  getSelectionPositions(): Record<string, { x: number; y: number }> {
    const positions: Record<string, { x: number; y: number }> = {}
    for (const uid of this._selection.list()) {
      const cell = this.graph.getCell(uid)
      if (cell instanceof joint.dia.Element) {
        const pos = cell.position()
        positions[uid] = { x: pos.x, y: pos.y }
      }
    }
    return positions
  }

  /**
   * Arm the next activity to appear so it lands at a viewport point — used by
   * paste, the same way a stencil drop arms its drop point. Falls back to the
   * last pointer position over the canvas (Ctrl+V has no click point of its
   * own), then to the canvas center if the pointer has never been over it.
   */
  armDropAt(client?: Point) {
    this._dropPlacement.arm(this._localDropPoint(client))
  }

  /**
   * Resolve a paste/drop target to graph coordinates. Falls back to the last
   * pointer position over the canvas (Ctrl+V has no click point of its own),
   * then to the canvas centre if the pointer has never been over it.
   */
  private _localDropPoint(client?: Point): Point {
    const rect = this._container.getBoundingClientRect()
    const point = client ??
      this._lastPointerClient ?? {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    const local = this.paper.clientToLocalPoint(point.x, point.y)
    return { x: local.x, y: local.y }
  }

  /**
   * Re-run dagre. With `uids` it lays out only those activities, leaving the
   * rest of the graph where the curator put it — tidying one cluster without
   * rearranging the whole pathway.
   *
   * Positions are persisted afterwards: a selection-only tidy sits alongside
   * manual positions, so losing it on reload would be surprising. (The
   * whole-graph layout was previously not saved either, which only went
   * unnoticed because re-running dagre is deterministic.)
   */
  autoLayout(spacing: LayoutSpacing = 'compact', uids?: string[]) {
    const visible = this.graph.getElements().filter(el => el.attr('./visibility') !== 'hidden')
    const scope = uids?.length ? new Set(uids) : null
    const elements = scope ? visible.filter(el => scope.has(String(el.id))) : visible
    if (elements.length === 0) return

    const subgraph = this.graph.getSubgraph(elements)
    const opts =
      spacing === 'compact'
        ? { rankSep: 50, marginX: 10, marginY: 10 }
        : { rankSep: 200, marginX: 50, marginY: 50 }

    joint.layout.DirectedGraph.layout(subgraph, {
      dagre,
      graphlib: dagre.graphlib,
      align: 'UL',
      setLabels: true,
      ranker: 'network-simplex',
      rankDir: 'TB',
      ...opts,
    })

    this._layoutChanged = false
    this._persistPositions()
  }

  /** Tidy just the current selection, if there is one. */
  autoLayoutSelection(spacing: LayoutSpacing = 'compact') {
    if (this._selection.isEmpty) return
    this.autoLayout(spacing, this._selection.list())
  }

  zoom(delta: number, event?: MouseEvent) {
    const currentScale = this.paper.scale().sx
    const newScale = currentScale + delta
    if (newScale > 0.1 && newScale < 10) {
      if (event) {
        const el = this.paper.el as HTMLElement
        const rect = el.getBoundingClientRect()
        const offsetX = event.clientX - rect.left
        const offsetY = event.clientY - rect.top
        const localPoint = this._offsetToLocalPoint(offsetX, offsetY)
        this.paper.translate(0, 0)
        this.paper.scale(newScale, newScale, localPoint.x, localPoint.y)
      } else {
        this.paper.scale(newScale, newScale)
      }
    }
  }

  resetZoom() {
    this.paper.scale(1, 1)
  }

  toggleActivityVisibility(activityId: string) {
    const cell = this.graph.getCell(activityId)
    if (!cell || !(cell instanceof joint.dia.Element)) return

    const activity = cell.prop('activity') as Activity | undefined
    if (!activity) return

    const successors = this.graph.getSuccessors(cell)
    const elements = [...successors, cell]
    const subgraph = this.graph.getSubgraph(elements)
    const isExpanded = cell.prop('expanded') !== false

    if (isExpanded) {
      subgraph.forEach(element => {
        element.attr('./visibility', 'hidden')
      })
    } else {
      subgraph.forEach(element => {
        element.attr('./visibility', 'visible')
      })
    }

    cell.attr('./visibility', 'visible')
    cell.prop('expanded', !isExpanded)
    this.autoLayout('compact')
    this.paper.translate(0, 0)
  }

  destroy() {
    this._container.removeEventListener('dragover', this._handleDragOver)
    this._container.removeEventListener('drop', this._handleDrop)
    this._container.removeEventListener('mousemove', this._handleMouseMove)
    this._container.removeEventListener('contextmenu', this._handleContextMenu, true)
    this._marquee.destroy()
    this.paper.remove()
  }

  // ── Stencil drag-drop (native DOM events on container) ─────

  private _handleDragOver = (e: DragEvent) => {
    if (e.dataTransfer && e.dataTransfer.types.indexOf('application/noctua-stencil') !== -1) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  private _handleDrop = (e: DragEvent) => {
    if (this.readOnly) return
    if (!e.dataTransfer) return
    const raw = e.dataTransfer.getData('application/noctua-stencil')
    if (!raw || !this.onStencilDrop) return

    e.preventDefault()
    const data = JSON.parse(raw) as { type: string; id: string }

    // Convert the drop point to graph coordinates (accounts for pan/zoom) and
    // arm it. The node it creates is positioned there once it comes back from
    // the server — see addCanvasGraph and DropPlacement.
    const local = this.paper.clientToLocalPoint(e.clientX, e.clientY)
    this._dropPlacement.arm({ x: local.x, y: local.y })

    this.onStencilDrop(data.type)
  }

  private _handleMouseMove = (e: MouseEvent) => {
    this._lastPointerClient = { x: e.clientX, y: e.clientY }
  }

  private _initStencilDrop() {
    this._container.addEventListener('dragover', this._handleDragOver)
    this._container.addEventListener('drop', this._handleDrop)
    this._container.addEventListener('mousemove', this._handleMouseMove)
    // Capture phase, on the container, so every right-click inside the canvas
    // reaches us before JointJS's own handling.
    this._container.addEventListener('contextmenu', this._handleContextMenu, true)
  }

  /**
   * Right-click anywhere on the canvas.
   *
   * Deliberately native rather than JointJS's `blank:contextmenu` /
   * `element:contextmenu` / `link:contextmenu` trio: those route through
   * `Paper.contextMenuTrigger`, whose `findView` + `guard` chain decides which
   * of the three fires, and a click that misses `blank` (on a relation's wide
   * invisible hit area, or a cell with no activity behind it) silently reached
   * no handler at all. One listener on the container cannot miss, and resolving
   * node-vs-canvas here is a single `closest('[model-id]')`.
   */
  private _handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()

    const target = e.target as Element | null
    const cellEl = typeof target?.closest === 'function' ? target.closest('[model-id]') : null
    const modelId = cellEl?.getAttribute('model-id')

    if (modelId) {
      const cell = this.graph.getCell(modelId)
      const activity = cell?.prop('activity') as Activity | undefined
      if (activity) {
        this.onContextMenu?.(activity.uid, e.clientX, e.clientY)
        return
      }
    }

    this.onBlankContextMenu?.(e.clientX, e.clientY)
  }

  // ── Highlighting ──────────────────────────────────────────────

  private _highlightSuccessorNodes(node: joint.dia.Element) {
    this._unhighlightAllNodes()

    const predecessors = this.graph.getPredecessors(node)
    const successors = this.graph.getSuccessors(node)

    // Grey out all nodes
    for (const cell of this.graph.getElements()) {
      if (cell instanceof NodeCellList) {
        cell.setColor('grey', 200, 300)
      }
    }

    // Amber for successors
    for (const cell of successors) {
      if (cell instanceof NodeCellList) {
        cell.setColor('amber', 200, 300)
      }
    }

    // Yellow for predecessors
    for (const cell of predecessors) {
      if (cell instanceof NodeCellList) {
        cell.setColor('yellow', 50, 100)
      }
    }

    // Bright yellow for hovered node
    if (node instanceof NodeCellList) {
      node.setColor('yellow', 100, 200)
    }
  }

  private _unhighlightAllNodes() {
    for (const cell of this.graph.getElements()) {
      if (cell instanceof NodeCellList) {
        const colorKey = (cell.prop('colorKey') as string) ?? 'green'
        cell.setColor(colorKey)
      }
    }
  }

  // ── Position persistence ──────────────────────────────────────

  private _persistPositions() {
    const positions: Record<string, { x: number; y: number }> = {}
    for (const element of this.graph.getElements()) {
      const activity = element.prop('activity') as Activity | undefined
      if (activity) {
        const pos = element.position()
        positions[activity.uid] = { x: pos.x, y: pos.y }
      }
    }
    this.onUpdateLocations?.(positions)
  }

  private _loadPositions(modelId: string): Record<string, { x: number; y: number }> | null {
    try {
      const raw = localStorage.getItem(`activityLocations-${modelId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  // ── Node/Link creation ────────────────────────────────────────

  private _activityIconUrl(activity: Activity): string {
    switch (activity.type) {
      case ActivityType.MOLECULE:
        return './assets/images/activity/molecule.png'
      case ActivityType.PROTEIN_COMPLEX:
        return './assets/images/activity/proteinComplex.png'
      default:
        return './assets/images/activity/default.png'
    }
  }

  private _createNode(activity: Activity, layoutDetail: LayoutDetail = 'detailed'): NodeCellList {
    const el = new NodeCellList()
    const colorKey = activityColorKey(activity)

    const gpLabel = activity.enabledBy?.label ?? activity.rootNode?.label ?? 'Unknown'
    el.addHeader(gpLabel)
    el.addIcon(this._activityIconUrl(activity))

    if (layoutDetail === 'detailed') {
      const { gpEdges, fdEdges } = orderActivityEdgesForDisplay(activity)
      // GP card (e.g. "GP part_of complex") renders above the MF, matching the form/table.
      // depthPrefix prepends em-dashes to the relation label to denote tree depth.
      for (const { edge, depthPrefix } of gpEdges) {
        if (edge.id === Relations.ENABLED_BY) continue
        if (edge.target?.label) {
          el.addEntity(depthPrefix + (edge.label ?? ''), edge.target.label, !!edge.evidence?.length)
        }
      }
      if (activity.molecularFunction) {
        const enabledByEdge = activity.edges?.find(e => e.id === Relations.ENABLED_BY)
        const hasEvidence = !!enabledByEdge?.evidence?.length
        el.addEntity('', activity.molecularFunction.label, hasEvidence)
      }
      for (const { edge, depthPrefix } of fdEdges) {
        if (edge.target?.label) {
          el.addEntity(depthPrefix + (edge.label ?? ''), edge.target.label, !!edge.evidence?.length)
        }
      }
    } else if (layoutDetail === 'activity') {
      if (activity.molecularFunction) {
        const enabledByEdge = activity.edges?.find(e => e.id === Relations.ENABLED_BY)
        const hasEvidence = !!enabledByEdge?.evidence?.length
        el.addEntity('', activity.molecularFunction.label, hasEvidence)
      }
    }
    // 'simple' layout: header only, no entity rows

    el.setColor(colorKey)
    el.setCommentCount(activityCommentCount(activity))
    el.set({
      activity,
      colorKey,
      id: activity.uid,
    })

    return el
  }

  private _createMolecule(activity: Activity): NodeCellMolecule {
    const el = new NodeCellMolecule()
    const colorKey = activityColorKey(activity)

    let label = activity.rootNode?.label ?? 'Unknown'
    // Check for cellular component edges to add location info
    for (const edge of activity.edges ?? []) {
      if (edge.target?.label && edge.target.rootTypes?.includes('GO:0005575')) {
        label += `\nlocated in: ${edge.target.label}`
        break
      }
    }

    el.setText(label)
    el.setColor(colorKey)
    el.setCommentCount(activityCommentCount(activity))
    el.resize(120, 120)
    el.set({
      activity,
      colorKey,
      id: activity.uid,
    })

    return el
  }

  private _createLink(conn: Edge): NodeLink | null {
    if (!conn.sourceId || !conn.targetId) return null

    const link = NodeLink.create()

    if (conn.isReverseLink && conn.reverseLinkLabel) {
      link.setText(conn.reverseLinkLabel)
      link.set({
        source: { id: conn.targetId },
        target: { id: conn.sourceId },
      })
    } else {
      link.setText(conn.label ?? '')
      link.set({
        source: { id: conn.sourceId },
        target: { id: conn.targetId },
      })
    }

    const color = getEdgeColor(conn.id ?? '')
    link.setColor(color)

    if (!conn.evidence?.length) {
      link.setNoEvidence(true)
    }

    return link
  }

  // ── Selection ─────────────────────────────────────────────────

  /**
   * Paint every cell's selection state. Multi-selected nodes take precedence
   * over the drawer-focused one: both use the single `highlighter` stroke
   * channel, because `body/fill` is repainted on every hover by
   * `_highlightSuccessorNodes`.
   *
   * A relation shows as selected when both of its activities are, which is also
   * what makes a group drag look right — links follow their endpoints anyway.
   */
  private _renderSelection() {
    for (const cell of this.graph.getCells()) {
      if (isSelectableCell(cell)) {
        const uid = String(cell.id)
        if (this._selection.has(uid)) {
          cell.setBorder(MULTI_SELECT_BORDER.color, MULTI_SELECT_BORDER.hue)
        } else if (uid === this._focusedUid) {
          cell.setBorder(FOCUS_BORDER.color, FOCUS_BORDER.hue)
        } else {
          cell.unsetBorder()
        }
      } else if (cell instanceof NodeLink) {
        const source = cell.get('source')?.id as string | undefined
        const target = cell.get('target')?.id as string | undefined
        const bothEnds =
          !!source && !!target && this._selection.has(source) && this._selection.has(target)
        cell.setSelected(bothEnds)
      }
    }
  }

  /** Repaint and tell React the selection changed. */
  private _commitSelection() {
    this._renderSelection()
    this.onSelectionChange?.(this._selection.list())
  }

  /** Currently multi-selected activity uids. */
  getSelection(): string[] {
    return this._selection.list()
  }

  /** Replace the multi-selection from outside the canvas. */
  setSelection(uids: string[]) {
    if (this._selection.replace(uids)) this._commitSelection()
  }

  clearSelection() {
    if (this._selection.clear()) this._commitSelection()
  }

  /** Add every activity on the canvas to the selection (Ctrl+A). */
  selectAll() {
    const uids = this.graph
      .getElements()
      .filter(el => !!el.prop('activity'))
      .map(el => String(el.id))
    if (this._selection.replace(uids)) this._commitSelection()
  }

  /** Every element on the canvas that is backed by an activity. */
  private _activityElements(): joint.dia.Element[] {
    return this.graph.getElements().filter(el => !!el.prop('activity'))
  }

  /**
   * Select an activity and everything causally related to it.
   *
   * `downstream`/`upstream` use JointJS's transitive successors/predecessors —
   * the same traversal the hover highlight already uses. `connected` walks
   * neighbours in both directions to reach the whole weakly-connected
   * component, which successors+predecessors alone would miss (they don't cross
   * to a sibling that shares a target).
   *
   * Replaces the selection and always includes the anchor. Returns its size.
   */
  selectConnected(uid: string, direction: 'downstream' | 'upstream' | 'connected'): number {
    const cell = this.graph.getCell(uid)
    if (!(cell instanceof joint.dia.Element)) return 0

    const related =
      direction === 'downstream'
        ? this.graph.getSuccessors(cell)
        : direction === 'upstream'
          ? this.graph.getPredecessors(cell)
          : this._componentOf(cell)

    const uids = [cell, ...related]
      .filter(el => !!el.prop('activity'))
      .map(el => String(el.id))

    this._selection.replace(uids)
    this._commitSelection()
    return this._selection.size
  }

  /** Breadth-first walk over neighbours in both directions. */
  private _componentOf(start: joint.dia.Element): joint.dia.Element[] {
    const seen = new Set<string>([String(start.id)])
    const found: joint.dia.Element[] = []
    const queue: joint.dia.Element[] = [start]

    while (queue.length > 0) {
      const current = queue.shift()!
      for (const neighbor of this.graph.getNeighbors(current)) {
        const id = String(neighbor.id)
        if (seen.has(id)) continue
        seen.add(id)
        found.push(neighbor)
        queue.push(neighbor)
      }
    }

    return found
  }

  /**
   * Replace the selection with every activity of one type. Returns how many
   * matched; when nothing does, the selection is left untouched so a mis-click
   * doesn't silently wipe it.
   */
  selectByType(type: ActivityType): number {
    const uids = this._activityElements()
      .filter(el => (el.prop('activity') as Activity | undefined)?.type === type)
      .map(el => String(el.id))

    if (uids.length === 0) return 0
    this._selection.replace(uids)
    this._commitSelection()
    return uids.length
  }

  /**
   * Activities carrying at least one statement with no evidence — the same
   * condition that draws the no-evidence marker on a node's rows.
   */
  selectWithoutEvidence(): number {
    const uids = this._activityElements()
      .filter(el => {
        const activity = el.prop('activity') as Activity | undefined
        return !!activity?.edges.some(edge => !edge.evidence?.length)
      })
      .map(el => String(el.id))

    if (uids.length === 0) return 0
    this._selection.replace(uids)
    this._commitSelection()
    return uids.length
  }

  /** Swap selected for unselected. Always applies — emptying is a valid result. */
  invertSelection(): number {
    const next = this._activityElements()
      .map(el => String(el.id))
      .filter(uid => !this._selection.has(uid))

    this._selection.replace(next)
    this._commitSelection()
    return next.length
  }

  /**
   * Move the whole selection by a fixed step — arrow-key nudge. No-op when read
   * only or when nothing is selected.
   */
  nudgeSelection(dx: number, dy: number) {
    if (this.readOnly || this._selection.isEmpty) return

    const step = { x: dx * NUDGE_STEP, y: dy * NUDGE_STEP }
    this._groupDragging = true
    for (const uid of this._selection.list()) {
      const cell = this.graph.getCell(uid)
      if (cell instanceof joint.dia.Element) cell.translate(step.x, step.y)
    }
    this._groupDragging = false

    this._layoutChanged = false
    this._persistPositions()
  }

  // ── Group drag ────────────────────────────────────────────────

  private _beginGroupDrag(element: joint.dia.Element) {
    if (this.readOnly || this._selection.size < 2) return
    const id = String(element.id)
    if (!this._selection.has(id)) return
    const pos = element.position()
    this._dragAnchor = { id, x: pos.x, y: pos.y }
  }

  /**
   * Translate the rest of the selection by however far the dragged node has
   * actually moved since the last event — so a node stopped at the paper edge
   * by `restrictTranslate` doesn't let the group lose its relative positions.
   */
  private _dragGroupWith(element: joint.dia.Element) {
    if (this._groupDragging || !this._dragAnchor) return
    if (String(element.id) !== this._dragAnchor.id) return

    const draggedId = this._dragAnchor.id
    const pos = element.position()
    const dx = pos.x - this._dragAnchor.x
    const dy = pos.y - this._dragAnchor.y
    if (dx === 0 && dy === 0) return

    this._dragAnchor = { id: draggedId, x: pos.x, y: pos.y }

    this._groupDragging = true
    for (const uid of this._selection.list()) {
      if (uid === draggedId) continue
      const cell = this.graph.getCell(uid)
      if (cell instanceof joint.dia.Element) cell.translate(dx, dy)
    }
    this._groupDragging = false
  }

  private _endGroupDrag() {
    this._dragAnchor = null
  }

  /**
   * Public selection API used to drive the canvas from outside (e.g. clicking
   * a comment in the side panel). Highlights the activity without moving the
   * viewport — auto-panning shifted the rest of the graph off-screen.
   */
  selectActivity(uid: string | null) {
    this._focusedUid = uid
    this._renderSelection()
  }

  // ── Coordinate transform ──────────────────────────────────────

  private _offsetToLocalPoint(x: number, y: number): { x: number; y: number } {
    const svgPoint = (this.paper.svg as SVGSVGElement).createSVGPoint()
    svgPoint.x = x
    svgPoint.y = y
    const ctm = (this.paper as any).viewport.getCTM()
    if (ctm) {
      const transformed = svgPoint.matrixTransform(ctm.inverse())
      return { x: transformed.x, y: transformed.y }
    }
    return { x, y }
  }
}
