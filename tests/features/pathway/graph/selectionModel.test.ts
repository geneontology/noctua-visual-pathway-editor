import { describe, expect, it } from 'vitest'
import { SelectionModel } from '@/features/pathway/graph/selectionModel'

describe('SelectionModel', () => {
  it('starts empty', () => {
    const sel = new SelectionModel()
    expect(sel.size).toBe(0)
    expect(sel.isEmpty).toBe(true)
    expect(sel.list()).toEqual([])
    expect(sel.has('a')).toBe(false)
  })

  describe('replace', () => {
    it('sets the selection and reports the change', () => {
      const sel = new SelectionModel()
      expect(sel.replace(['a', 'b'])).toBe(true)
      expect(sel.list()).toEqual(['a', 'b'])
      expect(sel.size).toBe(2)
      expect(sel.isEmpty).toBe(false)
    })

    it('discards what was selected before', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'b'])
      sel.replace(['c'])
      expect(sel.list()).toEqual(['c'])
      expect(sel.has('a')).toBe(false)
    })

    it('reports no change when the same set is replaced', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'b'])
      expect(sel.replace(['a', 'b'])).toBe(false)
    })

    it('ignores ordering when deciding whether anything changed', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'b'])
      expect(sel.replace(['b', 'a'])).toBe(false)
    })

    it('reports a change when the set differs in one member', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'b'])
      expect(sel.replace(['a', 'c'])).toBe(true)
    })

    it('de-duplicates repeated uids', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'a', 'b'])
      expect(sel.list()).toEqual(['a', 'b'])
    })

    it('clears when replaced with nothing', () => {
      const sel = new SelectionModel()
      sel.replace(['a'])
      expect(sel.replace([])).toBe(true)
      expect(sel.isEmpty).toBe(true)
    })
  })

  describe('add', () => {
    it('unions into the existing selection — the shift-drag path', () => {
      const sel = new SelectionModel()
      sel.replace(['a'])
      expect(sel.add(['b', 'c'])).toBe(true)
      expect(sel.list()).toEqual(['a', 'b', 'c'])
    })

    it('reports no change when every uid is already selected', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'b'])
      expect(sel.add(['a', 'b'])).toBe(false)
      expect(sel.size).toBe(2)
    })

    it('reports a change when only some uids are new', () => {
      const sel = new SelectionModel()
      sel.replace(['a'])
      expect(sel.add(['a', 'b'])).toBe(true)
      expect(sel.list()).toEqual(['a', 'b'])
    })

    it('adding nothing is not a change', () => {
      const sel = new SelectionModel()
      sel.replace(['a'])
      expect(sel.add([])).toBe(false)
    })
  })

  describe('toggle', () => {
    it('adds a uid that is not selected', () => {
      const sel = new SelectionModel()
      expect(sel.toggle('a')).toBe(true)
      expect(sel.has('a')).toBe(true)
    })

    it('removes a uid that is selected', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'b'])
      sel.toggle('a')
      expect(sel.has('a')).toBe(false)
      expect(sel.list()).toEqual(['b'])
    })

    it('round-trips back to the original set', () => {
      const sel = new SelectionModel()
      sel.replace(['a'])
      sel.toggle('b')
      sel.toggle('b')
      expect(sel.list()).toEqual(['a'])
    })
  })

  describe('clear', () => {
    it('empties the selection and reports the change', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'b'])
      expect(sel.clear()).toBe(true)
      expect(sel.isEmpty).toBe(true)
    })

    it('reports no change when already empty', () => {
      expect(new SelectionModel().clear()).toBe(false)
    })
  })

  describe('prune', () => {
    // This is what lets a selection survive the graph.resetCells rebuild that
    // every save triggers.
    it('keeps uids that still exist', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'b'])
      expect(sel.prune(['a', 'b', 'c'])).toBe(false)
      expect(sel.list()).toEqual(['a', 'b'])
    })

    it('drops uids that have gone', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'b'])
      expect(sel.prune(['a'])).toBe(true)
      expect(sel.list()).toEqual(['a'])
    })

    it('empties the selection when the model no longer has any of it', () => {
      const sel = new SelectionModel()
      sel.replace(['a', 'b'])
      expect(sel.prune(['x', 'y'])).toBe(true)
      expect(sel.isEmpty).toBe(true)
    })

    it('does not add uids that are new to the model', () => {
      const sel = new SelectionModel()
      sel.replace(['a'])
      sel.prune(['a', 'b'])
      expect(sel.has('b')).toBe(false)
    })

    it('is a no-op on an empty selection', () => {
      const sel = new SelectionModel()
      expect(sel.prune(['a'])).toBe(false)
    })
  })

  it('list() returns a copy, so callers cannot mutate internal state', () => {
    const sel = new SelectionModel()
    sel.replace(['a'])
    sel.list().push('b')
    expect(sel.list()).toEqual(['a'])
  })
})
