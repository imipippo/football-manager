import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Team, TeamTactics} from '../types';

interface TeamState {
  currentTeam: Team | null;
  teams: Team[];
  loading: boolean;
  error: string | null;
}

const initialState: TeamState = {
  currentTeam: null,
  teams: [],
  loading: false,
  error: null,
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setTeam: (state, action: PayloadAction<Team>) => {
      state.currentTeam = action.payload;
    },
    updateTactics: (state, action: PayloadAction<Partial<TeamTactics>>) => {
      if (state.currentTeam) {
        state.currentTeam.tactics = {
          ...state.currentTeam.tactics,
          ...action.payload,
        };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {setTeam, updateTactics, setLoading, setError} = teamSlice.actions;
export default teamSlice.reducer;
