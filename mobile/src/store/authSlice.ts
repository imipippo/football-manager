import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {AuthState, LoginCredentials, RegisterData, User} from '../types';
import {authService} from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, {rejectWithValue}) => {
    try {
      const response = await authService.login(credentials);
      await AsyncStorage.setItem('authToken', response.data.token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '登录失败');
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, {rejectWithValue}) => {
    try {
      const response = await authService.register(data);
      await AsyncStorage.setItem('authToken', response.data.token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '注册失败');
    }
  },
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, {rejectWithValue}) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return rejectWithValue('No token found');
      }
      const response = await authService.getProfile();
      return {user: response.data, token};
    } catch (error: any) {
      await AsyncStorage.removeItem('authToken');
      return rejectWithValue(error.response?.data?.message || '加载用户失败');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem('authToken');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setCredentials: (
      state,
      action: PayloadAction<{user: User; token: string}>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loadUser.pending, state => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loadUser.rejected, state => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, state => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const {clearError, setCredentials} = authSlice.actions;
export default authSlice.reducer;
