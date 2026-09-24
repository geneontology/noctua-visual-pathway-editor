import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import type { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { useRegionDelete } from '@/app/hooks/useRegionDelete'
import {
  buildActivity,
  buildEdgeWithEvidence,
  buildModel,
  buildNode,
} from '@tests/fixtures/builders'

const updateMock = vi.hoisted(() =>
  vi.fn((_operations: { operation: string }[]) => ({ unwrap: () => Promise.resolve({}) }))
)

vi.mock('@/features/gocam/slices/camApiSlice', () => ({
  useUpdateGraphModelMutation: () => [updateMock, { isLoading: false }],
}))

const buildHarness = () => {
  const store = makeStore()
  const a = buildActivity('act-a', [buildNode('GO:1', 'Alpha')])
  const b = buildActivity('act-b', [buildNode('GO:2', 'Beta')])
  const c = buildActivity('act-c', [buildNode('GO:3', 'Gamma')])
  // One relation, a → b, so the thumbnail has something to draw.
  const model = {
    ...buildModel([a, b, c]),
    activityConnections: [
      {
        ...buildEdgeWithEvidence('RO:0002413', []),
        sourceId: a.rootNode.uid,
        targetId: b.rootNode.uid,
      },
    ],
  }

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, model, wrapper }
}

// Canvas positions of the selection, as `getSelectionPositions` reports them.
const positions = {
  'act-a': { x: 100, y: 50 },
  'act-b': { x: 300, y: 150 },
  'act-c': { x: 500, y: 50 },
}

beforeEach(() => {
  updateMock.mockClear()
})

describe('useRegionDelete — request', () => {
  it('starts closed, with nothing to delete or preview', () => {
    const { model, wrapper } = buildHarness()
    const { result } = renderHook(() => useRegionDelete(model), { wrapper })

    expect(result.current.isDeleteOpen).toBe(false)
    expect(result.current.deleteTargets).toBeNull()
    expect(result.current.deletePreview).toBeNull()
  })

  it('holds the selected activities and a thumbnail of them', () => {
    const { model, wrapper } = buildHarness()
    const { result } = renderHook(() => useRegionDelete(model), { wrapper })

    act(() => result.current.requestDelete(['act-a', 'act-b'], positions))

    expect(result.current.isDeleteOpen).toBe(true)
    expect(result.current.deleteTargets?.map(a => a.uid)).toEqual(['act-a', 'act-b'])
    // Laid out from the canvas positions, relative to the selection's top-left.
    expect(result.current.deletePreview?.activities.map(entry => entry.offset)).toEqual([
      { x: 0, y: 0 },
      { x: 200, y: 100 },
    ])
    expect(result.current.deletePreview?.connections).toHaveLength(1)
  })

  it('ignores ids that match no activity', () => {
    const { model, wrapper } = buildHarness()
    const { result } = renderHook(() => useRegionDelete(model), { wrapper })

    act(() => result.current.requestDelete(['not-an-activity'], positions))

    expect(result.current.isDeleteOpen).toBe(false)
    expect(result.current.deletePreview).toBeNull()
  })

  it('cancelDelete drops the request and its thumbnail without writing', () => {
    const { model, wrapper } = buildHarness()
    const { result } = renderHook(() => useRegionDelete(model), { wrapper })

    act(() => result.current.requestDelete(['act-a', 'act-b'], positions))
    act(() => result.current.cancelDelete())

    expect(result.current.isDeleteOpen).toBe(false)
    expect(result.current.deleteTargets).toBeNull()
    expect(result.current.deletePreview).toBeNull()
    expect(updateMock).not.toHaveBeenCalled()
  })
})

describe('useRegionDelete — confirm', () => {
  it('sends one batch, clears the request and calls onDeleted', async () => {
    const onDeleted = vi.fn()
    const { model, wrapper } = buildHarness()
    const { result } = renderHook(() => useRegionDelete(model, onDeleted), { wrapper })

    act(() => result.current.requestDelete(['act-a', 'act-b'], positions))
    await act(async () => {
      await result.current.confirmDelete()
    })

    expect(updateMock).toHaveBeenCalledTimes(1)
    const operations = updateMock.mock.calls[0][0]
    expect(operations[operations.length - 1].operation).toBe('store')
    expect(result.current.isDeleteOpen).toBe(false)
    expect(result.current.deletePreview).toBeNull()
    expect(onDeleted).toHaveBeenCalledTimes(1)
  })

  it.each([
    [['act-a'], 'Deleted 1 node'],
    [['act-a', 'act-b'], 'Deleted 2 nodes'],
  ])('reports deleting %j as "%s"', async (ids, message) => {
    const { store, model, wrapper } = buildHarness()
    const { result } = renderHook(() => useRegionDelete(model), { wrapper })

    act(() => result.current.requestDelete(ids, positions))
    await act(async () => {
      await result.current.confirmDelete()
    })

    expect(store.getState().toast.message).toBe(message)
  })
})
