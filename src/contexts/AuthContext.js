import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './ApiContext';
import { TokenStorage, UserProfileStorage, clearAuthStorage } from '../utils/storage';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        loading: false, 
        error: null 
      };
    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        user: null, 
        loading: false, 
        error: action.payload 
      };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        loading: false, 
        error: null 
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    error: null,
  });

  const { api } = useApi();

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if token exists
      const tokenExists = await TokenStorage.exists();
      
      if (!tokenExists) {
        dispatch({ type: 'LOGOUT' });
        return;
      }

      // Load cached user profile instantly (no white screen)
      const cachedUser = await UserProfileStorage.get();
      if (cachedUser) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: cachedUser });
      }

      // Background: Fetch latest user info from server
      try {
        const response = await api.get('/auth/me');
        if (response.data.ok) {
          const updatedUser = response.data.user;
          // Update cache with latest data
          await UserProfileStorage.save(updatedUser);
          dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });
        } else {
          // If no cached user and API fails, logout
          if (!cachedUser) {
            await clearAuthStorage();
            dispatch({ type: 'LOGOUT' });
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        // If no cached user and API fails, logout
        if (!cachedUser) {
          await clearAuthStorage();
          dispatch({ type: 'LOGOUT' });
        }
        // If we have cached user, stay logged in (keep cached data)
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'LOADING' });

      console.log('[Login] Attempting login with:', { email });
      console.log('[Login] Server URL:', api.defaults.baseURL);

      // Login with server (Supabase Auth handled by server)
      const loginResponse = await api.post('/auth/login', { email, password });

      console.log('[Login] Response:', loginResponse.data);

      if (!loginResponse.data.ok) {
        const errorMessage = loginResponse.data.error || 'Đăng nhập thất bại';
        dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
        return { success: false, error: errorMessage };
      }

      const { token, user } = loginResponse.data;

      // Save token to SecureStore (encrypted)
      if (token) {
        await TokenStorage.save(token);
        console.log('[Login] Token saved to SecureStore');
      }

      // Save user profile to AsyncStorage (instant loading)
      await UserProfileStorage.save(user);
      console.log('[Login] User profile saved to AsyncStorage');

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      console.log('[Login] Login successful');
      return { success: true };
    } catch (error) {
      console.error('[Login] Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Đăng nhập thất bại';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Notify server to logout
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Server logout error (non-critical):', error);
      }

      // Clear auth data (token, profile) but keep query cache
      await clearAuthStorage();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error during logout:', error);
      // Clear auth data even if server call fails
      await clearAuthStorage();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}