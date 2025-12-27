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
  // For emulator/device testing, use your computer's IP address
  // Find your IP: Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) and look for IPv4 address
  const PRODUCTION_URL = 'https://api.tinphatmetech.online';
  const LOCAL_URL = 'http://192.168.1.139:3001'; // Change 192.168.1.139 to your actual IP
  
  // Use LOCAL_URL for testing, change to PRODUCTION_URL for production
  const USE_LOCAL = false; // Set to false for production
  
  const BASE_URL = currentBaseUrl || (USE_LOCAL ? LOCAL_URL : PRODUCTION_URL);
  

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

  // Force localhost for testing if USE_LOCAL is true
  const ACTUAL_BASE_URL = USE_LOCAL ? LOCAL_URL : BASE_URL;

  const api = axios.create({
    baseURL: ACTUAL_BASE_URL,
    timeout: 15000,
    withCredentials: true,  // Enable cookies for authentication
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Update baseURL whenever USE_LOCAL changes
  useEffect(() => {
    const newUrl = USE_LOCAL ? LOCAL_URL : PRODUCTION_URL;
    api.defaults.baseURL = newUrl;
  }, [USE_LOCAL]);

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
      return response;
    },
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid - clear auth data only (keep query cache)
        await clearAuthStorage();
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
    
    // Try to connect
    const success = await testConnection();
    
    if (success) {
      // Thành công - auto close
      setShowConnectionDialog(false);
      setConnectionError(null);
      setRetryCount(0);
      setIsRetryingConnection(false);
    } else if (newRetryCount >= 3) {
      // Sau 3 lần thử, dừng retry
      setIsRetryingConnection(false);
      console.warn('Max retries reached, user must manually retry');
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
      
      // Just make a simple request to check if server is reachable
      // Don't use /health as it may require auth
      // Instead, just try to connect - if server responds with any status, it's up
      try {
        await testApi.head('/', {
          validateStatus: () => true // Accept any status code
        });
        
        // Server is reachable
        if (currentBaseUrl !== testUrl) {
          setCurrentBaseUrl(testUrl);
          api.defaults.baseURL = testUrl;
        }
        setIsConnected(true);
        return true;
      } catch (error) {
        throw error;
      }
    } catch (error) {
      // If production failed and we haven't tried local yet
      if (testUrl === PRODUCTION_URL) {
        return await testConnection(LOCAL_URL);
      }
      
      // Both failed - set to production anyway and let app continue
      if (currentBaseUrl !== PRODUCTION_URL) {
        setCurrentBaseUrl(PRODUCTION_URL);
        api.defaults.baseURL = PRODUCTION_URL;
      }
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