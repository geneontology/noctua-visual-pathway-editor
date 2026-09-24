import { describe, it, expect, vi, beforeEach } from 'vitest'
import type * as joint from 'jointjs'
import { MarqueeSelection } from '@/features/pathway/graph/marqueeSelection'

// ── Fakes ───────────────────────────────────────────────────────────
//
// MarqueeSelection only touches four things on the paper/graph, so faking them
// keeps this a real unit test — the repo deliberately doesn't stand a JointJS
// paper up under jsdom (see the absence of any camCanvas test).

type Handler = (...args: unknown[]) => void

class FakePaper {
  handlers = new Map<string, Set<Handler>>()
  layer = document.createElement('div')

  on(event: string, handler: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
  }

  off(event: string, handler: Handler) {
    this.handlers.get(event)?.delete(handler)
  }

  getLayerNode() {
    return this.layer
  }

  trigger(event: string, ...args: unknown[]) {
    for (const handler of this.handlers.get(event) ?? []) handler(...args)
  }

  /** Number of live listeners, to prove destroy() cleans up. */
  get listenerCount() {
    let total = 0
    for (const set of this.handlers.values()) total += set.size
    return total
  }
}

/** A left-button pointer event; `shift` drives additive selection. */
const evt = (shift = false, button = 0) =>
  ({ button, shiftKey: shift }) as unknown as joint.dia.Event

const model = (id: string) => ({ id }) as unknown as joint.dia.Element

let paper: FakePaper
let graph: { findModelsInArea: ReturnType<typeof vi.fn> }
let onSelect: ReturnType<typeof vi.fn>
let onClickBlank: ReturnType<typeof vi.fn>
let marquee: MarqueeSelection

const build = (found: joint.dia.Element[] = []) => {
  paper = new FakePaper()
  graph = { findModelsInArea: vi.fn(() => found) }
  onSelect = vi.fn()
  onClickBlank = vi.fn()
  marquee = new MarqueeSelection(
    paper as unknown as joint.dia.Paper,
    graph as unknown as joint.dia.Graph,
    { onSelect, onClickBlank }
  )
}

/** down → move* → up, the whole gesture. */
const drag = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  { shift = false, button = 0 }: { shift?: boolean; button?: number } = {}
) => {
  paper.trigger('blank:pointerdown', evt(shift, button), from.x, from.y)
  paper.trigger('blank:pointermove', evt(shift, button), to.x, to.y)
  paper.trigger('blank:pointerup', evt(shift, button), to.x, to.y)
}

beforeEach(() => build())

describe('MarqueeSelection', () => {
  it('subscribes to the three blank pointer events', () => {
    expect(paper.handlers.get('blank:pointerdown')?.size).toBe(1)
    expect(paper.handlers.get('blank:pointermove')?.size).toBe(1)
    expect(paper.handlers.get('blank:pointerup')?.size).toBe(1)
  })

  describe('click on blank canvas', () => {
    it('reports a click, not a selection, when the pointer never moves', () => {
      paper.trigger('blank:pointerdown', evt(), 10, 10)
      paper.trigger('blank:pointerup', evt(), 10, 10)

      expect(onClickBlank).toHaveBeenCalledTimes(1)
      expect(onSelect).not.toHaveBeenCalled()
      expect(graph.findModelsInArea).not.toHaveBeenCalled()
    })

    it('treats a jitter below the drag threshold as a click', () => {
      drag({ x: 10, y: 10 }, { x: 12, y: 11 })

      expect(onClickBlank).toHaveBeenCalledTimes(1)
      expect(onSelect).not.toHaveBeenCalled()
    })

    it('ignores a pointerup that had no matching pointerdown', () => {
      paper.trigger('blank:pointerup', evt(), 10, 10)

      expect(onClickBlank).not.toHaveBeenCalled()
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('marquee drag', () => {
    it('selects the models the band closed over', () => {
      build([model('act-1'), model('act-2')])
      drag({ x: 0, y: 0 }, { x: 100, y: 50 })

      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onSelect).toHaveBeenCalledWith(['act-1', 'act-2'], false)
      expect(onClickBlank).not.toHaveBeenCalled()
    })

    it('hit-tests the dragged rectangle', () => {
      drag({ x: 20, y: 30 }, { x: 120, y: 80 })

      expect(graph.findModelsInArea).toHaveBeenCalledWith({
        x: 20,
        y: 30,
        width: 100,
        height: 50,
      })
    })

    it('normalizes a right-to-left, bottom-to-top drag', () => {
      drag({ x: 120, y: 80 }, { x: 20, y: 30 })

      expect(graph.findModelsInArea).toHaveBeenCalledWith({
        x: 20,
        y: 30,
        width: 100,
        height: 50,
      })
    })

    it('reports an empty selection when the band caught nothing', () => {
      drag({ x: 0, y: 0 }, { x: 100, y: 100 })

      expect(onSelect).toHaveBeenCalledWith([], false)
    })

    it('crosses the threshold on height alone', () => {
      drag({ x: 10, y: 10 }, { x: 11, y: 60 })

      expect(onSelect).toHaveBeenCalled()
      expect(onClickBlank).not.toHaveBeenCalled()
    })
  })

  describe('additive selection', () => {
    it('flags a shift-drag as additive', () => {
      build([model('act-1')])
      drag({ x: 0, y: 0 }, { x: 100, y: 100 }, { shift: true })

      expect(onSelect).toHaveBeenCalledWith(['act-1'], true)
    })

    it('reads shift from the pointerdown, not the pointerup', () => {
      build([model('act-1')])
      paper.trigger('blank:pointerdown', evt(true), 0, 0)
      paper.trigger('blank:pointermove', evt(false), 100, 100)
      paper.trigger('blank:pointerup', evt(false), 100, 100)

      expect(onSelect).toHaveBeenCalledWith(['act-1'], true)
    })
  })

  describe('non-primary buttons', () => {
    it('ignores a right-button drag, which belongs to the paste menu', () => {
      drag({ x: 0, y: 0 }, { x: 100, y: 100 }, { button: 2 })

      expect(onSelect).not.toHaveBeenCalled()
      expect(onClickBlank).not.toHaveBeenCalled()
    })

    it('ignores a middle-button drag', () => {
      drag({ x: 0, y: 0 }, { x: 100, y: 100 }, { button: 1 })

      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('the band element', () => {
    it('is added to the front layer while dragging and removed after', () => {
      paper.trigger('blank:pointerdown', evt(), 0, 0)
      expect(paper.layer.childElementCount).toBe(0)

      paper.trigger('blank:pointermove', evt(), 100, 100)
      expect(paper.layer.childElementCount).toBe(1)

      paper.trigger('blank:pointerup', evt(), 100, 100)
      expect(paper.layer.childElementCount).toBe(0)
    })

    it('tracks the pointer across successive moves', () => {
      paper.trigger('blank:pointerdown', evt(), 0, 0)
      paper.trigger('blank:pointermove', evt(), 50, 50)
      paper.trigger('blank:pointermove', evt(), 80, 20)

      const rect = paper.layer.firstElementChild!
      expect(rect.getAttribute('width')).toBe('80')
      expect(rect.getAttribute('height')).toBe('20')
    })

    it('is not created for a move with no pointerdown', () => {
      paper.trigger('blank:pointermove', evt(), 100, 100)

      expect(paper.layer.childElementCount).toBe(0)
    })

    it('leaves nothing behind after a second gesture', () => {
      drag({ x: 0, y: 0 }, { x: 100, y: 100 })
      drag({ x: 0, y: 0 }, { x: 50, y: 50 })

      expect(paper.layer.childElementCount).toBe(0)
      expect(onSelect).toHaveBeenCalledTimes(2)
    })
  })

  describe('destroy', () => {
    it('unsubscribes every handler', () => {
      marquee.destroy()

      expect(paper.listenerCount).toBe(0)
    })

    it('removes a band left mid-drag', () => {
      paper.trigger('blank:pointerdown', evt(), 0, 0)
      paper.trigger('blank:pointermove', evt(), 100, 100)
      expect(paper.layer.childElementCount).toBe(1)

      marquee.destroy()
      expect(paper.layer.childElementCount).toBe(0)
    })
  })
})
