import { describe, it, expect } from 'vitest'
import { buildSaveModelAnnotationsOperations } from '@/features/gocam/services/activityOperations'
import {
  OperationEntity,
  OperationType,
  AnnotationKey,
} from '@/features/gocam/models/operations'

const MODEL_ID = 'gomodel:test'

describe('buildSaveModelAnnotationsOperations', () => {
  it('removes prior + adds new for title/state/comments + ends with STORE', () => {
    const ops = buildSaveModelAnnotationsOperations(
      MODEL_ID,
      { title: 'old', state: 'development', comments: ['c1'] },
      { title: 'new', state: 'production', comments: ['c1', 'c2'] }
    )
    // Last op is always STORE
    expect(ops.at(-1)).toMatchObject({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
    })
    // Three remove ops + one title add + one state add + two comment adds
    const removes = ops.filter(o => o.operation === OperationType.REMOVE_ANNOTATION)
    const adds = ops.filter(o => o.operation === OperationType.ADD_ANNOTATION)
    expect(removes).toHaveLength(3) // old title + old state + 1 old comment
    expect(adds).toHaveLength(4) // new title + new state + 2 new comments
  })

  it('skips remove ops when prior values are missing (empty / undefined)', () => {
    const ops = buildSaveModelAnnotationsOperations(
      MODEL_ID,
      { title: '', state: undefined, comments: undefined },
      { title: 'New Title', state: 'production', comments: [] }
    )
    const removes = ops.filter(o => o.operation === OperationType.REMOVE_ANNOTATION)
    expect(removes).toHaveLength(0)
  })

  it('handles "comments cleared" — old had comments, new has empty array', () => {
    const ops = buildSaveModelAnnotationsOperations(
      MODEL_ID,
      { title: 't', state: 'production', comments: ['a', 'b'] },
      { title: 't', state: 'production', comments: [] }
    )
    const commentRemoves = ops.filter(
      o =>
        o.operation === OperationType.REMOVE_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.COMMENT
    )
    const commentAdds = ops.filter(
      o =>
        o.operation === OperationType.ADD_ANNOTATION &&
        Array.isArray(o.arguments.values) &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.COMMENT
    )
    expect(commentRemoves).toHaveLength(2)
    expect(commentAdds).toHaveLength(0)
  })

  it('tags every operation with the model-id', () => {
    const ops = buildSaveModelAnnotationsOperations(
      MODEL_ID,
      { title: 'a', state: 'b', comments: ['c'] },
      { title: 'A', state: 'B', comments: ['C'] }
    )
    for (const op of ops) {
      expect(op.arguments['model-id']).toBe(MODEL_ID)
    }
  })

  it('always emits the title and state ADD_ANNOTATION ops, even when unchanged', () => {
    // Field-level diffing isn't done here — the builder always re-emits title/state.
    // (The expectation is that the upstream callers only invoke this when something changed.)
    const ops = buildSaveModelAnnotationsOperations(
      MODEL_ID,
      { title: 'same', state: 'production', comments: [] },
      { title: 'same', state: 'production', comments: [] }
    )
    const titleAdd = ops.find(
      o =>
        o.operation === OperationType.ADD_ANNOTATION &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.TITLE
    )
    const stateAdd = ops.find(
      o =>
        o.operation === OperationType.ADD_ANNOTATION &&
        (o.arguments.values as Array<{ key: AnnotationKey }>)[0].key === AnnotationKey.STATE
    )
    expect(titleAdd).toBeTruthy()
    expect(stateAdd).toBeTruthy()
  })
})
