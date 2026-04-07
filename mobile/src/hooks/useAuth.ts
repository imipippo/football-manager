import {useCallback} from 'react';
import {useAppDispatch, useAppSelector} from './useRedux';
import {login, register, logout, loadUser, clearError} from '../store/authSlice';
import {LoginCredentials, RegisterData} from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const {user, token, isAuthenticated, loading, error} = useAppSelector(
    state => state.auth,
  );

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      return dispatch(login(credentials));
    },
    [dispatch],
  );

  const handleRegister = useCallback(
    async (data: RegisterData) => {
      return dispatch(register(data));
    },
    [dispatch],
  );

  const handleLogout = useCallback(async () => {
    return dispatch(logout());
  }, [dispatch]);

  const handleLoadUser = useCallback(async () => {
    return dispatch(loadUser());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    loadUser: handleLoadUser,
    clearError: handleClearError,
  };
};
