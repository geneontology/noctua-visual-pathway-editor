/**
 * The set of activities currently multi-selected on the canvas (#114).
 *
 * Deliberately free of any JointJS import: the canvas rebuilds all of its cells
 * on every model refetch (`CamCanvas.addCanvasGraph` → `graph.resetCells`), so
 * selection cannot live on the cells themselves. It lives here, keyed by
 * activity uid — which is a stable server individual id — and is re-applied to
 * the freshly created cells after each rebuild via `prune`.
 *
 * Every mutator returns whether it actually changed the set, so callers can skip
 * redundant redraws.
 */
export class SelectionModel {
  private _uids = new Set<string>()

  get size(): number {
    return this._uids.size
  }

  get isEmpty(): boolean {
    return this._uids.size === 0
  }

  has(uid: string): boolean {
    return this._uids.has(uid)
  }

  list(): string[] {
    return Array.from(this._uids)
  }

  /** Replace the whole selection. */
  replace(uids: Iterable<string>): boolean {
    const next = new Set(uids)
    if (sameSet(this._uids, next)) return false
    this._uids = next
    return true
  }

  /** Union `uids` into the selection — the shift-drag / shift-click path. */
  add(uids: Iterable<string>): boolean {
    let changed = false
    for (const uid of uids) {
      if (!this._uids.has(uid)) {
        this._uids.add(uid)
        changed = true
      }
    }
    return changed
  }

  /** Flip one uid's membership. Always a change. */
  toggle(uid: string): boolean {
    if (!this._uids.delete(uid)) this._uids.add(uid)
    return true
  }

  clear(): boolean {
    if (this._uids.size === 0) return false
    this._uids.clear()
    return true
  }

  /**
   * Drop uids that no longer exist in the model. Called after each canvas
   * rebuild so a deleted activity — or one removed by another curator — doesn't
   * linger in the selection.
   */
  prune(currentUids: Iterable<string>): boolean {
    const alive = new Set(currentUids)
    let changed = false
    for (const uid of this._uids) {
      if (!alive.has(uid)) {
        this._uids.delete(uid)
        changed = true
      }
    }
    return changed
  }
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const value of a) {
    if (!b.has(value)) return false
  }
  return true
}
