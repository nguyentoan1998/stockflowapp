import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './ApiContext';

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
      const userData = await AsyncStorage.getItem('userData');
      
      if (userData) {
        const user = JSON.parse(userData);
        // Verify session with server
        try {
          const response = await api.get('/auth/me');
          if (response.data.ok) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } catch {
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.log('Error checking auth status:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (username, password) => {
    try {
      dispatch({ type: 'LOADING' });
      
      // Debug: Log the login attempt
      console.log('Login attempt:', { user: username, passwordLength: password?.length });
      
      const response = await api.post('/auth/login', {
        user: username,  // Server expects 'user' field, not 'username'
        password
      });

      const { user } = response.data;  // Server returns user object, no separate token

      // Save to AsyncStorage - Server uses cookie-based auth
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return { success: true };
      
    } catch (error) {
      // Debug: Log the error details
      console.log('Login error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Call server logout to clear cookie
      await api.post('/auth/logout');
      await AsyncStorage.removeItem('userData');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.log('Error during logout:', error);
      // Clear local data even if server call fails
      await AsyncStorage.removeItem('userData');
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