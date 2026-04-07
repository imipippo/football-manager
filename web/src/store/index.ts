import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import teamReducer from './slices/teamSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    team: teamReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
