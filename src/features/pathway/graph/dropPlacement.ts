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
