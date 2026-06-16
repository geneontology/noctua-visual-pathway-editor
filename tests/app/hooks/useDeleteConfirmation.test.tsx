import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { useDeleteConfirmation } from '@/app/hooks/useDeleteConfirmation'
import { setRightDrawerOpen } from '@/@noctua.core/components/drawer/drawerSlice'
import { setModel, setSelectedActivity } from '@/features/gocam/slices/camSlice'
import { buildActivity, buildModel, buildNode } from '@tests/fixtures/builders'

const updateMock = vi.hoisted(() => vi.fn(() => Promise.resolve({})))

vi.mock('@/features/gocam/slices/camApiSlice', () => ({
  useUpdateGraphModelMutation: () => [updateMock, { isLoading: false }],
}))

const buildHarness = () => {
  const store = makeStore()
  const activity = buildActivity('act-1', [buildNode('GO:1', 'Foo')])
  const otherActivity = buildActivity('act-2', [buildNode('GO:2', 'Bar')])
  const model = buildModel([activity, otherActivity])
  store.dispatch(setModel(model))

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, model, activity, otherActivity, wrapper }
}

beforeEach(() => {
  updateMock.mockClear()
})

describe('useDeleteConfirmation', () => {
  it('starts with no delete target and isDeleteOpen=false', () => {
    const { model, wrapper } = buildHarness()
    const { result } = renderHook(() => useDeleteConfirmation(model), { wrapper })

    expect(result.current.deleteTarget).toBeNull()
    expect(result.current.isDeleteOpen).toBe(false)
  })

  it('requestDelete sets the target and flips isDeleteOpen to true', () => {
    const { model, wrapper } = buildHarness()
    const { result } = renderHook(() => useDeleteConfirmation(model), { wrapper })

    act(() => result.current.requestDelete('act-1'))

    expect(result.current.deleteTarget).toBe('act-1')
    expect(result.current.isDeleteOpen).toBe(true)
  })

  it('cancelDelete clears the target without calling the mutation', () => {
    const { model, wrapper } = buildHarness()
    const { result } = renderHook(() => useDeleteConfirmation(model), { wrapper })

    act(() => result.current.requestDelete('act-1'))
    act(() => result.current.cancelDelete())

    expect(result.current.deleteTarget).toBeNull()
    expect(result.current.isDeleteOpen).toBe(false)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('confirmDelete fires the mutation with delete ops, clears target, closes drawer, deselects', () => {
    const { store, model, wrapper } = buildHarness()
    store.dispatch(setRightDrawerOpen(true))
    store.dispatch(setSelectedActivity('act-1'))

    const { result } = renderHook(() => useDeleteConfirmation(model), { wrapper })

    act(() => result.current.requestDelete('act-1'))
    act(() => result.current.confirmDelete())

    expect(updateMock).toHaveBeenCalledTimes(1)
    const ops = updateMock.mock.calls[0][0]
    expect(Array.isArray(ops)).toBe(true)
    expect(ops.length).toBeGreaterThan(0)
    // Trailing op should be the STORE
    expect(ops[ops.length - 1].operation).toBe('store')

    expect(result.current.deleteTarget).toBeNull()
    expect(result.current.isDeleteOpen).toBe(false)
    expect(store.getState().drawer.rightDrawerOpen).toBe(false)
    expect(store.getState().cam.selectedActivityId).toBeNull()
  })

  it('confirmDelete is a no-op when no target has been set', () => {
    const { model, wrapper } = buildHarness()
    const { result } = renderHook(() => useDeleteConfirmation(model), { wrapper })

    act(() => result.current.confirmDelete())
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('confirmDelete is a no-op when the target uid does not match any activity', () => {
    const { model, wrapper } = buildHarness()
    const { result } = renderHook(() => useDeleteConfirmation(model), { wrapper })

    act(() => result.current.requestDelete('not-an-activity'))
    act(() => result.current.confirmDelete())

    expect(updateMock).not.toHaveBeenCalled()
  })

  it('confirmDelete is a no-op when model is null', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={makeStore()}>{children}</Provider>
    )
    const { result } = renderHook(() => useDeleteConfirmation(null), { wrapper })

    act(() => result.current.requestDelete('act-1'))
    act(() => result.current.confirmDelete())

    expect(updateMock).not.toHaveBeenCalled()
  })
})
