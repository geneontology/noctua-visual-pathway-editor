import { describe, it, expect } from 'vitest'
import reducer, {
  setRightDrawerOpen,
  setRightPanelTab,
  selectRightDrawerOpen,
  selectRightPanelTab,
  RightPanelTab,
} from '@/@noctua.core/components/drawer/drawerSlice'
import type { RootState } from '@/app/store/store'

const initial = reducer(undefined, { type: '@@INIT' })

const makeState = (overrides: Partial<typeof initial> = {}) =>
  ({ drawer: { ...initial, ...overrides } } as unknown as RootState)

describe('drawerSlice reducers', () => {
  it('starts closed on the activity-table tab', () => {
    expect(initial).toEqual({
      rightDrawerOpen: false,
      rightPanelTab: RightPanelTab.ACTIVITY_TABLE,
    })
  })

  it('setRightDrawerOpen toggles the open flag', () => {
    const opened = reducer(initial, setRightDrawerOpen(true))
    expect(opened.rightDrawerOpen).toBe(true)
    const closed = reducer(opened, setRightDrawerOpen(false))
    expect(closed.rightDrawerOpen).toBe(false)
  })

  it('setRightPanelTab switches between tabs', () => {
    const errors = reducer(initial, setRightPanelTab(RightPanelTab.CAM_ERRORS))
    expect(errors.rightPanelTab).toBe(RightPanelTab.CAM_ERRORS)
    const back = reducer(errors, setRightPanelTab(RightPanelTab.ACTIVITY_TABLE))
    expect(back.rightPanelTab).toBe(RightPanelTab.ACTIVITY_TABLE)
  })

  it('setRightPanelTab does not affect the open flag', () => {
    const opened = reducer(initial, setRightDrawerOpen(true))
    const switched = reducer(opened, setRightPanelTab(RightPanelTab.CAM_ERRORS))
    expect(switched.rightDrawerOpen).toBe(true)
  })

  it('selectors return the matching slice fields', () => {
    const state = makeState({
      rightDrawerOpen: true,
      rightPanelTab: RightPanelTab.CAM_ERRORS,
    })
    expect(selectRightDrawerOpen(state)).toBe(true)
    expect(selectRightPanelTab(state)).toBe(RightPanelTab.CAM_ERRORS)
  })
})
