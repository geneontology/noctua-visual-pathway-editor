import * as joint from 'jointjs'

/** How far the pointer must travel before a blank drag counts as a marquee. */
const DRAG_THRESHOLD = 3

const RECT_FILL = 'rgba(59, 130, 246, 0.12)'
const RECT_STROKE = '#3b82f6'

export interface MarqueeCallbacks {
  /** A marquee closed over these element ids. `additive` is a shift-drag. */
  onSelect: (ids: string[], additive: boolean) => void
  /** A blank click with no meaningful drag — clears the selection. */
  onClickBlank: () => void
}

/**
 * Rubber-band selection on empty canvas (#114).
 *
 * The band is an SVG rect appended to the paper's FRONT layer rather than an
 * HTML overlay: the paper is 30000x30000 inside a natively-scrolling container,
 * so an HTML rect would drift away from the graph as soon as the user scrolled
 * or zoomed. Drawn in the paper it pans and scales for free.
 *
 * Hit-testing uses `graph.findModelsInArea` rather than `paper.findViewsInArea`
 * because the paper is `async: true` — views for cells that haven't rendered yet
 * would be missed.
 */
export class MarqueeSelection {
  private _paper: joint.dia.Paper
  private _graph: joint.dia.Graph
  private _callbacks: MarqueeCallbacks

  private _origin: { x: number; y: number } | null = null
  private _rect: SVGRectElement | null = null
  private _additive = false

  constructor(paper: joint.dia.Paper, graph: joint.dia.Graph, callbacks: MarqueeCallbacks) {
    this._paper = paper
    this._graph = graph
    this._callbacks = callbacks

    paper.on('blank:pointerdown', this._onPointerDown)
    paper.on('blank:pointermove', this._onPointerMove)
    paper.on('blank:pointerup', this._onPointerUp)
  }

  destroy() {
    this._paper.off('blank:pointerdown', this._onPointerDown)
    this._paper.off('blank:pointermove', this._onPointerMove)
    this._paper.off('blank:pointerup', this._onPointerUp)
    this._removeRect()
  }

  // JointJS hands blank pointer events coordinates already in paper-local space.
  private _onPointerDown = (evt: joint.dia.Event, x: number, y: number) => {
    // Right-click opens the paste menu (`blank:contextmenu`); never a marquee.
    if ((evt as unknown as MouseEvent).button !== 0) return
    this._origin = { x, y }
    this._additive = !!(evt as unknown as MouseEvent).shiftKey
  }

  private _onPointerMove = (_evt: joint.dia.Event, x: number, y: number) => {
    if (!this._origin) return

    const area = this._area(x, y)
    if (!this._rect) {
      // Wait for a real drag so a plain click doesn't flash a zero-size band.
      if (area.width < DRAG_THRESHOLD && area.height < DRAG_THRESHOLD) return
      this._rect = this._createRect()
    }

    this._rect.setAttribute('x', String(area.x))
    this._rect.setAttribute('y', String(area.y))
    this._rect.setAttribute('width', String(area.width))
    this._rect.setAttribute('height', String(area.height))
  }

  private _onPointerUp = (_evt: joint.dia.Event, x: number, y: number) => {
    if (!this._origin) return

    const dragged = this._rect !== null
    const area = this._area(x, y)
    const additive = this._additive

    this._origin = null
    this._additive = false
    this._removeRect()

    if (!dragged) {
      this._callbacks.onClickBlank()
      return
    }

    const ids = this._graph
      .findModelsInArea(area)
      .map(element => String(element.id))

    this._callbacks.onSelect(ids, additive)
  }

  /** Normalized drag rectangle — drags run in any direction. */
  private _area(x: number, y: number) {
    const origin = this._origin!
    return {
      x: Math.min(origin.x, x),
      y: Math.min(origin.y, y),
      width: Math.abs(x - origin.x),
      height: Math.abs(y - origin.y),
    }
  }

  private _createRect(): SVGRectElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('fill', RECT_FILL)
    rect.setAttribute('stroke', RECT_STROKE)
    rect.setAttribute('stroke-width', '1')
    rect.setAttribute('stroke-dasharray', '4 2')
    rect.setAttribute('pointer-events', 'none')
    this._paper.getLayerNode(joint.dia.Paper.Layers.FRONT).appendChild(rect)
    return rect
  }

  private _removeRect() {
    this._rect?.remove()
    this._rect = null
  }
}
