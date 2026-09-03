import { describe, it, expect } from 'vitest'
import {
  buildDeleteActivityOperations,
  buildDeleteRegionOperations,
} from '@/features/gocam/services/activityOperations'
import { OperationEntity, OperationType } from '@/features/gocam/models/operations'
import type { Operation } from '@/features/gocam/models/operations'
import type { Activity, Edge, GraphNode } from '@/features/gocam/models/cam'
import { buildActivity, buildNode } from '@tests/fixtures/builders'

const MODEL_ID = 'gomodel:target'

const node = (uid: string): GraphNode => ({ ...buildNode('GO:0003674', 'mf'), uid })

const edge = (sourceId: string, targetId: string, id = 'RO:0002333'): Edge => ({
  uid: `edge-${sourceId}-${targetId}`,
  id,
  label: 'enabled by',
  sourceId,
  targetId,
  source: node(sourceId),
  target: node(targetId),
  contributors: [],
  groups: [],
  comments: [],
})

/** Activity with a root node, one child, and the edge between them. */
const activity = (root: string, child: string): Activity => ({
  ...buildActivity(root, [node(root), node(child)], [edge(root, child)]),
  rootNode: node(root),
})

const removals = (ops: Operation[], entity: OperationEntity) =>
  ops.filter(o => o.entity === entity && o.operation === OperationType.REMOVE)

const stores = (ops: Operation[]) =>
  ops.filter(o => o.entity === OperationEntity.MODEL && o.operation === OperationType.STORE)

describe('buildDeleteRegionOperations', () => {
  it('removes every node of every selected activity', () => {
    const ops = buildDeleteRegionOperations([activity('a', 'a1'), activity('b', 'b1')], MODEL_ID)

    const individuals = removals(ops, OperationEntity.INDIVIDUAL).map(
      o => o.arguments.individual
    )
    expect(individuals.sort()).toEqual(['a', 'a1', 'b', 'b1'])
  })

  it('removes every edge of every selected activity', () => {
    const ops = buildDeleteRegionOperations([activity('a', 'a1'), activity('b', 'b1')], MODEL_ID)

    expect(removals(ops, OperationEntity.EDGE)).toHaveLength(2)
  })

  it('is a single batch — one store for the whole selection', () => {
    const ops = buildDeleteRegionOperations(
      [activity('a', 'a1'), activity('b', 'b1'), activity('c', 'c1')],
      MODEL_ID
    )

    expect(stores(ops)).toHaveLength(1)
    expect(ops[ops.length - 1]).toEqual({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
      arguments: { 'model-id': MODEL_ID },
    })
  })

  it('removes edges before the individuals they reference', () => {
    const ops = buildDeleteRegionOperations([activity('a', 'a1')], MODEL_ID)

    const lastEdge = ops.map(o => o.entity).lastIndexOf(OperationEntity.EDGE)
    const firstIndividual = ops.map(o => o.entity).indexOf(OperationEntity.INDIVIDUAL)
    expect(lastEdge).toBeLessThan(firstIndividual)
  })

  it('never removes the same individual twice when activities share a node', () => {
    const shared = activity('a', 'shared')
    const other: Activity = {
      ...buildActivity('b', [node('b'), node('shared')], [edge('b', 'shared')]),
      rootNode: node('b'),
    }

    const ops = buildDeleteRegionOperations([shared, other], MODEL_ID)

    const individuals = removals(ops, OperationEntity.INDIVIDUAL).map(
      o => o.arguments.individual
    )
    expect(individuals).toHaveLength(new Set(individuals).size)
    expect(individuals.sort()).toEqual(['a', 'b', 'shared'])
  })

  it('targets the right model', () => {
    const ops = buildDeleteRegionOperations([activity('a', 'a1')], MODEL_ID)
    expect(ops.every(o => o.arguments['model-id'] === MODEL_ID)).toBe(true)
  })

  it('emits just a store for an empty selection', () => {
    const ops = buildDeleteRegionOperations([], MODEL_ID)
    expect(ops).toHaveLength(1)
    expect(stores(ops)).toHaveLength(1)
  })

  it('matches the single-activity builder for a selection of one', () => {
    const only = activity('a', 'a1')

    expect(buildDeleteRegionOperations([only], MODEL_ID)).toEqual(
      buildDeleteActivityOperations(only, MODEL_ID)
    )
  })
})
