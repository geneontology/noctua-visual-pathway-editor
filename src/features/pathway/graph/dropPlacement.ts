export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/** Top-left position that centers a box of `size` on `point`. */
export function centerTopLeft(point: Point, size: Size): Point {
  return { x: point.x - size.width / 2, y: point.y - size.height / 2 }
}

/** Spacing used when a pasted activity can't be correlated to a source offset. */
const GRID_STEP = 220
const GRID_COLUMNS = 4

export interface RegionPlacementEntry {
  /** Root term id of the copied activity, used to correlate it after paste. */
  termId: string | null
  /** Offset from the region's top-left, preserving the copied layout. */
  offset: Point
}

/** One activity present on the canvas this render. */
export interface RenderedActivity {
  uid: string
  termId: string | null
}

/**
 * Places a pasted *region* of activities (#114 follow-on).
 *
 * Same idea as `DropPlacement` — arm a point, wait for the nodes to come back
 * from the server, position them — but for N nodes at once, which brings a
 * correlation problem: the m3Batch response carries no mapping from the batch
 * variables we sent to the uids the server assigned, and the order activities
 * appear in is not a contract.
 *
 * So new activities are matched to copied ones by root term id, leftovers are
 * matched positionally, and anything still unmatched is dropped into a grid at
 * the paste point. Relative *structure* is exact regardless — it lives in the
 * relations — while relative *position* is best-effort.
 *
 * The armed point is the top-left of the pasted region, not its centre, so a
 * paste lands predictably where the user clicked.
 */
export class RegionPlacement {
  private _point: Point | null = null
  private _entries: RegionPlacementEntry[] = []
  private _knownUids = new Set<string>()

  get isArmed(): boolean {
    return this._point !== null
  }

  arm(point: Point, entries: RegionPlacementEntry[]): void {
    this._point = point
    this._entries = [...entries]
  }

  clear(): void {
    this._point = null
    this._entries = []
  }

  /**
   * Reconcile against the activities present this render. Returns top-left
   * positions for the newly-appeared ones, or null when there is nothing to
   * place. Always records the current uids for the next render.
   */
  resolve(current: RenderedActivity[]): Record<string, Point> | null {
    let placements: Record<string, Point> | null = null

    if (this._point && this._entries.length > 0) {
      const appeared = current.filter(item => !this._knownUids.has(item.uid))
      if (appeared.length > 0) {
        placements = this._match(appeared, this._point)
        this.clear()
      }
    }

    this._knownUids = new Set(current.map(item => item.uid))
    return placements
  }

  private _match(appeared: RenderedActivity[], point: Point): Record<string, Point> {
    const remaining = [...this._entries]
    const positions: Record<string, Point> = {}
    const unmatched: string[] = []

    // First pass: correlate by term id, which is right whenever the copied
    // activities have distinct root terms.
    for (const item of appeared) {
      const index = item.termId
        ? remaining.findIndex(entry => entry.termId === item.termId)
        : -1
      if (index === -1) {
        unmatched.push(item.uid)
        continue
      }
      const [entry] = remaining.splice(index, 1)
      positions[item.uid] = offsetFrom(point, entry.offset)
    }

    // Second pass: whatever is left keeps the remaining offsets in order, then
    // falls back to a grid so nodes never stack on one spot.
    let gridIndex = 0
    for (const uid of unmatched) {
      const entry = remaining.shift()
      positions[uid] = entry ? offsetFrom(point, entry.offset) : gridSlot(point, gridIndex++)
    }

    return positions
  }
}

function offsetFrom(point: Point, offset: Point): Point {
  return { x: point.x + offset.x, y: point.y + offset.y }
}

function gridSlot(point: Point, index: number): Point {
  return {
    x: point.x + (index % GRID_COLUMNS) * GRID_STEP,
    y: point.y + Math.floor(index / GRID_COLUMNS) * GRID_STEP,
  }
}

/**
 * Tracks a node being created from a stencil drop.
 *
 * The drop point is armed the moment the user drops on the canvas, but the new
 * activity only comes back from the server on a later (post-save) re-render —
 * and there can be intervening re-renders before it appears. `resolve` finds the
 * new activity by diffing the activities present this render against those seen
 * last render, and clears the armed drop ONLY once it actually places one, so an
 * intervening render can't consume it prematurely. The cancel path uses `clear`.
 */
export class DropPlacement {
  private _point: Point | null = null
  private _knownUids = new Set<string>()

  /** True while a drop is armed and waiting for its node to appear. */
  get isArmed(): boolean {
    return this._point !== null
  }

  /** Arm a drop at the given graph-space point. Overwrites any prior drop. */
  arm(point: Point): void {
    this._point = point
  }

  /** Discard an armed drop (e.g. the create form was dismissed). */
  clear(): void {
    this._point = null
  }

  /**
   * Reconcile against the activity uids present this render. Returns the drop
   * point and the uid of the newly-appeared activity to place there, or null
   * when there is nothing to place. Always records the current uids for the
   * next render. When several uids are new at once, the first is chosen.
   */
  resolve(currentUids: Iterable<string>): { uid: string; point: Point } | null {
    const uids = Array.from(currentUids)
    let placement: { uid: string; point: Point } | null = null

    if (this._point) {
      const newUid = uids.find(uid => !this._knownUids.has(uid))
      if (newUid !== undefined) {
        placement = { uid: newUid, point: this._point }
        this._point = null
      }
    }

    this._knownUids = new Set(uids)
    return placement
  }
}
