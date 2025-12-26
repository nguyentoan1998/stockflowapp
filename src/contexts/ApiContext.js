import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenStorage, CacheStorage, clearAuthStorage } from '../utils/storage';

const ApiContext = createContext();

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

export function ApiProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentBaseUrl, setCurrentBaseUrl] = useState(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [isRetryingConnection, setIsRetryingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // API Configuration
  // Priority: Production server -> Local server
  const PRODUCTION_URL = 'https://api.tinphatmetech.online';
  const LOCAL_URL = __DEV__ 
    ? process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.139:3001'
    : 'http://localhost:3001';
  
  const BASE_URL = currentBaseUrl || PRODUCTION_URL;

  // Get API key from AsyncStorage with default fallback
  const getApiKey = async () => {
    try {
      const apiKey = await AsyncStorage.getItem('api_key');
      return apiKey || process.env.EXPO_PUBLIC_API_KEY || 'Domaytimduockeynaycuatao';
    } catch (error) {
      console.error('Error getting API key:', error);
      return 'Domaytimduockeynaycuatao';
    }
  };

  const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    withCredentials: true,  // Enable cookies for authentication
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor để thêm API key header
  api.interceptors.request.use(
    async (config) => {
      const apiKey = await getApiKey();
      if (apiKey) {
        config.headers['X-API-Key'] = apiKey;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Request interceptor to add auth token from SecureStore
  api.interceptors.request.use(
    async (config) => {
      try {
        const token = await TokenStorage.get();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error adding auth token:', error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle errors
  api.interceptors.response.use(
    (response) => {
      // Connection successful, close dialog if it's open
      if (showConnectionDialog) {
        setShowConnectionDialog(false);
        setConnectionError(null);
        setRetryCount(0);
      }
      return response;
    },
    async (error) => {
      console.error('API Error:', error.message);

      if (error.response?.status === 401) {
        // Token expired or invalid - clear auth data only (keep query cache)
        await clearAuthStorage();
      } else if (!error.response) {
        // Network error - show connection dialog
        console.warn('Network error - showing connection dialog');
        setShowConnectionDialog(true);
        setConnectionError(error.message || 'Không thể kết nối tới server');
        setIsConnected(false);
      }

      return Promise.reject(error);
    }
  );

  // Set API key function
  const setApiKey = async (apiKey) => {
    try {
      await AsyncStorage.setItem('api_key', apiKey);
      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      return false;
    }
  };

  // Handle retry connection
  const handleRetryConnection = async () => {
    setIsRetryingConnection(true);
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    // Auto close dialog nếu thành công, hoặc sau 3 lần thử
    const success = await testConnection();
    
    if (!success && newRetryCount >= 3) {
      // Sau 3 lần thử, vẫn show dialog nhưng user phải manual retry
      setIsRetryingConnection(false);
    } else if (success) {
      // Thành công - auto close
      setShowConnectionDialog(false);
      setConnectionError(null);
      setRetryCount(0);
    } else {
      // Thất bại lần 1-2 - auto retry sau 2 giây
      setTimeout(() => {
        handleRetryConnection();
      }, 2000);
    }
  };

  // Close connection dialog manually
  const closeConnectionDialog = () => {
    setShowConnectionDialog(false);
    setIsRetryingConnection(false);
  };

  // Test connection with fallback
  const testConnection = async (url = null) => {
    const testUrl = url || currentBaseUrl || PRODUCTION_URL;
    
    try {
      setLoading(true);
      const testApi = axios.create({
        baseURL: testUrl,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      const apiKey = await getApiKey();
      const response = await testApi.get('/health', {
        headers: { 'X-API-Key': apiKey }
      });
      
      if (response.status === 200) {
        // Connection successful
        if (currentBaseUrl !== testUrl) {
          setCurrentBaseUrl(testUrl);
          // Update axios instance baseURL
          api.defaults.baseURL = testUrl;
        }
        setIsConnected(true);
        return true;
      }
      throw new Error('Health check failed');
    } catch (error) {
      console.error(`Connection failed to ${testUrl}:`, error.message);
      
      // If production failed and we haven't tried local yet
      if (testUrl === PRODUCTION_URL) {
        console.warn('Production server unavailable, trying local server...');
        return await testConnection(LOCAL_URL);
      }
      
      // Both failed
      setIsConnected(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initialize default API key on first app launch
  useEffect(() => {
    const initializeApiKey = async () => {
      try {
        const existingKey = await AsyncStorage.getItem('api_key');
        if (!existingKey) {
          await AsyncStorage.setItem('api_key', 'Domaytimduockeynaycuatao');
        }
      } catch (error) {
        console.error('Error initializing API key:', error);
      }
    };

    initializeApiKey();
  }, []);

  useEffect(() => {
    testConnection();
  }, []);

  const value = {
    api,
    isConnected,
    loading,
    testConnection,
    setApiKey,
    getApiKey,
    baseUrl: BASE_URL,
    productionUrl: PRODUCTION_URL,
    localUrl: LOCAL_URL,
    // Connection dialog states
    showConnectionDialog,
    isRetryingConnection,
    connectionError,
    retryCount,
    // Connection dialog handlers
    handleRetryConnection,
    closeConnectionDialog,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}