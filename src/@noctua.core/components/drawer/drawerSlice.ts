import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store/store'

export enum RightPanelTab {
  ACTIVITY_TABLE = 'activityTable',
  CAM_ERRORS = 'camErrors',
  COMMENTS = 'comments',
}

interface DrawerState {
  rightDrawerOpen: boolean
  rightPanelTab: RightPanelTab
  /**
   * The activity the Comments panel is scoped to, or null for the whole model.
   * Set when the panel is opened from an activity's own comment icon, so that
   * icon shows only that activity unit's comments (#289).
   */
  commentsActivityScope: string | null
}

const initialState: DrawerState = {
  rightDrawerOpen: false,
  rightPanelTab: RightPanelTab.ACTIVITY_TABLE,
  commentsActivityScope: null,
}

export const drawerSlice = createSlice({
  name: 'drawer',
  initialState,
  reducers: {
    setRightDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.rightDrawerOpen = action.payload
    },
    setRightPanelTab: (state, action: PayloadAction<RightPanelTab>) => {
      state.rightPanelTab = action.payload
    },
    setCommentsScope: (state, action: PayloadAction<string | null>) => {
      state.commentsActivityScope = action.payload
    },
  },
})

export const {
  setRightDrawerOpen,
  setRightPanelTab,
  setCommentsScope,
} = drawerSlice.actions

export const selectRightDrawerOpen = (state: RootState) => state.drawer.rightDrawerOpen
export const selectRightPanelTab = (state: RootState) => state.drawer.rightPanelTab
export const selectCommentsActivityScope = (state: RootState) =>
  state.drawer.commentsActivityScope

export default drawerSlice.reducer
