import { describe, it, expect, vi } from 'vitest'
import * as joint from 'jointjs'
import { CamCanvas } from '@/features/pathway/graph/camCanvas'
import { SelectionModel } from '@/features/pathway/graph/selectionModel'
import { RootTypes } from '@/features/gocam/models/cam'
import { buildActivity, buildNode } from '@tests/fixtures/builders'

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

describe('CamCanvas activity node coverage icon', () => {
  const mf = buildNode('GO:0016301', 'kinase activity', [RootTypes.MOLECULAR_FUNCTION])
  const gp = buildNode('UniProtKB:P24941', 'CDK2', [RootTypes.MOLECULAR_ENTITY])
  const bp = buildNode('GO:0000278', 'mitotic cell cycle', [RootTypes.BIOLOGICAL_PROCESS])
  const cc = buildNode('GO:0005634', 'nucleus', [
    RootTypes.CELLULAR_COMPONENT,
    RootTypes.CELLULAR_ANATOMICAL,
  ])
  const anatomical = buildNode('GO:0005737', 'cytoplasm', [RootTypes.CELLULAR_ANATOMICAL])
  const complex = buildNode('GO:0000307', 'cyclin-dependent protein kinase holoenzyme complex', [
    RootTypes.PROTEIN_CONTAINING_COMPLEX,
    RootTypes.CELLULAR_COMPONENT,
  ])

  const iconFor = (nodes: ReturnType<typeof buildNode>[]) => {
    const canvas = Object.create(CamCanvas.prototype) as CamCanvas
    const el = canvas['_createNode'](buildActivity('a', nodes), 'simple')
    return el.attr('icon/xlinkHref')
  }

  it.each([
    ['MF only', [mf, gp], 4],
    ['MF + BP', [mf, gp, bp], 6],
    ['MF + CC', [mf, gp, cc], 5],
    ['MF + BP + CC', [mf, gp, bp, cc], 7],
    ['no GO terms', [gp], 0],
  ])('%s → coverage-%i', (_name, nodes, coverage) => {
    expect(iconFor(nodes)).toBe(`./assets/images/activity/coverage-${coverage}.png`)
  })

  it('counts a cellular anatomical entity as CC', () => {
    expect(iconFor([mf, gp, anatomical])).toBe('./assets/images/activity/coverage-5.png')
  })

  it('does not count a protein-containing complex as CC', () => {
    expect(iconFor([mf, complex])).toBe('./assets/images/activity/coverage-4.png')
  })
})
