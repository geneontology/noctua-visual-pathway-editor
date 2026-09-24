import { describe, it, expect, vi } from 'vitest'
import * as joint from 'jointjs'
import { CamCanvas } from '@/features/pathway/graph/camCanvas'
import { SelectionModel } from '@/features/pathway/graph/selectionModel'

/**
 * A JointJS Paper can't be built under jsdom, so the constructor is skipped and
 * the selection methods run against a real Graph. Painting the selection needs
 * the paper, so `_commitSelection` is stubbed.
 */
const canvasOver = (graph: joint.dia.Graph, selected: string[] = []) => {
  const selection = new SelectionModel()
  selection.replace(selected)
  const canvas = Object.create(CamCanvas.prototype) as CamCanvas
  Object.assign(canvas, { graph, _selection: selection, _commitSelection: vi.fn() })
  return canvas
}

const node = (id: string) => {
  const element = new joint.shapes.standard.Rectangle({ id })
  element.prop('activity', { uid: id })
  return element
}

const relation = (source: string, target: string) =>
  new joint.shapes.standard.Link({ source: { id: source }, target: { id: target } })

describe('CamCanvas.selectUnconnected', () => {
  it('selects only the nodes with no relation to another node', () => {
    // a → b: a has only an outgoing relation, b only an incoming one.
    const graph = new joint.dia.Graph()
    graph.addCells([node('a'), node('b'), node('c'), node('d'), relation('a', 'b')])
    const canvas = canvasOver(graph)

    expect(canvas.selectUnconnected()).toBe(2)
    expect(canvas.getSelection().sort()).toEqual(['c', 'd'])
  })

  it('leaves the selection alone when every node is connected', () => {
    const graph = new joint.dia.Graph()
    graph.addCells([node('a'), node('b'), relation('a', 'b')])
    const canvas = canvasOver(graph, ['a'])

    expect(canvas.selectUnconnected()).toBe(0)
    expect(canvas.getSelection()).toEqual(['a'])
  })
})
