import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserState {
  id: string | null
  username: string | null
  token: string | null
  isAuthenticated: boolean
}

const token = localStorage.getItem('token')

const initialState: UserState = {
  id: null,
  username: null,
  token: token,
  isAuthenticated: !!token,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; username: string; token: string }>) => {
      state.id = action.payload.id
      state.username = action.payload.username
      state.token = action.payload.token
      state.isAuthenticated = true
      localStorage.setItem('token', action.payload.token)
    },
    logout: (state) => {
      state.id = null
      state.username = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
    },
  },
})

export const { setUser, logout } = userSlice.actions
export default userSlice.reducer
