import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Player} from '../types';

interface PlayerState {
  players: Player[];
  selectedPlayer: Player | null;
  loading: boolean;
  error: string | null;
}

const initialState: PlayerState = {
  players: [],
  selectedPlayer: null,
  loading: false,
  error: null,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
    },
    selectPlayer: (state, action: PayloadAction<Player | null>) => {
      state.selectedPlayer = action.payload;
    },
    updatePlayer: (state, action: PayloadAction<Player>) => {
      const index = state.players.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.players[index] = action.payload;
      }
      if (state.selectedPlayer?._id === action.payload._id) {
        state.selectedPlayer = action.payload;
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

export const {setPlayers, selectPlayer, updatePlayer, setLoading, setError} =
  playerSlice.actions;
export default playerSlice.reducer;
