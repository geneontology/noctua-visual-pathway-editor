import { describe, it, expect } from 'vitest'
import reducer, {
  setRightDrawerOpen,
  setRightPanelTab,
  setCommentsScope,
  selectRightDrawerOpen,
  selectRightPanelTab,
  selectCommentsActivityScope,
  RightPanelTab,
} from '@/@noctua.core/components/drawer/drawerSlice'
import type { RootState } from '@/app/store/store'

const initial = reducer(undefined, { type: '@@INIT' })

const makeState = (overrides: Partial<typeof initial> = {}) =>
  ({ drawer: { ...initial, ...overrides } } as unknown as RootState)

describe('drawerSlice reducers', () => {
  it('starts closed on the activity-table tab, comments unscoped', () => {
    expect(initial).toEqual({
      rightDrawerOpen: false,
      rightPanelTab: RightPanelTab.ACTIVITY_TABLE,
      commentsActivityScope: null,
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

  // Opening the panel from one activity's comment icon scopes it to that unit;
  // the toolbar button clears the scope again (#289).
  it('setCommentsScope sets and clears the scoped activity', () => {
    const scoped = reducer(initial, setCommentsScope('gomodel:1/act-1'))
    expect(scoped.commentsActivityScope).toBe('gomodel:1/act-1')
    const cleared = reducer(scoped, setCommentsScope(null))
    expect(cleared.commentsActivityScope).toBeNull()
  })

  it('setCommentsScope leaves the tab and open flag alone', () => {
    const opened = reducer(initial, setRightDrawerOpen(true))
    const scoped = reducer(opened, setCommentsScope('gomodel:1/act-1'))
    expect(scoped.rightDrawerOpen).toBe(true)
    expect(scoped.rightPanelTab).toBe(RightPanelTab.ACTIVITY_TABLE)
  })

  it('selectors return the matching slice fields', () => {
    const state = makeState({
      rightDrawerOpen: true,
      rightPanelTab: RightPanelTab.CAM_ERRORS,
      commentsActivityScope: 'gomodel:1/act-1',
    })
    expect(selectRightDrawerOpen(state)).toBe(true)
    expect(selectRightPanelTab(state)).toBe(RightPanelTab.CAM_ERRORS)
    expect(selectCommentsActivityScope(state)).toBe('gomodel:1/act-1')
  })
})
