import { createSlice } from '@reduxjs/toolkit'

export const loadingSlice = createSlice({
  name: 'loading',
  initialState: {
    loadingCount: 0
  },
  reducers: {
    setLoading: (state, action) => {
      if (action.payload) {
        state.loadingCount += 1
      } else {
        state.loadingCount = Math.max(0, state.loadingCount - 1)
      }
    },
    resetLoading: state => {
      state.loadingCount = 0
    }
  }
})

export const { setLoading, resetLoading } = loadingSlice.actions

export default loadingSlice.reducer
