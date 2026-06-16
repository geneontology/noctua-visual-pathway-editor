import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadingOverlayMiddleware } from '@/@noctua.core/components/loading-overlay/loadingOverlayMiddleware'
import { show, hide } from '@/@noctua.core/components/loading-overlay/loadingOverlaySlice'
import { OperationEntity, OperationType } from '@/features/gocam/models/operations'

const setup = () => {
  const dispatch = vi.fn()
  const next = vi.fn((a: unknown) => a)
  const api = { dispatch, getState: () => ({}) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoke = (action: unknown) => (loadingOverlayMiddleware as any)(api)(next)(action)
  return { dispatch, next, invoke }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('loadingOverlayMiddleware', () => {
  it('passes the action through to next()', () => {
    const { next, invoke } = setup()
    invoke({ type: 'untracked/pending' })
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('is a no-op for non-object actions', () => {
    const { dispatch, invoke } = setup()
    invoke('not-an-object')
    invoke(null)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('dispatches show("Loading Model Activities...") on getGraphModel/pending', () => {
    const { dispatch, invoke } = setup()
    invoke({
      type: 'api/executeQuery/pending',
      meta: { arg: { endpointName: 'getGraphModel' } },
    })
    expect(dispatch).toHaveBeenCalledWith(show('Loading Model Activities...'))
  })

  it('dispatches show("Copying Model...") on copyGraphModel/pending', () => {
    const { dispatch, invoke } = setup()
    invoke({
      type: 'api/executeMutation/pending',
      meta: { arg: { endpointName: 'copyGraphModel' } },
    })
    expect(dispatch).toHaveBeenCalledWith(show('Copying Model...'))
  })

  it('dispatches show("Saving...") on updateGraphModel/pending with no REMOVE ops', () => {
    const { dispatch, invoke } = setup()
    invoke({
      type: 'api/executeMutation/pending',
      meta: {
        arg: {
          endpointName: 'updateGraphModel',
          originalArgs: [
            { entity: OperationEntity.MODEL, operation: OperationType.STORE, arguments: {} },
          ],
        },
      },
    })
    expect(dispatch).toHaveBeenCalledWith(show('Saving...'))
  })

  it('dispatches show("Deleting...") on updateGraphModel/pending when any op is REMOVE', () => {
    const { dispatch, invoke } = setup()
    invoke({
      type: 'api/executeMutation/pending',
      meta: {
        arg: {
          endpointName: 'updateGraphModel',
          originalArgs: [
            { entity: OperationEntity.INDIVIDUAL, operation: OperationType.REMOVE, arguments: {} },
            { entity: OperationEntity.MODEL, operation: OperationType.STORE, arguments: {} },
          ],
        },
      },
    })
    expect(dispatch).toHaveBeenCalledWith(show('Deleting...'))
  })

  it('dispatches hide() ~1000ms after a /fulfilled action', () => {
    const { dispatch, invoke } = setup()
    invoke({
      type: 'api/executeQuery/fulfilled',
      meta: { arg: { endpointName: 'getGraphModel' } },
    })
    expect(dispatch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(dispatch).toHaveBeenCalledWith(hide())
  })

  it('dispatches hide() ~1000ms after a /rejected action', () => {
    const { dispatch, invoke } = setup()
    invoke({
      type: 'api/executeMutation/rejected',
      meta: { arg: { endpointName: 'updateGraphModel' } },
    })
    vi.advanceTimersByTime(1000)
    expect(dispatch).toHaveBeenCalledWith(hide())
  })

  it('ignores actions for non-tracked endpoints', () => {
    const { dispatch, invoke } = setup()
    invoke({
      type: 'api/executeQuery/pending',
      meta: { arg: { endpointName: 'someOtherEndpoint' } },
    })
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('ignores actions that have no type', () => {
    const { dispatch, invoke } = setup()
    invoke({ meta: { arg: { endpointName: 'getGraphModel' } } })
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('does not dispatch hide() immediately — the linger ensures the spinner is visible', () => {
    const { dispatch, invoke } = setup()
    invoke({
      type: 'api/executeQuery/fulfilled',
      meta: { arg: { endpointName: 'getGraphModel' } },
    })
    vi.advanceTimersByTime(900)
    expect(dispatch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    expect(dispatch).toHaveBeenCalledWith(hide())
  })
})
