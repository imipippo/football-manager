import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Player {
  _id: string
  name: string
  position: string
  rating: number
  age: number
  nationality: string
  stats: {
    pace: number
    shooting: number
    passing: number
    dribbling: number
    defending: number
    physical: number
  }
  marketValue: number
}

interface Team {
  _id: string
  name: string
  budget: number
  reputation: number
  players: Player[]
  formation?: string
}

interface TeamState {
  currentTeam: Team | null
  loading: boolean
}

const initialState: TeamState = {
  currentTeam: null,
  loading: false,
}

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setTeam: (state, action: PayloadAction<Team>) => {
      state.currentTeam = action.payload
      state.loading = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { setTeam, setLoading } = teamSlice.actions
export default teamSlice.reducer
